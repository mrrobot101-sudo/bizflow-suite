import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { fetchTransactions } from '@/services/transactionService';

export const TX_KEY = ['transactions'];

export function useTransactions() {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: TX_KEY, queryFn: fetchTransactions, staleTime: 30_000 });

  // Live updates when staff on other devices record sales
  useEffect(() => {
    const channel = supabase
      .channel('transactions-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        qc.invalidateQueries({ queryKey: TX_KEY });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  return { transactions: query.data ?? [], isLoading: query.isLoading, error: query.error, refresh: () => qc.invalidateQueries({ queryKey: TX_KEY }) };
}
