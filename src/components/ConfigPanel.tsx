import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Config } from '../types';
import { loadConfig, saveConfig, exportConfig, importConfig } from '../utils/storage';

/**
 * Configuration panel for GitHub PAT, repo, and OpenAI API key
 */
export default function ConfigPanel() {
  const { setConfig, setStep, setError } = useAppContext();
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
    } catch {
      setError('Failed to save configuration');
    }
  };

  /**
   * Export configuration to JSON file
   */
  const handleExport = () => {
    try {
      exportConfig(formData);
    } catch {
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
        } catch {
          setError('Failed to import configuration. Please check the file format.');
        }
      }
    };
    input.click();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
            <span className="mr-2">⚙️</span>
            Settings / Configuration
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Configure your GitHub repository and API keys for the decomposition workflow.
          </p>
        </div>

        {/* Private Repository Guide */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 px-6 py-4">
          <div className="flex">
            <span className="text-yellow-600 mr-3">💡</span>
            <div>
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Private Repository Access
              </h3>
              <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                For private repositories, ensure your GitHub Personal Access Token has <strong>repo</strong> and <strong>read:org</strong> permissions.{' '}
                <a 
                  href="https://github.com/settings/tokens/new?scopes=repo,read:org&description=ChopChop%20Issue%20Decomposer" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline hover:no-underline"
                >
                  Create token
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Configuration Form */}
        <div className="px-6 py-6">
          <div className="space-y-6">
            {/* GitHub Repository */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                GitHub Repository
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 dark:text-gray-400 text-sm">github.com/</span>
                </div>
                <input
                  type="text"
                  placeholder="owner/repository"
                  value={formData.githubRepo}
                  onChange={(e) => handleInputChange('githubRepo', e.target.value)}
                  className="w-full pl-24 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Include the owner/organization name and repository name
              </p>
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
                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowTokens(prev => ({ ...prev, githubPat: !prev.githubPat }))}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <span className="text-sm">{showTokens.githubPat ? '🙈' : '👁️'}</span>
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
                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowTokens(prev => ({ ...prev, openaiApiKey: !prev.openaiApiKey }))}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <span className="text-sm">{showTokens.openaiApiKey ? '🙈' : '👁️'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="bg-gray-50 dark:bg-gray-750 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex space-x-3">
              <button
                onClick={handleExport}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Download Config
              </button>
              <button
                onClick={handleImport}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Upload Config
              </button>
            </div>
            <button
              onClick={handleSave}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}