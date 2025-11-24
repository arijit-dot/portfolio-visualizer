import React from 'react';
import { MVP_STOCKS } from '../../data/stocks';
import { Stock } from '../../types/portfolio';
import { SECTOR_COLORS } from '../../utils/constants';

interface StockSelectorProps {
    selectedStock: Stock | null;
    onStockSelect: (stock: Stock) => void;
}

const StockSelector: React.FC<StockSelectorProps> = ({
    selectedStock,
    onStockSelect
}) => {
    const stocksBySector = MVP_STOCKS.reduce((acc, stock) => {
        if (!acc[stock.sector]) {
            acc[stock.sector] = [];
        }
        acc[stock.sector].push(stock);
        return acc;
    }, {} as { [key: string]: Stock[] });

    return (
        <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Select from 5 large-cap stocks</span>
            </div>

            {Object.entries(stocksBySector).map(([sector, stocks]) => (
                <div key={sector} className="border border-gray-200 rounded-lg">
                    <div
                        className="px-4 py-2 text-sm font-medium text-white rounded-t-lg"
                        style={{ backgroundColor: SECTOR_COLORS[sector] || '#6B7280' }}
                    >
                        {sector}
                    </div>
                    <div className="divide-y divide-gray-200">
                        {stocks.map((stock) => (
                            <button
                                key={stock.symbol}
                                className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${selectedStock?.symbol === stock.symbol ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                                    }`}
                                onClick={() => onStockSelect(stock)}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-medium text-gray-900">{stock.name}</div>
                                        <div className="text-sm text-gray-500">{stock.symbol}</div>
                                    </div>
                                    {selectedStock?.symbol === stock.symbol && (
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            ))}

            {selectedStock && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-sm text-blue-800">
                        <span className="font-medium">Selected:</span> {selectedStock.name}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StockSelector;