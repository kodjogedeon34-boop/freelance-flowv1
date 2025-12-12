import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-light-card dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-3xl shadow-sm dark:shadow-none p-6 ${className}`}>
      {children}
    </div>
  );
};