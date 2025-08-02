import React from 'react';

/**
 * Subtask list panel (placeholder)
 */
export default function SubtaskListPanel() {
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
          <p className="text-gray-500 dark:text-gray-400">Coming soon...</p>
        </div>
      </div>
    </div>
  );
}