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
 * Main application shell with navigation and step management
 */
export default function AppShell() {
  const { state, setStep } = useAppContext();
  const { currentStep, isLoading, error } = state;

  const CurrentStepComponent = WORKFLOW_STEPS[currentStep]?.component;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-8">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <span className="text-4xl">🔪</span>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    ChopChop
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                    Universal Issue Decomposer
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Navigation */}
      <div className="bg-white dark:bg-gray-800 border-b-2 border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="py-6" aria-label="Workflow Steps">
            <div className="flex items-center justify-between">
              {WORKFLOW_STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => setStep(index)}
                    disabled={isLoading}
                    className={`group flex flex-col items-center space-y-2 px-4 py-3 rounded-lg transition-all duration-200 min-w-[120px] ${
                      currentStep === index
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700'
                        : currentStep > index
                        ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-900/30'
                        : 'bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                        currentStep === index
                          ? 'bg-blue-600 text-white'
                          : currentStep > index
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {currentStep > index ? '✓' : index + 1}
                    </div>
                    <span
                      className={`text-xs font-medium text-center leading-tight ${
                        currentStep === index
                          ? 'text-blue-700 dark:text-blue-300'
                          : currentStep > index
                          ? 'text-green-700 dark:text-green-300'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {step.name}
                    </span>
                  </button>
                  {index < WORKFLOW_STEPS.length - 1 && (
                    <div className="flex-1 h-0.5 bg-gray-200 dark:bg-gray-600 mx-2 min-w-[20px]" />
                  )}
                </div>
              ))}
            </div>
          </nav>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400 text-lg">Loading...</p>
          </div>
        )}
        
        {!isLoading && CurrentStepComponent && <CurrentStepComponent />}
      </main>
    </div>
  );
}