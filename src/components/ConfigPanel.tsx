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
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 px-8 py-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">⚙️</span>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Configuration & Setup
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Configure your GitHub repository and API keys to get started with issue decomposition.
              </p>
            </div>
          </div>
        </div>

        {/* Private Repository Guide */}
        <div className="bg-blue-50 dark:bg-blue-900/10 border-b border-blue-200 dark:border-blue-800 px-8 py-6">
          <div className="flex items-start space-x-3">
            <span className="text-blue-500 text-lg flex-shrink-0">💡</span>
            <div>
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
                Connecting Private GitHub Repositories
              </h3>
              <div className="text-sm text-blue-800 dark:text-blue-300 space-y-2">
                <p>To access private repositories, your GitHub Personal Access Token must have the correct permissions:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>repo</strong> - Full control of private repositories</li>
                  <li><strong>read:org</strong> - Read organization membership (if applicable)</li>
                </ul>
                <p className="mt-3">
                  <a 
                    href="https://github.com/settings/tokens/new?scopes=repo,read:org&description=ChopChop%20Issue%20Decomposer" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 font-medium underline"
                  >
                    Create GitHub Token →
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Configuration Form */}
        <div className="px-8 py-8">
          <div className="space-y-8">
            {/* GitHub Repository */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                GitHub Repository
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-gray-500 dark:text-gray-400 text-base">github.com/</span>
                </div>
                <input
                  type="text"
                  placeholder="owner/repository"
                  value={formData.githubRepo}
                  onChange={(e) => handleInputChange('githubRepo', e.target.value)}
                  className="w-full pl-28 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-base transition-colors"
                />
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Include the owner/organization name and repository name (supports both public and private repos)
              </p>
            </div>

            {/* GitHub PAT */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                GitHub Personal Access Token
              </label>
              <div className="relative">
                <input
                  type={showTokens.githubPat ? 'text' : 'password'}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={formData.githubPat}
                  onChange={(e) => handleInputChange('githubPat', e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-base transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowTokens(prev => ({ ...prev, githubPat: !prev.githubPat }))}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <span className="text-lg">{showTokens.githubPat ? '🙈' : '👁️'}</span>
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Required permissions: <span className="font-medium">repo</span> (full access for private repos) and <span className="font-medium">read:org</span>
              </p>
            </div>

            {/* OpenAI API Key */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                OpenAI API Key
              </label>
              <div className="relative">
                <input
                  type={showTokens.openaiApiKey ? 'text' : 'password'}
                  placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={formData.openaiApiKey}
                  onChange={(e) => handleInputChange('openaiApiKey', e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-base transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowTokens(prev => ({ ...prev, openaiApiKey: !prev.openaiApiKey }))}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <span className="text-lg">{showTokens.openaiApiKey ? '🙈' : '👁️'}</span>
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">OpenAI Platform</a>
              </p>
            </div>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="bg-gray-50 dark:bg-gray-750 border-t border-gray-200 dark:border-gray-700 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex space-x-4">
              <button
                onClick={handleExport}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <span className="mr-2">📥</span>
                Download Config
              </button>
              <button
                onClick={handleImport}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <span className="mr-2">📤</span>
                Upload Config
              </button>
            </div>
            <button
              onClick={handleSave}
              className="inline-flex items-center px-6 py-3 text-sm font-semibold text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm transition-colors"
            >
              <span className="mr-2">✓</span>
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}