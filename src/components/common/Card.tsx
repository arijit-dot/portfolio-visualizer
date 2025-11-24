import React from 'react';

interface CardProps {
    children: React.ReactNode;
    title?: string;
    className?: string;
    actions?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({
    children,
    title,
    className = '',
    actions
}) => {
    return (
        <div className={`bg-white shadow rounded-lg border border-gray-200 ${className}`}>
            {(title || actions) && (
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
                    {title && (
                        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
                    )}
                    {actions && (
                        <div className="flex space-x-2">
                            {actions}
                        </div>
                    )}
                </div>
            )}
            <div className="px-4 py-5 sm:p-6">
                {children}
            </div>
        </div>
    );
};

export default Card;