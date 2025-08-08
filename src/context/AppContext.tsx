import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { AppState, AppStep, GitHubIssue, ClarificationQuestion, ExecutionPlan, Subtask, CreatedIssue, AppConfig, IssueCreationProgress } from '../types';
import { 
  saveConfig, 
  loadConfig, 
  exportConfig as exportConfigFile, 
  importConfig as importConfigFile,
  loadSavedPlans,
  savePlan,
  deletePlan,
  renamePlan,
  exportPlanAsJson,
  exportPlanAsMarkdown,
  importPlanFromJson,
  clearAllPlans
} from '../utils/storage';

const initialState: AppState = {
  currentStep: 1,
  config: {
    githubPat: '',
    githubRepo: '',
    openaiApiKey: '',
    preferences: {
      theme: 'light',
      editorMode: 'markdown'
    }
  },
  issue: null,
  clarificationQuestions: [],
  executionPlan: null,
  subtasks: [],
  createdIssues: [],
  isLoading: false,
  error: null,
  isCreating: false,
  creationProgress: null,
  showCompletion: false,
  savedPlans: []
};

type AppAction =
  | { type: 'SET_CONFIG'; payload: AppConfig }
  | { type: 'UPDATE_CONFIG'; payload: Partial<AppConfig> }
  | { type: 'LOAD_CONFIG'; payload: AppConfig }
  | { type: 'SET_ISSUE'; payload: GitHubIssue }
  | { type: 'SET_CLARIFICATION_QUESTIONS'; payload: ClarificationQuestion[] }
  | { type: 'UPDATE_CLARIFICATION_ANSWER'; payload: { questionId: string; answer: string } }
  | { type: 'SET_EXECUTION_PLAN'; payload: ExecutionPlan }
  | { type: 'UPDATE_PLAN_STEPS'; payload: PlanStep[] }
  | { type: 'SET_SUBTASKS'; payload: Subtask[] }
  | { type: 'UPDATE_SUBTASK'; payload: Subtask }
  | { type: 'SPLIT_SUBTASK'; payload: { originalId: string; newSubtasks: Subtask[] } }
  | { type: 'DELETE_SUBTASK'; payload: string }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_STEP'; payload: number }
  | { type: 'SET_CURRENT_STEP'; payload: AppStep }
  | { type: 'RESET_STATE' }
  | { type: 'SET_IS_CREATING'; payload: boolean }
  | { type: 'SET_CREATION_PROGRESS'; payload: IssueCreationProgress | null }
  | { type: 'SET_CREATED_ISSUES'; payload: CreatedIssue[] }
  | { type: 'SET_SHOW_COMPLETION'; payload: boolean }
  | { type: 'HIDE_COMPLETION' }
  | { type: 'LOAD_SAVED_PLANS'; payload: ExecutionPlan[] }
  | { type: 'ADD_SAVED_PLAN'; payload: ExecutionPlan }
  | { type: 'UPDATE_SAVED_PLAN'; payload: ExecutionPlan }
  | { type: 'REMOVE_SAVED_PLAN'; payload: string }
  | { type: 'CLEAR_ALL_SAVED_PLANS' };

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_CONFIG':
      // Fix: Don't save in reducer, let the action caller handle saving
      return { ...state, config: action.payload };

    case 'UPDATE_CONFIG': {
      // Fix: Don't save in reducer, let the action caller handle saving
      const updatedConfig = { ...state.config, ...action.payload };
      return { ...state, config: updatedConfig };
    }

    case 'LOAD_CONFIG':
      return { ...state, config: action.payload };

    case 'SET_ISSUE':
      return { ...state, issue: action.payload };

    case 'SET_CLARIFICATION_QUESTIONS':
      return { ...state, clarificationQuestions: action.payload };

    case 'UPDATE_CLARIFICATION_ANSWER':
      return {
        ...state,
        clarificationQuestions: state.clarificationQuestions.map(q =>
          q.id === action.payload.questionId ? { ...q, answer: action.payload.answer } : q
        )
      };

    case 'SET_EXECUTION_PLAN':
      return { ...state, executionPlan: action.payload };

    case 'UPDATE_PLAN_STEPS':
      return { 
        ...state, 
        executionPlan: state.executionPlan ? {
          ...state.executionPlan,
          steps: action.payload,
          updatedAt: new Date()
        } : null
      };

    case 'SET_SUBTASKS':
      return { ...state, subtasks: action.payload };

    case 'UPDATE_SUBTASK':
      return {
        ...state,
        subtasks: state.subtasks.map(task =>
          task.id === action.payload.id ? action.payload : task
        )
      };

    case 'SPLIT_SUBTASK': {
      const { originalId, newSubtasks } = action.payload;
      const originalIndex = state.subtasks.findIndex(task => task.id === originalId);

      if (originalIndex === -1) return state;

      // Remove original task and insert new tasks at the same position
      const updatedSubtasks = [
        ...state.subtasks.slice(0, originalIndex),
        ...newSubtasks.map((task, index) => ({
          ...task,
          id: `${originalId}-split-${index}`,
          order: originalIndex + index
        })),
        ...state.subtasks.slice(originalIndex + 1).map(task => ({
          ...task,
          order: task.order + newSubtasks.length - 1
        }))
      ];

      return { ...state, subtasks: updatedSubtasks };
    }

    case 'DELETE_SUBTASK': {
      const taskId = action.payload;
      const taskIndex = state.subtasks.findIndex(task => task.id === taskId);

      if (taskIndex === -1) return state;

      // Remove the task and reorder remaining tasks
      const updatedSubtasks = [
        ...state.subtasks.slice(0, taskIndex),
        ...state.subtasks.slice(taskIndex + 1).map(task => ({
          ...task,
          order: task.order > taskIndex ? task.order - 1 : task.order
        }))
      ];

      return { ...state, subtasks: updatedSubtasks };
    }

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_STEP':
      return { ...state, currentStep: action.payload };

    case 'SET_CURRENT_STEP':
      return { ...state, currentStep: action.payload };

    case 'RESET_STATE':
      return {
        ...initialState,
        config: state.config // Keep the configuration
      };

    case 'SET_IS_CREATING':
      return { ...state, isCreating: action.payload };
    case 'SET_CREATION_PROGRESS':
      return { ...state, creationProgress: action.payload };
    case 'SET_CREATED_ISSUES':
      return { ...state, createdIssues: action.payload };
    case 'SET_SHOW_COMPLETION':
      return { ...state, showCompletion: action.payload };

    case 'HIDE_COMPLETION':
      return { ...state, showCompletion: false };
    
    case 'LOAD_SAVED_PLANS':
      return { ...state, savedPlans: action.payload };
    
    case 'ADD_SAVED_PLAN':
      return { 
        ...state, 
        savedPlans: [...state.savedPlans, action.payload]
      };
    
    case 'UPDATE_SAVED_PLAN': {
      const updatedPlans = state.savedPlans.map(plan => 
        plan.id === action.payload.id ? action.payload : plan
      );
      return { ...state, savedPlans: updatedPlans };
    }
    
    case 'REMOVE_SAVED_PLAN': {
      const filteredPlans = state.savedPlans.filter(plan => plan.id !== action.payload);
      return { ...state, savedPlans: filteredPlans };
    }
    
    case 'CLEAR_ALL_SAVED_PLANS':
      return { ...state, savedPlans: [] };

    default:
      return state;
  }
};

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  nextStep: () => void;
  previousStep: () => void;
  resetState: () => void;
  updateConfig: (config: Partial<AppConfig>) => void;
  exportConfig: () => void;
  importConfig: (file: File) => Promise<void>;
  // Plan management methods
  saveCurrentPlan: (title?: string, description?: string) => Promise<void>;
  loadPlan: (planId: string) => void;
  deleteSavedPlan: (planId: string) => void;
  renameSavedPlan: (planId: string, newTitle: string, newDescription?: string) => void;
  exportPlanJson: (plan: ExecutionPlan) => void;
  exportPlanMarkdown: (plan: ExecutionPlan) => void;
  importPlan: (file: File) => Promise<void>;
  clearAllSavedPlans: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load config from localStorage on mount
  useEffect(() => {
    const savedConfig = loadConfig();
    if (savedConfig) {
      dispatch({ type: 'LOAD_CONFIG', payload: savedConfig });
    }
    
    // Load saved plans
    const savedPlans = loadSavedPlans();
    dispatch({ type: 'LOAD_SAVED_PLANS', payload: savedPlans });
  }, []);

  const nextStep = useCallback((): void => {
    let nextStepNumber: number;

    switch (state.currentStep) {
      case 1: // Issue Input -> Clarification Questions
        if (!state.issue) {
          console.warn('Cannot proceed: No issue loaded');
          return;
        }
        nextStepNumber = 2;
        break;

      case 2: // Clarification Questions -> Plan Review
        nextStepNumber = 3;
        break;

      case 3: // Plan Review -> Subtasks
        if (!state.executionPlan) {
          console.warn('Cannot proceed: No execution plan');
          return;
        }
        nextStepNumber = 4;
        break;

      case 4: // Subtasks -> Summary/Approval
        if (state.subtasks.length === 0) {
          console.warn('Cannot proceed: No subtasks generated');
          return;
        }
        nextStepNumber = 5;
        break;

      case 5: // Summary/Approval -> Complete (stay at 5)
        nextStepNumber = 5;
        break;

      default:
        console.warn('Unknown step:', state.currentStep);
        nextStepNumber = Math.min(state.currentStep + 1, 5);
    }

    dispatch({ type: 'SET_STEP', payload: nextStepNumber });
  }, [state.currentStep, state.issue, state.executionPlan, state.subtasks.length]);

  const previousStep = useCallback((): void => {
    const prevStepNumber = Math.max(state.currentStep - 1, 1);
    dispatch({ type: 'SET_STEP', payload: prevStepNumber });
  }, [state.currentStep]);

  const setError = useCallback((error: string | null): void => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const setLoading = useCallback((loading: boolean): void => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  const resetState = useCallback((): void => {
    dispatch({ type: 'RESET_STATE' });
  }, []);

  // Configuration management functions
  const updateConfig = useCallback((config: Partial<AppConfig>): void => {
    const updatedConfig = { ...state.config, ...config };

    // Update state first
    dispatch({ type: 'UPDATE_CONFIG', payload: config });

    // Then save to localStorage
    saveConfig(updatedConfig);
  }, [state.config]);

  const exportConfig = useCallback((): void => {
    try {
      exportConfigFile(state.config);
    } catch (error) {
      console.error('Export failed:', error);
      setError('Failed to export configuration');
    }
  }, [state.config, setError]);

  const importConfig = useCallback(async (file: File): Promise<void> => {
    try {
      const importedConfig = await importConfigFile(file);
      dispatch({ type: 'UPDATE_CONFIG', payload: importedConfig });
    } catch (error) {
      console.error('Import failed:', error);
      setError('Failed to import configuration');
      throw error;
    }
  }, [setError]);

  // Plan management functions
  const saveCurrentPlan = useCallback(async (title?: string, description?: string): Promise<void> => {
    if (!state.executionPlan) {
      throw new Error('No execution plan to save');
    }
    
    try {
      const planToSave: ExecutionPlan = {
        ...state.executionPlan,
        title: title || state.executionPlan.title || 'Untitled Plan',
        description: description || state.executionPlan.description || '',
        updatedAt: new Date()
      };
      
      savePlan(planToSave);
      dispatch({ type: 'UPDATE_SAVED_PLAN', payload: planToSave });
      
      // Show success message
      // We could add a success notification system later
    } catch (error) {
      console.error('Failed to save plan:', error);
      setError('Failed to save execution plan');
      throw error;
    }
  }, [state.executionPlan, setError]);

  const loadPlan = useCallback((planId: string): void => {
    const plan = state.savedPlans.find(p => p.id === planId);
    if (!plan) {
      setError('Plan not found');
      return;
    }
    
    dispatch({ type: 'SET_EXECUTION_PLAN', payload: plan });
    // Also set the subtasks if they exist in the plan steps
    if (plan.steps && plan.steps.length > 0) {
      const allSubtasks = plan.steps.flatMap(step => step.subtasks || []);
      if (allSubtasks.length > 0) {
        dispatch({ type: 'SET_SUBTASKS', payload: allSubtasks });
      }
    }
    
    // Navigate to plan review step to show the loaded plan
    dispatch({ type: 'SET_STEP', payload: 3 });
  }, [state.savedPlans, setError]);

  const deleteSavedPlan = useCallback((planId: string): void => {
    try {
      deletePlan(planId);
      dispatch({ type: 'REMOVE_SAVED_PLAN', payload: planId });
    } catch (error) {
      console.error('Failed to delete plan:', error);
      setError('Failed to delete execution plan');
    }
  }, [setError]);

  const renameSavedPlan = useCallback((planId: string, newTitle: string, newDescription?: string): void => {
    try {
      renamePlan(planId, newTitle, newDescription);
      
      // Update the plan in state
      const updatedPlan = state.savedPlans.find(p => p.id === planId);
      if (updatedPlan) {
        const updated = {
          ...updatedPlan,
          title: newTitle,
          description: newDescription || updatedPlan.description,
          updatedAt: new Date()
        };
        dispatch({ type: 'UPDATE_SAVED_PLAN', payload: updated });
      }
    } catch (error) {
      console.error('Failed to rename plan:', error);
      setError('Failed to rename execution plan');
    }
  }, [state.savedPlans, setError]);

  const exportPlanJson = useCallback((plan: ExecutionPlan): void => {
    try {
      exportPlanAsJson(plan);
    } catch (error) {
      console.error('Export failed:', error);
      setError('Failed to export plan as JSON');
    }
  }, [setError]);

  const exportPlanMarkdown = useCallback((plan: ExecutionPlan): void => {
    try {
      exportPlanAsMarkdown(plan);
    } catch (error) {
      console.error('Export failed:', error);
      setError('Failed to export plan as Markdown');
    }
  }, [setError]);

  const importPlan = useCallback(async (file: File): Promise<void> => {
    try {
      const importedPlan = await importPlanFromJson(file);
      
      // Generate new ID to avoid conflicts
      const newPlan = {
        ...importedPlan,
        id: `imported-${Date.now()}`,
        updatedAt: new Date()
      };
      
      savePlan(newPlan);
      dispatch({ type: 'ADD_SAVED_PLAN', payload: newPlan });
    } catch (error) {
      console.error('Import failed:', error);
      setError('Failed to import execution plan');
      throw error;
    }
  }, [setError]);

  const clearAllSavedPlans = useCallback((): void => {
    try {
      clearAllPlans();
      dispatch({ type: 'CLEAR_ALL_SAVED_PLANS' });
    } catch (error) {
      console.error('Failed to clear plans:', error);
      setError('Failed to clear saved plans');
    }
  }, [setError]);

  const contextValue: AppContextType = {
    state,
    dispatch,
    setError,
    setLoading,
    nextStep,
    previousStep,
    resetState,
    updateConfig,
    exportConfig,
    importConfig,
    saveCurrentPlan,
    loadPlan,
    deleteSavedPlan,
    renameSavedPlan,
    exportPlanJson,
    exportPlanMarkdown,
    importPlan,
    clearAllSavedPlans
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};