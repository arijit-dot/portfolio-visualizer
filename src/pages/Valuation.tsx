import React, { useState, useEffect } from 'react';
import { usePortfolio } from '../hooks/usePortfolio';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import { DCF_ASSUMPTIONS } from '../utils/constants';
import { MVP_STOCKS } from '../data/stocks';

interface StockFundamentals {
    name: string;
    currentPrice: number;
    eps: number;
    freeCashFlow: number; // in crores
    sharesOutstanding: number; // in crores
    sector: string;
    marketCap: string;
    revenue?: number;
    operatingCashFlow?: number;
    capitalExpenditure?: number;
}

const Valuation: React.FC = () => {
    const { portfolio } = usePortfolio();
    const [selectedStock, setSelectedStock] = useState(MVP_STOCKS[0]);
    const [growthRate, setGrowthRate] = useState(DCF_ASSUMPTIONS.defaultGrowthRate * 100);
    const [discountRate, setDiscountRate] = useState(DCF_ASSUMPTIONS.defaultDiscountRate * 100);
    const [terminalGrowth, setTerminalGrowth] = useState(DCF_ASSUMPTIONS.defaultTerminalGrowth * 100);
    const [realStockPrices, setRealStockPrices] = useState<{ [key: string]: any }>({});
    const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
    const [valuationLoading, setValuationLoading] = useState<{ [key: string]: boolean }>({});
    const [fundamentalData, setFundamentalData] = useState<{ [key: string]: StockFundamentals }>({});

    // Use environment variable for API base URL
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://portfolio-visualizer-yql8.onrender.com';

    // Default fundamental data (fallback)
    const defaultFundamentals: { [key: string]: StockFundamentals } = {
        "RELIANCE.NS": {
            name: "Reliance Industries Limited",
            currentPrice: 2450,
            eps: 89.2,
            freeCashFlow: 65000, // in crores
            sharesOutstanding: 676, // in crores
            sector: "Oil & Gas",
            marketCap: "₹16.5L Cr",
            revenue: 792000,
            operatingCashFlow: 115000,
            capitalExpenditure: 50000
        },
        "TCS.NS": {
            name: "Tata Consultancy Services",
            currentPrice: 3450,
            eps: 115.6,
            freeCashFlow: 45000,
            sharesOutstanding: 365,
            sector: "IT",
            marketCap: "₹12.5L Cr",
            revenue: 195000,
            operatingCashFlow: 52000,
            capitalExpenditure: 7000
        },
        "HDFCBANK.NS": {
            name: "HDFC Bank",
            currentPrice: 1650,
            eps: 78.9,
            freeCashFlow: 38000,
            sharesOutstanding: 695,
            sector: "Banking",
            marketCap: "₹11.5L Cr",
            revenue: 185000,
            operatingCashFlow: 45000,
            capitalExpenditure: 1500
        },
        "INFY.NS": {
            name: "Infosys",
            currentPrice: 1850,
            eps: 62.3,
            freeCashFlow: 25000,
            sharesOutstanding: 413,
            sector: "IT",
            marketCap: "₹6.25L Cr",
            revenue: 145000,
            operatingCashFlow: 32000,
            capitalExpenditure: 7000
        },
        "ITC.NS": {
            name: "ITC Limited",
            currentPrice: 450,
            eps: 14.2,
            freeCashFlow: 18000,
            sharesOutstanding: 1228,
            sector: "FMCG",
            marketCap: "₹4.25L Cr",
            revenue: 65000,
            operatingCashFlow: 22000,
            capitalExpenditure: 4000
        }
    };

    // Fetch real prices when selected stock changes
    useEffect(() => {
        const fetchRealPrice = async () => {
            if (!selectedStock) return;

            setLoading(prev => ({ ...prev, [selectedStock.symbol]: true }));

            try {
                console.log(`📡 Fetching real price for valuation: ${selectedStock.symbol}`);

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

    // Fetch fundamental data
    useEffect(() => {
        const fetchFundamentalData = async () => {
            if (!selectedStock || fundamentalData[selectedStock.symbol]) return;

            setValuationLoading(prev => ({ ...prev, [selectedStock.symbol]: true }));

            try {
                // Try to fetch from your backend first
                const response = await fetch(`${API_BASE}/stocks/fundamentals/${selectedStock.symbol}`);

                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        setFundamentalData(prev => ({
                            ...prev,
                            [selectedStock.symbol]: data.data
                        }));
                        console.log(`✅ Loaded fundamental data for ${selectedStock.symbol}`);
                        return;
                    }
                }

                // Fallback to default data
                console.log(`🔄 Using default fundamental data for ${selectedStock.symbol}`);
                setFundamentalData(prev => ({
                    ...prev,
                    [selectedStock.symbol]: defaultFundamentals[selectedStock.symbol]
                }));

            } catch (error) {
                console.error('❌ Error fetching fundamental data:', error);
                // Use default data
                setFundamentalData(prev => ({
                    ...prev,
                    [selectedStock.symbol]: defaultFundamentals[selectedStock.symbol]
                }));
            } finally {
                setValuationLoading(prev => ({ ...prev, [selectedStock.symbol]: false }));
            }
        };

        fetchFundamentalData();
    }, [selectedStock, API_BASE]);

    // Get stock data with real price if available
    const getStockData = (): StockFundamentals & { symbol: string; isRealData: boolean } => {
        const baseData = fundamentalData[selectedStock.symbol] || defaultFundamentals[selectedStock.symbol] || defaultFundamentals["RELIANCE.NS"];
        const realPrice = realStockPrices[selectedStock.symbol];

        return {
            ...baseData,
            currentPrice: realPrice || baseData.currentPrice,
            name: selectedStock.name || baseData.name,
            symbol: selectedStock.symbol,
            isRealData: !!realPrice
        };
    };

    const stockData = getStockData();

    // Calculate Free Cash Flow Per Share
    const getFreeCashFlowPerShare = (data: StockFundamentals): number => {
        // If we have operating cash flow and capex, calculate FCF
        if (data.operatingCashFlow && data.capitalExpenditure) {
            const freeCashFlow = data.operatingCashFlow - Math.abs(data.capitalExpenditure);
            return freeCashFlow / data.sharesOutstanding;
        }
        // Otherwise use the stored freeCashFlow value (which should be total FCF in crores)
        return data.freeCashFlow / data.sharesOutstanding;
    };

    // CORRECT DCF Calculation
    const calculateDCF = () => {
        const growthRateDecimal = growthRate / 100;
        const discountRateDecimal = discountRate / 100;
        const terminalGrowthDecimal = terminalGrowth / 100;

        // IMPORTANT: terminal growth must be less than discount rate
        if (terminalGrowthDecimal >= discountRateDecimal) {
            return {
                intrinsicValue: 0,
                marginOfSafety: 0,
                projectedFCF: 0,
                presentValue: 0,
                terminalValuePV: 0,
                error: "Terminal growth rate must be less than discount rate"
            };
        }

        // Calculate Free Cash Flow Per Share
        const fcfPerShare = getFreeCashFlowPerShare(stockData);

        let presentValue = 0;
        let currentFCF = fcfPerShare;
        const projectedFCFs: number[] = [];

        // 5-year explicit projection
        for (let year = 1; year <= 5; year++) {
            currentFCF = currentFCF * (1 + growthRateDecimal);
            projectedFCFs.push(currentFCF);
            const discountedFCF = currentFCF / Math.pow(1 + discountRateDecimal, year);
            presentValue += discountedFCF;
        }

        // Terminal Value using Gordon Growth Model
        const terminalValue = (projectedFCFs[4] * (1 + terminalGrowthDecimal)) /
            (discountRateDecimal - terminalGrowthDecimal);

        const terminalValuePV = terminalValue / Math.pow(1 + discountRateDecimal, 5);
        const intrinsicValue = presentValue + terminalValuePV;

        // Calculate Margin of Safety
        const marginOfSafety = intrinsicValue > 0 ?
            ((intrinsicValue - stockData.currentPrice) / intrinsicValue) * 100 : 0;

        return {
            intrinsicValue,
            marginOfSafety,
            projectedFCF: projectedFCFs[4],
            presentValue,
            terminalValuePV,
            fcfPerShare,
            error: null
        };
    };

    const dcfResult = calculateDCF();

    // Determine recommendation
    let recommendation = 'HOLD';
    if (dcfResult.error) {
        recommendation = 'INVALID';
    } else if (dcfResult.marginOfSafety > 25) {
        recommendation = 'STRONG BUY';
    } else if (dcfResult.marginOfSafety > 15) {
        recommendation = 'BUY';
    } else if (dcfResult.marginOfSafety > 5) {
        recommendation = 'HOLD';
    } else if (dcfResult.marginOfSafety > -10) {
        recommendation = 'REDUCE';
    } else {
        recommendation = 'SELL';
    }

    const recommendationColor = {
        'STRONG BUY': 'text-green-700',
        'BUY': 'text-green-600',
        'HOLD': 'text-yellow-600',
        'REDUCE': 'text-orange-600',
        'SELL': 'text-red-600',
        'INVALID': 'text-gray-600'
    }[recommendation];

    // Format large numbers
    const formatCrores = (value: number) => {
        if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L Cr`;
        if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K Cr`;
        return `₹${value.toFixed(0)} Cr`;
    };

    return (
        <div className="space-y-4 sm:space-y-6 w-full mx-auto px-3 sm:px-4 lg:px-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Valuation Analysis</h1>
                    <p className="text-gray-600 mt-1 text-sm sm:text-base">
                        Discounted Cash Flow (DCF) Valuation
                    </p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
                {/* Left Column - Stock Selection & Info */}
                <div className="w-full lg:w-1/3 space-y-4 sm:space-y-6">
                    {/* Stock Selection */}
                    <Card title="Select Stock to Analyze" className="p-3 sm:p-4">
                        <div className="space-y-2">
                            {MVP_STOCKS.map((stock) => (
                                <button
                                    key={stock.symbol}
                                    className={`w-full text-left p-2 sm:p-3 rounded-lg border transition-colors text-sm sm:text-base ${selectedStock.symbol === stock.symbol
                                            ? 'bg-blue-50 border-blue-500 border-l-4'
                                            : 'bg-white border-gray-200 hover:bg-gray-50'
                                        }`}
                                    onClick={() => setSelectedStock(stock)}
                                >
                                    <div className="font-medium text-gray-900">{stock.name}</div>
                                    <div className="text-xs sm:text-sm text-gray-600">{stock.symbol}</div>
                                </button>
                            ))}
                        </div>
                    </Card>

                    {/* Stock Information */}
                    <Card title="Stock Information" className="p-3 sm:p-4">
                        <div className="space-y-2 sm:space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600 text-sm sm:text-base">Symbol:</span>
                                <span className="font-medium text-sm sm:text-base">{selectedStock.symbol}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600 text-sm sm:text-base">Current Price:</span>
                                <span className="font-medium text-sm sm:text-base">
                                    {formatCurrency(stockData.currentPrice)}
                                    {stockData.isRealData && (
                                        <span className="ml-1 text-xs text-green-600">● Live</span>
                                    )}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600 text-sm sm:text-base">EPS (TTM):</span>
                                <span className="font-medium text-sm sm:text-base">₹{stockData.eps.toFixed(1)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600 text-sm sm:text-base">FCF/Share:</span>
                                <span className="font-medium text-sm sm:text-base">
                                    ₹{getFreeCashFlowPerShare(stockData).toFixed(1)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600 text-sm sm:text-base">Sector:</span>
                                <span className="font-medium text-sm sm:text-base">{stockData.sector}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600 text-sm sm:text-base">Market Cap:</span>
                                <span className="font-medium text-sm sm:text-base">{stockData.marketCap}</span>
                            </div>
                            {valuationLoading[selectedStock.symbol] && (
                                <div className="text-center text-blue-600 text-xs sm:text-sm">
                                    🔄 Loading fundamental data...
                                </div>
                            )}
                            {loading[selectedStock.symbol] && (
                                <div className="text-center text-blue-600 text-xs sm:text-sm">
                                    🔄 Loading real-time data...
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* DCF Assumptions */}
                    <Card title="DCF Assumptions" className="p-3 sm:p-4">
                        <div className="space-y-3 sm:space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    FCF Growth Rate ({growthRate}%)
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="25"
                                    step="0.5"
                                    value={growthRate}
                                    onChange={(e) => setGrowthRate(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                />
                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                    <span>0%</span>
                                    <span>12.5%</span>
                                    <span>25%</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Discount Rate (WACC) ({discountRate}%)
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
                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                    <span>8%</span>
                                    <span>14%</span>
                                    <span>20%</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Must be higher than terminal growth
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Terminal Growth ({terminalGrowth}%)
                                </label>
                                <input
                                    type="range"
                                    min="1"
                                    max="6"
                                    step="0.1"
                                    value={terminalGrowth}
                                    onChange={(e) => setTerminalGrowth(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                />
                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                    <span>1%</span>
                                    <span>3.5%</span>
                                    <span>6%</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Typically 2-3% (inflation rate)
                                </p>
                            </div>

                            <Button
                                variant="secondary"
                                className="w-full text-sm sm:text-base"
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
                <div className="w-full lg:w-2/3 space-y-4 sm:space-y-6">
                    {/* Valuation Results */}
                    <Card title={`Valuation Results - ${stockData.name}`} className="p-3 sm:p-4">
                        {dcfResult.error ? (
                            <div className="text-center p-6 bg-red-50 rounded-lg">
                                <div className="text-red-600 font-bold text-lg mb-2">⚠️ Invalid Parameters</div>
                                <p className="text-red-700">{dcfResult.error}</p>
                                <p className="text-sm text-gray-600 mt-2">
                                    Please adjust discount rate and terminal growth rate
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                                    <div className="text-center p-4 sm:p-6 bg-blue-50 rounded-lg">
                                        <div className="text-xl sm:text-2xl font-bold text-blue-900 mb-2">
                                            {formatCurrency(dcfResult.intrinsicValue)}
                                        </div>
                                        <div className="text-blue-700 font-medium text-sm sm:text-base">Intrinsic Value</div>
                                        <div className="text-xs sm:text-sm text-blue-600 mt-2">
                                            Based on DCF model
                                        </div>
                                    </div>

                                    <div className="text-center p-4 sm:p-6 bg-green-50 rounded-lg">
                                        <div className="text-xl sm:text-2xl font-bold text-green-900 mb-2">
                                            {formatPercentage(dcfResult.marginOfSafety / 100)}
                                        </div>
                                        <div className="text-green-700 font-medium text-sm sm:text-base">Margin of Safety</div>
                                        <div className="text-xs sm:text-sm text-green-600 mt-2">
                                            {dcfResult.marginOfSafety > 0 ? 'Undervalued' : 'Overvalued'}
                                        </div>
                                    </div>

                                    <div className="text-center p-4 sm:p-6 bg-purple-50 rounded-lg">
                                        <div className="text-xl sm:text-2xl font-bold text-purple-900 mb-2">
                                            {formatCurrency(stockData.currentPrice)}
                                        </div>
                                        <div className="text-purple-700 font-medium text-sm sm:text-base">Current Price</div>
                                        <div className="text-xs sm:text-sm text-purple-600 mt-2">
                                            {stockData.isRealData ? 'Live Market Price' : 'Estimated Price'}
                                        </div>
                                    </div>
                                </div>

                                {/* Recommendation */}
                                <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                                        <div className="flex-1">
                                            <div className="text-base sm:text-lg font-semibold text-gray-900">
                                                Recommendation: <span className={recommendationColor}>{recommendation}</span>
                                            </div>
                                            <div className="text-xs sm:text-sm text-gray-600 mt-1">
                                                {recommendation === 'STRONG BUY' && 'Stock is significantly undervalued (>25% MOS)'}
                                                {recommendation === 'BUY' && 'Stock appears undervalued (15-25% MOS)'}
                                                {recommendation === 'HOLD' && 'Stock appears fairly valued (5-15% MOS)'}
                                                {recommendation === 'REDUCE' && 'Stock appears overvalued (-10 to 5% MOS)'}
                                                {recommendation === 'SELL' && 'Stock is significantly overvalued (<-10% MOS)'}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs sm:text-sm text-gray-600">Price Difference</div>
                                            <div className={`text-base sm:text-lg font-bold ${dcfResult.marginOfSafety > 0 ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                {dcfResult.marginOfSafety > 0 ? '+' : ''}
                                                {formatCurrency(dcfResult.intrinsicValue - stockData.currentPrice)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </Card>

                    {/* Model Details */}
                    <Card title="DCF Model Details" className="p-3 sm:p-4">
                        <div className="space-y-3 sm:space-y-4">
                            <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4 text-sm">
                                <div className="flex justify-between xs:block">
                                    <span className="text-gray-600 text-sm">Projection Period:</span>
                                    <span className="font-medium text-sm">5 years</span>
                                </div>
                                <div className="flex justify-between xs:block">
                                    <span className="text-gray-600 text-sm">FCF Growth Rate:</span>
                                    <span className="font-medium text-sm">{growthRate}% per year</span>
                                </div>
                                <div className="flex justify-between xs:block">
                                    <span className="text-gray-600 text-sm">Discount Rate (WACC):</span>
                                    <span className="font-medium text-sm">{discountRate}%</span>
                                </div>
                                <div className="flex justify-between xs:block">
                                    <span className="text-gray-600 text-sm">Terminal Growth:</span>
                                    <span className="font-medium text-sm">{terminalGrowth}%</span>
                                </div>
                                <div className="flex justify-between xs:block">
                                    <span className="text-gray-600 text-sm">Current FCF/Share:</span>
                                    <span className="font-medium text-sm">₹{getFreeCashFlowPerShare(stockData).toFixed(1)}</span>
                                </div>
                                <div className="flex justify-between xs:block">
                                    <span className="text-gray-600 text-sm">Projected FCF (Year 5):</span>
                                    <span className="font-medium text-sm">₹{dcfResult.projectedFCF?.toFixed(1) || 'N/A'}</span>
                                </div>
                            </div>

                            <div className="pt-3 sm:pt-4 border-t border-gray-200">
                                <h4 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Methodology</h4>
                                <p className="text-xs sm:text-sm text-gray-600">
                                    The DCF model projects future free cash flows (not EPS) and discounts them back to present value
                                    using the Weighted Average Cost of Capital (WACC). The terminal value accounts for perpetual
                                    growth beyond the 5-year projection period using the Gordon Growth Model.
                                    Free Cash Flow = Operating Cash Flow - Capital Expenditures
                                </p>
                            </div>
                        </div>
                    </Card>

                    {/* Financial Metrics */}
                    <Card title="Financial Metrics" className="p-3 sm:p-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <div className="text-sm text-gray-600 mb-1">Revenue</div>
                                <div className="font-bold text-gray-900 text-sm sm:text-base">
                                    {stockData.revenue ? formatCrores(stockData.revenue) : 'N/A'}
                                </div>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <div className="text-sm text-gray-600 mb-1">Operating Cash Flow</div>
                                <div className="font-bold text-gray-900 text-sm sm:text-base">
                                    {stockData.operatingCashFlow ? formatCrores(stockData.operatingCashFlow) : 'N/A'}
                                </div>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <div className="text-sm text-gray-600 mb-1">Capital Expenditure</div>
                                <div className="font-bold text-gray-900 text-sm sm:text-base">
                                    {stockData.capitalExpenditure ? formatCrores(Math.abs(stockData.capitalExpenditure)) : 'N/A'}
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Disclaimer */}
                    <Card className="p-3 sm:p-4">
                        <div className="text-xs text-gray-500">
                            <p className="font-medium mb-1">Disclaimer:</p>
                            <p className="text-xs">
                                This valuation is for educational purposes only. The DCF model relies on several assumptions
                                that may not reflect actual market conditions. Free Cash Flow projections are estimates based
                                on historical data. Always conduct your own research and consult with a financial advisor
                                before making investment decisions.
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