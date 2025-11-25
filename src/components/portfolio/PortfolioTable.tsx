import React from 'react';
import Button from '../common/Button';
import { Holding } from '../../types/portfolio';
import { formatCurrency } from '../../utils/formatters';
import { getStockBySymbol } from '../../data/stocks';

interface PortfolioTableProps {
    holdings: Holding[];
    onEdit: (holdingId: string) => void;
    onRemove: (holdingId: string) => void;
}

const PortfolioTable: React.FC<PortfolioTableProps> = ({
    holdings,
    onEdit,
    onRemove
}) => {
    const calculateHoldingValue = (holding: Holding) => {
        const currentPrice = holding.currentPrice || holding.purchasePrice;
        return holding.quantity * currentPrice;
    };

    const calculatePnL = (holding: Holding) => {
        const currentPrice = holding.currentPrice || holding.purchasePrice;
        const investment = holding.quantity * holding.purchasePrice;
        const currentValue = holding.quantity * currentPrice;
        return currentValue - investment;
    };

    const calculatePnLPercentage = (holding: Holding) => {
        const investment = holding.quantity * holding.purchasePrice;
        const pnl = calculatePnL(holding);
        return (pnl / investment) * 100;
    };

    if (holdings.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                No holdings in portfolio
            </div>
        );
    }

    return (
        <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Stock
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Qty
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Avg Cost
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Current
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            P&L
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Value
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {holdings.map((holding) => {
                        const stock = getStockBySymbol(holding.symbol);
                        const pnl = calculatePnL(holding);
                        const pnlPercentage = calculatePnLPercentage(holding);
                        const currentValue = calculateHoldingValue(holding);
                        const currentPrice = holding.currentPrice || holding.purchasePrice;

                        return (
                            <tr key={holding.id} className="hover:bg-gray-50">
                                <td className="px-4 py-4 whitespace-nowrap">
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">
                                            {stock?.name || holding.symbol}
                                        </div>
                                        <div className="text-sm text-gray-500">{holding.symbol}</div>
                                    </div>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {holding.quantity}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {formatCurrency(holding.purchasePrice)}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {formatCurrency(currentPrice)}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                    <div className={`text-sm font-medium ${pnl >= 0 ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        {formatCurrency(pnl)}
                                    </div>
                                    <div className={`text-xs ${pnl >= 0 ? 'text-green-500' : 'text-red-500'
                                        }`}>
                                        {pnl >= 0 ? '+' : ''}{pnlPercentage.toFixed(2)}%
                                    </div>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {formatCurrency(currentValue)}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex space-x-2">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => onEdit(holding.id)}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={() => {
                                                if (window.confirm('Remove this holding from portfolio?')) {
                                                    onRemove(holding.id);
                                                }
                                            }}
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {/* Portfolio Summary */}
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">
                        Total Holdings: {holdings.length}
                    </span>
                    <div className="text-right">
                        <div className="text-gray-900 font-medium">
                            Total Value: {formatCurrency(
                                holdings.reduce((total, holding) => total + calculateHoldingValue(holding), 0)
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PortfolioTable;