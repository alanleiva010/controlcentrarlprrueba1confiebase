import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Currency, Crypto, NamedBalance } from '../types';
import { useBalanceStore } from '../store/useBalanceStore';

const balanceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  currency_code: z.string().min(1, 'Currency is required'),
  amount: z.number().min(0, 'Amount must be positive'),
});

type BalanceFormData = z.infer<typeof balanceSchema>;

interface BalanceFormProps {
  currencies: (Currency | Crypto)[];
  onSubmit: (data: BalanceFormData) => void;
  onCancel: () => void;
  cajaStatusId: string;
  initialBalance?: NamedBalance;
}

export function BalanceForm({ currencies, onSubmit, onCancel, cajaStatusId, initialBalance }: BalanceFormProps) {
  const { addBalance, editBalance } = useBalanceStore();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BalanceFormData>({
    resolver: zodResolver(balanceSchema),
    defaultValues: initialBalance ? {
      name: initialBalance.name,
      currency_code: initialBalance.currency_code,
      amount: initialBalance.amount,
    } : undefined,
  });

  const handleFormSubmit = async (data: BalanceFormData) => {
    try {
      if (!cajaStatusId) {
        throw new Error('No hay una caja abierta');
      }

      if (initialBalance) {
        await editBalance(initialBalance.id, data);
      } else {
        await addBalance({
          ...data,
          caja_status_id: cajaStatusId,
        });
      }

      onSubmit(data);
    } catch (error) {
      console.error('Error submitting balance:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Nombre del Balance
        </label>
        <input
          type="text"
          {...register('name')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder="Ej: Caja USD, Binance USDT, etc."
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Moneda
        </label>
        <select
          {...register('currency_code')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          disabled={!!initialBalance}
        >
          <option value="">Seleccionar moneda</option>
          {currencies.map((curr) => (
            <option key={curr.code} value={curr.code}>
              {curr.name} ({curr.code})
            </option>
          ))}
        </select>
        {errors.currency_code && (
          <p className="mt-1 text-sm text-red-600">{errors.currency_code.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Monto
        </label>
        <input
          type="number"
          step="0.01"
          {...register('amount', { valueAsNumber: true })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder="0.00"
        />
        {errors.amount && (
          <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
        )}
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
        >
          {initialBalance ? 'Actualizar Balance' : 'Guardar Balance'}
        </button>
      </div>
    </form>
  );
}