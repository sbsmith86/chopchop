import { AppConfig } from '../types';

const CONFIG_KEY = 'chopchop-config';

/**
 * Load configuration from localStorage
 */
export function loadConfig(): AppConfig | null {
  try {
    const saved = localStorage.getItem(CONFIG_KEY);
    if (!saved) return null;

    const parsed = JSON.parse(saved);

    // Ensure preferences exist
    return {
      ...parsed,
      preferences: {
        theme: 'light',
        editorMode: 'markdown',
        ...parsed.preferences
      }
    };
  } catch (error) {
    console.error('Failed to load config:', error);
    return null;
  }
}

/**
 * Save configuration to localStorage
 */
export function saveConfig(config: AppConfig): void {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    console.log('Config saved to localStorage:', config);
  } catch (error) {
    console.error('Failed to save config:', error);
    throw new Error('Failed to save configuration');
  }
}

/**
 * Export configuration as JSON file
 */
export function exportConfig(config: AppConfig): void {
  try {
    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'chopchop-config.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export config:', error);
    throw new Error('Failed to export configuration');
  }
}

/**
 * Import configuration from JSON file
 */
export function importConfig(file: File): Promise<AppConfig> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (typeof result !== 'string') {
          throw new Error('Invalid file content');
        }

        const config = JSON.parse(result);

        // Validate config structure and convert old format
        const validatedConfig: AppConfig = {
          githubPat: config.githubPat,
          githubRepo: config.githubRepo || config.defaultRepo, // Handle old format
          openaiApiKey: config.openaiApiKey,
          preferences: {
            theme: config.preferences?.theme || 'light',
            editorMode: config.preferences?.editorMode || 'markdown'
          }
        };

        resolve(validatedConfig);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}