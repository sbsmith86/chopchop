import React, { useEffect, useState, useCallback } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { useAppContext } from '../context/AppContext';
import { ExecutionPlan, PlanStep } from '../types';
import { OpenAIClient } from '../utils/openai';
import { PlanStepManager } from './PlanStepManager';
import { parseMarkdownToPlanSteps, planStepsToMarkdown } from '../utils/planParser';

/**
 * Plan review editor component
 * Allows users to review and edit the generated execution plan
 */
export const PlanReviewEditor: React.FC = () => {
  const { state, dispatch, setError, setLoading, nextStep, saveCurrentPlan } = useAppContext();
  const [planContent, setPlanContent] = useState('');
  const [planSteps, setPlanSteps] = useState<PlanStep[]>([]);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'markdown' | 'steps'>('markdown');

  /**
   * Handle plan steps changes and sync with markdown content
   */
  const handlePlanStepsChange = (updatedSteps: PlanStep[]) => {
    setPlanSteps(updatedSteps);
    const updatedContent = planStepsToMarkdown(updatedSteps, planContent);
    setPlanContent(updatedContent);
  };

  /**
   * Parse markdown content to plan steps when content changes
   */
  const handleContentChange = (value: string | undefined) => {
    const newContent = value || '';
    setPlanContent(newContent);
    
    // Parse steps from content if in markdown mode
    if (viewMode === 'markdown') {
      const parsedSteps = parseMarkdownToPlanSteps(newContent);
      setPlanSteps(parsedSteps);
    }
  };

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
      
      // Initialize plan steps from the generated plan
      if (executionPlan.steps && executionPlan.steps.length > 0) {
        setPlanSteps(executionPlan.steps);
      } else {
        const parsedSteps = parseMarkdownToPlanSteps(executionPlan.content);
        setPlanSteps(parsedSteps);
      }
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
      // Initialize plan steps from execution plan or parse from content
      if (state.executionPlan.steps && state.executionPlan.steps.length > 0) {
        setPlanSteps(state.executionPlan.steps);
      } else {
        const parsedSteps = parseMarkdownToPlanSteps(state.executionPlan.content);
        setPlanSteps(parsedSteps);
      }
    }
  }, [state.issue, state.config, hasGenerated, state.executionPlan, generatePlan]);

  /**
   * Save the edited plan and proceed
   */
  const handleSaveAndProceed = async () => {
    if (!planContent.trim()) {
      setError('Please enter or generate an execution plan before proceeding');
      return;
    }

    setIsSaving(true);

    try {
      // Create the updated execution plan with proper structure
      const updatedPlan: ExecutionPlan = {
        id: state.executionPlan?.id || Date.now().toString(),
        title: state.executionPlan?.title || `Execution Plan: ${state.issue?.title}`,
        description: state.executionPlan?.description || 'User-edited execution plan',
        content: planContent,
        steps: planSteps,
        createdAt: state.executionPlan?.createdAt || new Date(),
        updatedAt: new Date(),
        instructions: state.executionPlan?.instructions // Preserve instructions
      };

      // Save the plan to state
      dispatch({ type: 'SET_EXECUTION_PLAN', payload: updatedPlan });

      // Save to local storage
      await saveCurrentPlan(updatedPlan.title, updatedPlan.description);

      // Clear any existing subtasks since we're updating the plan
      dispatch({ type: 'SET_SUBTASKS', payload: [] });

      setError(null);

      nextStep();
    } catch (error) {
      console.error('Failed to save plan:', error);
      setError('Failed to save execution plan');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Save plan without proceeding
   */
  const handleSavePlan = async () => {
    if (!planContent.trim()) {
      setError('Please enter or generate an execution plan before saving');
      return;
    }

    setIsSaving(true);

    try {
      // Create the updated execution plan with proper structure
      const updatedPlan: ExecutionPlan = {
        id: state.executionPlan?.id || Date.now().toString(),
        title: state.executionPlan?.title || `Execution Plan: ${state.issue?.title}`,
        description: state.executionPlan?.description || 'User-edited execution plan',
        content: planContent,
        steps: planSteps,
        createdAt: state.executionPlan?.createdAt || new Date(),
        updatedAt: new Date(),
        instructions: state.executionPlan?.instructions // Preserve instructions
      };

      // Save the plan to state
      dispatch({ type: 'SET_EXECUTION_PLAN', payload: updatedPlan });

      // Save to local storage
      await saveCurrentPlan(updatedPlan.title, updatedPlan.description);

      setError(null);
    } catch (error) {
      console.error('Failed to save plan:', error);
      setError('Failed to save execution plan');
    } finally {
      setIsSaving(false);
    }
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
        <div className="h-full flex flex-col">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
              <p className="text-gray-700 text-lg font-medium mb-2">Generating execution plan...</p>
              <p className="text-gray-500 text-sm">Our AI is creating a detailed implementation strategy</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="px-6 py-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
              📋
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Plan Review & Editing
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Review and refine the AI-generated execution plan before breaking it down into actionable subtasks.
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Issue Context */}
          {state.issue && (
            <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600">📋</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Issue Context
                  </h3>
                  <p className="text-base font-medium text-gray-700 mb-2">
                    {state.issue.title}
                  </p>
                  {state.clarificationQuestions.filter(q => q.answer).length > 0 && (
                    <div className="mt-3 p-3 bg-blue-100 rounded-lg">
                      <p className="text-sm text-blue-700 flex items-center">
                        <span className="mr-2">💡</span>
                        Enhanced with insights from {state.clarificationQuestions.filter(q => q.answer).length} clarification answers
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* No Plan Generated */}
          {!state.isLoading && !planContent && (
            <div className="text-center py-16">
              <div className="flex flex-col items-center space-y-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center">
                  <span className="text-3xl">🤖</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Ready to Generate Plan
                  </h3>
                  <p className="text-gray-600 text-base mb-6 max-w-md mx-auto">
                    Our AI will create a comprehensive execution plan based on your issue and clarifications.
                  </p>
                </div>
                <button
                  onClick={generatePlan}
                  disabled={!state.issue || !state.config}
                  className="inline-flex items-center px-6 py-3 text-base font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 border border-transparent rounded-xl hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all"
                >
                  <span className="mr-2">✨</span>
                  Generate Execution Plan
                </button>
              </div>
            </div>
          )}

          {/* Plan Editor */}
          {planContent && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Execution Plan
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Review and edit the plan using markdown or structured steps
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  {/* View mode toggle */}
                  <div className="flex items-center bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('markdown')}
                      className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
                        viewMode === 'markdown'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      📝 Markdown
                    </button>
                    <button
                      onClick={() => setViewMode('steps')}
                      className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
                        viewMode === 'steps'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      📋 Steps
                    </button>
                  </div>
                  <button
                    onClick={handleRegenerate}
                    disabled={state.isLoading}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
                  >
                    <span className="mr-2">🔄</span>
                    Regenerate
                  </button>
                </div>
              </div>

              {/* Markdown Editor */}
              {viewMode === 'markdown' && (
                <div className="border border-gray-300 rounded-xl overflow-hidden shadow-sm">
                  <MDEditor
                    value={planContent}
                    onChange={handleContentChange}
                    preview="edit"
                    height={500}
                    data-color-mode="light"
                  />
                </div>
              )}

              {/* Plan Steps Manager */}
              {viewMode === 'steps' && (
                <div className="border border-gray-300 rounded-xl p-6 shadow-sm">
                  <PlanStepManager 
                    steps={planSteps}
                    onStepsChange={handlePlanStepsChange}
                  />
                </div>
              )}

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600">💡</span>
                  </div>
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-2">Plan Quality Tips:</p>
                    <ul className="space-y-1 text-sm">
                      <li>• Break down complex tasks into clear, sequential steps</li>
                      <li>• Include specific technologies, tools, and approaches</li>
                      <li>• Consider dependencies between different components</li>
                      <li>• Specify testing and validation approaches</li>
                      <li>• Use "Steps" view to control granularity and mark grouped units</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions Footer */}
        {planContent && (
          <div className="border-t border-gray-100 p-6 bg-gray-50 flex-shrink-0">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Ready to break down into subtasks
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleSavePlan}
                  disabled={!planContent.trim() || isSaving}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  {isSaving ? (
                    <span className="mr-2">⏳</span>
                  ) : (
                    <span className="mr-2">💾</span>
                  )}
                  {isSaving ? 'Saving...' : 'Save Plan'}
                </button>
                <button
                  onClick={handleSaveAndProceed}
                  disabled={!planContent.trim() || isSaving}
                  className="inline-flex items-center px-6 py-3 text-base font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 border border-transparent rounded-xl hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all"
                >
                  <span className="mr-2">🚀</span>
                  Save & Generate Subtasks
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};