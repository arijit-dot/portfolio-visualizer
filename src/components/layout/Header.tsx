import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Header: React.FC = () => {
    const location = useLocation();

    const isActive = (path: string) => {
        return location.pathname === path ? 'text-blue-600 border-blue-600' : 'text-gray-600 border-transparent';
    };

    return (
        <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">PV</span>
                            </div>
                            <span className="text-xl font-bold text-gray-900">Portfolio Visualizer</span>
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav className="flex space-x-8">
                        <Link
                            to="/dashboard"
                            className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isActive('/dashboard')}`}
                        >
                            Dashboard
                        </Link>
                        <Link
                            to="/portfolio"
                            className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isActive('/portfolio')}`}
                        >
                            Portfolio
                        </Link>
                        <Link
                            to="/valuation"
                            className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isActive('/valuation')}`}
                        >
                            Valuation
                        </Link>
                    </nav>
                </div>
            </div>
        </header>
    );
};

export default Header;