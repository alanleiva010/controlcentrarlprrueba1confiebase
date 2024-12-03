import { create } from 'zustand';
import { supabase } from '../config/supabase';
import { useTransactionStore } from './useTransactionStore';
import { useCajaStore } from './useCajaStore';
import { useBalanceStore } from './useBalanceStore';
import { useClientStore } from './useClientStore';
import { useCurrencyStore } from './useCurrencyStore';
import { useOperationTypeStore } from './useOperationTypeStore';
import { useOperatorStore } from './useOperatorStore';

interface SupabaseSyncStore {
  isSyncing: boolean;
  lastSyncTime: Date | null;
  error: string | null;
  syncData: () => Promise<void>;
}

export const useSupabaseSync = create<SupabaseSyncStore>((set, get) => ({
  isSyncing: false,
  lastSyncTime: null,
  error: null,

  syncData: async () => {
    if (get().isSyncing) return;

    set({ isSyncing: true, error: null });

    try {
      // Fetch all data in parallel for better performance
      const [
        { data: transactions, error: transactionsError },
        { data: cajaStatus, error: cajaStatusError },
        { data: balances, error: balancesError },
        { data: clients, error: clientsError },
        { data: currencies, error: currenciesError },
        { data: operationTypes, error: operationTypesError },
        { data: operators, error: operatorsError }
      ] = await Promise.all([
        supabase.from('transactions').select('*').order('created_at', { ascending: false }),
        supabase.from('caja_status').select('*').eq('is_open', true).single(),
        supabase.from('balances').select('*'),
        supabase.from('clients').select('*'),
        supabase.from('currencies').select('*'),
        supabase.from('operation_types').select('*'),
        supabase.from('operators').select('*')
      ]);

      // Check for errors
      const errors = [];
      if (transactionsError) errors.push('Error fetching transactions: ' + transactionsError.message);
      if (cajaStatusError && cajaStatusError.code !== 'PGRST116') errors.push('Error fetching caja status: ' + cajaStatusError.message);
      if (balancesError) errors.push('Error fetching balances: ' + balancesError.message);
      if (clientsError) errors.push('Error fetching clients: ' + clientsError.message);
      if (currenciesError) errors.push('Error fetching currencies: ' + currenciesError.message);
      if (operationTypesError) errors.push('Error fetching operation types: ' + operationTypesError.message);
      if (operatorsError) errors.push('Error fetching operators: ' + operatorsError.message);

      if (errors.length > 0) {
        throw new Error(errors.join('\n'));
      }

      // Update stores with fetched data
      if (transactions) {
        useTransactionStore.setState({ 
          transactions: transactions.map(t => ({
            ...t,
            date: new Date(t.date),
            createdAt: t.created_at ? new Date(t.created_at) : undefined,
            updatedAt: t.updated_at ? new Date(t.updated_at) : undefined
          }))
        });
      }

      if (cajaStatus) {
        useCajaStore.setState({
          isOpen: cajaStatus.is_open,
          openedBy: cajaStatus.opened_by,
          openedAt: cajaStatus.opened_at ? new Date(cajaStatus.opened_at) : null,
          closedBy: cajaStatus.closed_by,
          closedAt: cajaStatus.closed_at ? new Date(cajaStatus.closed_at) : null,
        });
      }

      if (balances) {
        useBalanceStore.setState({ balances });
      }

      if (clients) {
        useClientStore.setState({ clients });
      }

      if (currencies) {
        const fiatCurrencies = currencies.filter(c => c.type === 'FIAT').map(c => ({
          id: c.id,
          code: c.code,
          name: c.name,
          symbol: c.symbol,
          buyRate: c.buy_rate,
          sellRate: c.sell_rate,
          active: c.active
        }));

        const cryptoCurrencies = currencies.filter(c => c.type === 'CRYPTO').map(c => ({
          id: c.id,
          code: c.code,
          name: c.name,
          network: c.network,
          active: c.active
        }));

        useCurrencyStore.setState({ 
          currencies: fiatCurrencies,
          cryptos: cryptoCurrencies
        });
      }

      if (operationTypes) {
        useOperationTypeStore.setState({ operationTypes });
      }

      if (operators) {
        useOperatorStore.setState({ operators });
      }

      set({ 
        lastSyncTime: new Date(),
        error: null
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during sync';
      console.error('Error syncing with Supabase:', errorMessage);
      set({ error: errorMessage });
    } finally {
      set({ isSyncing: false });
    }
  }
}));