import React, { useState } from 'react';
import Button from '../common/Button';
import { Stock, Holding } from '../../types/portfolio';

interface PurchaseFormProps {
    stock: Stock;
    onSave: (holding: Omit<Holding, 'id'>) => void;
    onCancel?: () => void;
    editingHolding?: Holding;
}

const PurchaseForm: React.FC<PurchaseFormProps> = ({
    stock,
    onSave,
    onCancel,
    editingHolding
}) => {
    const [quantity, setQuantity] = useState(editingHolding?.quantity.toString() || '');
    const [purchasePrice, setPurchasePrice] = useState(editingHolding?.purchasePrice.toString() || '');
    const [purchaseDate, setPurchaseDate] = useState(
        editingHolding?.purchaseDate || new Date().toISOString().split('T')[0]
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!quantity || !purchasePrice || !purchaseDate) {
            alert('Please fill in all fields');
            return;
        }

        const holdingData: Omit<Holding, 'id'> = {
            symbol: stock.symbol,
            quantity: parseInt(quantity),
            purchasePrice: parseFloat(purchasePrice),
            purchaseDate: purchaseDate
        };

        onSave(holdingData);

        // Reset form if not editing
        if (!editingHolding) {
            setQuantity('');
            setPurchasePrice('');
            setPurchaseDate(new Date().toISOString().split('T')[0]);
        }
    };

    const totalInvestment = quantity && purchasePrice
        ? (parseInt(quantity) * parseFloat(purchasePrice)).toLocaleString('en-IN')
        : '0';

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Stock Info */}
            <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-900">{stock.name}</div>
                <div className="text-xs text-gray-600">{stock.symbol} • {stock.sector}</div>
            </div>

            {/* Quantity */}
            <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Shares
                </label>
                <input
                    type="number"
                    id="quantity"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter quantity"
                    required
                />
            </div>

            {/* Purchase Price */}
            <div>
                <label htmlFor="purchasePrice" className="block text-sm font-medium text-gray-700 mb-1">
                    Purchase Price per Share (₹)
                </label>
                <input
                    type="number"
                    id="purchasePrice"
                    min="0"
                    step="0.01"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter purchase price"
                    required
                />
            </div>

            {/* Purchase Date */}
            <div>
                <label htmlFor="purchaseDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Purchase Date
                </label>
                <input
                    type="date"
                    id="purchaseDate"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                />
            </div>

            {/* Total Investment */}
            {quantity && purchasePrice && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-sm text-blue-800">
                        <span className="font-medium">Total Investment:</span> ₹{totalInvestment}
                    </div>
                </div>
            )}

            {/* Buttons */}
            <div className="flex space-x-3 pt-2">
                <Button type="submit" className="flex-1">
                    {editingHolding ? 'Update Holding' : 'Add to Portfolio'}
                </Button>
                {onCancel && (
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onCancel}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                )}
            </div>

            {/* Help Text */}
            <div className="text-xs text-gray-500">
                <p>• Use actual purchase prices for accurate P&L calculation</p>
                <p>• You can edit these details later if needed</p>
            </div>
        </form>
    );
};

export default PurchaseForm;