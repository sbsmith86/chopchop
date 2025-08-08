import React, { useState, useEffect } from 'react';
import { PlanStep } from '../types';

interface PlanStepManagerProps {
  steps: PlanStep[];
  onStepsChange: (steps: PlanStep[]) => void;
}

interface PlanStepProps {
  step: PlanStep;
  onUpdate: (step: PlanStep) => void;
  onSplit: (stepId: string) => void;
  onDelete: (stepId: string) => void;
}

function PlanStepCard({ step, onUpdate, onSplit, onDelete }: PlanStepProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedStep, setEditedStep] = useState(step);

  const handleSave = () => {
    onUpdate(editedStep);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedStep(step);
    setIsEditing(false);
  };

  const handleGroupedUnitToggle = () => {
    const updated = { ...editedStep, isGroupedUnit: !editedStep.isGroupedUnit };
    setEditedStep(updated);
    onUpdate(updated);
  };

  const handleAllowSplitToggle = () => {
    const updated = { ...editedStep, allowSplit: !editedStep.allowSplit };
    setEditedStep(updated);
    onUpdate(updated);
  };

  return (
    <div
      className={`bg-white border-2 rounded-xl p-4 shadow-sm transition-all duration-200 ${
        step.isGroupedUnit
          ? 'border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
          : 'border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Step number and grouped unit indicator */}
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
              {step.order}
            </div>
            {step.isGroupedUnit && (
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                📦 Grouped Unit
              </span>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-3">
              <input
                type="text"
                value={editedStep.title}
                onChange={(e) => setEditedStep({ ...editedStep, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Step title..."
              />
              <textarea
                value={editedStep.description}
                onChange={(e) => setEditedStep({ ...editedStep, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                placeholder="Step description..."
              />
              
              {/* Control checkboxes */}
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editedStep.isGroupedUnit || false}
                    onChange={handleGroupedUnitToggle}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">
                    Keep as grouped unit (AI won't split this into multiple subtasks)
                  </span>
                </label>
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editedStep.allowSplit || false}
                    onChange={handleAllowSplitToggle}
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <span className="text-gray-700">
                    Allow splitting even if marked as "too big"
                  </span>
                </label>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={handleSave}
                  className="inline-flex items-center px-3 py-1 text-sm font-medium bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all shadow-sm"
                >
                  <span className="mr-1">✓</span>
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="inline-flex items-center px-3 py-1 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all"
                >
                  <span className="mr-1">✕</span>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Control toggles in view mode */}
              <div className="flex items-center space-x-4 mb-2">
                <button
                  onClick={handleGroupedUnitToggle}
                  className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full transition-colors ${
                    step.isGroupedUnit
                      ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  📦 {step.isGroupedUnit ? 'Grouped Unit' : 'Group Unit'}
                </button>
                <button
                  onClick={handleAllowSplitToggle}
                  className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full transition-colors ${
                    step.allowSplit
                      ? 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  ✂️ {step.allowSplit ? 'Split Allowed' : 'Allow Split'}
                </button>
              </div>
            </>
          )}
        </div>

        {!isEditing && (
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={() => onSplit(step.id)}
              className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-all"
              title="Split this step into two steps"
            >
              <span className="text-sm">➕</span>
            </button>
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
              title="Edit step"
            >
              <span className="text-sm">✏️</span>
            </button>
            <button
              onClick={() => onDelete(step.id)}
              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-all"
              title="Delete step"
            >
              <span className="text-sm">🗑️</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Plan Step Manager component for granular control over plan steps
 */
export const PlanStepManager: React.FC<PlanStepManagerProps> = ({ steps, onStepsChange }) => {
  const [localSteps, setLocalSteps] = useState<PlanStep[]>(steps);

  // Sync with parent when steps change
  useEffect(() => {
    setLocalSteps(steps);
  }, [steps]);

  const handleUpdateStep = (updatedStep: PlanStep) => {
    const updatedSteps = localSteps.map(step =>
      step.id === updatedStep.id ? updatedStep : step
    );
    setLocalSteps(updatedSteps);
    onStepsChange(updatedSteps);
  };

  const handleSplitStep = (stepId: string) => {
    const stepIndex = localSteps.findIndex(step => step.id === stepId);
    if (stepIndex === -1) return;

    const originalStep = localSteps[stepIndex];
    const newStep: PlanStep = {
      id: `${stepId}-split-${Date.now()}`,
      title: `${originalStep.title} (Part 2)`,
      description: '',
      order: originalStep.order + 1,
      subtasks: [],
      isGroupedUnit: false,
      allowSplit: false
    };

    const updatedSteps = [
      ...localSteps.slice(0, stepIndex + 1),
      newStep,
      ...localSteps.slice(stepIndex + 1).map(step => ({
        ...step,
        order: step.order + 1
      }))
    ];

    setLocalSteps(updatedSteps);
    onStepsChange(updatedSteps);
  };

  const handleDeleteStep = (stepId: string) => {
    const updatedSteps = localSteps
      .filter(step => step.id !== stepId)
      .map((step, index) => ({
        ...step,
        order: index + 1
      }));

    setLocalSteps(updatedSteps);
    onStepsChange(updatedSteps);
  };

  if (localSteps.length === 0) {
    return (
      <div className="bg-gray-50 rounded-xl p-8 text-center">
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">📋</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Plan Steps</h3>
        <p className="text-gray-600">
          The plan content will be automatically parsed into steps when you save.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Plan Steps ({localSteps.length})
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            AI-ordered execution sequence • Mark grouped units • Control splitting
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 rounded-xl p-4 mb-4">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-blue-600">💡</span>
          </div>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-2">Granularity Control Tips:</p>
            <ul className="space-y-1 text-sm">
              <li>• Mark related work as "grouped units" to keep them as single subtasks</li>
              <li>• Use "allow split" to override "too big" warnings for grouped units</li>
              <li>• Step order is determined by AI based on dependencies and logical flow</li>
              <li>• Split complex steps into smaller, more focused steps</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {localSteps.map((step) => (
          <PlanStepCard
            key={step.id}
            step={step}
            onUpdate={handleUpdateStep}
            onSplit={handleSplitStep}
            onDelete={handleDeleteStep}
          />
        ))}
      </div>
    </div>
  );
};