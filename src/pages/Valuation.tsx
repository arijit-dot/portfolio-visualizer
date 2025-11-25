import React, { useState, useEffect } from 'react';
import { usePortfolio } from '../hooks/usePortfolio';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import { DCF_ASSUMPTIONS } from '../utils/constants';
import { MVP_STOCKS } from '../data/stocks';

const Valuation: React.FC = () => {
    const { portfolio } = usePortfolio();
    const [selectedStock, setSelectedStock] = useState(MVP_STOCKS[0]); // Default to Reliance
    const [growthRate, setGrowthRate] = useState(DCF_ASSUMPTIONS.defaultGrowthRate * 100);
    const [discountRate, setDiscountRate] = useState(DCF_ASSUMPTIONS.defaultDiscountRate * 100);
    const [terminalGrowth, setTerminalGrowth] = useState(DCF_ASSUMPTIONS.defaultTerminalGrowth * 100);
    const [realStockPrices, setRealStockPrices] = useState<{ [key: string]: any }>({});
    const [loading, setLoading] = useState<{ [key: string]: boolean }>({});

    // Use environment variable for API base URL
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    // Mock fundamental data for all stocks
    const stockFundamentals: { [key: string]: any } = {
        "RELIANCE.NS": {
            name: "Reliance Industries Limited",
            currentPrice: 2450,
            eps: 89.2,
            sector: "Oil & Gas",
            marketCap: "₹16.5L Cr"
        },
        "TCS.NS": {
            name: "Tata Consultancy Services",
            currentPrice: 3450,
            eps: 115.6,
            sector: "IT",
            marketCap: "₹12.5L Cr"
        },
        "HDFCBANK.NS": {
            name: "HDFC Bank",
            currentPrice: 1650,
            eps: 78.9,
            sector: "Banking",
            marketCap: "₹11.5L Cr"
        },
        "INFY.NS": {
            name: "Infosys",
            currentPrice: 1850,
            eps: 62.3,
            sector: "IT",
            marketCap: "₹6.25L Cr"
        },
        "ITC.NS": {
            name: "ITC Limited",
            currentPrice: 450,
            eps: 14.2,
            sector: "FMCG",
            marketCap: "₹4.25L Cr"
        }
    };

    // Fetch real prices when selected stock changes
    useEffect(() => {
        const fetchRealPrice = async () => {
            if (!selectedStock) return;

            setLoading(prev => ({ ...prev, [selectedStock.symbol]: true }));

            try {
                console.log(`📡 Fetching real price for valuation: ${selectedStock.symbol}`);
                console.log(`🌐 Using API: ${API_BASE}/stocks/price/${selectedStock.symbol}`);

                const response = await fetch(`${API_BASE}/stocks/price/${selectedStock.symbol}`);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();

                if (data.success) {
                    setRealStockPrices(prev => ({
                        ...prev,
                        [selectedStock.symbol]: data.data.current_price
                    }));
                    console.log(`✅ Real price for ${selectedStock.symbol}: ₹${data.data.current_price}`);
                } else {
                    console.error(`❌ API error: ${data.error}`);
                }
            } catch (error) {
                console.error('❌ Network error fetching valuation data:', error);
                console.log('🔄 Falling back to mock data for:', selectedStock.symbol);
            } finally {
                setLoading(prev => ({ ...prev, [selectedStock.symbol]: false }));
            }
        };

        fetchRealPrice();
    }, [selectedStock, API_BASE]);

    // Use real price if available, otherwise fallback to mock data
    const getStockData = () => {
        const baseData = stockFundamentals[selectedStock.symbol] || stockFundamentals["RELIANCE.NS"];
        const realPrice = realStockPrices[selectedStock.symbol];

        return {
            ...baseData,
            currentPrice: realPrice || baseData.currentPrice,
            name: selectedStock.name || baseData.name,
            symbol: selectedStock.symbol,
            // Keep other fundamental data from mock for now
            eps: baseData.eps,
            sector: baseData.sector,
            marketCap: baseData.marketCap,
            isRealData: !!realPrice
        };
    };

    const stockData = getStockData();

    // DCF Calculation
    const calculateDCF = () => {
        const growthRateDecimal = growthRate / 100;
        const discountRateDecimal = discountRate / 100;
        const terminalGrowthDecimal = terminalGrowth / 100;

        let presentValue = 0;
        let currentEPS = stockData.eps;

        // 5-year projection
        for (let year = 1; year <= 5; year++) {
            currentEPS = currentEPS * (1 + growthRateDecimal);
            presentValue += currentEPS / Math.pow(1 + discountRateDecimal, year);
        }

        // Terminal value
        const terminalValue = (currentEPS * (1 + terminalGrowthDecimal)) /
            (discountRateDecimal - terminalGrowthDecimal);
        const terminalValuePV = terminalValue / Math.pow(1 + discountRateDecimal, 5);

        const intrinsicValue = presentValue + terminalValuePV;

        return {
            intrinsicValue,
            marginOfSafety: ((intrinsicValue - stockData.currentPrice) / intrinsicValue) * 100,
            projectedEPS: currentEPS
        };
    };

    const dcfResult = calculateDCF();
    const recommendation = dcfResult.marginOfSafety > 20 ? 'BUY' :
        dcfResult.marginOfSafety > 5 ? 'HOLD' : 'SELL';

    const recommendationColor = {
        'BUY': 'text-green-600',
        'HOLD': 'text-yellow-600',
        'SELL': 'text-red-600'
    }[recommendation];

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Valuation Analysis</h1>
                    <p className="text-gray-600 mt-1">
                        Discounted Cash Flow (DCF) Valuation
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Stock Selection & Info */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Stock Selection */}
                    <Card title="Select Stock to Analyze">
                        <div className="space-y-2">
                            {MVP_STOCKS.map((stock) => (
                                <button
                                    key={stock.symbol}
                                    className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedStock.symbol === stock.symbol
                                        ? 'bg-blue-50 border-blue-500 border-l-4'
                                        : 'bg-white border-gray-200 hover:bg-gray-50'
                                        }`}
                                    onClick={() => setSelectedStock(stock)}
                                >
                                    <div className="font-medium text-gray-900">{stock.name}</div>
                                    <div className="text-sm text-gray-600">{stock.symbol}</div>
                                </button>
                            ))}
                        </div>
                    </Card>

                    {/* Stock Information */}
                    <Card title="Stock Information">
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Symbol:</span>
                                <span className="font-medium">{selectedStock.symbol}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Current Price:</span>
                                <span className="font-medium">
                                    {formatCurrency(stockData.currentPrice)}
                                    {stockData.isRealData && (
                                        <span className="ml-1 text-xs text-green-600">● Live</span>
                                    )}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">EPS (TTM):</span>
                                <span className="font-medium">₹{stockData.eps}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Sector:</span>
                                <span className="font-medium">{stockData.sector}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Market Cap:</span>
                                <span className="font-medium">{stockData.marketCap}</span>
                            </div>
                            {loading[selectedStock.symbol] && (
                                <div className="text-center text-blue-600 text-sm">
                                    🔄 Loading real-time data...
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* DCF Assumptions */}
                    <Card title="DCF Assumptions">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Growth Rate ({growthRate}%)
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="20"
                                    step="0.5"
                                    value={growthRate}
                                    onChange={(e) => setGrowthRate(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                />
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>0%</span>
                                    <span>10%</span>
                                    <span>20%</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Discount Rate ({discountRate}%)
                                </label>
                                <input
                                    type="range"
                                    min="8"
                                    max="20"
                                    step="0.5"
                                    value={discountRate}
                                    onChange={(e) => setDiscountRate(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                />
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>8%</span>
                                    <span>14%</span>
                                    <span>20%</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Terminal Growth ({terminalGrowth}%)
                                </label>
                                <input
                                    type="range"
                                    min="1"
                                    max="5"
                                    step="0.1"
                                    value={terminalGrowth}
                                    onChange={(e) => setTerminalGrowth(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                />
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>1%</span>
                                    <span>3%</span>
                                    <span>5%</span>
                                </div>
                            </div>

                            <Button
                                variant="secondary"
                                className="w-full"
                                onClick={() => {
                                    setGrowthRate(DCF_ASSUMPTIONS.defaultGrowthRate * 100);
                                    setDiscountRate(DCF_ASSUMPTIONS.defaultDiscountRate * 100);
                                    setTerminalGrowth(DCF_ASSUMPTIONS.defaultTerminalGrowth * 100);
                                }}
                            >
                                Reset to Defaults
                            </Button>
                        </div>
                    </Card>
                </div>

                {/* Right Column - Results */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Valuation Results */}
                    <Card title={`Valuation Results - ${stockData.name}`}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="text-center p-6 bg-blue-50 rounded-lg">
                                <div className="text-2xl font-bold text-blue-900 mb-2">
                                    {formatCurrency(dcfResult.intrinsicValue)}
                                </div>
                                <div className="text-blue-700 font-medium">Intrinsic Value</div>
                                <div className="text-sm text-blue-600 mt-2">
                                    Based on DCF model
                                </div>
                            </div>

                            <div className="text-center p-6 bg-green-50 rounded-lg">
                                <div className="text-2xl font-bold text-green-900 mb-2">
                                    {formatPercentage(dcfResult.marginOfSafety / 100)}
                                </div>
                                <div className="text-green-700 font-medium">Margin of Safety</div>
                                <div className="text-sm text-green-600 mt-2">
                                    Current price vs intrinsic value
                                </div>
                            </div>
                        </div>

                        {/* Recommendation */}
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-lg font-semibold text-gray-900">
                                        Recommendation: <span className={recommendationColor}>{recommendation}</span>
                                    </div>
                                    <div className="text-sm text-gray-600 mt-1">
                                        {recommendation === 'BUY' && 'Stock appears significantly undervalued'}
                                        {recommendation === 'HOLD' && 'Stock appears fairly valued'}
                                        {recommendation === 'SELL' && 'Stock appears overvalued'}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-gray-600">Current Price</div>
                                    <div className="text-lg font-bold text-gray-900">
                                        {formatCurrency(stockData.currentPrice)}
                                        {stockData.isRealData && (
                                            <span className="ml-1 text-xs text-green-600">● Live</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Model Details */}
                    <Card title="DCF Model Details">
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="text-gray-600">Projection Period:</div>
                                <div className="font-medium">5 years</div>

                                <div className="text-gray-600">EPS Growth Rate:</div>
                                <div className="font-medium">{growthRate}% per year</div>

                                <div className="text-gray-600">Discount Rate (WACC):</div>
                                <div className="font-medium">{discountRate}%</div>

                                <div className="text-gray-600">Terminal Growth:</div>
                                <div className="font-medium">{terminalGrowth}%</div>

                                <div className="text-gray-600">Projected EPS (Year 5):</div>
                                <div className="font-medium">₹{dcfResult.projectedEPS.toFixed(2)}</div>
                            </div>

                            <div className="pt-4 border-t border-gray-200">
                                <h4 className="font-medium text-gray-900 mb-2">Methodology</h4>
                                <p className="text-sm text-gray-600">
                                    The DCF model projects future earnings and discounts them back to present value
                                    using your specified discount rate. The terminal value accounts for perpetual
                                    growth beyond the projection period.
                                </p>
                            </div>
                        </div>
                    </Card>

                    {/* Disclaimer */}
                    <Card>
                        <div className="text-xs text-gray-500">
                            <p className="font-medium mb-1">Disclaimer:</p>
                            <p>
                                This valuation is for educational purposes only. The DCF model relies on several assumptions
                                that may not reflect actual market conditions. Always conduct your own research and consult
                                with a financial advisor before making investment decisions.
                                {stockData.isRealData && (
                                    <span className="text-green-600"> ● Using real-time market data</span>
                                )}
                            </p>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Valuation;