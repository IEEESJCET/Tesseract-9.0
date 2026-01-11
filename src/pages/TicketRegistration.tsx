import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import type { Ticket, FormField } from '@/types';

const TicketRegistration = () => {
    const { ticketId } = useParams<{ ticketId: string }>();
    const navigate = useNavigate();
    const { user, profile, loading: authLoading } = useAuth();
    const { toast } = useToast();

    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState<Record<string, unknown>>({});
    const [referralCode, setReferralCode] = useState('');

    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login');
            return;
        }

        const fetchTicket = async () => {
            if (!ticketId) return;

            const { data, error } = await supabase
                .from('tickets')
                .select('*')
                .eq('id', ticketId)
                .eq('is_active', true)
                .single();

            if (error || !data) {
                toast({ title: 'Error', description: 'Ticket not found or unavailable', variant: 'destructive' });
                navigate('/dashboard');
                return;
            }

            setTicket(data);

            // Initialize form data with empty values
            const initialData: Record<string, unknown> = {};
            (data.form_fields || []).forEach((field: FormField) => {
                initialData[field.id] = field.type === 'checkbox' ? false : '';
            });
            setFormData(initialData);
            setLoading(false);
        };

        if (!authLoading) {
            fetchTicket();
        }
    }, [ticketId, user, authLoading, navigate, toast]);

    const handleInputChange = (fieldId: string, value: unknown) => {
        setFormData((prev) => ({ ...prev, [fieldId]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user || !ticket) return;

        // Validate required fields
        const invalidFields = (ticket.form_fields || []).filter(
            (field) => field.required && !formData[field.id]
        );

        if (invalidFields.length > 0) {
            toast({
                title: 'Validation Error',
                description: `Please fill in: ${invalidFields.map((f) => f.label).join(', ')}`,
                variant: 'destructive',
            });
            return;
        }

        setSubmitting(true);

        // Validate referral code if provided
        let validReferralCode: string | null = null;
        if (referralCode.trim()) {
            const { data: referrer, error: refError } = await supabase
                .from('profiles')
                .select('id')
                .eq('referral_code', referralCode.trim())
                .maybeSingle();

            if (refError) {
                console.error('Referral validation error:', refError);
                toast({
                    title: 'Validation Error',
                    description: 'Could not validate referral code. Please try again.',
                    variant: 'destructive',
                });
                setSubmitting(false);
                return;
            }

            if (referrer) {
                validReferralCode = referralCode.trim();
            } else {
                toast({
                    title: 'Invalid Referral Code',
                    description: 'The referral code you entered does not exist.',
                    variant: 'destructive',
                });
                setSubmitting(false);
                return;
            }
        }

        // Generate 10-digit alphanumeric registration ID
        const generateRegistrationId = () => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let result = '';
            for (let i = 0; i < 10; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
        };

        const { error } = await supabase.from('registrations').insert({
            user_id: user.id,
            ticket_id: ticket.id,
            form_data: formData,
            status: 'pending',
            referred_by: validReferralCode,
            registration_id: generateRegistrationId(),
        });

        if (error) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } else {
            toast({ title: 'Success', description: 'Registration submitted successfully!' });
            navigate('/dashboard');
        }

        setSubmitting(false);
    };

    const renderField = (field: FormField) => {
        const baseInputClass = "w-full bg-background border border-border rounded px-4 py-3 text-primary font-mono placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors";

        switch (field.type) {
            case 'textarea':
                return (
                    <textarea
                        value={String(formData[field.id] || '')}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        className={`${baseInputClass} h-24 resize-none`}
                        required={field.required}
                    />
                );

            case 'select':
                return (
                    <select
                        value={String(formData[field.id] || '')}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        className={baseInputClass}
                        required={field.required}
                    >
                        <option value="">Select an option</option>
                        {(field.options || []).map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                );

            case 'checkbox':
                return (
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={Boolean(formData[field.id])}
                            onChange={(e) => handleInputChange(field.id, e.target.checked)}
                            className="w-5 h-5 accent-primary"
                        />
                        <span className="text-primary font-mono">{field.label}</span>
                    </label>
                );

            default:
                return (
                    <input
                        type={field.type}
                        value={String(formData[field.id] || '')}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        className={baseInputClass}
                        required={field.required}
                    />
                );
        }
    };

    if (loading || authLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-primary font-mono animate-pulse">LOADING...</div>
            </div>
        );
    }

    if (!ticket) {
        return null;
    }

    return (
        <div className="min-h-screen bg-background relative scanlines flex flex-col">
            <Navigation />

            <main className="flex-1 flex flex-col items-center justify-center p-4">
                <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-30 pointer-events-none" />

                <div className="relative z-10 w-full max-w-lg">
                    <h1 className="text-2xl md:text-4xl font-display font-bold text-primary glow-text mb-2 text-center tracking-wider">
                        {ticket.title}
                    </h1>
                    {ticket.description && (
                        <p className="text-muted-foreground font-mono text-sm text-center mb-6">
                            {ticket.description}
                        </p>
                    )}

                    <div className="terminal-card">
                        <div className="terminal-header">
                            <span className="terminal-dot terminal-dot-red" />
                            <span className="terminal-dot terminal-dot-yellow" />
                            <span className="terminal-dot terminal-dot-green" />
                            <span className="text-xs text-muted-foreground ml-2 font-mono">
                                register://ticket
                            </span>
                        </div>

                        <div className="p-6 md:p-8">
                            {/* User Info Section */}
                            <div className="mb-6 pb-6 border-b border-border">
                                <p className="text-xs text-muted-foreground font-mono mb-3">YOUR INFO</p>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Name:</span>
                                        <span className="text-primary font-mono">{profile?.full_name || '-'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Email:</span>
                                        <span className="text-primary font-mono">{profile?.email || '-'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Phone:</span>
                                        <span className="text-primary font-mono">{profile?.phone || '-'}</span>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {(ticket.form_fields || []).map((field) => (
                                    <div key={field.id}>
                                        {field.type !== 'checkbox' && (
                                            <label className="block text-sm text-primary/80 font-mono mb-2">
                                                {field.label.toUpperCase()}
                                                {field.required && <span className="text-destructive ml-1">*</span>}
                                            </label>
                                        )}
                                        {renderField(field)}
                                    </div>
                                ))}

                                {/* Referral Code Input */}
                                <div className="pt-4 border-t border-border">
                                    <label className="block text-sm text-primary/80 font-mono mb-2">
                                        REFERRAL CODE (OPTIONAL)
                                    </label>
                                    <input
                                        type="text"
                                        value={referralCode}
                                        onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                                        placeholder="Enter 5-digit referral code"
                                        maxLength={5}
                                        className="w-full bg-background border border-border rounded px-4 py-3 text-primary font-mono placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors tracking-widest"
                                    />
                                    <p className="text-xs text-muted-foreground font-mono mt-1">
                                        Have a friend's referral code? Enter it here.
                                    </p>
                                </div>

                                {ticket.price > 0 && (
                                    <div className="flex justify-between items-center py-4 border-t border-border">
                                        <span className="text-muted-foreground font-mono">Ticket Price:</span>
                                        <span className="text-xl font-display font-bold text-primary">₹{ticket.price}</span>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full glow-button bg-primary text-background py-3 font-display font-bold tracking-wider rounded hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                                >
                                    {submitting ? 'SUBMITTING...' : 'REGISTER'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default TicketRegistration;
