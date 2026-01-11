import { useState } from 'react';
import { VolunteerLayout } from '@/components/volunteer/VolunteerLayout';
import { QRScanner } from '@/components/QRScanner';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle, XCircle, User, Ticket, Calendar, Search } from 'lucide-react';

interface ScannedParticipant {
    id: string;
    registration_id: string;
    profile: {
        full_name: string;
        email: string;
        phone: string;
    };
    ticket: {
        title: string;
    };
    checked_in: boolean;
    checked_in_at: string | null;
    created_at: string;
}

const VolunteerCheckin = () => {
    const { toast } = useToast();
    const { user } = useAuth();
    const [scannedParticipant, setScannedParticipant] = useState<ScannedParticipant | null>(null);
    const [loading, setLoading] = useState(false);
    const [checkingIn, setCheckingIn] = useState(false);
    const [manualId, setManualId] = useState('');

    const handleScan = async (registrationId: string) => {
        setLoading(true);
        setScannedParticipant(null);

        try {
            const { data, error } = await supabase
                .from('registrations')
                .select('id, registration_id, checked_in, checked_in_at, created_at, profile:profiles!fk_registrations_profile(full_name, email, phone), ticket:tickets(title)')
                .eq('registration_id', registrationId)
                .eq('status', 'confirmed')
                .single();

            if (error || !data) {
                toast({
                    title: 'Not Found',
                    description: 'No confirmed registration found with this QR code.',
                    variant: 'destructive',
                });
                setLoading(false);
                return;
            }

            setScannedParticipant(data as unknown as ScannedParticipant);
        } catch (err) {
            toast({
                title: 'Error',
                description: 'Failed to lookup registration.',
                variant: 'destructive',
            });
        }

        setLoading(false);
    };

    const handleConfirmCheckin = async () => {
        if (!scannedParticipant || !user) return;

        setCheckingIn(true);

        try {
            const { error } = await supabase
                .from('registrations')
                .update({
                    checked_in: true,
                    checked_in_at: new Date().toISOString(),
                    checked_in_by: user.id,
                })
                .eq('id', scannedParticipant.id);

            if (error) throw error;

            toast({
                title: 'Checked In!',
                description: `${scannedParticipant.profile.full_name} has been checked in successfully.`,
            });

            setScannedParticipant(null);
        } catch (err) {
            toast({
                title: 'Error',
                description: 'Failed to check in participant.',
                variant: 'destructive',
            });
        }

        setCheckingIn(false);
    };

    const handleCancel = () => {
        setScannedParticipant(null);
    };

    return (
        <VolunteerLayout>
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-display text-primary glow-text tracking-wider">
                        CHECK-IN
                    </h2>
                    <p className="text-muted-foreground font-mono text-sm mt-1">
                        Scan participant QR codes to check them in
                    </p>
                </div>

                {!scannedParticipant && !loading && (
                    <div className="space-y-6">
                        {/* Manual Entry */}
                        <div className="terminal-card p-6">
                            <h3 className="text-sm font-mono text-muted-foreground mb-3">MANUAL ENTRY</h3>
                            <form onSubmit={(e) => { e.preventDefault(); if (manualId.trim()) handleScan(manualId.trim().toUpperCase()); }} className="flex gap-3">
                                <input
                                    type="text"
                                    value={manualId}
                                    onChange={(e) => setManualId(e.target.value.toUpperCase())}
                                    placeholder="Enter Registration ID (e.g. ABC123XYZ0)"
                                    className="flex-1 bg-background border border-border rounded px-4 py-3 text-primary font-mono tracking-wider focus:border-primary uppercase"
                                    maxLength={10}
                                />
                                <button
                                    type="submit"
                                    disabled={!manualId.trim()}
                                    className="flex items-center gap-2 bg-primary text-background px-6 py-3 font-display font-bold rounded hover:scale-105 transition-transform disabled:opacity-50"
                                >
                                    <Search className="w-5 h-5" />
                                    Lookup
                                </button>
                            </form>
                        </div>

                        {/* QR Scanner */}
                        <div className="terminal-card p-6">
                            <h3 className="text-sm font-mono text-muted-foreground mb-3">OR SCAN QR CODE</h3>
                            <QRScanner onScan={handleScan} />
                        </div>
                    </div>
                )}

                {loading && (
                    <div className="terminal-card p-8 text-center">
                        <div className="text-primary font-mono animate-pulse">Looking up participant...</div>
                    </div>
                )}

                {/* Confirmation Modal */}
                {scannedParticipant && (
                    <div className="terminal-card p-6">
                        <div className="text-center mb-6">
                            {scannedParticipant.checked_in ? (
                                <div className="inline-flex items-center gap-2 text-yellow-500 bg-yellow-500/10 px-4 py-2 rounded-full font-mono text-sm mb-4">
                                    <CheckCircle className="w-5 h-5" />
                                    Already Checked In
                                </div>
                            ) : (
                                <div className="inline-flex items-center gap-2 text-primary bg-primary/10 px-4 py-2 rounded-full font-mono text-sm mb-4">
                                    <User className="w-5 h-5" />
                                    Ready to Check In
                                </div>
                            )}
                        </div>

                        <div className="text-center mb-6">
                            <h3 className="text-2xl font-display text-primary mb-2">
                                {scannedParticipant.profile.full_name}
                            </h3>
                            <p className="text-muted-foreground font-mono text-sm">
                                {scannedParticipant.profile.email}
                            </p>
                            <p className="text-muted-foreground font-mono text-sm">
                                {scannedParticipant.profile.phone}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-secondary/20 p-4 rounded text-center">
                                <Ticket className="w-6 h-6 text-primary mx-auto mb-2" />
                                <p className="text-xs text-muted-foreground font-mono">Ticket</p>
                                <p className="text-sm text-primary font-mono">{scannedParticipant.ticket.title}</p>
                            </div>
                            <div className="bg-secondary/20 p-4 rounded text-center">
                                <Calendar className="w-6 h-6 text-primary mx-auto mb-2" />
                                <p className="text-xs text-muted-foreground font-mono">Registration ID</p>
                                <p className="text-sm text-primary font-mono tracking-wider">{scannedParticipant.registration_id}</p>
                            </div>
                        </div>

                        {scannedParticipant.checked_in ? (
                            <div className="text-center">
                                <p className="text-muted-foreground font-mono text-sm mb-4">
                                    Checked in at: {new Date(scannedParticipant.checked_in_at!).toLocaleString()}
                                </p>
                                <button
                                    onClick={handleCancel}
                                    className="flex items-center justify-center gap-2 mx-auto px-6 py-3 border border-primary text-primary rounded font-mono hover:bg-primary/10"
                                >
                                    Scan Another
                                </button>
                            </div>
                        ) : (
                            <div className="flex justify-center gap-4">
                                <button
                                    onClick={handleCancel}
                                    className="flex items-center gap-2 px-6 py-3 border border-border text-muted-foreground rounded font-mono hover:bg-secondary/50"
                                >
                                    <XCircle className="w-5 h-5" />
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmCheckin}
                                    disabled={checkingIn}
                                    className="flex items-center gap-2 bg-green-500 text-white px-6 py-3 font-display font-bold rounded hover:scale-105 transition-transform disabled:opacity-50"
                                >
                                    <CheckCircle className="w-5 h-5" />
                                    {checkingIn ? 'Checking In...' : 'Confirm Check-In'}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </VolunteerLayout>
    );
};

export default VolunteerCheckin;
