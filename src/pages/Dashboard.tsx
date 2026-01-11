import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { PhoneDialog } from '@/components/PhoneDialog';
import { LogOut, User, Phone, Mail, Ticket, Settings, Share2, Copy, Check } from 'lucide-react';
import type { Ticket as TicketType, Registration } from '@/types';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, loading, signOut, isAdmin } = useAuth();
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [referralCount, setReferralCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (profile && !profile.phone) {
      setShowPhoneDialog(true);
    }
  }, [profile]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      const [ticketsRes, registrationsRes] = await Promise.all([
        supabase.from('tickets').select('*').eq('is_active', true),
        supabase
          .from('registrations')
          .select('*, ticket:tickets(*)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
      ]);

      if (!ticketsRes.error) setTickets(ticketsRes.data || []);
      if (!registrationsRes.error) setRegistrations(registrationsRes.data || []);
      setDataLoading(false);
    };

    if (user) fetchData();
  }, [user]);

  // Fetch referral count - runs on every navigation to dashboard
  useEffect(() => {
    const fetchReferralCount = async () => {
      if (!profile?.referral_code) return;

      const { count } = await supabase
        .from('registrations')
        .select('id', { count: 'exact', head: true })
        .eq('referred_by', profile.referral_code);

      setReferralCount(count || 0);
    };

    fetchReferralCount();
  }, [profile?.referral_code, location.key]);

  const copyReferralCode = () => {
    if (profile?.referral_code) {
      navigator.clipboard.writeText(profile.referral_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handlePhoneComplete = () => {
    setShowPhoneDialog(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary font-mono animate-pulse">LOADING...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background relative scanlines flex flex-col">
      <Navigation />

      <main className="flex-1 p-4 pt-20">
        <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-30 pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto space-y-8">
          <h1 className="text-3xl md:text-5xl font-display font-bold text-primary glow-text text-center tracking-wider">
            DASHBOARD
          </h1>

          {/* Admin Link */}
          {isAdmin && (
            <Link
              to="/admin"
              className="flex items-center justify-center gap-2 bg-secondary/30 border border-primary/30 py-3 rounded font-mono text-primary hover:bg-secondary/50 hover:border-primary transition-colors"
            >
              <Settings className="w-5 h-5" />
              ADMIN PANEL
            </Link>
          )}

          {/* Profile Card */}
          <div className="terminal-card">
            <div className="terminal-header">
              <span className="terminal-dot terminal-dot-red" />
              <span className="terminal-dot terminal-dot-yellow" />
              <span className="terminal-dot terminal-dot-green" />
              <span className="text-xs text-muted-foreground ml-2 font-mono">
                user://profile
              </span>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center">
                  <User className="w-7 h-7 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-display text-primary truncate">
                    {profile?.full_name || 'User'}
                  </h2>
                  <p className="text-sm text-muted-foreground font-mono">Welcome back</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-3 py-2 border border-destructive/50 bg-destructive/10 rounded font-mono text-sm text-destructive hover:bg-destructive/20"
                >
                  <LogOut className="w-4 h-4" />
                  SIGN OUT
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 bg-background border border-border rounded">
                  <Mail className="w-4 h-4 text-primary/60" />
                  <div className="min-w-0">
                    <span className="text-xs text-muted-foreground font-mono block">EMAIL</span>
                    <span className="text-sm text-primary font-mono truncate block">{profile?.email || user.email}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-background border border-border rounded">
                  <Phone className="w-4 h-4 text-primary/60" />
                  <div className="min-w-0">
                    <span className="text-xs text-muted-foreground font-mono block">PHONE</span>
                    <span className="text-sm text-primary font-mono truncate block">{profile?.phone || 'Not provided'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Available Tickets */}
          <div className="terminal-card">
            <div className="terminal-header">
              <span className="terminal-dot terminal-dot-red" />
              <span className="terminal-dot terminal-dot-yellow" />
              <span className="terminal-dot terminal-dot-green" />
              <span className="text-xs text-muted-foreground ml-2 font-mono">
                tickets://available
              </span>
            </div>

            <div className="p-6">
              <h3 className="text-lg font-display text-primary mb-4">AVAILABLE TICKETS</h3>

              {dataLoading ? (
                <div className="text-muted-foreground font-mono text-sm animate-pulse">Loading...</div>
              ) : tickets.length === 0 ? (
                <p className="text-muted-foreground font-mono text-sm">No tickets available at the moment.</p>
              ) : (
                <div className="grid gap-3">
                  {tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="flex items-center justify-between p-4 bg-background border border-border rounded hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Ticket className="w-5 h-5 text-primary/60 flex-shrink-0" />
                        <div className="min-w-0">
                          <h4 className="font-display text-primary truncate">{ticket.title}</h4>
                          {ticket.description && (
                            <p className="text-xs text-muted-foreground font-mono truncate">{ticket.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <span className="text-primary font-display font-bold">
                          {ticket.price > 0 ? `₹${ticket.price}` : 'FREE'}
                        </span>
                        <Link
                          to={`/tickets/${ticket.id}/register`}
                          className="bg-primary text-background px-4 py-2 font-display font-bold text-sm rounded hover:scale-105 transition-transform"
                        >
                          REGISTER
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* My Registrations */}
          <div className="terminal-card">
            <div className="terminal-header">
              <span className="terminal-dot terminal-dot-red" />
              <span className="terminal-dot terminal-dot-yellow" />
              <span className="terminal-dot terminal-dot-green" />
              <span className="text-xs text-muted-foreground ml-2 font-mono">
                registrations://mine
              </span>
            </div>

            <div className="p-6">
              <h3 className="text-lg font-display text-primary mb-4">MY REGISTRATIONS</h3>

              {dataLoading ? (
                <div className="text-muted-foreground font-mono text-sm animate-pulse">Loading...</div>
              ) : registrations.length === 0 ? (
                <p className="text-muted-foreground font-mono text-sm">You haven't registered for any events yet.</p>
              ) : (
                <div className="space-y-3">
                  {registrations.map((reg) => (
                    <div
                      key={reg.id}
                      className="flex items-center justify-between p-4 bg-background border border-border rounded"
                    >
                      <div className="min-w-0">
                        <h4 className="font-display text-primary truncate">{reg.ticket?.title || 'Unknown'}</h4>
                        <p className="text-xs text-muted-foreground font-mono">
                          {new Date(reg.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded font-mono ${reg.status === 'confirmed'
                          ? 'bg-green-500/20 text-green-500'
                          : reg.status === 'cancelled'
                            ? 'bg-red-500/20 text-red-500'
                            : 'bg-yellow-500/20 text-yellow-500'
                          }`}
                      >
                        {reg.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Referrals Section */}
          <div className="terminal-card">
            <div className="terminal-header">
              <span className="terminal-dot terminal-dot-red" />
              <span className="terminal-dot terminal-dot-yellow" />
              <span className="terminal-dot terminal-dot-green" />
              <span className="text-xs text-muted-foreground ml-2 font-mono">
                referrals://code
              </span>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Share2 className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-display text-primary">YOUR REFERRAL CODE</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-background border border-border rounded">
                  <span className="text-xs text-muted-foreground font-mono block mb-2">REFERRAL CODE</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-display font-bold text-primary tracking-widest">
                      {profile?.referral_code || '-----'}
                    </span>
                    <button
                      onClick={copyReferralCode}
                      className="p-2 hover:bg-secondary/50 rounded transition-colors"
                      title="Copy code"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-background border border-border rounded">
                  <span className="text-xs text-muted-foreground font-mono block mb-2">TOTAL REFERRALS</span>
                  <span className="text-2xl font-display font-bold text-primary">
                    {referralCount}
                  </span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground font-mono mt-4">
                Share your referral code with friends. When they use it during registration, you'll see them in your referral count!
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <PhoneDialog open={showPhoneDialog} onComplete={handlePhoneComplete} />
    </div>
  );
};

export default Dashboard;
