import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { PlanManagerPanel } from './PlanManagerPanel';
import { BookmarkIcon } from './ui/Icons';

export const Header: React.FC = () => {
  const { state } = useAppContext();
  const [showPlanManager, setShowPlanManager] = useState(false);

  return (
    <>
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
            
            {/* Plan Management Button */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowPlanManager(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                title="Manage Execution Plans"
              >
                <BookmarkIcon className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  Plans ({state.savedPlans.length})
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <PlanManagerPanel 
        isOpen={showPlanManager} 
        onClose={() => setShowPlanManager(false)} 
      />
    </>
  );
};