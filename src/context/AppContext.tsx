import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { AppState, AppStep, GitHubIssue, ClarificationQuestion, ExecutionPlan, Subtask, CreatedIssue, AppConfig, IssueCreationProgress } from '../types';
import { saveConfig, loadConfig, exportConfig as exportConfigFile, importConfig as importConfigFile } from '../utils/storage';

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
  showCompletion: false
};

type AppAction =
  | { type: 'SET_CONFIG'; payload: AppConfig }
  | { type: 'UPDATE_CONFIG'; payload: Partial<AppConfig> }
  | { type: 'LOAD_CONFIG'; payload: AppConfig }
  | { type: 'SET_ISSUE'; payload: GitHubIssue }
  | { type: 'SET_CLARIFICATION_QUESTIONS'; payload: ClarificationQuestion[] }
  | { type: 'UPDATE_CLARIFICATION_ANSWER'; payload: { questionId: string; answer: string } }
  | { type: 'SET_EXECUTION_PLAN'; payload: ExecutionPlan }
  | { type: 'SET_SUBTASKS'; payload: Subtask[] }
  | { type: 'UPDATE_SUBTASK'; payload: Subtask }
  | { type: 'SPLIT_SUBTASK'; payload: { originalId: string; newSubtasks: Subtask[] } }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_STEP'; payload: number }
  | { type: 'SET_CURRENT_STEP'; payload: AppStep }
  | { type: 'RESET_STATE' }
  | { type: 'SET_IS_CREATING'; payload: boolean }
  | { type: 'SET_CREATION_PROGRESS'; payload: IssueCreationProgress | null }
  | { type: 'SET_CREATED_ISSUES'; payload: CreatedIssue[] }
  | { type: 'SET_SHOW_COMPLETION'; payload: boolean }
  | { type: 'HIDE_COMPLETION' };

const appReducer = (state: AppState, action: AppAction): AppState => {
  console.log("reducer called. action: ", action.type, action.payload);
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
  }, []);

  const nextStep = useCallback((): void => {
    console.log('nextStep called - current step:', state.currentStep);

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

    console.log(`Step transition: ${state.currentStep} -> ${nextStepNumber}`);
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
    console.log('updateConfig called with:', config);
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
    importConfig
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