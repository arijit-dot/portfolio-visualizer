import { useState, useEffect } from 'react';
import { Portfolio, Holding } from '../types/portfolio';
import { stockApi } from '../services/stockApi';

// Generate a simple ID for new holdings
const generateId = (): string => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

export const usePortfolio = () => {
    const [portfolio, setPortfolio] = useState<Portfolio>({ holdings: [] });
    const [isLoaded, setIsLoaded] = useState(false);
    const [isUpdatingPrices, setIsUpdatingPrices] = useState(false);

    // Load portfolio from localStorage on mount
    useEffect(() => {
        console.log('🔄 Loading portfolio from localStorage...');
        const savedPortfolio = localStorage.getItem('portfolio');

        if (savedPortfolio) {
            try {
                const parsed = JSON.parse(savedPortfolio);
                console.log('📥 Loaded portfolio with', parsed.holdings?.length, 'holdings');
                setPortfolio(parsed);
            } catch (error) {
                console.error('Error loading portfolio:', error);
                setPortfolio({ holdings: [] });
            }
        }
        setIsLoaded(true);
    }, []);

    // Save portfolio to localStorage whenever it changes
    useEffect(() => {
        if (isLoaded && portfolio.holdings) {
            console.log('💾 Saving portfolio with', portfolio.holdings.length, 'holdings');
            localStorage.setItem('portfolio', JSON.stringify(portfolio));
        }
    }, [portfolio, isLoaded]);

    // Update stock prices with REAL data - FIXED VERSION
    const updateStockPrices = async () => {
        if (isUpdatingPrices) {
            console.log('⏳ Price update already in progress, skipping...');
            return;
        }

        const currentHoldings = portfolio.holdings;
        if (!currentHoldings || currentHoldings.length === 0) {
            console.log('📭 No holdings to update');
            return;
        }

        console.log('🔄 Updating stock prices for', currentHoldings.length, 'holdings...');
        setIsUpdatingPrices(true);

        try {
            const symbols = currentHoldings.map(h => h.symbol);
            console.log('📡 Fetching prices for symbols:', symbols);

            const priceResults = await stockApi.getMultipleStockPrices(symbols);

            console.log('📊 Price results received:', priceResults);

            setPortfolio(prev => {
                // Ensure we're working with the latest state
                const latestHoldings = prev.holdings;

                const updatedHoldings = latestHoldings.map((holding, index) => {
                    const priceData = priceResults[index];
                    if (priceData && priceData.success && priceData.data) {
                        const newPrice = priceData.data.current_price;
                        console.log(`💰 Updated ${holding.symbol}: ₹${newPrice}`);
                        return {
                            ...holding,
                            currentPrice: newPrice
                        };
                    } else {
                        console.log(`⚠️ No price data for ${holding.symbol}`);
                        return holding;
                    }
                });

                console.log('✅ Price update complete. Final holdings count:', updatedHoldings.length);
                return {
                    ...prev,
                    holdings: updatedHoldings
                };
            });

        } catch (error) {
            console.error('❌ Error updating stock prices:', error);
        } finally {
            setIsUpdatingPrices(false);
        }
    };

    // Update prices when portfolio loads - with debouncing
    useEffect(() => {
        if (isLoaded && portfolio.holdings && portfolio.holdings.length > 0 && !isUpdatingPrices) {
            console.log('🚀 Initial price update triggered');

            // Small delay to ensure state is stable
            const timer = setTimeout(() => {
                updateStockPrices();
            }, 500);

            // Update prices every 2 minutes
            const interval = setInterval(() => {
                if (!isUpdatingPrices) {
                    updateStockPrices();
                }
            }, 120000);

            return () => {
                clearTimeout(timer);
                clearInterval(interval);
            };
        }
    }, [isLoaded, portfolio.holdings?.length]);

    const addHolding = (holdingData: Omit<Holding, 'id'>) => {
        console.log('➕ Adding new holding:', holdingData.symbol);

        const newHolding: Holding = {
            ...holdingData,
            id: generateId(),
            currentPrice: holdingData.purchasePrice // Initial price
        };

        setPortfolio(prev => {
            const newHoldings = [...(prev.holdings || []), newHolding];
            console.log('✅ Portfolio updated. Total holdings:', newHoldings.length);
            return {
                ...prev,
                holdings: newHoldings
            };
        });

        // Update price after adding with small delay
        setTimeout(() => {
            console.log('🔄 Triggering price update after adding holding');
            updateStockPrices();
        }, 1000);
    };

    const removeHolding = (holdingId: string) => {
        console.log('🗑️ Removing holding:', holdingId);
        setPortfolio(prev => ({
            ...prev,
            holdings: prev.holdings.filter(holding => holding.id !== holdingId)
        }));
    };

    const updateHolding = (holdingId: string, updatedData: Omit<Holding, 'id'>) => {
        console.log('✏️ Updating holding:', holdingId);
        setPortfolio(prev => ({
            ...prev,
            holdings: prev.holdings.map(holding =>
                holding.id === holdingId
                    ? { ...updatedData, id: holdingId, currentPrice: updatedData.purchasePrice }
                    : holding
            )
        }));

        // Update price after editing
        setTimeout(() => {
            console.log('🔄 Triggering price update after editing holding');
            updateStockPrices();
        }, 1000);
    };

    const refreshPrices = () => {
        console.log('🔄 Manual refresh requested');
        updateStockPrices();
    };

    // Clear entire portfolio
    const clearPortfolio = () => {
        console.log('🗑️ Clearing entire portfolio');
        setPortfolio({ holdings: [] });
    };

    // Portfolio calculations
    const getPortfolioValue = (): number => {
        if (!portfolio.holdings) return 0;
        return portfolio.holdings.reduce((total, holding) => {
            const currentPrice = holding.currentPrice || holding.purchasePrice;
            return total + (holding.quantity * currentPrice);
        }, 0);
    };

    const getTotalInvestment = (): number => {
        if (!portfolio.holdings) return 0;
        return portfolio.holdings.reduce((total, holding) => {
            return total + (holding.quantity * holding.purchasePrice);
        }, 0);
    };

    const getTotalPnL = (): number => {
        if (!portfolio.holdings) return 0;
        return portfolio.holdings.reduce((total, holding) => {
            const currentPrice = holding.currentPrice || holding.purchasePrice;
            const investment = holding.quantity * holding.purchasePrice;
            const currentValue = holding.quantity * currentPrice;
            return total + (currentValue - investment);
        }, 0);
    };

    const getTotalPnLPercentage = (): number => {
        const totalInvestment = getTotalInvestment();
        const totalPnL = getTotalPnL();
        return totalInvestment > 0 ? (totalPnL / totalInvestment) * 100 : 0;
    };

    const getTodaysPnL = (): number => {
        const portfolioValue = getPortfolioValue();
        return portfolioValue > 0 ? portfolioValue * 0.0054 : 0;
    };

    const getHoldingPnL = (holding: Holding): number => {
        const currentPrice = holding.currentPrice || holding.purchasePrice;
        const investment = holding.quantity * holding.purchasePrice;
        const currentValue = holding.quantity * currentPrice;
        return currentValue - investment;
    };

    const getHoldingPnLPercentage = (holding: Holding): number => {
        const investment = holding.quantity * holding.purchasePrice;
        const pnl = getHoldingPnL(holding);
        return investment > 0 ? (pnl / investment) * 100 : 0;
    };

    return {
        portfolio,
        addHolding,
        removeHolding,
        updateHolding,
        refreshPrices,
        clearPortfolio,
        getPortfolioValue,
        getTotalInvestment,
        getTotalPnL,
        getTotalPnLPercentage,
        getTodaysPnL,
        getHoldingPnL,
        getHoldingPnLPercentage,
        isLoaded,
        isUpdatingPrices
    };
};