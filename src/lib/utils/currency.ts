/**
 * Taux de repli tant que platform_settings n'est pas chargé.
 * Doit rester aligné sur la valeur par défaut de la base (platform_settings.exchange_rate).
 */
export const DEFAULT_EXCHANGE_RATE = 2300;

export let MARKET_EXCHANGE_RATE = DEFAULT_EXCHANGE_RATE;

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

export function formatPriceCDF(priceUsd: number, exchangeRate: number = MARKET_EXCHANGE_RATE): string {
  const totalCdf = Math.round(priceUsd * (exchangeRate || DEFAULT_EXCHANGE_RATE));
  return new Intl.NumberFormat('fr-CD').format(totalCdf) + ' FC';
}

export function formatPriceUSD(priceUsd: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(priceUsd);
}

export function formatPriceValue(
  amountUsd: number,
  currency: 'USD' | 'CDF',
  rate: number = MARKET_EXCHANGE_RATE
): string {
  if (currency === 'USD') {
    return '$' + amountUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  } else {
    const cdf = Math.round(amountUsd * (rate || DEFAULT_EXCHANGE_RATE));
    return cdf.toLocaleString('fr-FR') + ' CDF';
  }
}
