import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer className="bg-white border-t border-gray-200 mt-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="text-center text-gray-600">
                    <p className="text-sm">
                        Portfolio Visualizer - Built for demonstrating financial analytics skills
                    </p>
                    <p className="text-xs mt-2 text-gray-500">
                        Data provided by Yahoo Finance • Not financial advice
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;