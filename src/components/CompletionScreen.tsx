import React from 'react';
import { CreatedIssue, Subtask } from '../types';

interface CompletionScreenProps {
  createdIssues: CreatedIssue[];
  subtasks: Subtask[];
  repositoryUrl: string;
  onStartNew: () => void;
  onExportSummary: () => void;
}

export const CompletionScreen: React.FC<CompletionScreenProps> = ({
  createdIssues,
  subtasks,
  repositoryUrl,
  onStartNew,
  onExportSummary
}) => {
  const totalEstimatedHours = subtasks.reduce((sum, task) => sum + task.estimatedHours, 0);
  const tooBigTasksCount = subtasks.filter(task => task.isTooBig).length;

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <span className="text-4xl">🎉</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Issues Created Successfully!
        </h1>
        <p className="text-lg text-gray-600">
          {createdIssues.length} GitHub issues have been created and are ready for development
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-xl border border-blue-200 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-xl">📋</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {createdIssues.length}
              </div>
              <div className="text-sm font-medium text-blue-800">
                Issues Created
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-6 rounded-xl border border-green-200 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 text-xl">⏱️</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {totalEstimatedHours}h
              </div>
              <div className="text-sm font-medium text-green-800">
                Estimated Work
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-violet-100 p-6 rounded-xl border border-purple-200 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-purple-600 text-xl">🎯</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {subtasks.filter(task => !task.isTooBig).length}
              </div>
              <div className="text-sm font-medium text-purple-800">
                Atomic Tasks
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-yellow-100 p-6 rounded-xl border border-orange-200 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-orange-600 text-xl">⚠️</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {tooBigTasksCount}
              </div>
              <div className="text-sm font-medium text-orange-800">
                Had Warnings
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Repository Link */}
      <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-xl">🏠</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900">Repository</h3>
              <p className="text-blue-700">{repositoryUrl}</p>
            </div>
          </div>
          <a
            href={`https://github.com/${repositoryUrl}/issues`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <span className="mr-2">🔗</span>
            View All Issues
          </a>
        </div>
      </div>

      {/* Created Issues List */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Created Issues</h2>
        <div className="space-y-3 max-h-96 overflow-y-auto bg-gray-50 rounded-xl p-4 border border-gray-200">
          {createdIssues.map((issue, index) => {
            const subtask = subtasks.find(s => s.id === issue.subtaskId);
            return (
              <div key={issue.number} className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center space-x-3">
                  <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-bold">
                    #{issue.number}
                  </span>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{issue.title}</h3>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-sm text-gray-500">
                        {subtask?.estimatedHours || 0}h estimated
                      </span>
                      {subtask?.isTooBig && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                          ⚠️ Was flagged as large
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <a
                  href={issue.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <span className="mr-1">🔗</span>
                  View Issue
                </a>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={onExportSummary}
          className="inline-flex items-center px-6 py-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
        >
          <span className="mr-2">📄</span>
          Export Summary
        </button>

        <button
          onClick={onStartNew}
          className="inline-flex items-center px-6 py-3 text-base font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 border border-transparent rounded-xl hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg transition-all"
        >
          <span className="mr-2">🚀</span>
          Start New Decomposition
        </button>
      </div>
    </div>
  );
};