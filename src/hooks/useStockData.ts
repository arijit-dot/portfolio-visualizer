import { useState, useEffect } from 'react';
import { Stock } from '../types/portfolio';

export const useStockData = (symbol: string) => {
    const [stockData, setStockData] = useState<Stock | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!symbol) return;

        const fetchStockData = async () => {
            setLoading(true);
            setError(null);

            try {
                // ✅ REPLACE MOCK DATA WITH REAL API CALL
                const response = await fetch(`http://localhost:3001/api/stocks/${symbol}`);

                if (!response.ok) {
                    throw new Error('Failed to fetch stock data');
                }

                const data = await response.json();

                setStockData(data);
            } catch (err) {
                setError('Failed to fetch stock data');
                console.error('Error fetching stock data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchStockData();
    }, [symbol]);

    return { stockData, loading, error };
};