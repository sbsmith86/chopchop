import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Config } from '../types';
import { loadConfig, saveConfig, exportConfig, importConfig } from '../utils/storage';

/**
 * Configuration panel for GitHub PAT, repo, and OpenAI API key
 */
export default function ConfigPanel() {
  const { state, setConfig, setStep, setError } = useAppContext();
  const [formData, setFormData] = useState<Config>({
    githubPat: '',
    githubRepo: '',
    openaiApiKey: '',
  });
  const [showTokens, setShowTokens] = useState({
    githubPat: false,
    openaiApiKey: false,
  });

  // Load config on mount
  useEffect(() => {
    const savedConfig = loadConfig();
    if (savedConfig) {
      setFormData(savedConfig);
      setConfig(savedConfig);
    }
  }, [setConfig]);

  /**
   * Handle form input changes
   */
  const handleInputChange = (field: keyof Config, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  /**
   * Save configuration and proceed to next step
   */
  const handleSave = () => {
    if (!formData.githubPat || !formData.githubRepo || !formData.openaiApiKey) {
      setError('All configuration fields are required');
      return;
    }

    try {
      saveConfig(formData);
      setConfig(formData);
      setError(null);
      setStep(1); // Move to Issue Input step
    } catch (error) {
      setError('Failed to save configuration');
    }
  };

  /**
   * Export configuration to JSON file
   */
  const handleExport = () => {
    try {
      exportConfig(formData);
    } catch (error) {
      setError('Failed to export configuration');
    }
  };

  /**
   * Import configuration from JSON file
   */
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const config = await importConfig(file);
          setFormData(config);
          setError(null);
        } catch (error) {
          setError('Failed to import configuration. Please check the file format.');
        }
      }
    };
    input.click();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
            ⚙️ Settings / Configuration
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Configure your GitHub repository and API keys for the decomposition workflow.
          </p>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* GitHub Repository */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              GitHub Repository
            </label>
            <input
              type="text"
              placeholder="owner/repository"
              value={formData.githubRepo}
              onChange={(e) => handleInputChange('githubRepo', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* GitHub PAT */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              GitHub Personal Access Token
            </label>
            <div className="relative">
              <input
                type={showTokens.githubPat ? 'text' : 'password'}
                placeholder="Enter your GitHub PAT"
                value={formData.githubPat}
                onChange={(e) => handleInputChange('githubPat', e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowTokens(prev => ({ ...prev, githubPat: !prev.githubPat }))}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showTokens.githubPat ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* OpenAI API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              OpenAI API Key
            </label>
            <div className="relative">
              <input
                type={showTokens.openaiApiKey ? 'text' : 'password'}
                placeholder="Enter your OpenAI API key"
                value={formData.openaiApiKey}
                onChange={(e) => handleInputChange('openaiApiKey', e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowTokens(prev => ({ ...prev, openaiApiKey: !prev.openaiApiKey }))}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showTokens.openaiApiKey ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-750 border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
          <div className="flex items-center justify-between">
            <div className="flex space-x-3">
              <button
                onClick={handleExport}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Download Config
              </button>
              <button
                onClick={handleImport}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Upload Config
              </button>
            </div>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}