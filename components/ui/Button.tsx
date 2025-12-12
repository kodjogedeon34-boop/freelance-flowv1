
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseClasses = 'px-6 py-3 font-semibold rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-300 ease-in-out transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'text-white bg-gradient-to-r from-primary-gradient-start to-primary-gradient-end hover:shadow-glow-primary hover:brightness-110 border-0',
    secondary: 'bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border text-light-text dark:text-dark-text hover:bg-gray-50 dark:hover:bg-dark-border hover:shadow-md',
    ghost: 'bg-transparent text-light-text dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-white/5',
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};