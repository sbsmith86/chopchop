/**
 * Core type definitions for ChopChop application
 */

export interface GitHubIssue {
  id: string;
  title: string;
  body: string;
  url?: string;
  number?: number;
  repository?: string;
  additionalContext?: string;
}

export interface GitHubIssueResponse {
  id: number;
  number: number;
  title: string;
  html_url: string;
  body: string | null;
  state: string;
  created_at: string;
  updated_at: string;
}

export interface ClarificationQuestion {
  id: string;
  question: string;
  answer?: string;
  required: boolean;
  type?: 'text' | 'choice' | 'number';
  options?: string[];
  context?: string;
}

export interface ExecutionPlan {
  id: string;
  title: string;
  description: string;
  content: string;
  steps: PlanStep[];
  createdAt: Date;
  updatedAt: Date;
  instructions?: string; // Instructions/context from original issue (README, coding standards, etc.)
}

export interface PlanStep {
  id: string;
  title: string;
  description: string;
  order: number;
  subtasks: Subtask[];
}

export interface Subtask {
  id: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  guardrails: string[];
  estimatedHours: number;
  order: number;
  isTooBig: boolean;
  tags: string[];
  dependsOn: string[]; // Add dependency tracking
  prerequisiteTaskIds: string[]; // IDs of tasks that must complete first
}

export interface AppConfig {
  githubPat?: string;
  githubRepo?: string; // Standardize on githubRepo
  openaiApiKey?: string;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    editorMode: 'markdown' | 'rich';
  };
}

export interface CreatedIssue {
  number: number;
  title: string;
  url: string;
  subtaskId: string; // Add this for linking to original subtask
}

// Fix the type mismatch - use numbers like the rest of the codebase
export type AppStep = 1 | 2 | 3 | 4 | 5;

export interface AppState {
  currentStep: number; // Use number instead of AppStep for consistency
  config: AppConfig;
  issue: GitHubIssue | null;
  clarificationQuestions: ClarificationQuestion[];
  executionPlan: ExecutionPlan | null;
  subtasks: Subtask[];
  createdIssues: CreatedIssue[];
  isLoading: boolean;
  error: string | null;
  savedPlans: ExecutionPlan[]; // Add saved plans to state
}

// GitHub API types
export interface CreateIssueRequest {
  title: string;
  body: string;
  labels?: string[];
  assignees?: string[];
}

export interface GitHubConfig {
  pat: string;
  repo: string;
}

// Add this type for the storage utility
export interface Config {
  githubPat?: string;
  githubRepo?: string; // Match AppConfig
  openaiApiKey?: string;
  preferences?: {
    theme: 'light' | 'dark' | 'system';
    editorMode: 'markdown' | 'rich';
  };
}

// Add to existing types - no changes to existing interfaces

export interface SubtaskSplit {
  originalTaskId: string;
  newSubtasks: Omit<Subtask, 'id' | 'order'>[];
}

// Add these interfaces to your existing types (they might already exist)

export interface IssueCreationProgress {
  currentIssue: number;
  totalIssues: number;
  currentTask: string;
  status: 'creating' | 'completed' | 'error';
  createdIssue?: CreatedIssue;
  error?: string;
}

export interface CreationState {
  isCreating: boolean;
  progress: IssueCreationProgress | null;
  createdIssues: CreatedIssue[];
  completedAt: Date | null;
  errors: string[];
}