import React from 'react';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />
            <main className="flex-1 w-full">
                <div className="max-w-7xl mx-auto w-full py-4 sm:py-6 px-3 sm:px-4 lg:px-6">
                    {children}
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Layout;