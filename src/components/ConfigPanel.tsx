import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { EyeIcon, EyeSlashIcon, DownloadIcon, UploadIcon, XIcon } from './ui/Icons';

interface ConfigPanelProps {
  onClose?: () => void;
}

/**
 * Modern configuration panel with clean form design
 * Features secure token input and configuration management
 */
export const ConfigPanel: React.FC<ConfigPanelProps> = ({ onClose }) => {
  const { state, updateConfig, exportConfig, importConfig } = useAppContext();
  const [showTokens, setShowTokens] = useState(false);
  const [localConfig, setLocalConfig] = useState(state.config);
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Handles saving configuration with user feedback
   */
  const handleSave = async (): Promise<void> => {
    setIsSaving(true);
    try {
      console.log('Saving config:', localConfig);
      updateConfig(localConfig);
      await new Promise(resolve => setTimeout(resolve, 500)); // Brief feedback delay
      onClose?.();
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handles configuration file import with error handling
   */
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const importedConfig = await importConfig(file);
        setLocalConfig(importedConfig);
        event.target.value = '';
        alert('Configuration imported successfully!');
      } catch (error) {
        console.error('Import failed:', error);
        alert('Failed to import configuration file');
      }
    }
  };

  /**
   * Handles configuration export
   */
  const handleExport = (): void => {
    try {
      exportConfig();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export configuration');
    }
  };

  /**
   * Updates a specific field in local configuration
   */
  const updateField = <K extends keyof typeof localConfig>(
    field: K,
    value: typeof localConfig[K]
  ): void => {
    setLocalConfig(prev => ({ ...prev, [field]: value }));
  };

  /**
   * Updates nested preference fields
   */
  const updatePreferences = (preferences: typeof localConfig.preferences): void => {
    setLocalConfig(prev => ({ ...prev, preferences }));
  };

  /**
   * Tests OpenAI API key validity
   */
  const testOpenAIConnection = async (): Promise<void> => {
    if (!localConfig.openaiApiKey) {
      alert('Please enter an OpenAI API key first');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${localConfig.openaiApiKey}`,
        },
      });

      if (response.ok) {
        alert('✅ OpenAI API key is valid and working!');
      } else {
        const error = await response.json().catch(() => ({}));
        alert(`❌ OpenAI API key test failed: ${error.error?.message || response.statusText}`);
      }
    } catch (error) {
      alert(`❌ OpenAI API connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Configuration</h2>
          <p className="text-gray-500 mt-1">Set up your GitHub and OpenAI credentials</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XIcon className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      <div className="max-w-2xl space-y-8">
        {/* GitHub Configuration */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-semibold text-sm">GH</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">GitHub Settings</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Personal Access Token
              </label>
              <div className="relative">
                <input
                  type={showTokens ? 'text' : 'password'}
                  value={localConfig.githubPat || ''}
                  onChange={e => updateField('githubPat', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono text-sm"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                />
                <button
                  type="button"
                  onClick={() => setShowTokens(!showTokens)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  {showTokens ? (
                    <EyeSlashIcon className="w-4 h-4 text-gray-500" />
                  ) : (
                    <EyeIcon className="w-4 h-4 text-gray-500" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Repository
              </label>
              <input
                type="text"
                value={localConfig.githubRepo || ''}
                onChange={e => updateField('githubRepo', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="owner/repository"
              />
            </div>
          </div>
        </div>

        {/* OpenAI Configuration */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-semibold text-sm">AI</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">OpenAI Settings</h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Key
            </label>
            <div className="flex items-center space-x-2">
              <input
                type={showTokens ? 'text' : 'password'}
                value={localConfig.openaiApiKey || ''}
                onChange={e => updateField('openaiApiKey', e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all font-mono text-sm"
                placeholder="sk-xxxxxxxxxxxxxxxxxxxx"
              />
              <button
                onClick={testOpenAIConnection}
                disabled={!localConfig.openaiApiKey || isSaving}
                className="px-3 py-2 text-sm bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Test Connection
              </button>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Preferences</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Theme
              </label>
              <select
                value={localConfig.preferences.theme}
                onChange={e => updatePreferences({
                  ...localConfig.preferences,
                  theme: e.target.value as 'light' | 'dark' | 'system'
                })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Editor Mode
              </label>
              <select
                value={localConfig.preferences.editorMode}
                onChange={e => updatePreferences({
                  ...localConfig.preferences,
                  editorMode: e.target.value as 'markdown' | 'rich'
                })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="markdown">Markdown</option>
                <option value="rich">Rich Text</option>
              </select>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <div className="flex items-center space-x-4">
            <label className="cursor-pointer inline-flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all border border-blue-200 hover:border-blue-300">
              <UploadIcon className="w-4 h-4" />
              <span>Import Config</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>

            <button
              onClick={handleExport}
              className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-all border border-gray-200 hover:border-gray-300"
            >
              <DownloadIcon className="w-4 h-4" />
              <span>Export Config</span>
            </button>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              'Save Configuration'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};