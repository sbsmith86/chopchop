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
}

export interface ExecutionPlan {
  id: string;
  title: string;
  description: string;
  content: string;
  steps: PlanStep[];
  createdAt: Date;
  updatedAt: Date;
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
  id: number;
  title: string;
  url: string;
  number: number;
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