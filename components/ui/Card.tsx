import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-light-card dark:bg-dark-card dark:border dark:border-dark-border rounded-2xl shadow-md p-6 ${className}`}>
      {children}
    </div>
  );
};