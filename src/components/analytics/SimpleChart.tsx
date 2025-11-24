import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

// Simple Line Chart Component
export const SimpleLineChart = ({ data, options, title }) => {
    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: title || 'Performance Chart',
            },
        },
        ...options
    };

    return <Line data={data} options={chartOptions} />;
};

// Simple Doughnut Chart Component
export const SimpleDoughnutChart = ({ data, options, title }) => {
    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'bottom',
            },
            title: {
                display: true,
                text: title || 'Allocation Chart',
            },
        },
        ...options
    };

    return <Doughnut data={data} options={chartOptions} />;
};

// Simple Bar Chart Component
export const SimpleBarChart = ({ data, options, title }) => {
    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: title || 'Bar Chart',
            },
        },
        ...options
    };

    return <Bar data={data} options={chartOptions} />;
};

// Pre-configured performance chart
export const PerformanceChart = ({ portfolioData, benchmarkData, labels }) => {
    const data = {
        labels: labels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
            {
                label: 'Your Portfolio',
                data: portfolioData || [10000, 12000, 11500, 13000, 12500, 14000],
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true,
            },
            {
                label: 'Nifty 50',
                data: benchmarkData || [100, 105, 102, 108, 106, 110],
                borderColor: 'rgb(107, 114, 128)',
                backgroundColor: 'rgba(107, 114, 128, 0.1)',
                tension: 0.4,
                fill: false,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Portfolio Performance vs Nifty 50',
            },
        },
        scales: {
            y: {
                beginAtZero: false,
            },
        },
    };

    return <Line data={data} options={options} />;
};

// Pre-configured allocation chart
export const AllocationChart = ({ sectors }) => {
    const sectorColors = {
        'Oil & Gas': '#FF6B6B',
        'IT': '#4ECDC4',
        'Banking': '#45B7D1',
        'FMCG': '#96CEB4',
        'Telecom': '#FFEAA7',
        'Infrastructure': '#DDA0DD',
        'Financial Services': '#98D8C8',
        'Chemicals': '#F7DC6F',
        'Auto': '#BB8FCE',
        'Pharma': '#85C1E9'
    };

    const sectorData = sectors || {
        'IT': 40,
        'Banking': 30,
        'Oil & Gas': 20,
        'FMCG': 10
    };

    const data = {
        labels: Object.keys(sectorData),
        datasets: [
            {
                data: Object.values(sectorData),
                backgroundColor: Object.keys(sectorData).map(sector =>
                    sectorColors[sector] || '#6B7280'
                ),
                borderWidth: 2,
                borderColor: '#fff',
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'bottom',
            },
        },
    };

    return <Doughnut data={data} options={options} />;
};

// Export all components
export default {
    SimpleLineChart,
    SimpleDoughnutChart,
    SimpleBarChart,
    PerformanceChart,
    AllocationChart
};