import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '../config/supabase';
import { useAuthStore } from './useAuthStore';
import { useBalanceStore } from './useBalanceStore';

interface CajaState {
  isOpen: boolean;
  cajaStatusId: string | null;
  openedBy: string | null;
  openedAt: Date | null;
  closedBy: string | null;
  closedAt: Date | null;
  openCaja: () => Promise<void>;
  closeCaja: () => Promise<void>;
}

export const useCajaStore = create<CajaState>()(
  persist(
    (set, get) => ({
      isOpen: false,
      cajaStatusId: null,
      openedBy: null,
      openedAt: null,
      closedBy: null,
      closedAt: null,
      openCaja: async () => {
        const operator = useAuthStore.getState().user;
        if (!operator) {
          throw new Error('No operator logged in');
        }

        try {
          // Verificar si ya hay una caja abierta
          const { data: existingCaja, error: existingError } = await supabase
            .from('caja_status')
            .select('*')
            .eq('is_open', true)
            .single();

          if (existingError && existingError.code !== 'PGRST116') {
            console.error('Error fetching existing caja:', existingError);
            throw existingError;
          }

          if (existingCaja) {
            throw new Error('Ya existe una caja abierta');
          }

          // Crear una nueva entrada en caja_status
          const { data, error } = await supabase
            .from('caja_status')
            .insert({
              is_open: true,
              opened_by: operator.id,
              opened_at: new Date().toISOString(),
            })
            .select('id')
            .single();

          if (error) {
            console.error('Error inserting new caja:', error);
            throw error;
          }

          set({
            isOpen: true,
            cajaStatusId: data.id,
            openedBy: operator.id,
            openedAt: new Date(),
            closedBy: null,
            closedAt: null,
          });

          // Limpiar los balances existentes al abrir una nueva caja
          useBalanceStore.setState({ balances: [] });

        } catch (error) {
          console.error('Error opening caja:', error);
          throw error;
        }
      },
      closeCaja: async () => {
        const operator = useAuthStore.getState().user;
        const currentBalances = useBalanceStore.getState().balances;
        const cajaStatusId = get().cajaStatusId;

        if (!operator) {
          throw new Error('No operator logged in');
        }

        if (!cajaStatusId) {
          throw new Error('No hay una caja abierta');
        }

        try {
          // Guardar los balances finales
          const balanceSnapshots = currentBalances.map(balance => ({
            caja_status_id: cajaStatusId,
            balance_id: balance.id,
            final_amount: balance.amount,
            created_at: new Date().toISOString()
          }));

          // Insertar los snapshots de balances
          if (balanceSnapshots.length > 0) {
            const { error: snapshotError } = await supabase
              .from('balance_snapshots')
              .insert(balanceSnapshots);

            if (snapshotError) throw snapshotError;
          }

          // Actualizar el estado de la caja
          const { error: closeError } = await supabase
            .from('caja_status')
            .update({
              is_open: false,
              closed_by: operator.id,
              closed_at: new Date().toISOString(),
            })
            .eq('id', cajaStatusId);

          if (closeError) throw closeError;

          set({
            isOpen: false,
            cajaStatusId: null,
            closedBy: operator.id,
            closedAt: new Date(),
          });

          // Limpiar los balances al cerrar la caja
          useBalanceStore.setState({ balances: [] });

        } catch (error) {
          console.error('Error closing caja:', error);
          throw error;
        }
      },
    }),
    {
      name: 'caja-storage',
      storage: createJSONStorage(() => localStorage),
      version: 10,
      migrate: (persistedState: any, version) => {
        if (version < 10) {
          return {
            isOpen: false,
            cajaStatusId: null,
            openedBy: null,
            openedAt: null,
            closedBy: null,
            closedAt: null,
          };
        }
        return persistedState as CajaState;
      },
      partialize: (state) => ({
        ...state,
        openedAt: state.openedAt?.toISOString(),
        closedAt: state.closedAt?.toISOString(),
      }),
      merge: (persistedState: any, currentState) => ({
        ...currentState,
        ...persistedState,
        openedAt: persistedState.openedAt ? new Date(persistedState.openedAt) : null,
        closedAt: persistedState.closedAt ? new Date(persistedState.closedAt) : null,
      }),
    }
  )
);