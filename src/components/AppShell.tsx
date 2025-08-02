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
  { id: 0, name: 'Configuration', icon: '⚙️', component: ConfigPanel, color: 'indigo' },
  { id: 1, name: 'Issue Input', icon: '📝', component: IssueInputPanel, color: 'green' },
  { id: 2, name: 'Clarification', icon: '❓', component: ClarificationQuestionPanel, color: 'purple' },
  { id: 3, name: 'Plan Review', icon: '📋', component: PlanReviewEditor, color: 'blue' },
  { id: 4, name: 'Subtasks', icon: '📊', component: SubtaskListPanel, color: 'orange' },
  { id: 5, name: 'Approval', icon: '✅', component: SummaryApprovalPanel, color: 'emerald' },
];

/**
 * Main application shell with navigation and step management
 */
export default function AppShell() {
  const { state, setStep } = useAppContext();
  const { currentStep, isLoading, error } = state;

  const CurrentStepComponent = WORKFLOW_STEPS[currentStep]?.component;
  const progressPercentage = ((currentStep + 1) / WORKFLOW_STEPS.length) * 100;

  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentStep) return 'completed';
    if (stepIndex === currentStep) return 'current';
    return 'upcoming';
  };

  const getStepColorClasses = (step: typeof WORKFLOW_STEPS[0], status: string) => {
    if (status === 'completed') {
      return 'bg-emerald-500 text-white border-emerald-500';
    } else if (status === 'current') {
      return `bg-${step.color}-500 text-white border-${step.color}-500 shadow-lg shadow-${step.color}-500/25`;
    }
    return 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200 hover:text-gray-700';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Modern Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-white/20 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-lg">
                  🔪
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    ChopChop
                  </h1>
                  <p className="text-sm text-gray-500 font-medium">Universal Issue Decomposer</p>
                </div>
              </div>
            </div>

            {/* Progress Indicator */}
            <div className="hidden md:flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-600">Progress</span>
              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <span className="text-sm font-bold text-indigo-600">{Math.round(progressPercentage)}%</span>
            </div>
          </div>
        </div>
      </header>

      {/* Error Alert */}
      {error && (
        <div className="mx-4 mt-4 mb-2 max-w-7xl lg:mx-auto">
          <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-4 shadow-sm">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-500 text-sm">⚠️</span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-800">Error</h3>
                <div className="text-sm text-red-700 mt-1">{error}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl border border-white/20 p-6 sticky top-24">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Workflow Steps</h2>
                <p className="text-sm text-gray-500">Follow the process to decompose your issue</p>
              </div>

              {/* Step Navigation */}
              <nav className="space-y-3">
                {WORKFLOW_STEPS.map((step, index) => {
                  const status = getStepStatus(index);
                  const isClickable = !isLoading;
                  
                  return (
                    <button
                      key={step.id}
                      onClick={() => isClickable && setStep(index)}
                      disabled={!isClickable}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 group ${
                        isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                      } ${getStepColorClasses(step, status)}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                          status === 'completed' 
                            ? 'bg-white/20' 
                            : status === 'current' 
                              ? 'bg-white/20' 
                              : 'bg-gray-200'
                        }`}>
                          {status === 'completed' ? (
                            <span className="text-sm">✓</span>
                          ) : (
                            <span className="text-sm">{step.icon}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                              status === 'completed' 
                                ? 'bg-white/20 text-white' 
                                : status === 'current' 
                                  ? 'bg-white/20 text-white' 
                                  : 'bg-gray-200 text-gray-500'
                            }`}>
                              {index + 1}
                            </span>
                            <span className="text-sm font-medium truncate">{step.name}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </nav>

              {/* Mobile Progress Bar */}
              <div className="mt-6 md:hidden">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>Progress</span>
                  <span className="font-bold text-indigo-600">{Math.round(progressPercentage)}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-xl border border-white/20 min-h-[600px] relative overflow-hidden">
              {isLoading && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading...</p>
                    <p className="text-sm text-gray-500 mt-1">Please wait while we process your request</p>
                  </div>
                </div>
              )}
              
              {!isLoading && CurrentStepComponent && <CurrentStepComponent />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}