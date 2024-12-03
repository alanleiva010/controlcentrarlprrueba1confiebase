import React from 'react';
import { format } from 'date-fns';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../config/supabase';

interface CajaHistoryEntry {
  id: string;
  opened_at: string;
  closed_at: string | null;
  opened_by: string;
  closed_by: string | null;
  balances: Array<{
    id: string;
    name: string;
    currency_code: string;
    amount: number;
    final_amount: number;
  }>;
}

export function CajaHistory() {
  const [history, setHistory] = React.useState<CajaHistoryEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { user: operator } = useAuthStore();

  React.useEffect(() => {
    const fetchHistory = async () => {
      try {
        // Obtener el historial de cajas con sus balances y snapshots
        const { data: cajaHistory, error: cajaError } = await supabase
          .from('caja_status')
          .select(`
            id,
            opened_at,
            closed_at,
            opened_by,
            closed_by,
            balances (
              id,
              name,
              currency_code,
              amount
            ),
            balance_snapshots (
              balance_id,
              final_amount
            )
          `)
          .order('opened_at', { ascending: false });

        if (cajaError) throw cajaError;

        // Procesar los datos para combinar balances con sus snapshots
        const formattedHistory = cajaHistory.map(entry => ({
          ...entry,
          balances: entry.balances.map(balance => {
            const snapshot = entry.balance_snapshots?.find(
              s => s.balance_id === balance.id
            );
            return {
              ...balance,
              final_amount: snapshot?.final_amount || balance.amount
            };
          })
        }));

        setHistory(formattedHistory);
      } catch (error) {
        console.error('Error fetching caja history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (!operator) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-gray-600">Debe iniciar sesión para ver el historial</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-gray-600">Cargando historial...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Historial de Caja</h1>

      <div className="space-y-4">
        {history.map((entry) => (
          <div
            key={entry.id}
            className="bg-white shadow overflow-hidden sm:rounded-lg"
          >
            <div className="px-4 py-5 sm:px-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {format(new Date(entry.opened_at), 'dd/MM/yyyy HH:mm')}
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    {entry.closed_at
                      ? `Cerrado el ${format(new Date(entry.closed_at), 'dd/MM/yyyy HH:mm')}`
                      : 'Abierto'}
                  </p>
                </div>
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    entry.closed_at
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {entry.closed_at ? 'Cerrado' : 'Abierto'}
                </span>
              </div>
            </div>
            <div className="border-t border-gray-200">
              <div className="px-4 py-5 sm:p-6">
                <h4 className="text-sm font-medium text-gray-900 mb-4">Balances</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {entry.balances.map((balance) => (
                    <div
                      key={balance.id}
                      className="bg-gray-50 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-900">
                          {balance.name}
                        </span>
                        <span className="text-sm text-gray-500">
                          {balance.currency_code}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Inicial</p>
                          <p className="text-sm font-medium text-gray-900">
                            {balance.amount.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Final</p>
                          <p className="text-sm font-medium text-gray-900">
                            {balance.final_amount.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}

        {history.length === 0 && (
          <div className="text-center py-12">
            <p className="text-lg text-gray-600">No hay historial disponible</p>
          </div>
        )}
      </div>
    </div>
  );
}