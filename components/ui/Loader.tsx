
import React from 'react';

interface LoaderProps {
  text?: string;
}

export const Loader: React.FC<LoaderProps> = ({ text = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="w-16 h-16 border-4 border-accent border-t-transparent border-solid rounded-full animate-spin"></div>
      <p className="text-lg font-medium text-gray-600 dark:text-dark-text-secondary">{text}</p>
    </div>
  );
};