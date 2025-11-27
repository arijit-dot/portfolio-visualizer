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
        maintainAspectRatio: false,
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
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom' as const,
            },
        },
    };

    if (!isLoaded) {
        return (
            <div className="text-center py-8 sm:py-12 px-4">
                <div className="max-w-md mx-auto">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Loading...</h2>
                    <p className="text-gray-600 text-sm sm:text-base">Loading your portfolio data...</p>
                </div>
            </div>
        );
    }

    if (!hasHoldings) {
        return (
            <div className="text-center py-8 sm:py-12 px-4">
                <div className="max-w-md mx-auto">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                        No Portfolio Found
                    </h2>
                    <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base">
                        Create a portfolio to see your dashboard.
                    </p>
                    <Link to="/portfolio">
                        <Button size="lg" className="text-sm sm:text-base">
                            Create Portfolio
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6 w-full mx-auto px-3 sm:px-4 lg:px-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Portfolio Dashboard</h1>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <Button variant="secondary" onClick={refreshPrices} className="text-xs sm:text-sm">
                        🔄 Refresh
                    </Button>
                    <Link to="/portfolio">
                        <Button variant="secondary" className="text-xs sm:text-sm">Edit Portfolio</Button>
                    </Link>
                    <Link to="/valuation">
                        <Button className="text-xs sm:text-sm">Valuation</Button>
                    </Link>
                </div>
            </div>

            {/* Portfolio Overview Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                <Card className="p-3 sm:p-4">
                    <div className="text-center">
                        <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                            {formatCurrency(metrics.portfolioValue)}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600 mt-1">
                            Portfolio Value
                        </div>
                    </div>
                </Card>

                <Card className="p-3 sm:p-4">
                    <div className="text-center">
                        <div className={`text-lg sm:text-xl md:text-2xl font-bold ${metrics.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                            {formatCurrency(metrics.totalPnL)}
                        </div>
                        <div className={`text-xs sm:text-sm ${metrics.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatPercentage(metrics.totalPnLPercentage / 100)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Total P&L</div>
                    </div>
                </Card>

                <Card className="p-3 sm:p-4">
                    <div className="text-center">
                        <div className={`text-lg sm:text-xl md:text-2xl font-bold ${metrics.todaysPnL >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                            {formatCurrency(metrics.todaysPnL)}
                        </div>
                        <div className={`text-xs sm:text-sm ${metrics.todaysPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatPercentage(0.0054)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Today's P&L</div>
                    </div>
                </Card>

                <Card className="p-3 sm:p-4">
                    <div className="text-center">
                        <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                            {metrics.holdingsCount}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600 mt-1">
                            Holdings
                        </div>
                    </div>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                <Card title="Performance vs Benchmark" className="p-3 sm:p-4">
                    <div className="h-64 sm:h-72 md:h-80">
                        {chartData ? (
                            <Line data={chartData} options={performanceChartOptions} />
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                                Loading chart...
                            </div>
                        )}
                    </div>
                </Card>

                <Card title="Sector Allocation" className="p-3 sm:p-4">
                    <div className="h-64 sm:h-72 md:h-80">
                        {allocationData ? (
                            <Doughnut data={allocationData} options={allocationChartOptions} />
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                                Loading allocation...
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* Risk Metrics */}
            <Card title="Risk Analytics" className="p-3 sm:p-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
                        <div className="text-lg sm:text-xl font-bold text-blue-900">16.8%</div>
                        <div className="text-xs sm:text-sm text-blue-700">Volatility</div>
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
                        <div className="text-lg sm:text-xl font-bold text-green-900">1.05</div>
                        <div className="text-xs sm:text-sm text-green-700">Beta vs Nifty</div>
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-yellow-50 rounded-lg">
                        <div className="text-lg sm:text-xl font-bold text-yellow-900">-12.3%</div>
                        <div className="text-xs sm:text-sm text-yellow-700">Max Drawdown</div>
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-purple-50 rounded-lg">
                        <div className="text-lg sm:text-xl font-bold text-purple-900">0.89</div>
                        <div className="text-xs sm:text-sm text-purple-700">Sharpe Ratio</div>
                    </div>
                </div>
            </Card>

            {/* Holdings List */}
            <Card
                title="Your Holdings"
                actions={
                    <div className="text-xs sm:text-sm text-gray-600">
                        Total: {formatCurrency(metrics.portfolioValue)}
                    </div>
                }
                className="p-3 sm:p-4"
            >
                <div className="overflow-x-auto">
                    <div className="min-w-[600px]">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                                    <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                                    <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Cost</th>
                                    <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Current</th>
                                    <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">P&L</th>
                                    <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
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
                                            <td className="px-3 py-3 sm:px-4 sm:py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {stock?.name || holding.symbol}
                                                    </div>
                                                    <div className="text-xs text-gray-500">{holding.symbol}</div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 sm:px-4 sm:py-4 whitespace-nowrap text-sm text-gray-900">
                                                {holding.quantity}
                                            </td>
                                            <td className="px-3 py-3 sm:px-4 sm:py-4 whitespace-nowrap text-sm text-gray-900">
                                                {formatCurrency(holding.purchasePrice)}
                                            </td>
                                            <td className="px-3 py-3 sm:px-4 sm:py-4 whitespace-nowrap text-sm text-gray-900">
                                                {formatCurrency(currentPrice)}
                                            </td>
                                            <td className="px-3 py-3 sm:px-4 sm:py-4 whitespace-nowrap">
                                                <div className={`text-sm font-medium ${pnl >= 0 ? 'text-green-600' : 'text-red-600'
                                                    }`}>
                                                    {formatCurrency(pnl)}
                                                </div>
                                                <div className={`text-xs ${pnl >= 0 ? 'text-green-500' : 'text-red-500'
                                                    }`}>
                                                    {pnl >= 0 ? '+' : ''}{pnlPercentage.toFixed(2)}%
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 sm:px-4 sm:py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {formatCurrency(currentValue)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default Dashboard;