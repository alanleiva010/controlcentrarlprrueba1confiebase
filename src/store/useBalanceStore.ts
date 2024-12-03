import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { NamedBalance } from '../types';
import { supabase } from '../config/supabase';

interface BalanceStore {
  balances: NamedBalance[];
  addBalance: (balance: Omit<NamedBalance, 'id' | 'active'> & { caja_status_id: string }) => Promise<void>;
  updateBalance: (id: string, amount: number) => Promise<void>;
  editBalance: (id: string, data: Partial<NamedBalance>) => Promise<void>;
  deleteBalance: (id: string) => Promise<void>;
  toggleActive: (id: string) => Promise<void>;
  getBalance: (id: string) => NamedBalance | undefined;
}

export const useBalanceStore = create<BalanceStore>()(
  persist(
    (set, get) => ({
      balances: [],
      addBalance: async (balance) => {
        const newBalance = {
          ...balance,
          id: uuidv4(),
          active: true,
        };

        try {
          const { error } = await supabase
            .from('balances')
            .insert({
              id: newBalance.id,
              name: newBalance.name,
              currency_code: newBalance.currency_code,
              amount: newBalance.amount,
              active: true,
              caja_status_id: newBalance.caja_status_id,
              created_at: new Date().toISOString(),
            });

          if (error) throw error;

          set((state) => ({
            balances: [...state.balances, newBalance],
          }));
        } catch (error) {
          console.error('Error adding balance:', error);
          throw error;
        }
      },
      updateBalance: async (id, amount) => {
        const balance = get().balances.find((b) => b.id === id);
        if (!balance) return;

        const newAmount = balance.amount + amount;

        try {
          const { error } = await supabase
            .from('balances')
            .update({
              amount: newAmount,
              updated_at: new Date().toISOString(),
            })
            .eq('id', id);

          if (error) throw error;

          set((state) => ({
            balances: state.balances.map((b) =>
              b.id === id ? { ...b, amount: newAmount } : b
            ),
          }));
        } catch (error) {
          console.error('Error updating balance:', error);
          throw error;
        }
      },
      editBalance: async (id, data) => {
        try {
          const { error } = await supabase
            .from('balances')
            .update({
              ...data,
              updated_at: new Date().toISOString(),
            })
            .eq('id', id);

          if (error) throw error;

          set((state) => ({
            balances: state.balances.map((b) =>
              b.id === id ? { ...b, ...data } : b
            ),
          }));
        } catch (error) {
          console.error('Error editing balance:', error);
          throw error;
        }
      },
      deleteBalance: async (id) => {
        try {
          const { error } = await supabase
            .from('balances')
            .delete()
            .eq('id', id);

          if (error) throw error;

          set((state) => ({
            balances: state.balances.filter((b) => b.id !== id),
          }));
        } catch (error) {
          console.error('Error deleting balance:', error);
          throw error;
        }
      },
      toggleActive: async (id) => {
        const balance = get().balances.find((b) => b.id === id);
        if (!balance) return;

        try {
          const { error } = await supabase
            .from('balances')
            .update({
              active: !balance.active,
              updated_at: new Date().toISOString(),
            })
            .eq('id', id);

          if (error) throw error;

          set((state) => ({
            balances: state.balances.map((b) =>
              b.id === id ? { ...b, active: !b.active } : b
            ),
          }));
        } catch (error) {
          console.error('Error toggling balance status:', error);
          throw error;
        }
      },
      getBalance: (id) => {
        return get().balances.find((b) => b.id === id);
      },
    }),
    {
      name: 'balance-storage',
      version: 5,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: any, version) => {
        if (version < 5) {
          return { balances: [] };
        }
        return persistedState as BalanceStore;
      },
    }
  )
);