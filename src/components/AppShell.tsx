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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                🔪 ChopChop
              </h1>
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                Universal Issue Decomposer
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 py-4" aria-label="Workflow Steps">
            {WORKFLOW_STEPS.map((step, index) => (
              <button
                key={step.id}
                onClick={() => setStep(index)}
                className={`text-sm font-medium transition-colors ${
                  currentStep === index
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 pb-2'
                    : currentStep > index
                    ? 'text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
                disabled={isLoading}
              >
                <span className="mr-2">
                  {currentStep > index ? '✓' : index + 1}
                </span>
                {step.name}
              </button>
            ))}
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