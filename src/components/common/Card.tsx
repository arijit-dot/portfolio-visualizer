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
        <div className={`bg-white shadow-sm rounded-lg border border-gray-200 ${className}`}>
            {(title || actions) && (
                <div className="px-3 py-4 sm:px-4 sm:py-5 border-b border-gray-200 flex flex-col xs:flex-row justify-between items-start xs:items-center gap-2 xs:gap-4">
                    {title && (
                        <h3 className="text-base sm:text-lg font-medium text-gray-900">{title}</h3>
                    )}
                    {actions && (
                        <div className="flex flex-wrap gap-2 w-full xs:w-auto justify-start xs:justify-end">
                            {actions}
                        </div>
                    )}
                </div>
            )}
            <div className="px-3 py-4 sm:px-4 sm:py-5 lg:p-6">
                {children}
            </div>
        </div>
    );
};

export default Card;