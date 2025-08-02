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
 * Main application shell with sidebar navigation and step management
 */
export default function AppShell() {
  const { state, setStep } = useAppContext();
  const { currentStep, isLoading, error } = state;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const CurrentStepComponent = WORKFLOW_STEPS[currentStep]?.component;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar Navigation */}
      <div className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 flex-shrink-0 ${
        sidebarCollapsed ? 'w-16' : 'w-80'
      }`}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : ''}`}>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                🔪 {!sidebarCollapsed && 'ChopChop'}
              </h1>
            </div>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="text-gray-500 dark:text-gray-400">
                {sidebarCollapsed ? '→' : '←'}
              </span>
            </button>
          </div>
          {!sidebarCollapsed && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Universal Issue Decomposer
            </p>
          )}
        </div>

        {/* Workflow Steps Navigation */}
        <nav className="p-4 space-y-2" aria-label="Workflow Steps">
          {WORKFLOW_STEPS.map((step, index) => {
            const isActive = currentStep === index;
            const isCompleted = currentStep > index;
            const isDisabled = isLoading;

            return (
              <button
                key={step.id}
                onClick={() => setStep(index)}
                disabled={isDisabled}
                className={`w-full flex items-center p-4 rounded-xl transition-all duration-200 text-left group ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 shadow-sm'
                    : isCompleted
                    ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-900/30'
                    : 'bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className={`flex items-center justify-center w-10 h-10 rounded-lg mr-4 ${
                  isActive
                    ? 'bg-blue-500 text-white'
                    : isCompleted
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                }`}>
                  <span className="text-sm font-bold">
                    {isCompleted ? '✓' : index + 1}
                  </span>
                </div>
                {!sidebarCollapsed && (
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-sm font-semibold ${
                      isActive
                        ? 'text-blue-900 dark:text-blue-100'
                        : isCompleted
                        ? 'text-green-900 dark:text-green-100'
                        : 'text-gray-900 dark:text-gray-100'
                    }`}>
                      {step.name}
                    </h3>
                    <p className={`text-xs mt-1 ${
                      isActive
                        ? 'text-blue-600 dark:text-blue-300'
                        : isCompleted
                        ? 'text-green-600 dark:text-green-300'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {isActive ? 'Current step' : isCompleted ? 'Completed' : 'Upcoming'}
                    </p>
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Progress Indicator */}
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Progress</span>
              <span className="text-gray-900 dark:text-gray-100 font-medium">
                {currentStep + 1}/{WORKFLOW_STEPS.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / WORKFLOW_STEPS.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Error Alert */}
        {error && (
          <div className="m-6 mb-0">
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 rounded-lg p-6 shadow-sm">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-red-500 text-xl">⚠️</span>
                </div>
                <div className="ml-4">
                  <h3 className="text-base font-semibold text-red-800 dark:text-red-200">
                    Error
                  </h3>
                  <div className="mt-2 text-sm text-red-700 dark:text-red-300 leading-relaxed">
                    {error}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-6">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400 text-lg">Loading...</p>
            </div>
          )}
          
          {!isLoading && CurrentStepComponent && <CurrentStepComponent />}
        </main>
      </div>
    </div>
  );
}