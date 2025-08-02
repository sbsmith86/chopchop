import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Header } from './Header';
import { ProgressIndicator } from './ProgressIndicator';
import { ConfigPanel } from './ConfigPanel';  // Named import
import { IssueInputPanel } from './IssueInputPanel';  // Named import
import { ClarificationQuestionPanel } from './ClarificationQuestionPanel';  // Named import
import { PlanReviewEditor } from './PlanReviewEditor';  // Named import
import { SubtaskListPanel } from './SubtaskListPanel';  // Named import
import { SummaryApprovalPanel } from './SummaryApprovalPanel';  // Named import
import { ErrorBanner } from './ui/ErrorBanner';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { SettingsIcon } from './ui/Icons';

/**
 * Main application shell with modern wizard-style layout
 */
export const AppShell: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const [showConfig, setShowConfig] = React.useState(!state.config?.githubPat);

  const isConfigured = Boolean(
    state.config?.githubPat &&
    state.config?.defaultRepo &&
    state.config?.openaiApiKey
  );

  /**
   * Renders the appropriate panel based on current step
   */
  const renderCurrentPanel = (): JSX.Element => {
    if (showConfig || !isConfigured) {
      return <ConfigPanel onClose={() => setShowConfig(false)} />;
    }

    switch (state.currentStep) {
      case 'input':
        return <IssueInputPanel />;
      case 'clarification':
        return <ClarificationQuestionPanel />;
      case 'plan':
        return <PlanReviewEditor />;
      case 'subtasks':
      case 'execution':
        return <SubtaskListPanel />;
      case 'approval':
        return <SummaryApprovalPanel />;
      default:
        return <IssueInputPanel />;
    }
  };

  return (
    <div className="min-h-screen">
      <Header />

      {/* Settings toggle */}
      <button
        onClick={() => setShowConfig(true)}
        className="fixed top-6 right-6 z-50 p-3 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 group"
        title="Settings"
      >
        <SettingsIcon className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
      </button>

      {/* Error banner */}
      {state.error && (
        <div className="mx-auto max-w-6xl px-6">
          <ErrorBanner message={state.error} />
        </div>
      )}

      {/* Main content */}
      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Progress indicator */}
        {isConfigured && !showConfig && (
          <div className="mb-8">
            <ProgressIndicator />
          </div>
        )}

        {/* Main panel */}
        <div className="relative">
          {state.isLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {renderCurrentPanel()}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};