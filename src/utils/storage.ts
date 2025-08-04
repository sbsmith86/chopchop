import { AppConfig, ExecutionPlan } from '../types';

const CONFIG_KEY = 'chopchop-config';
const PLANS_KEY = 'chopchop-plans';

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

/**
 * Load all saved execution plans from localStorage
 */
export function loadSavedPlans(): ExecutionPlan[] {
  try {
    const saved = localStorage.getItem(PLANS_KEY);
    if (!saved) return [];

    const plans = JSON.parse(saved);
    
    // Convert date strings back to Date objects
    return plans.map((plan: any) => ({
      ...plan,
      createdAt: new Date(plan.createdAt),
      updatedAt: new Date(plan.updatedAt)
    }));
  } catch (error) {
    console.error('Failed to load saved plans:', error);
    return [];
  }
}

/**
 * Save an execution plan to localStorage
 */
export function savePlan(plan: ExecutionPlan): void {
  try {
    const existingPlans = loadSavedPlans();
    
    // Check if plan already exists and update it, otherwise add new
    const existingIndex = existingPlans.findIndex(p => p.id === plan.id);
    
    if (existingIndex >= 0) {
      existingPlans[existingIndex] = { ...plan, updatedAt: new Date() };
    } else {
      existingPlans.push(plan);
    }
    
    localStorage.setItem(PLANS_KEY, JSON.stringify(existingPlans));
    console.log('Plan saved to localStorage:', plan.title);
  } catch (error) {
    console.error('Failed to save plan:', error);
    throw new Error('Failed to save execution plan');
  }
}

/**
 * Delete an execution plan from localStorage
 */
export function deletePlan(planId: string): void {
  try {
    const existingPlans = loadSavedPlans();
    const filteredPlans = existingPlans.filter(p => p.id !== planId);
    localStorage.setItem(PLANS_KEY, JSON.stringify(filteredPlans));
    console.log('Plan deleted from localStorage:', planId);
  } catch (error) {
    console.error('Failed to delete plan:', error);
    throw new Error('Failed to delete execution plan');
  }
}

/**
 * Rename an execution plan
 */
export function renamePlan(planId: string, newTitle: string, newDescription?: string): void {
  try {
    const existingPlans = loadSavedPlans();
    const planIndex = existingPlans.findIndex(p => p.id === planId);
    
    if (planIndex === -1) {
      throw new Error('Plan not found');
    }
    
    existingPlans[planIndex] = {
      ...existingPlans[planIndex],
      title: newTitle,
      description: newDescription || existingPlans[planIndex].description,
      updatedAt: new Date()
    };
    
    localStorage.setItem(PLANS_KEY, JSON.stringify(existingPlans));
    console.log('Plan renamed:', planId, newTitle);
  } catch (error) {
    console.error('Failed to rename plan:', error);
    throw new Error('Failed to rename execution plan');
  }
}

/**
 * Export an execution plan as JSON file
 */
export function exportPlanAsJson(plan: ExecutionPlan): void {
  try {
    const dataStr = JSON.stringify(plan, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${plan.title.replace(/[^a-z0-9]/gi, '_')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export plan as JSON:', error);
    throw new Error('Failed to export execution plan as JSON');
  }
}

/**
 * Export an execution plan as Markdown file
 */
export function exportPlanAsMarkdown(plan: ExecutionPlan): void {
  try {
    let markdown = `# ${plan.title}\n\n`;
    
    if (plan.description) {
      markdown += `${plan.description}\n\n`;
    }
    
    markdown += `**Created:** ${plan.createdAt.toLocaleDateString()}\n`;
    markdown += `**Last Updated:** ${plan.updatedAt.toLocaleDateString()}\n\n`;
    
    markdown += `## Execution Plan\n\n${plan.content}\n\n`;
    
    if (plan.steps && plan.steps.length > 0) {
      markdown += `## Steps\n\n`;
      plan.steps.forEach((step, index) => {
        markdown += `### ${index + 1}. ${step.title}\n\n`;
        markdown += `${step.description}\n\n`;
        
        if (step.subtasks && step.subtasks.length > 0) {
          markdown += `#### Subtasks:\n\n`;
          step.subtasks.forEach((subtask, subIndex) => {
            markdown += `${subIndex + 1}. **${subtask.title}**\n`;
            markdown += `   ${subtask.description}\n\n`;
            
            if (subtask.acceptanceCriteria && subtask.acceptanceCriteria.length > 0) {
              markdown += `   **Acceptance Criteria:**\n`;
              subtask.acceptanceCriteria.forEach(criteria => {
                markdown += `   - ${criteria}\n`;
              });
              markdown += `\n`;
            }
          });
        }
      });
    }
    
    const dataBlob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${plan.title.replace(/[^a-z0-9]/gi, '_')}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export plan as Markdown:', error);
    throw new Error('Failed to export execution plan as Markdown');
  }
}

/**
 * Import an execution plan from JSON file
 */
export function importPlanFromJson(file: File): Promise<ExecutionPlan> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (typeof result !== 'string') {
          throw new Error('Invalid file content');
        }

        const planData = JSON.parse(result);
        
        // Validate plan structure
        if (!planData.id || !planData.title || !planData.content) {
          throw new Error('Invalid plan file: missing required fields');
        }
        
        const plan: ExecutionPlan = {
          id: planData.id,
          title: planData.title,
          description: planData.description || '',
          content: planData.content,
          steps: planData.steps || [],
          createdAt: planData.createdAt ? new Date(planData.createdAt) : new Date(),
          updatedAt: new Date() // Update timestamp on import
        };

        resolve(plan);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Clear all saved plans (for user reset functionality)
 */
export function clearAllPlans(): void {
  try {
    localStorage.removeItem(PLANS_KEY);
    console.log('All plans cleared from localStorage');
  } catch (error) {
    console.error('Failed to clear plans:', error);
    throw new Error('Failed to clear saved plans');
  }
}