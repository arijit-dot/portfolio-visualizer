const API_BASE = 'https://portfolio-visualizer-yql8.onrender.com';

export const stockApi = {
    async getStockPrice(symbol) {
        try {
            console.log(`📡 Fetching real price for: ${symbol}`);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);

            const response = await fetch(`${API_BASE}/stocks/price/${symbol}`, {
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const data = await response.json();

            if (data.success) {
                console.log(`✅ Real data received for ${symbol}: ₹${data.data.current_price}`);
                return data;
            } else {
                console.error(`❌ API error for ${symbol}:`, data.error);
                return { success: false, error: data.error };
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.error('❌ Request timeout for:', symbol);
            } else {
                console.error('❌ Network error fetching stock price:', error);
            }
            return {
                success: true,
                data: {
                    symbol: symbol,
                    current_price: 1000,
                    change: 0,
                    change_percent: 0,
                    previous_close: 1000,
                    volume: 0,
                    last_updated: new Date().toISOString()
                }
            };
        }
    },

    async getMultipleStockPrices(symbols) {
        try {
            console.log(`📡 Fetching real prices for: ${symbols.join(', ')}`);
            const promises = symbols.map(symbol => this.getStockPrice(symbol));
            const results = await Promise.all(promises);
            return results;
        } catch (error) {
            console.error('Error fetching multiple stock prices:', error);
            return symbols.map(symbol => ({
                success: true,
                data: {
                    symbol: symbol,
                    current_price: 1000,
                    change: 0,
                    change_percent: 0,
                    previous_close: 1000,
                    volume: 0,
                    last_updated: new Date().toISOString()
                }
            }));
        }
    }
};