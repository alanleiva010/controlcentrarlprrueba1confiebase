import React from 'react';
import { format } from 'date-fns';
import { X } from 'lucide-react';
import { Transaction } from '../types';
import { formatCurrency } from '../utils/formatCurrency';

interface CajaHistoryDetailsProps {
  date: Date;
  transactions: Transaction[];
  onClose: () => void;
}

export function CajaHistoryDetails({ date, transactions, onClose }: CajaHistoryDetailsProps) {
  const filteredTransactions = transactions.filter(
    t => new Date(t.date).toDateString() === new Date(date).toDateString()
  );

  const groupedTransactions = {
    ARS: [] as Transaction[],
    USD: [] as Transaction[],
    USDT: [] as Transaction[],
  };

  filteredTransactions.forEach(transaction => {
    if (transaction.currencyOperation.includes('ARS')) {
      groupedTransactions.ARS.push(transaction);
    } else if (transaction.currencyOperation.includes('USD')) {
      groupedTransactions.USD.push(transaction);
    } else if (transaction.currencyOperation.includes('USDT')) {
      groupedTransactions.USDT.push(transaction);
    }
  });

  const getDisplayAmount = (transaction: Transaction) => {
    if (transaction.currencyOperation.includes('ARS')) {
      return transaction.netAmount || transaction.amount;
    }

    if (transaction.currencyOperation.includes('SELL')) {
      if (transaction.calculatedAmount) {
        return {
          primary: transaction.amount,
          secondary: transaction.netAmount || transaction.calculatedAmount
        };
      }
      return transaction.amount;
    }

    if (transaction.currencyOperation.includes('BUY')) {
      if (transaction.calculatedAmount) {
        return {
          primary: transaction.netAmount || transaction.amount,
          secondary: transaction.calculatedAmount
        };
      }
      return transaction.netAmount || transaction.amount;
    }

    return transaction.amount;
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            Detalle de Movimientos - {format(new Date(date), 'dd/MM/yyyy')}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
          {Object.entries(groupedTransactions).map(([currency, txs]) => (
            <div key={currency} className="space-y-4">
              <h4 className="text-md font-medium text-gray-900 sticky top-0 bg-white py-2">
                Movimientos en {currency}
              </h4>
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Hora</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Operación</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Tipo</th>
                      <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {txs.map((tx) => {
                      const displayAmount = getDisplayAmount(tx);
                      return (
                        <tr key={tx.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900">
                            {format(new Date(tx.date), 'HH:mm')}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {tx.currencyOperation}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {tx.operationType}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-gray-900">
                            {typeof displayAmount === 'object' ? (
                              <>
                                {formatCurrency(displayAmount.primary, tx.currencyOperation)}
                                <span className="block text-xs text-gray-500">
                                  {formatCurrency(
                                    displayAmount.secondary,
                                    tx.currencyOperation.includes('BUY') ? 
                                      tx.currencyOperation.replace('BUY', 'IN') : 
                                      'ARS_IN'
                                  )}
                                </span>
                              </>
                            ) : (
                              formatCurrency(displayAmount, tx.currencyOperation)
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {txs.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-3 py-4 text-sm text-gray-500 text-center">
                          No hay movimientos para mostrar
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}