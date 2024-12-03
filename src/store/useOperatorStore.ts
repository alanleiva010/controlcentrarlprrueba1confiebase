import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { Operator } from '../types';
import { supabase } from '../config/supabase';

interface OperatorStore {
  operators: Operator[];
  addOperator: (operator: Omit<Operator, 'id' | 'active'>) => Promise<void>;
  updateOperator: (id: string, operator: Partial<Operator>) => Promise<void>;
  deleteOperator: (id: string) => Promise<void>;
  getOperatorByEmail: (email: string) => Promise<Operator | null>;
}

// Create a proper UUID for the default admin
const DEFAULT_ADMIN_ID = '00000000-0000-0000-0000-000000000000';

const defaultOperators: Operator[] = [
  {
    id: DEFAULT_ADMIN_ID,
    name: 'Administrador',
    email: 'alan@menlei.net',
    password: '123456',
    role: 'admin',
    permissions: {
      clients: true,
      providers: true,
      banks: true,
      cryptos: true,
      currencies: true,
      operators: true,
      transactions: true,
      reports: true,
    },
    active: true,
  }
];

export const useOperatorStore = create<OperatorStore>()(
  persist(
    (set, get) => ({
      operators: defaultOperators,
      addOperator: async (operator) => {
        const newOperator = {
          ...operator,
          id: uuidv4(),
          active: true,
        };

        try {
          const { error } = await supabase.from('operators').insert(newOperator);
          if (error) throw error;

          set((state) => ({
            operators: [...state.operators, newOperator],
          }));
        } catch (error) {
          console.error('Error adding operator:', error);
          throw error;
        }
      },
      updateOperator: async (id, operator) => {
        try {
          const { error } = await supabase
            .from('operators')
            .update(operator)
            .eq('id', id);

          if (error) throw error;

          set((state) => ({
            operators: state.operators.map((op) =>
              op.id === id ? { ...op, ...operator } : op
            ),
          }));
        } catch (error) {
          console.error('Error updating operator:', error);
          throw error;
        }
      },
      deleteOperator: async (id) => {
        try {
          const { error } = await supabase
            .from('operators')
            .delete()
            .eq('id', id);

          if (error) throw error;

          set((state) => ({
            operators: state.operators.filter((op) => op.id !== id),
          }));
        } catch (error) {
          console.error('Error deleting operator:', error);
          throw error;
        }
      },
      getOperatorByEmail: async (email) => {
        try {
          const { data, error } = await supabase
            .from('operators')
            .select('*')
            .eq('email', email)
            .single();

          if (error) {
            console.error('Error fetching operator by email:', error);
            return null;
          }

          return data as Operator;
        } catch (error) {
          console.error('Error getting operator by email:', error);
          return null;
        }
      },
    }),
    {
      name: 'operator-storage',
      version: 8,
      storage: createJSONStorage(() => localStorage),
      migrate: async (persistedState: any, version) => {
        if (version < 8) {
          const { data: operators } = await supabase.from('operators').select('*');
          return { operators: operators || defaultOperators };
        }
        return persistedState as OperatorStore;
      },
    }
  )
);