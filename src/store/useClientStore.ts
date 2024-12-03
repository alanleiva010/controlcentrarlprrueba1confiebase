import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { Client } from '../types';
import { supabase } from '../config/supabase';

interface ClientStore {
  clients: Client[];
  addClient: (client: Omit<Client, 'id'>) => Promise<void>;
  updateClient: (id: string, client: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
}

export const useClientStore = create<ClientStore>()(
  persist(
    (set) => ({
      clients: [],
      addClient: async (client) => {
        const newClient = {
          ...client,
          id: uuidv4(),
        };

        try {
          const { error } = await supabase.from('clients').insert({
            id: newClient.id,
            name: newClient.name,
            document_type: newClient.documentType,
            document_number: newClient.documentNumber,
            phone: newClient.phone,
            email: newClient.email,
            address: newClient.address,
            kyc_status: newClient.kycStatus,
          });

          if (error) throw error;

          set((state) => ({
            clients: [...state.clients, newClient],
          }));
        } catch (error) {
          console.error('Error adding client:', error);
          throw error;
        }
      },
      updateClient: async (id, client) => {
        try {
          const { error } = await supabase
            .from('clients')
            .update({
              name: client.name,
              document_type: client.documentType,
              document_number: client.documentNumber,
              phone: client.phone,
              email: client.email,
              address: client.address,
              kyc_status: client.kycStatus,
            })
            .eq('id', id);

          if (error) throw error;

          set((state) => ({
            clients: state.clients.map((c) => (c.id === id ? { ...c, ...client } : c)),
          }));
        } catch (error) {
          console.error('Error updating client:', error);
          throw error;
        }
      },
      deleteClient: async (id) => {
        try {
          const { error } = await supabase
            .from('clients')
            .delete()
            .eq('id', id);

          if (error) throw error;

          set((state) => ({
            clients: state.clients.filter((c) => c.id !== id),
          }));
        } catch (error) {
          console.error('Error deleting client:', error);
          throw error;
        }
      },
    }),
    {
      name: 'client-storage',
      version: 2,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: any, version) => {
        if (version < 2) {
          return { clients: [] };
        }
        return persistedState as ClientStore;
      },
    }
  )
);