import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { AppState, AppConfig, GitHubIssue, ClarificationQuestion, ExecutionPlan, Subtask, AppStep, CreatedIssue } from '../types';

/**
 * Action types for the ChopChop app reducer
 */
type AppAction =
  | { type: 'SET_STEP'; payload: AppStep }
  | { type: 'SET_CONFIG'; payload: Partial<AppConfig> }
  | { type: 'SET_ISSUE'; payload: GitHubIssue | null }
  | { type: 'SET_CLARIFICATION_QUESTIONS'; payload: ClarificationQuestion[] }
  | { type: 'UPDATE_CLARIFICATION_ANSWER'; payload: { id: string; answer: string } }
  | { type: 'SET_EXECUTION_PLAN'; payload: ExecutionPlan | null }
  | { type: 'SET_SUBTASKS'; payload: Subtask[] }
  | { type: 'UPDATE_SUBTASK'; payload: Subtask }
  | { type: 'REORDER_SUBTASKS'; payload: Subtask[] }
  | { type: 'SET_CREATED_ISSUES'; payload: CreatedIssue[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET' };

/**
 * Default configuration for ChopChop application
 */
const DEFAULT_CONFIG: AppConfig = {
  preferences: {
    theme: 'system',
    editorMode: 'markdown'
  }
};

/**
 * Load configuration from localStorage with proper error handling
 * @returns AppConfig with fallback to defaults
 */
const loadStoredConfig = (): AppConfig => {
  try {
    const stored = localStorage.getItem('chopchop-config');
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_CONFIG, ...parsed };
    }
    return DEFAULT_CONFIG;
  } catch (error) {
    console.error('Failed to load stored config:', error);
    return DEFAULT_CONFIG;
  }
};

/**
 * Initial state for the ChopChop application
 */
const initialState: AppState = {
  currentStep: 'input',
  config: loadStoredConfig(),
  issue: null,
  clarificationQuestions: [],
  executionPlan: null,
  subtasks: [],
  createdIssues: [],
  isLoading: false,
  error: null,
};

/**
 * ChopChop app reducer function
 * Manages all application state transitions
 * @param state - Current application state
 * @param action - Action to apply
 * @returns Updated application state
 */
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };

    case 'SET_CONFIG': {
      const newConfig = { ...state.config, ...action.payload };
      // Persist to localStorage with error handling
      try {
        localStorage.setItem('chopchop-config', JSON.stringify(newConfig));
      } catch (error) {
        console.error('Failed to save config to localStorage:', error);
      }
      return { ...state, config: newConfig };
    }

    case 'SET_ISSUE':
      return { ...state, issue: action.payload };

    case 'SET_CLARIFICATION_QUESTIONS':
      return { ...state, clarificationQuestions: action.payload };

    case 'UPDATE_CLARIFICATION_ANSWER':
      return {
        ...state,
        clarificationQuestions: state.clarificationQuestions.map(q =>
          q.id === action.payload.id ? { ...q, answer: action.payload.answer } : q
        ),
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
        ),
      };

    case 'REORDER_SUBTASKS':
      return { ...state, subtasks: action.payload };

    case 'SET_CREATED_ISSUES':
      return { ...state, createdIssues: action.payload };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'RESET':
      return { ...initialState, config: state.config }; // Keep config on reset

    default:
      return state;
  }
}

/**
 * ChopChop application context interface
 */
interface AppContextType {
  // State
  state: AppState;
  dispatch: React.Dispatch<AppAction>;

  // Configuration helpers
  updateConfig: (updates: Partial<AppConfig>) => void;
  exportConfig: () => void;
  importConfig: (file: File) => Promise<void>;
  isConfigured: boolean;

  // Navigation helpers
  setStep: (step: AppStep) => void;
  nextStep: () => void;

  // Data helpers
  setIssue: (issue: GitHubIssue | null) => void;
  updateQuestionAnswer: (questionId: string, answer: string) => void;

  // UI helpers
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetState: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

/**
 * ChopChop application context provider
 * Manages all application state and provides helper functions
 * @param children - React children components
 * @returns JSX.Element with context provider
 */
export function AppProvider({ children }: { children: ReactNode }): JSX.Element {
  const [state, dispatch] = useReducer(appReducer, initialState);

  /**
   * Updates configuration and persists to localStorage
   * @param updates - Partial configuration updates
   */
  const updateConfig = useCallback((updates: Partial<AppConfig>): void => {
    dispatch({ type: 'SET_CONFIG', payload: updates });
  }, []);

  /**
   * Exports configuration as downloadable JSON file
   */
  const exportConfig = useCallback((): void => {
    try {
      const dataStr = JSON.stringify(state.config, null, 2);
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
      dispatch({ type: 'SET_ERROR', payload: 'Failed to export configuration file' });
    }
  }, [state.config]);

  /**
   * Imports configuration from uploaded JSON file
   * @param file - JSON configuration file
   */
  const importConfig = useCallback(async (file: File): Promise<void> => {
    try {
      const text = await file.text();
      const importedConfig = JSON.parse(text);

      // Validate basic config structure
      if (typeof importedConfig !== 'object' || !importedConfig.preferences) {
        throw new Error('Invalid configuration file format');
      }

      updateConfig(importedConfig);
    } catch (error) {
      console.error('Failed to import config:', error);
      throw new Error('Invalid configuration file format');
    }
  }, [updateConfig]);

  /**
   * Determines if the application is properly configured
   */
  const isConfigured = Boolean(
    state.config.githubPat &&
    state.config.defaultRepo &&
    state.config.openaiApiKey
  );

  /**
   * Advances to the next step in the workflow
   */
  const nextStep = useCallback((): void => {
    const stepOrder: AppStep[] = ['input', 'clarification', 'plan', 'subtasks', 'execution', 'approval'];
    const currentIndex = stepOrder.indexOf(state.currentStep);
    if (currentIndex < stepOrder.length - 1) {
      dispatch({ type: 'SET_STEP', payload: stepOrder[currentIndex + 1] });
    }
  }, [state.currentStep]);

  /**
   * Updates the answer for a specific clarification question
   * @param questionId - Unique question identifier
   * @param answer - User's answer
   */
  const updateQuestionAnswer = useCallback((questionId: string, answer: string): void => {
    dispatch({ type: 'UPDATE_CLARIFICATION_ANSWER', payload: { id: questionId, answer } });
  }, []);

  /**
   * Resets application state while preserving configuration
   */
  const resetState = useCallback((): void => {
    dispatch({ type: 'RESET' });
  }, []);

  const contextValue: AppContextType = {
    state,
    dispatch,
    updateConfig,
    exportConfig,
    importConfig,
    isConfigured,
    setStep: (step: AppStep) => dispatch({ type: 'SET_STEP', payload: step }),
    nextStep,
    setIssue: (issue: GitHubIssue | null) => dispatch({ type: 'SET_ISSUE', payload: issue }),
    updateQuestionAnswer,
    setLoading: (loading: boolean) => dispatch({ type: 'SET_LOADING', payload: loading }),
    setError: (error: string | null) => dispatch({ type: 'SET_ERROR', payload: error }),
    resetState,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

/**
 * Hook to access the ChopChop application context
 * @throws Error if used outside of AppProvider
 * @returns AppContextType context object
 */
export function useAppContext(): AppContextType {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}