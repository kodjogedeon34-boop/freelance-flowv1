
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseClasses = 'px-6 py-2.5 font-semibold rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:scale-100';
  
  const variantClasses = {
    primary: 'text-white bg-gradient-to-r from-primary-gradient-start to-primary-gradient-end hover:from-primary-gradient-start/90 hover:to-primary-gradient-end/90 focus:ring-accent hover:shadow-glow-primary',
    secondary: 'bg-gray-200 dark:bg-[#21262D] dark:border dark:border-dark-border text-light-text dark:text-dark-text-secondary hover:bg-gray-300 dark:hover:bg-dark-border focus:ring-accent',
    ghost: 'bg-transparent text-light-text dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-card focus:ring-accent',
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};