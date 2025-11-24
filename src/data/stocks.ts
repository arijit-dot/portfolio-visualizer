import { Stock } from '../types/portfolio';

export const MVP_STOCKS: Stock[] = [
    {
        symbol: "RELIANCE.NS",
        name: "Reliance Industries",
        sector: "Oil & Gas"
    },
    {
        symbol: "TCS.NS",
        name: "Tata Consultancy Services",
        sector: "IT"
    },
    {
        symbol: "HDFCBANK.NS",
        name: "HDFC Bank",
        sector: "Banking"
    },
    {
        symbol: "INFY.NS",
        name: "Infosys",
        sector: "IT"
    },
    {
        symbol: "ITC.NS",
        name: "ITC Limited",
        sector: "FMCG"
    }
];

export const getStockBySymbol = (symbol: string): Stock | undefined => {
    return MVP_STOCKS.find(stock => stock.symbol === symbol);
};