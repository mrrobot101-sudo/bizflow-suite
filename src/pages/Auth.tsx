import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { useAuth } from '@/contexts/AuthContext';

type Mode = 'signin' | 'signup' | 'forgot';

export default function AuthPage() {
  const { session } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  if (session) return <Navigate to="/" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      } else if (mode === 'signup') {
        if (name.trim().length < 2) throw new Error('Enter your name');
        if (password.length < 8) throw new Error('Password must be at least 8 characters');
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin, data: { display_name: name.trim().slice(0, 60) } },
        });
        if (error) throw error;
        toast.success('Check your email to confirm your account.');
        setMode('signin');
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success('Password reset link sent. Check your email.');
        setMode('signin');
      }
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth('google', { redirect_uri: window.location.origin });
    if (result.error) toast.error(result.error.message || 'Google sign-in failed');
  };

  const inputClass = 'w-full px-3 py-3 rounded-lg border border-input bg-background text-foreground text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-ring';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-xl gradient-primary flex items-center justify-center font-heading font-bold text-primary-foreground">CM</div>
          <h1 className="text-2xl font-heading font-bold">Cyber MIS</h1>
          <p className="text-sm text-muted-foreground">
            {mode === 'signin' ? 'Sign in to record and view sales' : mode === 'signup' ? 'Create a staff account' : 'Reset your password'}
          </p>
        </div>

        <div className="bg-card border rounded-xl p-5 space-y-4">
          {mode !== 'forgot' && (
            <>
              <button type="button" onClick={google} className="w-full py-3 rounded-lg border border-input bg-background text-sm font-medium hover:bg-muted transition-colors">
                Continue with Google
              </button>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex-1 h-px bg-border" /> or <span className="flex-1 h-px bg-border" />
              </div>
            </>
          )}

          <form onSubmit={submit} className="space-y-3">
            {mode === 'signup' && (
              <input className={inputClass} placeholder="Your name" value={name} onChange={e => setName(e.target.value)} maxLength={60} required autoComplete="name" />
            )}
            <input className={inputClass} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            {mode !== 'forgot' && (
              <input className={inputClass} type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required minLength={mode === 'signup' ? 8 : 1} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />
            )}
            <button type="submit" disabled={busy} className="w-full gradient-primary text-primary-foreground py-3 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2">
              {busy && <Loader2 size={16} className="animate-spin" />}
              {mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
            </button>
          </form>

          <div className="text-center text-sm space-y-1">
            {mode === 'signin' && (
              <>
                <button onClick={() => setMode('forgot')} className="text-muted-foreground hover:underline block w-full">Forgot password?</button>
                <button onClick={() => setMode('signup')} className="text-primary hover:underline">New staff? Create an account</button>
              </>
            )}
            {mode !== 'signin' && (
              <button onClick={() => setMode('signin')} className="text-primary hover:underline">Back to sign in</button>
            )}
          </div>
        </div>
        <p className="text-xs text-center text-muted-foreground">New staff accounts need the owner's approval before use.</p>
      </div>
    </div>
  );
}
