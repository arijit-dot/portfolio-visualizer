import React from 'react';

const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-white border-t border-gray-200 mt-8 sm:mt-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                <div className="text-center text-gray-600">
                    {/* Main Text */}
                    <p className="text-sm sm:text-base">
                        Portfolio Visualizer - Built for demonstrating financial analytics skills
                    </p>

                    {/* Additional Info - Stack on mobile, side by side on larger screens */}
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4 mt-3 sm:mt-4">
                        <p className="text-xs sm:text-sm text-gray-500">
                            Data provided by Yahoo Finance
                        </p>
                        <span className="hidden sm:inline text-gray-400">•</span>
                        <p className="text-xs sm:text-sm text-gray-500">
                            Not financial advice
                        </p>
                    </div>

                    {/* Copyright */}
                    <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
                        <p className="text-xs text-gray-400">
                            © {currentYear} Portfolio Visualizer. Educational purpose only.
                        </p>
                    </div>

                    {/* Quick Links - Optional addition for better UX */}
                    <div className="mt-4 flex justify-center space-x-4 sm:space-x-6">
                        <a
                            href="#"
                            className="text-xs text-gray-400 hover:text-gray-600 transition-colors duration-200"
                            onClick={(e) => e.preventDefault()}
                        >
                            Privacy
                        </a>
                        <a
                            href="#"
                            className="text-xs text-gray-400 hover:text-gray-600 transition-colors duration-200"
                            onClick={(e) => e.preventDefault()}
                        >
                            Terms
                        </a>
                        <a
                            href="#"
                            className="text-xs text-gray-400 hover:text-gray-600 transition-colors duration-200"
                            onClick={(e) => e.preventDefault()}
                        >
                            Contact
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;