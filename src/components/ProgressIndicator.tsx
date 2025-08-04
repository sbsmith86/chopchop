import React from 'react';
import { useAppContext } from '../context/AppContext';

export const ProgressIndicator: React.FC = () => {
  const { state } = useAppContext();

  // Add debug logging for step tracking
  console.log('ProgressIndicator rendered - currentStep:', state.currentStep);

  const steps = [
    { number: 1, name: 'Issue Input' },
    { number: 2, name: 'Clarification' },
    { number: 3, name: 'Plan Review' },
    { number: 4, name: 'Subtasks' },
    { number: 5, name: 'Approval' }
  ];

  return (
    <div className="flex items-center justify-center space-x-4 p-4">
      {steps.map((step) => (
        <div
          key={step.number}
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step.number <= state.currentStep
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-600'
          }`}
        >
          {step.number}
        </div>
      ))}
    </div>
  );
};