import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, ShieldCheck, UserCheck, UserX } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Member {
  id: string;
  display_name: string;
  email: string;
  roles: string[];
}

async function fetchMembers(): Promise<Member[]> {
  const [{ data: profiles, error }, { data: roles }] = await Promise.all([
    supabase.from('profiles').select('id, display_name, email, created_at').order('created_at'),
    supabase.from('user_roles').select('user_id, role'),
  ]);
  if (error) throw error;
  return (profiles || []).map(p => ({
    ...p,
    roles: (roles || []).filter(r => r.user_id === p.id).map(r => r.role),
  }));
}

export default function StaffPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: members = [], isLoading } = useQuery({ queryKey: ['members'], queryFn: fetchMembers });

  const approve = async (id: string) => {
    const { error } = await supabase.from('user_roles').insert({ user_id: id, role: 'staff' });
    if (error) return toast.error(error.message);
    toast.success('Staff approved');
    qc.invalidateQueries({ queryKey: ['members'] });
  };

  const revoke = async (id: string) => {
    if (!window.confirm('Remove this person\'s access?')) return;
    const { error } = await supabase.from('user_roles').delete().eq('user_id', id).eq('role', 'staff');
    if (error) return toast.error(error.message);
    toast.success('Access removed');
    qc.invalidateQueries({ queryKey: ['members'] });
  };

  const pending = members.filter(m => m.roles.length === 0);
  const active = members.filter(m => m.roles.length > 0);

  const Card = ({ m }: { m: Member }) => (
    <div className="bg-card border rounded-xl p-3 flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-sm shrink-0">
        {(m.display_name || m.email || '?').charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{m.display_name || 'Unnamed'}{m.id === user?.id && ' (you)'}</p>
        <p className="text-xs text-muted-foreground truncate">{m.email}</p>
      </div>
      {m.roles.includes('owner') ? (
        <span className="flex items-center gap-1 text-xs font-medium text-primary"><ShieldCheck size={14} /> Owner</span>
      ) : m.roles.includes('staff') ? (
        <button onClick={() => revoke(m.id)} className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg border hover:text-destructive hover:border-destructive transition-colors">
          <UserX size={14} /> Remove
        </button>
      ) : (
        <button onClick={() => approve(m.id)} className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg gradient-primary text-primary-foreground font-medium">
          <UserCheck size={14} /> Approve
        </button>
      )}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-heading font-bold">Staff</h1>
        <p className="text-sm text-muted-foreground">Staff create an account on the sign-in page, then you approve them here.</p>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          <section className="space-y-2">
            <h2 className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Waiting for approval ({pending.length})</h2>
            {pending.length === 0 ? <p className="text-sm text-muted-foreground bg-card border rounded-xl p-4">No pending requests.</p> : pending.map(m => <Card key={m.id} m={m} />)}
          </section>
          <section className="space-y-2">
            <h2 className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Team ({active.length})</h2>
            {active.map(m => <Card key={m.id} m={m} />)}
          </section>
        </>
      )}
    </div>
  );
}
