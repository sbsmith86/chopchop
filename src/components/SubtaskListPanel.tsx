import { useEffect, useState, useCallback } from 'react';
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
      className={`bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-lg p-6 shadow-sm hover:shadow-md transition-all ${
        subtask.isTooBig ? 'border-l-4 border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/10' : ''
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
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-base font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white transition-colors"
                placeholder="Task title..."
              />
              <textarea
                value={editedSubtask.description}
                onChange={(e) => setEditedSubtask({ ...editedSubtask, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white transition-colors resize-none"
                placeholder="Task description..."
              />
              <div className="flex space-x-3">
                <button
                  onClick={handleSave}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                >
                  <span className="mr-1">✓</span>
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
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
                  className="mt-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing transition-colors"
                  title="Drag to reorder"
                >
                  <span className="text-lg">⋮⋮</span>
                </button>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                      {subtask.title}
                    </h3>
                    {subtask.isTooBig && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 rounded-full">
                        ⚠️ Too Big
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                    {subtask.description}
                  </p>
                  
                  {subtask.acceptanceCriteria.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                        <span className="mr-1">✅</span>
                        Acceptance Criteria:
                      </p>
                      <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 pl-4">
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
                    <div className="mb-2">
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                        <span className="mr-1">🛡️</span>
                        Guardrails:
                      </p>
                      <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 pl-4">
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
              className="inline-flex items-center p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
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
 * Subtask list panel with drag-and-drop functionality
 */
export default function SubtaskListPanel() {
  const { state, dispatch, setStep, setError, setLoading } = useAppContext();
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

    setLoading(true);
    setError(null);
    setHasGenerated(true);

    try {
      const openaiClient = new OpenAIClient(state.config.openaiApiKey);
      const subtasks = await openaiClient.generateSubtasks(state.executionPlan);
      
      dispatch({ type: 'SET_SUBTASKS', payload: subtasks });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to generate subtasks');
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
      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-8 py-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-6"></div>
            <p className="text-gray-600 dark:text-gray-400 text-lg">Generating subtasks...</p>
            <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">Breaking down your plan into atomic tasks</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 px-8 py-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">📋</span>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Subtasks Management
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Review, edit, and reorder atomic subtasks with drag-and-drop functionality.
              </p>
            </div>
          </div>
        </div>

        <div className="px-8 py-8">
          {/* Plan Context */}
          {state.executionPlan && (
            <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-750 rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="flex items-start space-x-3">
                <span className="text-orange-500 text-lg flex-shrink-0">📋</span>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Based on Execution Plan:
                  </h3>
                  <div className="text-sm text-gray-600 dark:text-gray-400 max-h-24 overflow-y-auto bg-white dark:bg-gray-700 p-3 rounded border">
                    {state.executionPlan.content.substring(0, 300)}
                    {state.executionPlan.content.length > 300 && '...'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* No Subtasks Generated */}
          {!state.isLoading && state.subtasks.length === 0 && (
            <div className="py-12">
              <div className="text-center">
                <span className="text-6xl">🤖</span>
                <p className="text-gray-600 dark:text-gray-400 text-lg mt-4 mb-2">
                  No subtasks generated yet.
                </p>
                <p className="text-gray-500 dark:text-gray-500 text-sm mb-6">
                  Generate atomic, actionable subtasks from your execution plan.
                </p>
                <button
                  onClick={generateSubtasks}
                  disabled={!state.executionPlan || !state.config}
                  className="inline-flex items-center px-6 py-3 text-base font-semibold text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
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
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Subtasks ({state.subtasks.length})
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Drag to reorder • Click edit to modify • Review for completeness
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  {state.subtasks.some(task => task.isTooBig) && (
                    <div className="flex items-center space-x-2 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
                      <span className="text-yellow-600 dark:text-yellow-400 text-sm">⚠️</span>
                      <span className="text-xs text-yellow-700 dark:text-yellow-300 font-medium">
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
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
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

              <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 rounded-lg p-4 mt-6">
                <div className="flex items-start space-x-3">
                  <span className="text-blue-500 text-lg flex-shrink-0">💡</span>
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-medium mb-2">Subtask Management Tips:</p>
                    <ul className="space-y-1 text-sm">
                      <li>• <span className="font-medium">⋮⋮</span> Drag tasks by the handle to reorder them</li>
                      <li>• <span className="font-medium">✏️</span> Click the edit button to modify task details</li>
                      <li>• <span className="font-medium">⚠️</span> Yellow warning indicates tasks that may be too large and should be split</li>
                      <li>• Each task should be completable in under 2 hours</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          {state.subtasks.length > 0 && (
            <div className="mt-8 flex justify-end">
              <button
                onClick={handleProceed}
                className="inline-flex items-center px-6 py-3 text-base font-semibold text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm transition-colors"
              >
                <span className="mr-2">🚀</span>
                Proceed to Approval
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}