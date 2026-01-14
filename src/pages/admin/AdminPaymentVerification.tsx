import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { ShieldCheck, RefreshCw, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';

interface RegistrationWithPayment {
    id: string;
    razorpay_order_id: string | null;
    razorpay_payment_id: string | null;
    status: string;
    created_at: string;
    profile: {
        full_name: string;
        email: string;
    } | null;
    ticket: {
        title: string;
    } | null;
}

interface PaymentVerificationResult {
    order_id: string;
    verification_status: 'genuine' | 'failed' | 'no_payments' | 'pending';
    payment_count: number;
    genuine_payment: {
        id: string;
        amount: number;
        status: string;
        captured: boolean;
        method: string;
    } | null;
    payments: Array<{
        id: string;
        amount: number;
        status: string;
        captured: boolean;
        method: string;
        error_code: string | null;
        error_description: string | null;
        created_at: number;
    }>;
}

interface VerificationState {
    [orderId: string]: {
        loading: boolean;
        result: PaymentVerificationResult | null;
        error: string | null;
    };
}

const AdminPaymentVerification = () => {
    const [registrations, setRegistrations] = useState<RegistrationWithPayment[]>([]);
    const [loading, setLoading] = useState(true);
    const [verificationState, setVerificationState] = useState<VerificationState>({});
    const [verifyingAll, setVerifyingAll] = useState(false);
    const [filter, setFilter] = useState<'all' | 'genuine' | 'failed' | 'pending' | 'unverified'>('all');
    const { toast } = useToast();

    useEffect(() => {
        fetchRegistrations();
    }, []);

    const fetchRegistrations = async () => {
        try {
            const { data, error } = await supabase
                .from('registrations')
                .select(`
                    id,
                    razorpay_order_id,
                    razorpay_payment_id,
                    status,
                    created_at,
                    profile:profiles(full_name, email),
                    ticket:tickets(title)
                `)
                .not('razorpay_order_id', 'is', null)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRegistrations(data || []);
        } catch (error) {
            console.error('Error fetching registrations:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch registrations',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const verifyPayment = async (orderId: string) => {
        setVerificationState(prev => ({
            ...prev,
            [orderId]: { loading: true, result: null, error: null }
        }));

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                throw new Error('Not authenticated');
            }

            const response = await supabase.functions.invoke('fetch-order-payments', {
                body: { order_id: orderId },
            });

            if (response.error) {
                throw new Error(response.error.message);
            }

            const result = response.data as PaymentVerificationResult;

            setVerificationState(prev => ({
                ...prev,
                [orderId]: { loading: false, result, error: null }
            }));

            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Verification failed';
            setVerificationState(prev => ({
                ...prev,
                [orderId]: { loading: false, result: null, error: errorMessage }
            }));
            return null;
        }
    };

    const verifyAllPayments = async () => {
        setVerifyingAll(true);

        for (const reg of registrations) {
            if (reg.razorpay_order_id) {
                await verifyPayment(reg.razorpay_order_id);
                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        }

        setVerifyingAll(false);
        toast({
            title: 'Verification Complete',
            description: `Verified ${registrations.length} payments`,
        });
    };

    const getStatusIcon = (orderId: string) => {
        const state = verificationState[orderId];
        if (!state) return <Clock className="w-4 h-4 text-muted-foreground" />;
        if (state.loading) return <RefreshCw className="w-4 h-4 text-primary animate-spin" />;
        if (state.error) return <AlertCircle className="w-4 h-4 text-destructive" />;
        if (state.result) {
            switch (state.result.verification_status) {
                case 'genuine':
                    return <CheckCircle className="w-4 h-4 text-green-500" />;
                case 'failed':
                    return <XCircle className="w-4 h-4 text-destructive" />;
                case 'no_payments':
                    return <AlertCircle className="w-4 h-4 text-yellow-500" />;
                case 'pending':
                    return <Clock className="w-4 h-4 text-blue-500" />;
            }
        }
        return null;
    };

    const getStatusBadge = (orderId: string) => {
        const state = verificationState[orderId];
        if (!state || !state.result) return null;

        const statusColors: Record<string, string> = {
            genuine: 'bg-green-500/20 text-green-500 border-green-500/50',
            failed: 'bg-destructive/20 text-destructive border-destructive/50',
            no_payments: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50',
            pending: 'bg-blue-500/20 text-blue-500 border-blue-500/50',
        };

        return (
            <span className={`px-2 py-0.5 rounded text-xs font-mono border ${statusColors[state.result.verification_status]}`}>
                {state.result.verification_status.toUpperCase()}
            </span>
        );
    };

    const filteredRegistrations = registrations.filter(reg => {
        if (filter === 'all') return true;
        if (filter === 'unverified') return !verificationState[reg.razorpay_order_id!];
        const state = verificationState[reg.razorpay_order_id!];
        if (!state?.result) return filter === 'unverified';
        return state.result.verification_status === filter;
    });

    const stats = {
        total: registrations.length,
        genuine: Object.values(verificationState).filter(v => v.result?.verification_status === 'genuine').length,
        failed: Object.values(verificationState).filter(v => v.result?.verification_status === 'failed').length,
        pending: Object.values(verificationState).filter(v => v.result?.verification_status === 'pending').length,
        noPayments: Object.values(verificationState).filter(v => v.result?.verification_status === 'no_payments').length,
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-display text-primary glow-text tracking-wider flex items-center gap-2">
                            <ShieldCheck className="w-6 h-6" />
                            VERIFY PAYMENTS
                        </h2>
                        <p className="text-muted-foreground font-mono text-sm mt-1">
                            Verify payment status directly from Razorpay
                        </p>
                    </div>
                    <button
                        onClick={verifyAllPayments}
                        disabled={verifyingAll || registrations.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-background font-mono text-sm rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <RefreshCw className={`w-4 h-4 ${verifyingAll ? 'animate-spin' : ''}`} />
                        {verifyingAll ? 'Verifying...' : 'Verify All Payments'}
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="terminal-card p-4">
                        <p className="text-xs text-muted-foreground font-mono uppercase">Total</p>
                        <p className="text-2xl font-display font-bold text-primary mt-1">{stats.total}</p>
                    </div>
                    <div className="terminal-card p-4">
                        <p className="text-xs text-muted-foreground font-mono uppercase">Genuine</p>
                        <p className="text-2xl font-display font-bold text-green-500 mt-1">{stats.genuine}</p>
                    </div>
                    <div className="terminal-card p-4">
                        <p className="text-xs text-muted-foreground font-mono uppercase">Failed</p>
                        <p className="text-2xl font-display font-bold text-destructive mt-1">{stats.failed}</p>
                    </div>
                    <div className="terminal-card p-4">
                        <p className="text-xs text-muted-foreground font-mono uppercase">Pending</p>
                        <p className="text-2xl font-display font-bold text-blue-500 mt-1">{stats.pending}</p>
                    </div>
                    <div className="terminal-card p-4">
                        <p className="text-xs text-muted-foreground font-mono uppercase">No Payments</p>
                        <p className="text-2xl font-display font-bold text-yellow-500 mt-1">{stats.noPayments}</p>
                    </div>
                </div>

                {/* Filter */}
                <div className="flex gap-2 flex-wrap">
                    {(['all', 'genuine', 'failed', 'pending', 'unverified'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1 rounded font-mono text-sm transition-colors ${filter === f
                                    ? 'bg-primary text-background'
                                    : 'bg-secondary/50 text-primary hover:bg-secondary'
                                }`}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Table */}
                <div className="terminal-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="text-left p-4 font-mono text-xs text-muted-foreground uppercase">Status</th>
                                    <th className="text-left p-4 font-mono text-xs text-muted-foreground uppercase">User</th>
                                    <th className="text-left p-4 font-mono text-xs text-muted-foreground uppercase">Ticket</th>
                                    <th className="text-left p-4 font-mono text-xs text-muted-foreground uppercase">Order ID</th>
                                    <th className="text-left p-4 font-mono text-xs text-muted-foreground uppercase">Payment ID</th>
                                    <th className="text-left p-4 font-mono text-xs text-muted-foreground uppercase">Verification</th>
                                    <th className="text-left p-4 font-mono text-xs text-muted-foreground uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-primary font-mono animate-pulse">
                                            Loading registrations...
                                        </td>
                                    </tr>
                                ) : filteredRegistrations.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-muted-foreground font-mono">
                                            No registrations found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRegistrations.map((reg) => {
                                        const state = reg.razorpay_order_id ? verificationState[reg.razorpay_order_id] : null;
                                        return (
                                            <tr key={reg.id} className="border-b border-border/50 hover:bg-secondary/20">
                                                <td className="p-4">
                                                    <span className={`px-2 py-0.5 rounded text-xs font-mono ${reg.status === 'confirmed'
                                                            ? 'bg-green-500/20 text-green-500'
                                                            : 'bg-yellow-500/20 text-yellow-500'
                                                        }`}>
                                                        {reg.status}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="font-mono text-sm">
                                                        {reg.profile?.full_name || 'Unknown'}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {reg.profile?.email}
                                                    </div>
                                                </td>
                                                <td className="p-4 font-mono text-sm">
                                                    {reg.ticket?.title || 'Unknown'}
                                                </td>
                                                <td className="p-4 font-mono text-xs text-muted-foreground">
                                                    {reg.razorpay_order_id?.slice(0, 20)}...
                                                </td>
                                                <td className="p-4 font-mono text-xs text-muted-foreground">
                                                    {reg.razorpay_payment_id?.slice(0, 20) || '-'}...
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        {getStatusIcon(reg.razorpay_order_id!)}
                                                        {getStatusBadge(reg.razorpay_order_id!)}
                                                        {state?.error && (
                                                            <span className="text-xs text-destructive">{state.error}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <button
                                                        onClick={() => reg.razorpay_order_id && verifyPayment(reg.razorpay_order_id)}
                                                        disabled={state?.loading || verifyingAll}
                                                        className="px-3 py-1 bg-primary/20 text-primary font-mono text-xs rounded hover:bg-primary/30 disabled:opacity-50"
                                                    >
                                                        {state?.loading ? 'Verifying...' : 'Verify'}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Legend */}
                <div className="terminal-card p-4">
                    <h3 className="font-mono text-sm text-muted-foreground mb-3">Verification Status Legend:</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-mono">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span>Genuine - Payment captured successfully</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <XCircle className="w-4 h-4 text-destructive" />
                            <span>Failed - All payments failed</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-yellow-500" />
                            <span>No Payments - No payment attempts</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-blue-500" />
                            <span>Pending - Payment in progress</span>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminPaymentVerification;
