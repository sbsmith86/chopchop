import React from 'react';
import { IssueCreationProgress, CreatedIssue } from '../types';

interface IssueCreationProgressProps {
  progress: IssueCreationProgress;
  createdIssues: CreatedIssue[];
}

export const IssueCreationProgressComponent: React.FC<IssueCreationProgressProps> = ({
  progress,
  createdIssues
}) => {
  const progressPercentage = (progress.currentIssue / progress.totalIssues) * 100;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Creating GitHub Issues</h3>
        <span className="text-sm font-medium text-gray-600">
          {progress.currentIssue} of {progress.totalIssues}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span>{Math.round(progressPercentage)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Current Task */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {progress.status === 'creating' ? (
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            ) : progress.status === 'completed' ? (
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">✓</span>
              </div>
            ) : (
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">✗</span>
              </div>
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              {progress.status === 'creating' && 'Creating: '}
              {progress.status === 'completed' && 'Completed: '}
              {progress.status === 'error' && 'Failed: '}
              {progress.currentTask}
            </p>
            {progress.status === 'error' && progress.error && (
              <p className="text-sm text-red-600 mt-1">{progress.error}</p>
            )}
          </div>
        </div>
      </div>

      {/* Created Issues List */}
      {createdIssues.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            Created Issues ({createdIssues.length})
          </h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {createdIssues.map((issue) => (
              <div key={issue.number} className="flex items-center justify-between p-2 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-green-100 text-green-600 rounded-full text-xs font-bold">
                    #{issue.number}
                  </span>
                  <span className="text-sm font-medium text-green-800 truncate">
                    {issue.title}
                  </span>
                </div>
                <a
                  href={issue.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 hover:text-green-700 text-sm"
                >
                  <span>🔗</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};