import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { AppState, Config, GitHubIssue, ClarificationQuestion, ExecutionPlan, Subtask } from '../types';

/**
 * Action types for the app reducer
 */
type AppAction =
  | { type: 'SET_STEP'; payload: number }
  | { type: 'SET_CONFIG'; payload: Config }
  | { type: 'SET_ISSUE'; payload: GitHubIssue }
  | { type: 'SET_CLARIFICATION_QUESTIONS'; payload: ClarificationQuestion[] }
  | { type: 'UPDATE_CLARIFICATION_ANSWER'; payload: { id: string; answer: string } }
  | { type: 'SET_EXECUTION_PLAN'; payload: ExecutionPlan }
  | { type: 'SET_SUBTASKS'; payload: Subtask[] }
  | { type: 'UPDATE_SUBTASK'; payload: Subtask }
  | { type: 'REORDER_SUBTASKS'; payload: Subtask[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET' };

/**
 * Initial state for the application
 */
const initialState: AppState = {
  currentStep: 0,
  config: null,
  issue: null,
  clarificationQuestions: [],
  executionPlan: null,
  subtasks: [],
  isLoading: false,
  error: null,
};

/**
 * App reducer function
 */
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };
    case 'SET_CONFIG':
      return { ...state, config: action.payload };
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
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

/**
 * Context interface
 */
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  setStep: (step: number) => void;
  setConfig: (config: Config) => void;
  setIssue: (issue: GitHubIssue) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

/**
 * App context provider component
 */
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const contextValue: AppContextType = {
    state,
    dispatch,
    setStep: (step: number) => dispatch({ type: 'SET_STEP', payload: step }),
    setConfig: (config: Config) => dispatch({ type: 'SET_CONFIG', payload: config }),
    setIssue: (issue: GitHubIssue) => dispatch({ type: 'SET_ISSUE', payload: issue }),
    setLoading: (loading: boolean) => dispatch({ type: 'SET_LOADING', payload: loading }),
    setError: (error: string | null) => dispatch({ type: 'SET_ERROR', payload: error }),
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

/**
 * Hook to use the app context
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}