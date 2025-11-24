import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import PortfolioBuilder from './pages/PortfolioBuilder';
import Valuation from './pages/Valuation';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Layout><Dashboard /></Layout>} />
                <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
                <Route path="/portfolio" element={<Layout><PortfolioBuilder /></Layout>} />
                <Route path="/valuation" element={<Layout><Valuation /></Layout>} />
            </Routes>
        </Router>
    );
}

export default App;