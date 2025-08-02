import React from 'react';

/**
 * Test component to verify Tailwind CSS is working properly
 */
export const TailwindTest: React.FC = () => {
  return (
    <div className="fixed top-4 left-4 z-50 p-4 bg-green-500 text-white rounded-lg shadow-lg max-w-sm">
      <h3 className="font-bold text-lg mb-2">Tailwind Status</h3>
      <div className="space-y-2 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-300 rounded-full"></div>
          <span>Background colors working</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-300 rounded-full"></div>
          <span>Spacing and sizing working</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-purple-300 rounded-full"></div>
          <span>Typography working</span>
        </div>
      </div>
      <button
        className="mt-3 px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs transition-colors"
        onClick={() => {
          const el = document.querySelector('[data-tailwind-test]') as HTMLElement;
          if (el) el.style.display = 'none';
        }}
      >
        Hide Test
      </button>
    </div>
  );
};