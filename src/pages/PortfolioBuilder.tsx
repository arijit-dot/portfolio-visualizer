import React, { useState } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import StockSelector from '../components/portfolio/StockSelector';
import PurchaseForm from '../components/portfolio/PurchaseForm';
import PortfolioTable from '../components/portfolio/PortfolioTable';
import { usePortfolio } from '../hooks/usePortfolio';
import { Holding, Stock } from '../types/portfolio';

const PortfolioBuilder: React.FC = () => {
    const { portfolio, addHolding, removeHolding, updateHolding } = usePortfolio();

    const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
    const [isEditing, setIsEditing] = useState<string | null>(null);

    const handleAddHolding = (holdingData: Omit<Holding, 'id'>) => {
        console.log('➕ Adding holding:', holdingData);
        addHolding(holdingData);
        setSelectedStock(null);
    };

    const handleEditHolding = (holdingId: string) => {
        setIsEditing(holdingId);
        const holding = portfolio.holdings.find(h => h.id === holdingId);
        if (holding) {
            const stock = { symbol: holding.symbol, name: '', sector: '' };
            setSelectedStock(stock as Stock);
        }
    };

    const handleSaveEdit = (holdingData: Omit<Holding, 'id'>) => {
        if (isEditing) {
            updateHolding(isEditing, holdingData);
            setIsEditing(null);
            setSelectedStock(null);
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(null);
        setSelectedStock(null);
    };

    // SIMPLE navigation that always works
    const handleViewDashboard = () => {
        console.log('🎯 Navigating to dashboard with portfolio:', portfolio);
        window.location.href = '/dashboard';
    };

    // Manual test function
    const handleManualSave = () => {
        const testHolding = {
            id: 'test-' + Date.now(),
            symbol: 'RELIANCE.NS',
            quantity: 10,
            purchasePrice: 2450,
            purchaseDate: '2024-01-01'
        };
        const testPortfolio = { holdings: [testHolding] };
        localStorage.setItem('portfolio', JSON.stringify(testPortfolio));
        console.log('💾 Manually saved test portfolio:', testPortfolio);
        alert('Test portfolio saved! Check dashboard now.');
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">
                    {portfolio.holdings.length > 0 ? 'Manage Portfolio' : 'Build Your Portfolio'}
                </h1>
                <div className="flex space-x-3">
                    {portfolio.holdings.length > 0 && (
                        <Button onClick={handleViewDashboard}>
                            View Dashboard ({portfolio.holdings.length} holdings)
                        </Button>
                    )}
                    {/* Manual test button */}
                    <Button variant="secondary" onClick={handleManualSave}>
                        💾 Test Save
                    </Button>
                </div>
            </div>

            {/* DEBUG CARD */}
            <Card title="🛠️ Debug Information">
                <div className="text-sm space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="font-medium">Portfolio Status:</div>
                            <div>Holdings count: <span className="font-bold">{portfolio.holdings.length}</span></div>
                            <div>LocalStorage: <span className={localStorage.getItem('portfolio') ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                                {localStorage.getItem('portfolio') ? 'EXISTS' : 'EMPTY'}
                            </span></div>
                        </div>
                        <div>
                            <div className="font-medium">Current State:</div>
                            <div>Selected stock: {selectedStock?.symbol || 'None'}</div>
                            <div>Editing: {isEditing || 'None'}</div>
                        </div>
                    </div>

                    <div className="flex space-x-2 pt-2">
                        <button
                            onClick={() => {
                                console.log('📊 Current portfolio:', portfolio);
                                console.log('💾 LocalStorage data:', localStorage.getItem('portfolio'));
                            }}
                            className="bg-blue-500 text-white px-3 py-1 rounded text-xs"
                        >
                            Log to Console
                        </button>
                        <button
                            onClick={() => {
                                localStorage.removeItem('portfolio');
                                console.log('🧹 Cleared localStorage');
                                window.location.reload();
                            }}
                            className="bg-red-500 text-white px-3 py-1 rounded text-xs"
                        >
                            Clear Storage
                        </button>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Stock Selection & Form */}
                <div className="lg:col-span-1 space-y-6">
                    <Card title="1. Select Stock">
                        <StockSelector
                            selectedStock={selectedStock}
                            onStockSelect={setSelectedStock}
                        />
                    </Card>

                    {selectedStock && (
                        <Card title="2. Enter Purchase Details">
                            <PurchaseForm
                                stock={selectedStock}
                                onSave={isEditing ? handleSaveEdit : handleAddHolding}
                                onCancel={isEditing ? handleCancelEdit : undefined}
                                editingHolding={isEditing ? portfolio.holdings.find(h => h.id === isEditing) : undefined}
                            />
                        </Card>
                    )}
                </div>

                {/* Right Column - Portfolio Table */}
                <div className="lg:col-span-2">
                    <Card
                        title="Your Portfolio"
                        actions={
                            portfolio.holdings.length > 0 && (
                                <div className="text-sm text-gray-600">
                                    {portfolio.holdings.length} holding{portfolio.holdings.length !== 1 ? 's' : ''}
                                </div>
                            )
                        }
                    >
                        {portfolio.holdings.length > 0 ? (
                            <PortfolioTable
                                holdings={portfolio.holdings}
                                onEdit={handleEditHolding}
                                onRemove={removeHolding}
                            />
                        ) : (
                            <div className="text-center py-12">
                                <div className="text-gray-400 mb-4">
                                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No holdings yet</h3>
                                <p className="text-gray-600 mb-4">
                                    Select a stock and add purchase details to build your portfolio.
                                </p>
                                <div className="text-sm text-gray-500">
                                    <p>• Click on any stock from the left panel</p>
                                    <p>• Enter quantity, purchase price, and date</p>
                                    <p>• Click "Add to Portfolio"</p>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            </div>

            {/* Instructions */}
            {portfolio.holdings.length === 0 && (
                <Card title="💡 How to Test">
                    <div className="text-sm text-gray-600 space-y-2">
                        <p><strong>Option 1 - Normal Flow:</strong></p>
                        <p>1. Select a stock from the left panel (e.g., RELIANCE.NS)</p>
                        <p>2. Enter quantity (e.g., 10), purchase price (e.g., 2450), and date</p>
                        <p>3. Click "Add to Portfolio"</p>
                        <p>4. Check if "LocalStorage" shows "EXISTS" in debug card</p>
                        <p>5. Click "View Dashboard"</p>

                        <p className="mt-4"><strong>Option 2 - Quick Test:</strong></p>
                        <p>1. Click the "💾 Test Save" button above</p>
                        <p>2. Check if "LocalStorage" shows "EXISTS"</p>
                        <p>3. Click "View Dashboard"</p>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default PortfolioBuilder;