export interface Stock {
    symbol: string;
    name: string;
    sector: string;
    currentPrice?: number;
}

export interface Holding {
    id: string;
    symbol: string;
    quantity: number;
    purchasePrice: number;
    purchaseDate: string;
    currentPrice?: number;
}

export interface Portfolio {
    holdings: Holding[];
}

export interface ValuationResult {
    intrinsicValue: number;
    marginOfSafety: number;
    recommendation: 'BUY' | 'HOLD' | 'SELL';
    assumptions: {
        growthRate: number;
        discountRate: number;
        terminalGrowth: number;
    };
}