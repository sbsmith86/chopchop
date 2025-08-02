import React, { useEffect, useState } from 'react';
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
      className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4 ${
        subtask.isTooBig ? 'border-l-4 border-l-yellow-500' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-3">
              <input
                type="text"
                value={editedSubtask.title}
                onChange={(e) => setEditedSubtask({ ...editedSubtask, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <textarea
                value={editedSubtask.description}
                onChange={(e) => setEditedSubtask({ ...editedSubtask, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleSave}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="px-3 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center">
                <button
                  {...attributes}
                  {...listeners}
                  className="mr-2 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
                >
                  ⋮⋮
                </button>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  {subtask.title}
                </h3>
                {subtask.isTooBig && (
                  <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                    Too Big
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {subtask.description}
              </p>
              
              {subtask.acceptanceCriteria.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Acceptance Criteria:
                  </p>
                  <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    {subtask.acceptanceCriteria.map((criteria, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{criteria}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {subtask.guardrails.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Guardrails:
                  </p>
                  <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    {subtask.guardrails.map((guardrail, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2">⚠️</span>
                        <span>{guardrail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
        
        {!isEditing && (
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={() => setIsEditing(true)}
              className="text-gray-400 hover:text-gray-600 text-sm"
            >
              ✏️
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

  // Auto-generate subtasks when entering this step
  useEffect(() => {
    if (state.executionPlan && state.config && !hasGenerated && state.subtasks.length === 0) {
      generateSubtasks();
    }
  }, [state.executionPlan, state.config, hasGenerated, state.subtasks.length]);

  /**
   * Generate subtasks using OpenAI
   */
  const generateSubtasks = async () => {
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
  };

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
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Generating subtasks...</p>
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
            📋 Subtasks
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Review, split, and reorder atomic subtasks with drag-and-drop functionality.
          </p>
        </div>

        <div className="px-6 py-4">
          {/* Plan Context */}
          {state.executionPlan && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-750 rounded-md">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Based on Execution Plan:
              </h3>
              <div className="text-xs text-gray-600 dark:text-gray-400 max-h-20 overflow-y-auto">
                {state.executionPlan.content.substring(0, 200)}...
              </div>
            </div>
          )}

          {/* No Subtasks Generated */}
          {!state.isLoading && state.subtasks.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                No subtasks generated yet.
              </p>
              <button
                onClick={generateSubtasks}
                disabled={!state.executionPlan || !state.config}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Generate Subtasks
              </button>
            </div>
          )}

          {/* Subtasks List */}
          {state.subtasks.length > 0 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Subtasks ({state.subtasks.length})
                </h3>
                <div className="flex items-center space-x-4">
                  {state.subtasks.some(task => task.isTooBig) && (
                    <span className="text-xs text-yellow-600 dark:text-yellow-400">
                      ⚠️ {state.subtasks.filter(task => task.isTooBig).length} tasks may be too large
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setHasGenerated(false);
                      generateSubtasks();
                    }}
                    disabled={state.isLoading}
                    className="px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded hover:bg-gray-50 dark:hover:bg-gray-500"
                  >
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
                  <div className="space-y-3">
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

              <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
                <p className="mb-1">
                  💡 Drag tasks by the ⋮⋮ handle to reorder them
                </p>
                <p className="mb-1">
                  ✏️ Click the edit button to modify task details
                </p>
                <p>
                  ⚠️ Yellow warning indicates tasks that may be too large and should be split
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          {state.subtasks.length > 0 && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleProceed}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Proceed to Approval
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}