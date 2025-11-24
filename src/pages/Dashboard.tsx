import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { usePortfolio } from '../hooks/usePortfolio';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import { getStockBySymbol } from '../data/stocks';
import { SECTOR_COLORS } from '../utils/constants';

// Import charts
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const Dashboard: React.FC = () => {
    const {
        portfolio,
        isLoaded,
        getPortfolioValue,
        getTotalInvestment,
        getTotalPnL,
        getTotalPnLPercentage,
        getTodaysPnL,
        getHoldingPnL,
        getHoldingPnLPercentage,
        refreshPrices
    } = usePortfolio();

    const [chartData, setChartData] = useState<any>(null);
    const [allocationData, setAllocationData] = useState<any>(null);

    // Prepare chart data when portfolio changes
    useEffect(() => {
        if (portfolio.holdings.length > 0) {
            prepareChartData();
            prepareAllocationData();
        }
    }, [portfolio]);

    const prepareChartData = () => {
        // Mock performance data
        const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        const portfolioValues = [30000, 32000, 31000, 33500, 34000, getPortfolioValue()];
        const niftyValues = [100, 105, 102, 108, 110, 112]; // Normalized

        setChartData({
            labels,
            datasets: [
                {
                    label: 'Your Portfolio',
                    data: portfolioValues,
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true,
                },
                {
                    label: 'Nifty 50',
                    data: niftyValues,
                    borderColor: 'rgb(107, 114, 128)',
                    backgroundColor: 'rgba(107, 114, 128, 0.1)',
                    tension: 0.4,
                    fill: false,
                },
            ],
        });
    };

    const prepareAllocationData = () => {
        const sectors: { [key: string]: number } = {};

        portfolio.holdings.forEach(holding => {
            const stock = getStockBySymbol(holding.symbol);
            const currentPrice = holding.currentPrice || holding.purchasePrice;
            const value = holding.quantity * currentPrice;

            if (stock && stock.sector) {
                sectors[stock.sector] = (sectors[stock.sector] || 0) + value;
            }
        });

        const sectorNames = Object.keys(sectors);
        const sectorValues = Object.values(sectors);
        const sectorColors = sectorNames.map(sector => SECTOR_COLORS[sector] || '#6B7280');

        setAllocationData({
            labels: sectorNames,
            datasets: [
                {
                    data: sectorValues,
                    backgroundColor: sectorColors,
                    borderWidth: 2,
                    borderColor: '#fff',
                },
            ],
        });
    };

    const metrics = {
        portfolioValue: getPortfolioValue(),
        totalInvestment: getTotalInvestment(),
        totalPnL: getTotalPnL(),
        totalPnLPercentage: getTotalPnLPercentage(),
        todaysPnL: getTodaysPnL(),
        holdingsCount: portfolio.holdings.length
    };

    const hasHoldings = portfolio.holdings.length > 0;

    // Chart options
    const performanceChartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: true,
                text: '6-Month Performance vs Nifty 50',
            },
        },
        scales: {
            y: {
                beginAtZero: false,
            },
        },
    };

    const allocationChartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'bottom' as const,
            },
        },
    };

    if (!isLoaded) {
        return (
            <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Loading...</h2>
                    <p className="text-gray-600">Loading your portfolio data...</p>
                </div>
            </div>
        );
    }

    if (!hasHoldings) {
        return (
            <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                        No Portfolio Found
                    </h2>
                    <p className="text-gray-600 mb-8">
                        Create a portfolio to see your dashboard.
                    </p>
                    <Link to="/portfolio">
                        <Button size="lg">
                            Create Portfolio
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Portfolio Dashboard</h1>
                <div className="flex space-x-3">
                    <Button variant="secondary" onClick={refreshPrices}>
                        🔄 Refresh Prices
                    </Button>
                    <Link to="/portfolio">
                        <Button variant="secondary">Edit Portfolio</Button>
                    </Link>
                    <Link to="/valuation">
                        <Button>Valuation Analysis</Button>
                    </Link>
                </div>
            </div>

            {/* Portfolio Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card title="Portfolio Value">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                            {formatCurrency(metrics.portfolioValue)}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                            Current value
                        </div>
                    </div>
                </Card>

                <Card title="Total P&L">
                    <div className="text-center">
                        <div className={`text-2xl font-bold ${metrics.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                            {formatCurrency(metrics.totalPnL)}
                        </div>
                        <div className={`text-sm ${metrics.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatPercentage(metrics.totalPnLPercentage / 100)}
                        </div>
                    </div>
                </Card>

                <Card title="Today's P&L">
                    <div className="text-center">
                        <div className={`text-2xl font-bold ${metrics.todaysPnL >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                            {formatCurrency(metrics.todaysPnL)}
                        </div>
                        <div className={`text-sm ${metrics.todaysPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatPercentage(0.0054)} {/* +0.54% */}
                        </div>
                    </div>
                </Card>

                <Card title="Holdings">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                            {metrics.holdingsCount}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                            Stocks
                        </div>
                    </div>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Performance vs Benchmark">
                    <div className="h-80">
                        {chartData ? (
                            <Line data={chartData} options={performanceChartOptions} />
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-500">
                                Loading chart...
                            </div>
                        )}
                    </div>
                </Card>

                <Card title="Sector Allocation">
                    <div className="h-80">
                        {allocationData ? (
                            <Doughnut data={allocationData} options={allocationChartOptions} />
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-500">
                                Loading allocation...
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* Risk Metrics */}
            <Card title="Risk Analytics">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-xl font-bold text-blue-900">16.8%</div>
                        <div className="text-sm text-blue-700">Volatility</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-xl font-bold text-green-900">1.05</div>
                        <div className="text-sm text-green-700">Beta vs Nifty</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <div className="text-xl font-bold text-yellow-900">-12.3%</div>
                        <div className="text-sm text-yellow-700">Max Drawdown</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-xl font-bold text-purple-900">0.89</div>
                        <div className="text-sm text-purple-700">Sharpe Ratio</div>
                    </div>
                </div>
            </Card>

            {/* Holdings List */}
            <Card
                title="Your Holdings"
                actions={
                    <div className="text-sm text-gray-600">
                        Total: {formatCurrency(metrics.portfolioValue)}
                    </div>
                }
            >
                <div className="overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Cost</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">P&L</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {portfolio.holdings.map((holding) => {
                                const stock = getStockBySymbol(holding.symbol);
                                const currentPrice = holding.currentPrice || holding.purchasePrice;
                                const currentValue = holding.quantity * currentPrice;
                                const pnl = getHoldingPnL(holding);
                                const pnlPercentage = getHoldingPnLPercentage(holding);

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
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {formatCurrency(currentValue)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default Dashboard;