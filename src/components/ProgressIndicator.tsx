import React from 'react';
import { useAppContext } from '../context/AppContext';

export const ProgressIndicator: React.FC = () => {
  const { state } = useAppContext();

  const steps = ['input', 'clarification', 'plan', 'subtasks', 'approval'];
  const currentIndex = steps.indexOf(state.currentStep);

  return (
    <div className="flex items-center justify-center space-x-4 p-4">
      {steps.map((step, index) => (
        <div
          key={step}
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            index <= currentIndex
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-600'
          }`}
        >
          {index + 1}
        </div>
      ))}
    </div>
  );
};