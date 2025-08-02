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
    <div>
      {/* Header */}
      <header>
        <div>
          <div>
            <div>
              <h1>🔪 ChopChop</h1>
              <span>Universal Issue Decomposer</span>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Navigation */}
      <div>
        <div>
          <nav>
            {WORKFLOW_STEPS.map((step, index) => (
              <button
                key={step.id}
                onClick={() => setStep(index)}
                disabled={isLoading}
              >
                <span>
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
        <div>
          <div>
            <div>
              <div>
                <span>⚠️</span>
              </div>
              <div>
                <h3>Error</h3>
                <div>{error}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main>
        {isLoading && (
          <div>
            <div>Loading...</div>
          </div>
        )}
        
        {!isLoading && CurrentStepComponent && <CurrentStepComponent />}
      </main>
    </div>
  );
}