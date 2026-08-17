export let MARKET_EXCHANGE_RATE = 2300;

export function setActiveExchangeRate(rate: number) {
  if (rate > 0 && !isNaN(rate)) {
    MARKET_EXCHANGE_RATE = rate;
  }
}

export function calculateEstimate(amount: number, from: 'USD' | 'CDF', rate: number = MARKET_EXCHANGE_RATE): number {
  if (amount <= 0 || isNaN(amount)) {
    return 0;
  }
  if (from === 'USD') {
    return Math.round(amount * rate);
  } else {
    return Math.round((amount / rate) * 100) / 100;
  }
}

export function formatPriceValue(
  amountUsd: number,
  currency: 'USD' | 'CDF',
  rate: number = MARKET_EXCHANGE_RATE
): string {
  if (currency === 'USD') {
    return '$' + amountUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  } else {
    const cdf = Math.round(amountUsd * rate);
    return cdf.toLocaleString('fr-FR') + ' CDF';
  }
}
