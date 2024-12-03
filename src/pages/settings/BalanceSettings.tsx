import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useBalanceStore } from '../../store/useBalanceStore';
import { useCurrencyStore } from '../../store/useCurrencyStore';
import { BalanceForm } from '../../components/BalanceForm';

export function BalanceSettings() {
  const [showForm, setShowForm] = useState(false);
  const { balances, addBalance, editBalance, deleteBalance, toggleActive } = useBalanceStore();
  const { currencies, cryptos } = useCurrencyStore();
  const allCurrencies = [...currencies, ...cryptos].filter(c => c.active);

  const handleSubmit = async (name: string, currency: string, amount: number) => {
    try {
      await addBalance({ name, currency, amount });
      setShowForm(false);
    } catch (error) {
      console.error('Error adding balance:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Configuración de Balances</h1>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar Balance
        </button>
      </div>

      {showForm && (
        <div className="bg-white shadow sm:rounded-lg p-6">
          <BalanceForm
            currencies={allCurrencies}
            onSubmit={handleSubmit}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Moneda
              </th>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Saldo Actual
              </th>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {balances.map((balance) => (
              <tr key={balance.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {balance.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {balance.currency}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {balance.amount.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => toggleActive(balance.id)}
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      balance.active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {balance.active ? 'Activo' : 'Inactivo'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => deleteBalance(balance.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}