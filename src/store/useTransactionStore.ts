import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { Transaction } from '../types';
import { useBalanceStore } from './useBalanceStore';
import { supabase } from '../config/supabase';

interface TransactionStore {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  getTransactionsByDate: (startDate: Date, endDate: Date) => Transaction[];
}

export const useTransactionStore = create<TransactionStore>()(
  persist(
    (set, get) => ({
      transactions: [],
      addTransaction: async (transaction) => {
        const newTransaction = {
          ...transaction,
          id: uuidv4(),
        };

        const updateBalance = useBalanceStore.getState().updateBalance;
        const amount = transaction.amount;
        const calculatedAmount = transaction.calculatedAmount;
        const netAmount = transaction.netAmount;
        const balanceId = transaction.balanceId;

        try {
          if (balanceId) {
            switch (transaction.currencyOperation) {
              case 'ARS_IN':
                await updateBalance(balanceId, netAmount || amount);
                break;
              case 'ARS_OUT':
                await updateBalance(balanceId, -(netAmount || amount));
                break;
              case 'USDT_BUY':
                if (calculatedAmount) {
                  await updateBalance(balanceId, calculatedAmount);
                }
                break;
              case 'USDT_SELL':
                await updateBalance(balanceId, -amount);
                break;
              case 'USDT_IN':
                await updateBalance(balanceId, amount);
                break;
              case 'USDT_OUT':
                await updateBalance(balanceId, -amount);
                break;
              case 'USD_IN':
                await updateBalance(balanceId, amount);
                break;
              case 'USD_OUT':
                await updateBalance(balanceId, -amount);
                break;
              case 'USD_BUY':
                if (calculatedAmount) {
                  await updateBalance(balanceId, calculatedAmount);
                }
                break;
              case 'USD_SELL':
                await updateBalance(balanceId, -amount);
                break;
            }
          }

          const { error } = await supabase
            .from('transactions')
            .insert({
              ...newTransaction,
              id: newTransaction.id,
              date: newTransaction.date.toISOString(),
              created_at: new Date().toISOString(),
            });

          if (error) throw error;

          set((state) => ({
            transactions: [newTransaction, ...state.transactions],
          }));
        } catch (error) {
          console.error('Error adding transaction:', error);
          throw error;
        }
      },
      getTransactionsByDate: (startDate: Date, endDate: Date) => {
        return get().transactions.filter(
          (transaction) =>
            new Date(transaction.date) >= startDate && new Date(transaction.date) <= endDate
        );
      },
    }),
    {
      name: 'transaction-storage',
      storage: createJSONStorage(() => localStorage),
      version: 5,
      migrate: (persistedState: any, version) => {
        if (version < 5) {
          return { transactions: [] };
        }
        return persistedState as TransactionStore;
      },
      partialize: (state) => ({
        transactions: state.transactions.map(transaction => ({
          ...transaction,
          date: transaction.date.toISOString(),
          createdAt: transaction.createdAt?.toISOString(),
          updatedAt: transaction.updatedAt?.toISOString()
        }))
      }),
      merge: (persistedState: any, currentState) => ({
        ...currentState,
        ...persistedState,
        transactions: persistedState.transactions.map((transaction: any) => ({
          ...transaction,
          date: new Date(transaction.date),
          createdAt: transaction.createdAt ? new Date(transaction.createdAt) : undefined,
          updatedAt: transaction.updatedAt ? new Date(transaction.updatedAt) : undefined
        }))
      })
    }
  )
);