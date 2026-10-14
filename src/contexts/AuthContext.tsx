import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type Role = 'owner' | 'staff' | null;

interface AuthState {
  session: Session | null;
  user: User | null;
  role: Role;
  displayName: string;
  loading: boolean;
  refreshRole: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (uid: string | undefined) => {
    if (!uid) {
      setRole(null);
      setDisplayName('');
      return;
    }
    const [{ data: roles }, { data: profile }] = await Promise.all([
      supabase.from('user_roles').select('role').eq('user_id', uid),
      supabase.from('profiles').select('display_name').eq('id', uid).maybeSingle(),
    ]);
    const list = (roles || []).map(r => r.role);
    setRole(list.includes('owner') ? 'owner' : list.includes('staff') ? 'staff' : null);
    setDisplayName(profile?.display_name || '');
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      // defer DB calls out of the auth callback
      setTimeout(() => {
        loadProfile(s?.user?.id).finally(() => setLoading(false));
      }, 0);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      loadProfile(data.session?.user?.id).finally(() => setLoading(false));
    });
    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const value: AuthState = {
    session,
    user: session?.user ?? null,
    role,
    displayName,
    loading,
    refreshRole: () => loadProfile(session?.user?.id),
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
