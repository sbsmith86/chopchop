import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { isFileSystemAPISupported, saveConfigToFile, loadConfigFromFile } from '../utils/filesystem';

export const ConfigPanel: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { state, dispatch } = useAppContext();
  const [localConfig, setLocalConfig] = useState(state.config);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useNativeFS, setUseNativeFS] = useState(
    isFileSystemAPISupported() ? localStorage.getItem('useNativeFS') === 'true' : false
  );

  // Save user preference
  const handlePreferenceChange = (val: boolean) => {
    setUseNativeFS(val);
    localStorage.setItem('useNativeFS', val ? 'true' : 'false');
  };

  // Save config (localStorage)
  const handleSave = async () => {
    setIsSaving(true);
    try {
      dispatch({ type: 'SET_CONFIG', payload: localConfig });
      localStorage.setItem('chopchopConfig', JSON.stringify(localConfig));
      await new Promise(resolve => setTimeout(resolve, 500));
      onClose?.();
    } catch (error) {
      setError('Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  // Import config (download/upload fallback)
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const text = await file.text();
        const importedConfig = JSON.parse(text);
        setLocalConfig(importedConfig);
        event.target.value = '';
        alert('Configuration imported successfully!');
      } catch (error) {
        setError('Failed to import configuration file');
      }
    }
  };

  // Export config (download/upload fallback)
  const handleExport = () => {
    try {
      const blob = new Blob([JSON.stringify(localConfig, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'chopchop-config.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      setError('Failed to export configuration');
    }
  };

  // Native file system save/load
  const handleNativeSave = async () => {
    try {
      await saveConfigToFile(localConfig);
      alert('Config saved to file!');
    } catch (e) {
      setError('Failed to save config to file');
    }
  };

  const handleNativeLoad = async () => {
    try {
      const loaded = await loadConfigFromFile();
      if (loaded) {
        setLocalConfig(loaded);
        alert('Config loaded from file!');
      }
    } catch (e) {
      setError('Failed to load config from file');
    }
  };

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Configuration</h2>
      {error && <div className="mb-4 text-red-600">{error}</div>}

      {/* Example config fields */}
      <div className="mb-4">
        <label className="block font-medium mb-1">GitHub PAT</label>
        <input
          type="password"
          className="w-full border rounded px-3 py-2"
          value={localConfig.githubPat || ''}
          onChange={e => setLocalConfig({ ...localConfig, githubPat: e.target.value })}
        />
      </div>
      <div className="mb-4">
        <label className="block font-medium mb-1">GitHub Repo (owner/repo)</label>
        <input
          type="text"
          className="w-full border rounded px-3 py-2"
          value={localConfig.githubRepo || ''}
          onChange={e => setLocalConfig({ ...localConfig, githubRepo: e.target.value })}
        />
      </div>
      <div className="mb-4">
        <label className="block font-medium mb-1">OpenAI API Key</label>
        <input
          type="password"
          className="w-full border rounded px-3 py-2"
          value={localConfig.openaiApiKey || ''}
          onChange={e => setLocalConfig({ ...localConfig, openaiApiKey: e.target.value })}
        />
      </div>

      {/* User preference for storage method */}
      {isFileSystemAPISupported() && (
        <div className="mb-4">
          <label className="block font-medium mb-1">Storage Method</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={useNativeFS ? 'native' : 'download'}
            onChange={e => handlePreferenceChange(e.target.value === 'native')}
          >
            <option value="native">Native File System (recommended)</option>
            <option value="download">Download/Upload (fallback)</option>
          </select>
        </div>
      )}

      {/* Save/Load buttons */}
      <div className="flex gap-2 mb-4">
        <button
          className="px-4 py-2 bg-emerald-600 text-white rounded"
          onClick={handleSave}
          disabled={isSaving}
        >
          Save to LocalStorage
        </button>
        {isFileSystemAPISupported() && useNativeFS ? (
          <>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded"
              onClick={handleNativeSave}
              disabled={isSaving}
            >
              Save Config to File
            </button>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded"
              onClick={handleNativeLoad}
              disabled={isSaving}
            >
              Load Config from File
            </button>
          </>
        ) : (
          <>
            <button
              className="px-4 py-2 bg-gray-600 text-white rounded"
              onClick={handleExport}
              disabled={isSaving}
            >
              Export Config (Download)
            </button>
            <label className="px-4 py-2 bg-gray-600 text-white rounded cursor-pointer">
              Import Config (Upload)
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImport}
                disabled={isSaving}
              />
            </label>
          </>
        )}
      </div>
      <button
        className="mt-4 px-4 py-2 bg-gray-300 rounded"
        onClick={onClose}
      >
        Close
      </button>
    </div>
  );
};