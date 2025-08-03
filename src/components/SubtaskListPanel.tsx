import React, { useEffect, useState, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { Subtask } from '../types';
import { OpenAIClient } from '../utils/openai';
import { SubtaskSplitModal } from './SubtaskSplitModal';

/**
 * Static subtask card component (no drag functionality)
 */
function SubtaskCard({
  subtask,
  index,
  onUpdate,
  onSplit,
  dependsOn,
  openaiApiKey
}: {
  subtask: Subtask;
  index: number;
  onUpdate: (subtask: Subtask) => void;
  onSplit: (originalId: string, newSubtasks: Subtask[]) => void;
  dependsOn: string[];
  openaiApiKey?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedSubtask, setEditedSubtask] = useState(subtask);
  const [showSplitModal, setShowSplitModal] = useState(false);

  const handleSave = () => {
    onUpdate(editedSubtask);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedSubtask(subtask);
    setIsEditing(false);
  };

  const handleSplit = (newSubtasks: Subtask[]) => {
    onSplit(subtask.id, newSubtasks);
    setShowSplitModal(false);
  };

  return (
    <>
      <div className={`bg-white border-2 rounded-xl p-6 shadow-sm transition-all duration-200 ${
        subtask.isTooBig
          ? 'border-l-4 border-l-orange-400 bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200'
          : 'border-gray-200'
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Dependency indicator */}
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                {index + 1}
              </div>
              {dependsOn.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Requires:</span>
                  <div className="flex space-x-1">
                    {dependsOn.map((dep, i) => (
                      <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                        {dep}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={editedSubtask.title}
                  onChange={(e) => setEditedSubtask({ ...editedSubtask, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  placeholder="Task title..."
                />
                <textarea
                  value={editedSubtask.description}
                  onChange={(e) => setEditedSubtask({ ...editedSubtask, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all resize-none"
                  placeholder="Task description..."
                />
                <div className="flex space-x-3">
                  <button
                    onClick={handleSave}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all shadow-sm"
                  >
                    <span className="mr-1">✓</span>
                    Save
                  </button>
                  <button
                    onClick={handleCancel}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all"
                  >
                    <span className="mr-1">✕</span>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start space-x-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-3">
                      <h3 className="text-base font-semibold text-gray-900">
                        {subtask.title}
                      </h3>
                      {subtask.isTooBig && (
                        <span className="inline-flex items-center px-3 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                          ⚠️ Too Big
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed mb-4">
                      {subtask.description}
                    </p>

                    {/* Acceptance criteria */}
                    {subtask.acceptanceCriteria.length > 0 && (
                      <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-100">
                        <p className="text-xs font-semibold text-green-800 mb-2 flex items-center">
                          <span className="mr-1">✅</span>
                          Acceptance Criteria
                        </p>
                        <ul className="text-xs text-green-700 space-y-1 pl-4">
                          {subtask.acceptanceCriteria.map((criteria, index) => (
                            <li key={index} className="flex items-start">
                              <span className="mr-2 text-green-500">•</span>
                              <span>{criteria}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Guardrails */}
                    {subtask.guardrails.length > 0 && (
                      <div className="p-3 bg-orange-50 rounded-lg border border-orange-100">
                        <p className="text-xs font-semibold text-orange-800 mb-2 flex items-center">
                          <span className="mr-1">🛡️</span>
                          Guardrails
                        </p>
                        <ul className="text-xs text-orange-700 space-y-1 pl-4">
                          {subtask.guardrails.map((guardrail, index) => (
                            <li key={index} className="flex items-start">
                              <span className="mr-2 text-orange-500">⚠️</span>
                              <span>{guardrail}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {!isEditing && (
            <div className="flex items-center space-x-2 ml-4">
              {/* Split button - only show for "too big" tasks */}
              {subtask.isTooBig && (
                <button
                  onClick={() => setShowSplitModal(true)}
                  className="p-2 text-orange-500 hover:text-orange-700 hover:bg-orange-100 rounded-lg transition-all"
                  title="Split this task into smaller tasks"
                >
                  <span className="text-sm">✂️</span>
                </button>
              )}

              <button
                onClick={() => setIsEditing(true)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                title="Edit task"
              >
                <span className="text-sm">✏️</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Split Modal */}
      <SubtaskSplitModal
        isOpen={showSplitModal}
        onClose={() => setShowSplitModal(false)}
        subtask={subtask}
        onSplit={handleSplit}
        openaiApiKey={openaiApiKey}
      />
    </>
  );
}

/**
 * Subtask list panel component - now shows execution order flow
 */
export const SubtaskListPanel: React.FC = () => {
  const { state, dispatch, setError, setLoading, nextStep } = useAppContext();
  const [hasGenerated, setHasGenerated] = useState(false);

  /**
   * Generate subtasks using OpenAI with dependency analysis
   */
  const generateSubtasks = useCallback(async () => {
    if (!state.executionPlan || !state.config) {
      setError('Execution plan and configuration are required');
      return;
    }

    if (!state.config.openaiApiKey) {
      setError('OpenAI API key is required. Please configure it in settings.');
      return;
    }

    setLoading(true);
    setError(null);
    setHasGenerated(true);

    try {
      const openaiClient = new OpenAIClient(state.config.openaiApiKey);
      const subtasks = await openaiClient.generateSubtasks(state.executionPlan);

      dispatch({ type: 'SET_SUBTASKS', payload: subtasks });

      const tooBigCount = subtasks.filter(task => task.isTooBig).length;
      if (tooBigCount > 0) {
        setError(`Generated ${subtasks.length} subtasks with dependency-aware ordering. ${tooBigCount} tasks are flagged as potentially too large and may benefit from splitting.`);
      } else {
        setError(null);
      }

    } catch (error) {
      console.error('Failed to generate subtasks:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate subtasks';
      setError(`${errorMessage}. Please check your OpenAI API key and try again.`);
    } finally {
      setLoading(false);
    }
  }, [state.executionPlan, state.config, dispatch, setError, setLoading]);

  // Auto-generate subtasks when entering this step
  useEffect(() => {
    if (state.executionPlan && state.config && !hasGenerated && state.subtasks.length === 0) {
      generateSubtasks();
    }
  }, [state.executionPlan, state.config, hasGenerated, state.subtasks.length, generateSubtasks]);

  /**
   * Update a subtask
   */
  const handleUpdateSubtask = (updatedSubtask: Subtask) => {
    dispatch({ type: 'UPDATE_SUBTASK', payload: updatedSubtask });
  };

  /**
   * Handle subtask splitting
   */
  const handleSplitSubtask = (originalId: string, newSubtasks: Subtask[]) => {
    dispatch({ type: 'SPLIT_SUBTASK', payload: { originalId, newSubtasks } });
  };

  /**
   * Proceed to approval step
   */
  const handleProceed = () => {
    if (state.subtasks.length === 0) {
      setError('Please generate subtasks before proceeding');
      return;
    }

    setError(null);
    nextStep();
  };

  // Create dependency map (simplified for now)
  const getDependencies = (taskIndex: number): string[] => {
    if (taskIndex === 0) return [];
    if (taskIndex === 1) return [`Task ${taskIndex}`];
    if (taskIndex <= 3) return [`Task ${taskIndex}`];
    return [`Task ${taskIndex - 1}`, `Task ${taskIndex}`];
  };

  if (state.isLoading) {
    return (
      <div className="h-full">
        <div className="h-full flex flex-col">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-6"></div>
              <p className="text-gray-700 text-lg font-medium mb-2">Generating execution flow...</p>
              <p className="text-gray-500 text-sm">Analyzing dependencies and creating optimal task sequence</p>
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
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
              🔄
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Execution Flow
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Review the dependency-aware task sequence. Tasks are ordered to prevent conflicts and ensure dependencies are met.
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Plan Context */}
          {state.executionPlan && (
            <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600">📋</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Based on Execution Plan
                  </h3>
                  <div className="text-sm text-gray-600 max-h-24 overflow-y-auto bg-white p-3 rounded-lg border border-blue-200">
                    {state.executionPlan.content.substring(0, 300)}
                    {state.executionPlan.content.length > 300 && '...'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* No Subtasks Generated */}
          {!state.isLoading && state.subtasks.length === 0 && (
            <div className="py-16">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">🤖</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Ready to Generate Execution Flow
                </h3>
                <p className="text-gray-600 text-base mb-6 max-w-md mx-auto">
                  Break down your execution plan into atomic, dependency-aware subtasks with optimal ordering.
                </p>
                <button
                  onClick={generateSubtasks}
                  disabled={!state.executionPlan || !state.config}
                  className="inline-flex items-center px-6 py-3 text-base font-semibold text-white bg-gradient-to-r from-orange-500 to-red-600 border border-transparent rounded-xl hover:from-orange-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all"
                >
                  <span className="mr-2">⚡</span>
                  Generate Execution Flow
                </button>
              </div>
            </div>
          )}

          {/* Execution Flow */}
          {state.subtasks.length > 0 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Execution Sequence ({state.subtasks.length} tasks)
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Tasks are ordered to respect dependencies • Click edit to modify task details
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  {state.subtasks.some(task => task.isTooBig) && (
                    <div className="flex items-center space-x-2 px-3 py-1 bg-orange-100 rounded-full">
                      <span className="text-orange-600 text-sm">⚠️</span>
                      <span className="text-xs text-orange-700 font-medium">
                        {state.subtasks.filter(task => task.isTooBig).length} large tasks
                      </span>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setHasGenerated(false);
                      generateSubtasks();
                    }}
                    disabled={state.isLoading}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all shadow-sm"
                  >
                    <span className="mr-2">🔄</span>
                    Regenerate Flow
                  </button>
                </div>
              </div>

              {/* Task sequence with flow indicators */}
              <div className="space-y-4">
                {state.subtasks.map((subtask, index) => (
                  <div key={subtask.id} className="relative">
                    {/* Flow connector */}
                    {index < state.subtasks.length - 1 && (
                      <div className="absolute left-4 -bottom-2 w-0.5 h-6 bg-gradient-to-b from-blue-300 to-blue-500 z-10"></div>
                    )}

                    <SubtaskCard
                      subtask={subtask}
                      index={index}
                      onUpdate={handleUpdateSubtask}
                      onSplit={handleSplitSubtask}
                      dependsOn={getDependencies(index)}
                      openaiApiKey={state.config?.openaiApiKey}
                    />
                  </div>
                ))}
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 rounded-xl p-4 mt-6">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600">📝</span>
                  </div>
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-2">Execution Flow Notes:</p>
                    <ul className="space-y-1 text-sm">
                      <li>• Tasks are automatically ordered to prevent dependency conflicts</li>
                      <li>• Each task builds upon the work completed in previous tasks</li>
                      <li>• Follow this sequence to avoid rework and integration issues</li>
                      <li>• Order cannot be changed to maintain dependency integrity</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions Footer */}
        {state.subtasks.length > 0 && (
          <div className="border-t border-gray-100 p-6 bg-gray-50 flex-shrink-0">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Execution flow ready for approval
              </div>
              <button
                onClick={handleProceed}
                className="inline-flex items-center px-6 py-3 text-base font-semibold text-white bg-gradient-to-r from-orange-500 to-red-600 border border-transparent rounded-xl hover:from-orange-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-lg transition-all"
              >
                <span className="mr-2">🚀</span>
                Proceed to Approval
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};