import { CURRENCY_SYMBOL } from './constants';

export const formatCurrency = (amount: number): string => {
    return `${CURRENCY_SYMBOL}${amount.toLocaleString('en-IN', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2
    })}`;
};

export const formatPercentage = (value: number): string => {
    return `${value > 0 ? '+' : ''}${(value * 100).toFixed(2)}%`;
};

export const formatNumber = (num: number): string => {
    if (num >= 10000000) {
        return `${(num / 10000000).toFixed(2)}Cr`;
    } else if (num >= 100000) {
        return `${(num / 100000).toFixed(2)}L`;
    } else if (num >= 1000) {
        return `${(num / 1000).toFixed(2)}K`;
    }
    return num.toString();
};