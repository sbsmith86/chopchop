import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import ConfigPanel from './ConfigPanel';
import IssueInputPanel from './IssueInputPanel';
import ClarificationQuestionPanel from './ClarificationQuestionPanel';
import PlanReviewEditor from './PlanReviewEditor';
import SubtaskListPanel from './SubtaskListPanel';
import SummaryApprovalPanel from './SummaryApprovalPanel';

/**
 * Workflow steps configuration
 */
const WORKFLOW_STEPS = [
  { id: 0, name: 'Configuration', component: ConfigPanel },
  { id: 1, name: 'Issue Input', component: IssueInputPanel },
  { id: 2, name: 'Clarification', component: ClarificationQuestionPanel },
  { id: 3, name: 'Plan Review', component: PlanReviewEditor },
  { id: 4, name: 'Subtasks', component: SubtaskListPanel },
  { id: 5, name: 'Approval', component: SummaryApprovalPanel },
];

/**
 * Main application shell with left sidebar navigation
 */
export default function AppShell() {
  const { state, setStep } = useAppContext();
  const { currentStep, isLoading, error } = state;
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const CurrentStepComponent = WORKFLOW_STEPS[currentStep]?.component;

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* LEFT SIDEBAR */}
      <div className={`bg-white dark:bg-gray-800 transition-all duration-300 ease-in-out flex-shrink-0 border-r border-gray-200 dark:border-gray-700 ${
        sidebarOpen ? 'w-72' : 'w-16'
      }`}>
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
          {sidebarOpen ? (
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🔪</span>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">ChopChop</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Issue Decomposer</p>
              </div>
            </div>
          ) : (
            <span className="text-2xl mx-auto">🔪</span>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg 
              className="w-5 h-5 text-gray-500 dark:text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              {sidebarOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              )}
            </svg>
          </button>
        </div>

        {/* Navigation Steps */}
        <nav className="flex-1 px-4 py-6 space-y-3">
          {WORKFLOW_STEPS.map((step, index) => {
            const isActive = currentStep === index;
            const isCompleted = currentStep > index;
            const isUpcoming = currentStep < index;

            return (
              <button
                key={step.id}
                onClick={() => setStep(index)}
                disabled={isLoading}
                className={`w-full flex items-center text-left p-3 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : isCompleted
                    ? 'bg-green-50 text-green-800 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-200 dark:hover:bg-green-900/30'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {/* Step Number/Icon */}
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold mr-3 ${
                  isActive
                    ? 'bg-white/20'
                    : isCompleted
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                }`}>
                  {isCompleted ? '✓' : index + 1}
                </div>

                {/* Step Details */}
                {sidebarOpen && (
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{step.name}</div>
                    <div className={`text-xs mt-0.5 ${
                      isActive
                        ? 'text-blue-100'
                        : isCompleted
                        ? 'text-green-600 dark:text-green-300'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {isActive ? 'Current' : isCompleted ? 'Completed' : 'Upcoming'}
                    </div>
                  </div>
                )}

                {/* Arrow indicator for current step when collapsed */}
                {!sidebarOpen && isActive && (
                  <div className="absolute left-16 w-0 h-0 border-l-4 border-l-blue-600 border-t-4 border-t-transparent border-b-4 border-b-transparent"></div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Progress Bar */}
        {sidebarOpen && (
          <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>Progress</span>
              <span>{currentStep + 1} of {WORKFLOW_STEPS.length}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${((currentStep + 1) / WORKFLOW_STEPS.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Error Alert */}
        {error && (
          <div className="m-6">
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-red-500 text-lg">⚠️</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
                  <div className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading...</p>
            </div>
          )}
          
          {!isLoading && CurrentStepComponent && <CurrentStepComponent />}
        </main>
      </div>
    </div>
  );
}