import React from 'react';

/**
 * Modern loading spinner with smooth animation
 */
export const LoadingSpinner: React.FC = () => (
  <div className="flex flex-col items-center justify-center space-y-4">
    <div className="relative">
      <div className="w-12 h-12 border-4 border-blue-200 rounded-full animate-spin"></div>
      <div className="absolute top-0 left-0 w-12 h-12 border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
    </div>
    <p className="text-gray-600 font-medium">Processing your request...</p>
  </div>
);