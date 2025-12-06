import React, { useState, useEffect } from 'react';
import { usePortfolio } from '../hooks/usePortfolio';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import { DCF_ASSUMPTIONS } from '../utils/constants';
import { MVP_STOCKS } from '../data/stocks';

interface StockFundamentals {
    symbol: string;
    name: string;
    currentPrice: number;
    eps: number;
    freeCashFlow?: number; // in crores
    sharesOutstanding: number; // in crores
    sector: string;
    marketCap?: number;
    revenue?: number;
    operatingCashFlow?: number;
    capitalExpenditure?: number;
    // New fields from updated backend
    fcfPerShare: number;         // Accurate FCF per share (from backend)
    fcfSource?: string;          // "yahoo" or "estimated"
    fcfNote?: string;            // Explanation of FCF source
    yahooFcfPerShare?: number;   // Original Yahoo FCF
    estimatedFcfPerShare?: number; // Estimated FCF
    data_source?: string;        // Data source info
    last_updated?: string;       // When data was fetched
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

    // Default fundamental data (fallback) - UPDATED with better FCF estimates
    const defaultFundamentals: { [key: string]: StockFundamentals } = {
        "RELIANCE.NS": {
            symbol: "RELIANCE.NS",
            name: "Reliance Industries Limited",
            currentPrice: 2450,
            eps: 101.5,
            sharesOutstanding: 676,
            sector: "Oil & Gas",
            marketCap: 1045000,
            revenue: 800000,
            operatingCashFlow: 115000,
            capitalExpenditure: 50000,
            fcfPerShare: 66.6, // EPS * 1.03 for Oil & Gas
            fcfSource: "estimated",
            fcfNote: "Estimated from EPS (1.03×)",
            data_source: "Default (Backend unavailable)"
        },
        "TCS.NS": {
            symbol: "TCS.NS",
            name: "Tata Consultancy Services",
            currentPrice: 3450,
            eps: 124.5,
            sharesOutstanding: 365,
            sector: "IT",
            marketCap: 1400000,
            revenue: 200000,
            operatingCashFlow: 52000,
            capitalExpenditure: 7000,
            fcfPerShare: 93.4, // EPS * 0.75 for IT
            fcfSource: "estimated",
            fcfNote: "Estimated from EPS (0.75×)",
            data_source: "Default (Backend unavailable)"
        },
        "HDFCBANK.NS": {
            symbol: "HDFCBANK.NS",
            name: "HDFC Bank",
            currentPrice: 1650,
            eps: 86.3,
            sharesOutstanding: 695,
            sector: "Banking",
            marketCap: 1200000,
            revenue: 185000,
            operatingCashFlow: 45000,
            capitalExpenditure: 1500,
            fcfPerShare: 56.1, // EPS * 0.65 for Banking
            fcfSource: "estimated",
            fcfNote: "Estimated from EPS (0.65×)",
            data_source: "Default (Backend unavailable)"
        },
        "INFY.NS": {
            symbol: "INFY.NS",
            name: "Infosys",
            currentPrice: 1850,
            eps: 68.9,
            sharesOutstanding: 413,
            sector: "IT",
            marketCap: 680000,
            revenue: 145000,
            operatingCashFlow: 32000,
            capitalExpenditure: 7000,
            fcfPerShare: 51.7, // EPS * 0.75 for IT
            fcfSource: "estimated",
            fcfNote: "Estimated from EPS (0.75×)",
            data_source: "Default (Backend unavailable)"
        },
        "ITC.NS": {
            symbol: "ITC.NS",
            name: "ITC Limited",
            currentPrice: 450,
            eps: 15.8,
            sharesOutstanding: 1228,
            sector: "FMCG",
            marketCap: 500000,
            revenue: 70000,
            operatingCashFlow: 22000,
            capitalExpenditure: 4000,
            fcfPerShare: 13.4, // EPS * 0.85 for FMCG
            fcfSource: "estimated",
            fcfNote: "Estimated from EPS (0.85×)",
            data_source: "Default (Backend unavailable)"
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

    // Fetch fundamental data from backend
    useEffect(() => {
        const fetchFundamentalData = async () => {
            if (!selectedStock) return;

            setValuationLoading(prev => ({ ...prev, [selectedStock.symbol]: true }));

            try {
                console.log(`📡 Fetching fundamental data for: ${selectedStock.symbol}`);

                // Fetch from your updated backend
                const response = await fetch(`${API_BASE}/stocks/fundamentals/${selectedStock.symbol}`);

                if (response.ok) {
                    const data = await response.json();

                    if (data.success) {
                        console.log(`✅ Backend fundamental data for ${selectedStock.symbol}:`, data.data);

                        // Store the complete backend response
                        setFundamentalData(prev => ({
                            ...prev,
                            [selectedStock.symbol]: {
                                symbol: selectedStock.symbol,
                                name: data.data.name || selectedStock.name,
                                currentPrice: data.data.currentPrice || 0,
                                eps: data.data.eps || 0,
                                freeCashFlow: data.data.freeCashFlow,
                                sharesOutstanding: data.data.sharesOutstanding || 1,
                                sector: data.data.sector || 'N/A',
                                marketCap: data.data.marketCap,
                                revenue: data.data.revenue,
                                operatingCashFlow: data.data.operatingCashFlow,
                                capitalExpenditure: data.data.capitalExpenditure,
                                // New fields from updated backend
                                fcfPerShare: data.data.fcfPerShare || 0,
                                fcfSource: data.data.fcfSource,
                                fcfNote: data.data.fcfNote,
                                yahooFcfPerShare: data.data.yahooFcfPerShare,
                                estimatedFcfPerShare: data.data.estimatedFcfPerShare,
                                data_source: data.data.data_source,
                                last_updated: data.data.last_updated
                            }
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
    const getStockData = (): StockFundamentals & { isRealData: boolean } => {
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

    // Get FCF per share - use accurate value from backend
    const getFreeCashFlowPerShare = (): number => {
        // Use the accurate fcfPerShare from backend (already calculated correctly)
        return stockData.fcfPerShare || 0;
    };

    // CORRECT DCF Calculation using accurate FCF
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

        // Get accurate FCF per share from backend
        const fcfPerShare = getFreeCashFlowPerShare();

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
        if (!value) return 'N/A';
        if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L Cr`;
        if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K Cr`;
        return `₹${value.toFixed(0)} Cr`;
    };

    // Get FCF source badge color
    const getFcfSourceColor = (source?: string) => {
        if (source === 'yahoo') return 'bg-blue-100 text-blue-800';
        if (source === 'estimated') return 'bg-purple-100 text-purple-800';
        return 'bg-gray-100 text-gray-800';
    };

    // Get FCF source text
    const getFcfSourceText = (source?: string) => {
        if (source === 'yahoo') return 'Yahoo Finance';
        if (source === 'estimated') return 'EPS-based Estimate';
        return 'Default';
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
                                <span className="font-medium text-sm sm:text-base flex items-center gap-2">
                                    ₹{getFreeCashFlowPerShare().toFixed(1)}
                                    {stockData.fcfSource && (
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${getFcfSourceColor(stockData.fcfSource)}`}>
                                            {getFcfSourceText(stockData.fcfSource)}
                                        </span>
                                    )}
                                </span>
                            </div>
                            {stockData.fcfNote && (
                                <div className="text-xs text-gray-500 italic">
                                    {stockData.fcfNote}
                                </div>
                            )}
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600 text-sm sm:text-base">Sector:</span>
                                <span className="font-medium text-sm sm:text-base">{stockData.sector}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600 text-sm sm:text-base">Market Cap:</span>
                                <span className="font-medium text-sm sm:text-base">{formatCrores(stockData.marketCap || 0)}</span>
                            </div>
                            {stockData.data_source && (
                                <div className="text-xs text-gray-500 italic border-t pt-2">
                                    Source: {stockData.data_source}
                                </div>
                            )}
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
                                    <span className="font-medium text-sm">₹{dcfResult.fcfPerShare?.toFixed(1) || '0.0'}</span>
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
                                {stockData.fcfSource === 'estimated' && (
                                    <p className="text-xs sm:text-sm text-purple-600 mt-2">
                                        <strong>Note:</strong> FCF estimated from EPS using sector-specific multipliers for better accuracy.
                                        {stockData.sector === 'Oil & Gas' && ' (Oil & Gas: EPS × 1.03)'}
                                        {stockData.sector === 'IT' && ' (IT: EPS × 0.75)'}
                                        {stockData.sector === 'Banking' && ' (Banking: EPS × 0.65)'}
                                    </p>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Financial Metrics */}
                    <Card title="Financial Metrics" className="p-3 sm:p-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <div className="text-sm text-gray-600 mb-1">Revenue</div>
                                <div className="font-bold text-gray-900 text-sm sm:text-base">
                                    {formatCrores(stockData.revenue || 0)}
                                </div>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <div className="text-sm text-gray-600 mb-1">Operating Cash Flow</div>
                                <div className="font-bold text-gray-900 text-sm sm:text-base">
                                    {formatCrores(stockData.operatingCashFlow || 0)}
                                </div>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <div className="text-sm text-gray-600 mb-1">Capital Expenditure</div>
                                <div className="font-bold text-gray-900 text-sm sm:text-base">
                                    {formatCrores(Math.abs(stockData.capitalExpenditure || 0))}
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
                                that may not reflect actual market conditions. Free Cash Flow is estimated from EPS using
                                sector-specific multipliers for better accuracy. Always conduct your own research and
                                consult with a financial advisor before making investment decisions.
                                {stockData.isRealData && (
                                    <span className="text-green-600"> ● Using real-time market data</span>
                                )}
                                {stockData.fcfSource === 'estimated' && (
                                    <span className="text-purple-600"> ● Using EPS-based FCF estimation</span>
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