export function formatCurrency(amount: number, currencyOperation?: string): string {
  if (!amount) return '0.00';
  const formattedAmount = amount.toFixed(2);
  
  if (!currencyOperation) return formattedAmount;
  
  if (currencyOperation.includes('ARS')) {
    return `$${formattedAmount}`;
  } else if (currencyOperation.includes('USDT')) {
    return `${formattedAmount} USDT`;
  } else if (currencyOperation.includes('USD')) {
    return `${formattedAmount} USD`;
  }
  
  return formattedAmount;
}