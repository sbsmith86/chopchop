import { useEffect, useState, useCallback } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { useAppContext } from '../context/AppContext';
import { ExecutionPlan } from '../types';
import { OpenAIClient } from '../utils/openai';

/**
 * Plan review editor with markdown editing capabilities
 */
export default function PlanReviewEditor() {
  const { state, dispatch, setStep, setError, setLoading } = useAppContext();
  const [planContent, setPlanContent] = useState('');
  const [hasGenerated, setHasGenerated] = useState(false);

  /**
   * Generate execution plan using OpenAI
   */
  const generatePlan = useCallback(async () => {
    if (!state.issue || !state.config) {
      setError('Issue and configuration are required');
      return;
    }

    setLoading(true);
    setError(null);
    setHasGenerated(true);

    try {
      const openaiClient = new OpenAIClient(state.config.openaiApiKey);
      const executionPlan = await openaiClient.generateExecutionPlan(state.issue, state.clarificationQuestions);
      
      dispatch({ type: 'SET_EXECUTION_PLAN', payload: executionPlan });
      setPlanContent(executionPlan.content);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to generate execution plan');
    } finally {
      setLoading(false);
    }
  }, [state.issue, state.config, state.clarificationQuestions, dispatch, setError, setLoading]);

  // Auto-generate plan when entering this step
  useEffect(() => {
    if (state.issue && state.config && !hasGenerated && !state.executionPlan) {
      generatePlan();
    } else if (state.executionPlan) {
      setPlanContent(state.executionPlan.content);
    }
  }, [state.issue, state.config, hasGenerated, state.executionPlan, generatePlan]);

  /**
   * Save the edited plan and proceed
   */
  const handleSaveAndProceed = () => {
    if (!planContent.trim()) {
      setError('Please enter or generate an execution plan before proceeding');
      return;
    }

    const updatedPlan: ExecutionPlan = { content: planContent };
    dispatch({ type: 'SET_EXECUTION_PLAN', payload: updatedPlan });
    setError(null);
    setStep(4); // Move to Subtasks step
  };

  /**
   * Regenerate plan
   */
  const handleRegenerate = () => {
    setHasGenerated(false);
    generatePlan();
  };

  if (state.isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Generating execution plan...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
            📋 Plan Review
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Review and edit the AI-generated execution plan before proceeding to subtasks.
          </p>
        </div>

        <div className="px-6 py-4">
          {/* Issue Context */}
          {state.issue && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-750 rounded-md">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Issue Context:
              </h3>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {state.issue.title}
              </p>
              {state.clarificationQuestions.filter(q => q.answer).length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Based on {state.clarificationQuestions.filter(q => q.answer).length} clarification answers
                  </p>
                </div>
              )}
            </div>
          )}

          {/* No Plan Generated */}
          {!state.isLoading && !planContent && (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                No execution plan generated yet.
              </p>
              <button
                onClick={generatePlan}
                disabled={!state.issue || !state.config}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Generate Plan
              </button>
            </div>
          )}

          {/* Markdown Editor */}
          {planContent && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Execution Plan (Markdown)
                </h3>
                <button
                  onClick={handleRegenerate}
                  disabled={state.isLoading}
                  className="px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Regenerate
                </button>
              </div>
              
              <div className="border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
                <MDEditor
                  value={planContent}
                  onChange={(value) => setPlanContent(value || '')}
                  preview="edit"
                  height={400}
                  data-color-mode={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
                />
              </div>
              
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <p className="mb-1">
                  ✅ Review the generated plan above and make any necessary edits.
                </p>
                <p>
                  ⚠️ This step is required - the plan will be used to generate atomic subtasks in the next step.
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          {planContent && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSaveAndProceed}
                disabled={!planContent.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Plan & Generate Subtasks
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}