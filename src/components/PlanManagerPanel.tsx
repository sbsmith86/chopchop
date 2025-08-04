import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { ExecutionPlan } from '../types';
import { TrashIcon, PencilIcon, DocumentArrowDownIcon, DocumentIcon, FolderOpenIcon } from './ui/Icons';

interface PlanManagerPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Plan Management Panel Component
 * Allows users to view, manage, and load saved execution plans
 */
export const PlanManagerPanel: React.FC<PlanManagerPanelProps> = ({ isOpen, onClose }) => {
  const { 
    state, 
    loadPlan, 
    deleteSavedPlan, 
    renameSavedPlan,
    exportPlanJson,
    exportPlanMarkdown,
    importPlan,
    clearAllSavedPlans,
    setError
  } = useAppContext();

  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  if (!isOpen) return null;

  const handleRename = (plan: ExecutionPlan) => {
    setEditingPlan(plan.id);
    setEditTitle(plan.title);
    setEditDescription(plan.description);
  };

  const handleSaveRename = () => {
    if (editingPlan && editTitle.trim()) {
      renameSavedPlan(editingPlan, editTitle.trim(), editDescription.trim());
      setEditingPlan(null);
      setEditTitle('');
      setEditDescription('');
    }
  };

  const handleCancelRename = () => {
    setEditingPlan(null);
    setEditTitle('');
    setEditDescription('');
  };

  const handleDelete = (planId: string) => {
    if (window.confirm('Are you sure you want to delete this plan? This action cannot be undone.')) {
      deleteSavedPlan(planId);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        await importPlan(file);
        // Reset the input so the same file can be imported again
        event.target.value = '';
      } catch (error) {
        console.error('Import failed:', error);
      }
    }
  };

  const handleClearAll = () => {
    if (showClearConfirm) {
      clearAllSavedPlans();
      setShowClearConfirm(false);
    } else {
      setShowClearConfirm(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Execution Plans</h2>
              <p className="text-gray-600 mt-1">Manage your saved execution plans</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="border-b border-gray-200 p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Import Plan */}
              <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                <FolderOpenIcon className="w-4 h-4 mr-2" />
                Import Plan
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
              
              <span className="text-gray-500">|</span>
              
              <span className="text-sm text-gray-600">
                {state.savedPlans.length} plan{state.savedPlans.length !== 1 ? 's' : ''} saved
              </span>
            </div>

            {/* Clear All */}
            {state.savedPlans.length > 0 && (
              <div className="flex items-center space-x-2">
                {showClearConfirm ? (
                  <>
                    <span className="text-sm text-red-600 font-medium">Are you sure?</span>
                    <button
                      onClick={handleClearAll}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                    >
                      Yes, Clear All
                    </button>
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleClearAll}
                    className="px-3 py-2 text-red-600 text-sm hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Clear All Plans
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Plans List */}
        <div className="overflow-y-auto max-h-96">
          {state.savedPlans.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <DocumentIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No saved plans</h3>
              <p className="text-gray-600 mb-4">Create an execution plan to save it here</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start New Plan
              </button>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {state.savedPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  {editingPlan === plan.id ? (
                    /* Edit Mode */
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Plan title"
                        autoFocus
                      />
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Plan description (optional)"
                        rows={2}
                      />
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={handleCancelRename}
                          className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveRename}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* View Mode */
                    <div>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{plan.title}</h3>
                          {plan.description && (
                            <p className="text-gray-600 text-sm mb-2">{plan.description}</p>
                          )}
                          <div className="text-xs text-gray-500">
                            <span>Created: {plan.createdAt.toLocaleDateString()}</span>
                            {plan.updatedAt.getTime() !== plan.createdAt.getTime() && (
                              <span className="ml-3">Updated: {plan.updatedAt.toLocaleDateString()}</span>
                            )}
                            {plan.steps.length > 0 && (
                              <span className="ml-3">{plan.steps.length} step{plan.steps.length !== 1 ? 's' : ''}</span>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center space-x-1 ml-4">
                          <button
                            onClick={() => loadPlan(plan.id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Load this plan"
                          >
                            <FolderOpenIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRename(plan)}
                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                            title="Rename plan"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          
                          {/* Export dropdown */}
                          <div className="relative group">
                            <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                              <DocumentArrowDownIcon className="w-4 h-4" />
                            </button>
                            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                              <button
                                onClick={() => exportPlanJson(plan)}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg"
                              >
                                Export as JSON
                              </button>
                              <button
                                onClick={() => exportPlanMarkdown(plan)}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 last:rounded-b-lg"
                              >
                                Export as Markdown
                              </button>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => handleDelete(plan.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete plan"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Quick preview of plan content */}
                      {plan.content && (
                        <div className="bg-gray-50 rounded p-3 text-sm text-gray-700">
                          <div className="line-clamp-3">
                            {plan.content.substring(0, 200)}
                            {plan.content.length > 200 && '...'}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              All plans are stored locally in your browser. Clear browser data will remove all plans.
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};