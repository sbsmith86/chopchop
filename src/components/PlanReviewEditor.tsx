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
      <div className="h-full">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl border border-gray-200 dark:border-gray-700 h-full flex flex-col">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-200 border-t-orange-600 mx-auto mb-6"></div>
              <p className="text-gray-600 dark:text-gray-400 text-lg">Generating execution plan...</p>
              <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">This may take a few moments</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl border border-gray-200 dark:border-gray-700 h-full flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">📋</span>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Execution Plan Review
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Review and edit the AI-generated execution plan before breaking it down into subtasks.
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Issue Context */}
          {state.issue && (
            <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-750 rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="flex items-start space-x-3">
                <span className="text-blue-500 text-lg flex-shrink-0">📋</span>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Issue Context:
                  </h3>
                  <p className="text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {state.issue.title}
                  </p>
                  {state.clarificationQuestions.filter(q => q.answer).length > 0 && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        💡 Generated with insights from {state.clarificationQuestions.filter(q => q.answer).length} clarification answers
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* No Plan Generated */}
          {!state.isLoading && !planContent && (
            <div className="text-center py-12">
              <div className="flex flex-col items-center space-y-4">
                <span className="text-6xl">🤖</span>
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
                    No execution plan generated yet.
                  </p>
                  <p className="text-gray-500 dark:text-gray-500 text-sm mb-6">
                    Generate an AI-powered execution plan based on your issue and clarifications.
                  </p>
                </div>
                <button
                  onClick={generatePlan}
                  disabled={!state.issue || !state.config}
                  className="inline-flex items-center px-6 py-3 text-base font-semibold text-white bg-orange-600 border border-transparent rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
                >
                  <span className="mr-2">✨</span>
                  Generate Plan
                </button>
              </div>
            </div>
          )}

          {/* Markdown Editor */}
          {planContent && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Execution Plan
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Review and edit the plan using markdown formatting
                  </p>
                </div>
                <button
                  onClick={handleRegenerate}
                  disabled={state.isLoading}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
                >
                  <span className="mr-2">🔄</span>
                  Regenerate
                </button>
              </div>
              
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden shadow-sm">
                <MDEditor
                  value={planContent}
                  onChange={(value) => setPlanContent(value || '')}
                  preview="edit"
                  height={500}
                  data-color-mode={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
                />
              </div>
              
              <div className="bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-400 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <span className="text-orange-500 text-lg flex-shrink-0">💡</span>
                  <div className="text-sm text-orange-800 dark:text-orange-200">
                    <p className="font-medium mb-2">Plan Quality Tips:</p>
                    <ul className="space-y-1 text-sm">
                      <li>• Break down complex tasks into clear, sequential steps</li>
                      <li>• Include specific technologies, tools, and approaches</li>
                      <li>• Consider dependencies between different components</li>
                      <li>• Specify testing and validation approaches</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions Footer */}
        {planContent && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-6 flex-shrink-0">
            <div className="flex justify-end">
              <button
                onClick={handleSaveAndProceed}
                disabled={!planContent.trim()}
                className="inline-flex items-center px-6 py-3 text-base font-semibold text-white bg-orange-600 border border-transparent rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
              >
                <span className="mr-2">🚀</span>
                Save Plan & Generate Subtasks
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}