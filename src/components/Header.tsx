import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">C</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">ChopChop</h1>
              <p className="text-sm text-gray-500">Issue Decomposer</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};