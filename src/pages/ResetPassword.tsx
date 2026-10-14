import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error('Password must be at least 8 characters');
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success('Password updated');
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <form onSubmit={submit} className="w-full max-w-sm bg-card border rounded-xl p-5 space-y-4">
        <h1 className="text-xl font-heading font-bold">Set a new password</h1>
        <input type="password" className="w-full px-3 py-3 rounded-lg border border-input bg-background text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="New password (min 8 characters)" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" required />
        <button disabled={busy} className="w-full gradient-primary text-primary-foreground py-3 rounded-lg font-semibold text-sm disabled:opacity-60">Update password</button>
      </form>
    </div>
  );
}
