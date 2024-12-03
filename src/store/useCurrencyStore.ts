import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { Currency, Crypto } from '../types';
import { supabase } from '../config/supabase';

interface CurrencyStore {
  currencies: Currency[];
  cryptos: Crypto[];
  addCurrency: (currency: Omit<Currency, 'id'>) => Promise<void>;
  updateCurrency: (id: string, currency: Partial<Currency>) => Promise<void>;
  deleteCurrency: (id: string) => Promise<void>;
  addCrypto: (crypto: Omit<Crypto, 'id'>) => Promise<void>;
  updateCrypto: (id: string, crypto: Partial<Crypto>) => Promise<void>;
  deleteCrypto: (id: string) => Promise<void>;
}

const defaultCurrencies: Currency[] = [
  { id: '1', code: 'USD', name: 'US Dollar', symbol: '$', buyRate: 3.72, sellRate: 3.75, active: true },
  { id: '2', code: 'EUR', name: 'Euro', symbol: '€', buyRate: 4.05, sellRate: 4.08, active: true },
  { id: '3', code: 'ARS', name: 'Argentine Peso', symbol: '$', buyRate: 1, sellRate: 1, active: true },
];

const defaultCryptos: Crypto[] = [
  { id: '1', name: 'Bitcoin', code: 'BTC', network: 'Bitcoin', active: true },
  { id: '2', name: 'Ethereum', code: 'ETH', network: 'Ethereum', active: true },
  { id: '3', name: 'USDT', code: 'USDT', network: 'Tron', active: true },
];

export const useCurrencyStore = create<CurrencyStore>()(
  persist(
    (set) => ({
      currencies: defaultCurrencies,
      cryptos: defaultCryptos,
      addCurrency: async (currency) => {
        const newCurrency = { ...currency, id: uuidv4() };
        
        try {
          const { error } = await supabase
            .from('currencies')
            .insert({
              id: newCurrency.id,
              code: newCurrency.code,
              name: newCurrency.name,
              symbol: newCurrency.symbol,
              buy_rate: newCurrency.buyRate,
              sell_rate: newCurrency.sellRate,
              active: newCurrency.active,
              type: 'FIAT'
            });

          if (error) throw error;

          set((state) => ({
            currencies: [...state.currencies, newCurrency],
          }));
        } catch (error) {
          console.error('Error adding currency:', error);
          throw error;
        }
      },
      updateCurrency: async (id, currency) => {
        try {
          const { error } = await supabase
            .from('currencies')
            .update({
              code: currency.code,
              name: currency.name,
              symbol: currency.symbol,
              buy_rate: currency.buyRate,
              sell_rate: currency.sellRate,
              active: currency.active,
            })
            .eq('id', id);

          if (error) throw error;

          set((state) => ({
            currencies: state.currencies.map((c) =>
              c.id === id ? { ...c, ...currency } : c
            ),
          }));
        } catch (error) {
          console.error('Error updating currency:', error);
          throw error;
        }
      },
      deleteCurrency: async (id) => {
        try {
          const { error } = await supabase
            .from('currencies')
            .delete()
            .eq('id', id);

          if (error) throw error;

          set((state) => ({
            currencies: state.currencies.filter((c) => c.id !== id),
          }));
        } catch (error) {
          console.error('Error deleting currency:', error);
          throw error;
        }
      },
      addCrypto: async (crypto) => {
        const newCrypto = { ...crypto, id: uuidv4() };
        
        try {
          const { error } = await supabase
            .from('currencies')
            .insert({
              id: newCrypto.id,
              code: newCrypto.code,
              name: newCrypto.name,
              network: newCrypto.network,
              active: newCrypto.active,
              type: 'CRYPTO'
            });

          if (error) throw error;

          set((state) => ({
            cryptos: [...state.cryptos, newCrypto],
          }));
        } catch (error) {
          console.error('Error adding crypto:', error);
          throw error;
        }
      },
      updateCrypto: async (id, crypto) => {
        try {
          const { error } = await supabase
            .from('currencies')
            .update({
              code: crypto.code,
              name: crypto.name,
              network: crypto.network,
              active: crypto.active,
            })
            .eq('id', id);

          if (error) throw error;

          set((state) => ({
            cryptos: state.cryptos.map((c) =>
              c.id === id ? { ...c, ...crypto } : c
            ),
          }));
        } catch (error) {
          console.error('Error updating crypto:', error);
          throw error;
        }
      },
      deleteCrypto: async (id) => {
        try {
          const { error } = await supabase
            .from('currencies')
            .delete()
            .eq('id', id);

          if (error) throw error;

          set((state) => ({
            cryptos: state.cryptos.filter((c) => c.id !== id),
          }));
        } catch (error) {
          console.error('Error deleting crypto:', error);
          throw error;
        }
      },
    }),
    {
      name: 'currency-storage',
      version: 2,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: any, version) => {
        if (version < 2) {
          return {
            currencies: defaultCurrencies,
            cryptos: defaultCryptos
          };
        }
        return persistedState as CurrencyStore;
      },
    }
  )
);