import React, { useEffect, useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAppContext } from '../context/AppContext';
import { Subtask } from '../types';
import { OpenAIClient } from '../utils/openai';

/**
 * Draggable subtask card component
 */
function SubtaskCard({ subtask, onUpdate }: { subtask: Subtask; onUpdate: (subtask: Subtask) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedSubtask, setEditedSubtask] = useState(subtask);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: subtask.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleSave = () => {
    onUpdate(editedSubtask);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedSubtask(subtask);
    setIsEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border-2 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 ${
        subtask.isTooBig
          ? 'border-l-4 border-l-orange-400 bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
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
                <button
                  {...attributes}
                  {...listeners}
                  className="mt-1 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing transition-all"
                  title="Drag to reorder"
                >
                  <span className="text-sm">⋮⋮</span>
                </button>
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
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
              title="Edit task"
            >
              <span className="text-sm">✏️</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Subtask list panel component
 * Displays and manages subtasks with drag-and-drop functionality
 */
export const SubtaskListPanel: React.FC = () => {
  const { state, dispatch, setStep, setError, setLoading, nextStep } = useAppContext();
  const [hasGenerated, setHasGenerated] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  /**
   * Generate subtasks using OpenAI
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

      // Show helpful feedback about "too big" tasks
      const tooBigCount = subtasks.filter(task => task.isTooBig).length;
      if (tooBigCount > 0) {
        setError(`Generated ${subtasks.length} subtasks. ${tooBigCount} tasks are flagged as potentially too large and may benefit from splitting.`);
      } else {
        setError(null); // Clear any previous errors
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
   * Handle drag end event for reordering
   */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = state.subtasks.findIndex(task => task.id === active.id);
      const newIndex = state.subtasks.findIndex(task => task.id === over.id);

      const reorderedSubtasks = arrayMove(state.subtasks, oldIndex, newIndex).map((task, index) => ({
        ...task,
        order: index,
      }));

      dispatch({ type: 'REORDER_SUBTASKS', payload: reorderedSubtasks });
    }
  };

  /**
   * Update a subtask
   */
  const handleUpdateSubtask = (updatedSubtask: Subtask) => {
    dispatch({ type: 'UPDATE_SUBTASK', payload: updatedSubtask });
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
    setStep(5); // Move to Approval step
  };

  if (state.isLoading) {
    return (
      <div className="h-full">
        <div className="h-full flex flex-col">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-6"></div>
              <p className="text-gray-700 text-lg font-medium mb-2">Generating subtasks...</p>
              <p className="text-gray-500 text-sm">Breaking down your plan into manageable, atomic tasks</p>
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
              📊
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Subtask Management
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Review, edit, and organize atomic subtasks with intuitive drag-and-drop functionality.
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
                  Ready to Generate Subtasks
                </h3>
                <p className="text-gray-600 text-base mb-6 max-w-md mx-auto">
                  Break down your execution plan into atomic, actionable subtasks that can be completed individually.
                </p>
                <button
                  onClick={generateSubtasks}
                  disabled={!state.executionPlan || !state.config}
                  className="inline-flex items-center px-6 py-3 text-base font-semibold text-white bg-gradient-to-r from-orange-500 to-red-600 border border-transparent rounded-xl hover:from-orange-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all"
                >
                  <span className="mr-2">✨</span>
                  Generate Subtasks
                </button>
              </div>
            </div>
          )}

          {/* Subtasks List */}
          {state.subtasks.length > 0 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Subtasks ({state.subtasks.length})
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Drag to reorder • Click edit to modify • Review for completeness
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
                    Regenerate
                  </button>
                </div>
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={state.subtasks.map(task => task.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-4">
                    {state.subtasks.map((subtask) => (
                      <SubtaskCard
                        key={subtask.id}
                        subtask={subtask}
                        onUpdate={handleUpdateSubtask}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              <div className="bg-gradient-to-r from-orange-50 to-red-50 border-l-4 border-orange-400 rounded-xl p-4 mt-6">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-orange-600">💡</span>
                  </div>
                  <div className="text-sm text-orange-800">
                    <p className="font-medium mb-2">Subtask Management Tips:</p>
                    <ul className="space-y-1 text-sm">
                      <li>• <span className="font-medium">⋮⋮</span> Drag tasks by the handle to reorder them</li>
                      <li>• <span className="font-medium">✏️</span> Click the edit button to modify task details</li>
                      <li>• <span className="font-medium">⚠️</span> Orange warning indicates tasks that may be too large and should be split</li>
                      <li>• Each task should be completable in under 2 hours for optimal workflow</li>
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
                Ready for final review and approval
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
}