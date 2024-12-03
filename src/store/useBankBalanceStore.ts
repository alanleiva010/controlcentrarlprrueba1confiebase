import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { BankBalance } from '../types';
import { supabase } from '../config/supabase';

interface BankBalanceStore {
  bankBalances: BankBalance[];
  addBankBalance: (balance: BankBalance) => Promise<void>;
  updateBankBalance: (bankId: string, currency: string, amount: number) => Promise<void>;
  getBankBalance: (bankId: string, currency: string) => number;
  setBankBalance: (bankId: string, currency: string, amount: number) => Promise<void>;
}

export const useBankBalanceStore = create<BankBalanceStore>()(
  persist(
    (set, get) => ({
      bankBalances: [],
      addBankBalance: async (balance) => {
        try {
          const { error } = await supabase
            .from('bank_balances')
            .upsert({
              bank_id: balance.bankId,
              currency: balance.currency,
              amount: balance.amount,
            }, {
              onConflict: 'bank_id,currency'
            });

          if (error) throw error;

          set((state) => {
            const existingIndex = state.bankBalances.findIndex(
              (b) => b.bankId === balance.bankId && b.currency === balance.currency
            );

            if (existingIndex >= 0) {
              const newBalances = [...state.bankBalances];
              newBalances[existingIndex] = balance;
              return { bankBalances: newBalances };
            }

            return { bankBalances: [...state.bankBalances, balance] };
          });
        } catch (error) {
          console.error('Error adding bank balance:', error);
          throw error;
        }
      },
      updateBankBalance: async (bankId, currency, amount) => {
        try {
          const currentBalance = get().getBankBalance(bankId, currency);
          const newAmount = currentBalance + amount;

          const { error } = await supabase
            .from('bank_balances')
            .upsert({
              bank_id: bankId,
              currency: currency,
              amount: newAmount,
            }, {
              onConflict: 'bank_id,currency'
            });

          if (error) throw error;

          set((state) => {
            const existingIndex = state.bankBalances.findIndex(
              (b) => b.bankId === bankId && b.currency === currency
            );

            if (existingIndex >= 0) {
              const newBalances = [...state.bankBalances];
              newBalances[existingIndex] = {
                ...newBalances[existingIndex],
                amount: newAmount,
              };
              return { bankBalances: newBalances };
            }

            return {
              bankBalances: [...state.bankBalances, { bankId, currency, amount: newAmount }],
            };
          });
        } catch (error) {
          console.error('Error updating bank balance:', error);
          throw error;
        }
      },
      setBankBalance: async (bankId, currency, amount) => {
        try {
          const { error } = await supabase
            .from('bank_balances')
            .upsert({
              bank_id: bankId,
              currency: currency,
              amount: amount,
            }, {
              onConflict: 'bank_id,currency'
            });

          if (error) throw error;

          set((state) => {
            const existingIndex = state.bankBalances.findIndex(
              (b) => b.bankId === bankId && b.currency === currency
            );

            const newBalance = { bankId, currency, amount };

            if (existingIndex >= 0) {
              const newBalances = [...state.bankBalances];
              newBalances[existingIndex] = newBalance;
              return { bankBalances: newBalances };
            }

            return {
              bankBalances: [...state.bankBalances, newBalance],
            };
          });
        } catch (error) {
          console.error('Error setting bank balance:', error);
          throw error;
        }
      },
      getBankBalance: (bankId, currency) => {
        const balance = get().bankBalances.find(
          (b) => b.bankId === bankId && b.currency === currency
        );
        return balance?.amount || 0;
      },
    }),
    {
      name: 'bank-balance-storage',
      version: 3,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: any, version) => {
        if (version < 3) {
          return { bankBalances: [] };
        }
        return persistedState as BankBalanceStore;
      }
    }
  )
);