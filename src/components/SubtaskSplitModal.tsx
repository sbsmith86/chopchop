import React, { useState, useCallback } from 'react';
import { Subtask } from '../types';
import { OpenAIClient } from '../utils/openai';

interface SubtaskSplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtask: Subtask;
  onSplit: (newSubtasks: Subtask[]) => void;
  openaiApiKey?: string;
}

export const SubtaskSplitModal: React.FC<SubtaskSplitModalProps> = ({
  isOpen,
  onClose,
  subtask,
  onSplit,
  openaiApiKey
}) => {
  const [splitTasks, setSplitTasks] = useState<Omit<Subtask, 'id' | 'order'>[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSplitSuggestions = useCallback(async () => {
    if (!openaiApiKey) {
      setError('OpenAI API key is required for AI-assisted splitting');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const openaiClient = new OpenAIClient(openaiApiKey);
      const suggestions = await openaiClient.splitSubtask(subtask);
      setSplitTasks(suggestions);
    } catch (error) {
      console.error('Failed to generate split suggestions:', error);
      setError('Failed to generate suggestions. You can manually create split tasks below.');
      setSplitTasks([
        {
          title: `${subtask.title} - Part 1`,
          description:
            'Before starting, review the entire codebase and README.md Technical Design Document. Then proceed with the first part of this split task.',
          acceptanceCriteria: [
            'Reviewed entire codebase and README.md Technical Design Document',
            ...subtask.acceptanceCriteria.slice(0, Math.ceil(subtask.acceptanceCriteria.length / 2))
          ],
          guardrails: [
            ...subtask.guardrails,
            'Follow patterns established in codebase review and Technical Design Document'
          ],
          estimatedHours: Math.ceil(subtask.estimatedHours / 2),
          isTooBig: false,
          tags: subtask.tags,
          dependsOn: subtask.dependsOn,
          prerequisiteTaskIds: subtask.prerequisiteTaskIds,
          affectedFiles: subtask.affectedFiles
        },
        {
          title: `${subtask.title} - Part 2`,
          description:
            'Continue the task, ensuring all work follows the architectural patterns and requirements identified in the README.md Technical Design Document.',
          acceptanceCriteria: subtask.acceptanceCriteria.slice(Math.ceil(subtask.acceptanceCriteria.length / 2)),
          guardrails: [
            ...subtask.guardrails,
            'Adhere to architecture guidelines from README.md Technical Design Document'
          ],
          estimatedHours: Math.floor(subtask.estimatedHours / 2),
          isTooBig: false,
          tags: subtask.tags,
          dependsOn: subtask.dependsOn,
          prerequisiteTaskIds: subtask.prerequisiteTaskIds,
          affectedFiles: subtask.affectedFiles
        }
      ]);
    } finally {
      setIsGenerating(false);
    }
  }, [subtask, openaiApiKey]);

  const addSplitTask = () => {
    setSplitTasks(prev => [...prev, {
      title: '',
      description: '',
      acceptanceCriteria: ['Task completed successfully'],
      guardrails: subtask.guardrails,
      estimatedHours: 1,
      isTooBig: false,
      tags: subtask.tags,
      dependsOn: subtask.dependsOn,
      prerequisiteTaskIds: subtask.prerequisiteTaskIds,
      affectedFiles: []
    }]);
  };

  const updateSplitTask = (index: number, field: string, value: any) => {
    setSplitTasks(prev => prev.map((task, i) =>
      i === index ? { ...task, [field]: value } : task
    ));
  };

  const removeSplitTask = (index: number) => {
    setSplitTasks(prev => prev.filter((_, i) => i !== index));
  };

  const handleSplit = () => {
    if (splitTasks.length < 2) {
      setError('Please create at least 2 split tasks');
      return;
    }

    if (splitTasks.some(task => !task.title.trim())) {
      setError('All split tasks must have titles');
      return;
    }

    const finalSubtasks: Subtask[] = splitTasks.map((task, index) => ({
      ...task,
      id: `${subtask.id}-split-${index + 1}`,
      order: subtask.order + index
    }));

    onSplit(finalSubtasks);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Split Large Task</h2>
            <p className="text-sm text-gray-600 mt-1">Break down this task into smaller, more manageable pieces</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <span className="text-gray-500">✕</span>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl">
            <h3 className="font-semibold text-orange-900 mb-2 flex items-center">
              <span className="mr-2">⚠️</span>
              Original Task (Too Big)
            </h3>
            <p className="text-sm text-orange-800 font-medium">{subtask.title}</p>
            <p className="text-xs text-orange-700 mt-1">{subtask.description}</p>
            <div className="text-xs text-orange-600 mt-2">
              <span className="font-medium">Estimated Hours:</span> {subtask.estimatedHours} •
              <span className="font-medium ml-2">Acceptance Criteria:</span> {subtask.acceptanceCriteria.length}
            </div>
          </div>

          {openaiApiKey && splitTasks.length === 0 && (
            <div className="mb-6 text-center">
              <button
                onClick={generateSplitSuggestions}
                disabled={isGenerating}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-lg"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Generating Split Suggestions...
                  </>
                ) : (
                  <>
                    <span className="mr-2">🤖</span>
                    Generate AI Split Suggestions
                  </>
                )}
              </button>
              <p className="text-sm text-gray-500 mt-2">Or manually create split tasks below</p>
            </div>
          )}

          {splitTasks.length === 0 && (
            <div className="text-center">
              <button
                onClick={addSplitTask}
                className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              >
                <span className="mr-2">➕</span>
                Add Split Task Manually
              </button>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {splitTasks.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Split Tasks ({splitTasks.length})</h3>
                <button
                  onClick={addSplitTask}
                  className="inline-flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  <span className="mr-1">➕</span>
                  Add Task
                </button>
              </div>

              {splitTasks.map((task, index) => (
                <div key={index} className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                        {index + 1}
                      </span>
                      <span className="text-sm font-medium text-gray-700">Split Task {index + 1}</span>
                    </div>
                    {splitTasks.length > 2 && (
                      <button
                        onClick={() => removeSplitTask(index)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <input
                      type="text"
                      value={task.title}
                      onChange={(e) => updateSplitTask(index, 'title', e.target.value)}
                      placeholder="Task title..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <textarea
                      value={task.description}
                      onChange={(e) => updateSplitTask(index, 'description', e.target.value)}
                      placeholder="Task description..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />

                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <label className="text-xs text-gray-600">Hours:</label>
                        <input
                          type="number"
                          min="1"
                          max="8"
                          value={task.estimatedHours}
                          onChange={(e) => updateSplitTask(index, 'estimatedHours', parseInt(e.target.value) || 1)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div className="text-xs text-gray-500">
                        Acceptance Criteria: {task.acceptanceCriteria.length}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {splitTasks.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Splitting into {splitTasks.length} smaller tasks
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSplit}
                disabled={splitTasks.length < 2 || splitTasks.some(task => !task.title.trim())}
                className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 transition-all"
              >
                Split Task
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};