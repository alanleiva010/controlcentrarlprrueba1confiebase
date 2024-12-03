import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { Bank } from '../types';
import { supabase } from '../config/supabase';

interface BankStore {
  banks: Bank[];
  addBank: (bank: Omit<Bank, 'id'>) => Promise<void>;
  updateBank: (id: string, bank: Partial<Bank>) => Promise<void>;
  deleteBank: (id: string) => Promise<void>;
  toggleActive: (id: string) => Promise<void>;
  editBank: (id: string, bank: Partial<Bank>) => Promise<void>;
}

export const useBankStore = create<BankStore>()(
  persist(
    (set, get) => ({
      banks: [],
      addBank: async (bank) => {
        const newBank = { ...bank, id: uuidv4() };
        
        try {
          const { error } = await supabase
            .from('banks')
            .insert({
              id: newBank.id,
              name: newBank.name,
              code: newBank.code,
              country: newBank.country,
              active: newBank.active,
            });

          if (error) throw error;

          set((state) => ({
            banks: [...state.banks, newBank],
          }));
        } catch (error) {
          console.error('Error adding bank:', error);
          throw error;
        }
      },
      updateBank: async (id, bank) => {
        try {
          const { error } = await supabase
            .from('banks')
            .update({
              name: bank.name,
              code: bank.code,
              country: bank.country,
              active: bank.active,
            })
            .eq('id', id);

          if (error) throw error;

          set((state) => ({
            banks: state.banks.map((b) => (b.id === id ? { ...b, ...bank } : b)),
          }));
        } catch (error) {
          console.error('Error updating bank:', error);
          throw error;
        }
      },
      deleteBank: async (id) => {
        try {
          const { error } = await supabase
            .from('banks')
            .delete()
            .eq('id', id);

          if (error) throw error;

          set((state) => ({
            banks: state.banks.filter((b) => b.id !== id),
          }));
        } catch (error) {
          console.error('Error deleting bank:', error);
          throw error;
        }
      },
      toggleActive: async (id) => {
        const bank = get().banks.find(b => b.id === id);
        if (!bank) return;

        try {
          const { error } = await supabase
            .from('banks')
            .update({ active: !bank.active })
            .eq('id', id);

          if (error) throw error;

          set((state) => ({
            banks: state.banks.map((b) => 
              b.id === id ? { ...b, active: !b.active } : b
            ),
          }));
        } catch (error) {
          console.error('Error toggling bank status:', error);
          throw error;
        }
      },
      editBank: async (id, bank) => {
        try {
          const { error } = await supabase
            .from('banks')
            .update({
              name: bank.name,
              code: bank.code,
              country: bank.country,
            })
            .eq('id', id);

          if (error) throw error;

          set((state) => ({
            banks: state.banks.map((b) => (b.id === id ? { ...b, ...bank } : b)),
          }));
        } catch (error) {
          console.error('Error editing bank:', error);
          throw error;
        }
      },
    }),
    {
      name: 'bank-storage',
      version: 4,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: any, version) => {
        if (version < 4) {
          return { banks: [] };
        }
        return persistedState as BankStore;
      },
    }
  )
);