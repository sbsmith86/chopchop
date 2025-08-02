/**
 * Core types for the ChopChop application
 */

export interface Config {
  githubPat: string;
  githubRepo: string;
  openaiApiKey: string;
}

export interface GitHubIssue {
  title: string;
  body: string;
  url?: string;
}

export interface ClarificationQuestion {
  id: string;
  question: string;
  answer?: string;
}

export interface ExecutionPlan {
  content: string;
}

export interface Subtask {
  id: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  guardrails: string[];
  isTooBig: boolean;
  order: number;
}

export interface AppState {
  currentStep: number;
  config: Config | null;
  issue: GitHubIssue | null;
  clarificationQuestions: ClarificationQuestion[];
  executionPlan: ExecutionPlan | null;
  subtasks: Subtask[];
  isLoading: boolean;
  error: string | null;
}

export type WorkflowStep = 
  | 'config'
  | 'input' 
  | 'clarification'
  | 'plan'
  | 'subtasks'
  | 'approval';

export interface CreatedIssue {
  number: number;
  url: string;
  title: string;
}