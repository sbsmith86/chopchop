import { ClarificationQuestion, GitHubIssue, ExecutionPlan, Subtask } from '../types';

/**
 * OpenAI API client for generating plans and questions
 */
export class OpenAIClient {
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Generate clarification questions for an issue using OpenAI
   * Analyzes issue content to create specific, relevant questions
   */
  async generateClarificationQuestions(issue: { issueTitle: string; issueBody: string }): Promise<string[]> {
    try {
      const prompt = this.buildClarificationPrompt(issue);

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are an expert software project manager who helps break down complex issues into actionable tasks. Generate specific clarification questions that will help identify missing requirements, scope boundaries, and implementation details.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 800,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No content received from OpenAI API');
      }

      // Parse questions from response
      const questions = this.parseQuestionsFromResponse(content);

      // Validate we got meaningful questions
      if (questions.length === 0) {
        throw new Error('No valid questions extracted from OpenAI response');
      }

      return questions.slice(0, 5); // Limit to 5 questions max

    } catch (error) {
      console.warn('OpenAI API call failed, falling back to generic questions:', error);
      return this.getFallbackQuestions(issue);
    }
  }

  /**
   * Builds a comprehensive prompt for generating clarification questions
   */
  private buildClarificationPrompt(issue: { issueTitle: string; issueBody: string }): string {
    return `Analyze this GitHub issue and generate 3-5 specific clarification questions that would help break it down into actionable subtasks.

**Issue Title:** ${issue.issueTitle}

**Issue Description:**
${issue.issueBody || 'No description provided'}

**Instructions:**
- Focus on identifying unclear requirements, missing technical details, and scope boundaries
- Ask about dependencies, constraints, and acceptance criteria that aren't well defined
- Consider user experience, interface specifics, and implementation approaches
- Make questions specific to THIS issue, not generic project management questions
- Each question should help clarify something that would affect how the work is broken down

**Format:** Return only the questions, one per line, ending with a question mark.

**Example questions for reference (but make them specific to the actual issue):**
- What specific user roles need access to this feature?
- Are there any existing APIs or services this should integrate with?
- What are the performance requirements or constraints?
- How should error cases be handled?
- What testing approach should be used?

**Questions:**`;
  }

  /**
   * Parses questions from OpenAI response content
   */
  private parseQuestionsFromResponse(content: string): string[] {
    return content
      .split('\n')
      .map(line => line.trim())
      .filter(line => {
        // Remove empty lines, numbering, and bullets
        const cleaned = line.replace(/^[\d\-\*\•\s]+/, '').trim();
        // Must be a question (ends with ?) and have reasonable length
        return cleaned.endsWith('?') && cleaned.length > 10 && cleaned.length < 200;
      })
      .map(line => line.replace(/^[\d\-\*\•\s]+/, '').trim())
      .filter((question, index, array) => {
        // Remove duplicates and ensure uniqueness
        return array.indexOf(question) === index;
      });
  }

  /**
   * Provides meaningful fallback questions when API fails
   * Attempts to be somewhat relevant to the issue content
   */
  private getFallbackQuestions(issue: { issueTitle: string; issueBody: string }): string[] {
    const baseQuestions = [
      'What are the specific technical requirements for this feature?',
      'Are there any dependencies or constraints that should be considered?',
      'What should the acceptance criteria include for this to be complete?',
      'Who are the primary users or stakeholders for this change?',
      'What is the expected timeline or priority for this work?'
    ];

    // Try to make fallback questions slightly more relevant
    const title = issue.issueTitle.toLowerCase();
    const body = (issue.issueBody || '').toLowerCase();
    const content = `${title} ${body}`;

    // Add context-specific questions based on keywords
    const contextQuestions: string[] = [];

    if (content.includes('api') || content.includes('endpoint')) {
      contextQuestions.push('What API endpoints or integrations are required?');
    }

    if (content.includes('ui') || content.includes('interface') || content.includes('frontend')) {
      contextQuestions.push('What are the specific UI/UX requirements?');
    }

    if (content.includes('database') || content.includes('data') || content.includes('storage')) {
      contextQuestions.push('What are the data storage and retrieval requirements?');
    }

    if (content.includes('security') || content.includes('auth') || content.includes('permission')) {
      contextQuestions.push('What security or authentication considerations are needed?');
    }

    // Combine context questions with base questions, limit to 5
    return [...contextQuestions, ...baseQuestions].slice(0, 5);
  }

  /**
   * Generate execution plan from issue and clarifications
   */
  async generateExecutionPlan(issue: GitHubIssue, questions: ClarificationQuestion[]): Promise<ExecutionPlan> {
    // Mock implementation for now
    const content = `# Execution Plan for: ${issue.title}

## Overview
${issue.body}

## Implementation Steps
1. **Analysis Phase**
   - Review requirements and constraints
   - Identify dependencies and blockers

2. **Design Phase**
   - Create technical specifications
   - Plan architecture and data models

3. **Implementation Phase**
   - Set up development environment
   - Implement core functionality
   - Add tests and documentation

4. **Testing Phase**
   - Unit testing
   - Integration testing
   - User acceptance testing

5. **Deployment Phase**
   - Prepare deployment scripts
   - Deploy to staging environment
   - Deploy to production

## Success Criteria
- All acceptance criteria are met
- Code passes all tests
- Documentation is complete
- Feature is deployed successfully`;

    return {
      id: Date.now().toString(),
      title: `Plan for ${issue.title}`,
      description: 'AI-generated execution plan',
      content,
      steps: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Generate subtasks from execution plan
   */
  async generateSubtasks(plan: ExecutionPlan): Promise<Subtask[]> {
    // Mock implementation for now
    return [
      {
        id: '1',
        title: 'Set up development environment',
        description: 'Configure local development environment with necessary tools and dependencies',
        acceptanceCriteria: [
          'Development environment is configured',
          'All dependencies are installed',
          'Project builds successfully'
        ],
        guardrails: [
          'Use version-controlled configuration',
          'Document setup process'
        ],
        estimatedHours: 4,
        order: 1,
        isTooBig: false,
        tags: ['setup', 'environment']
      },
      {
        id: '2',
        title: 'Implement core functionality',
        description: 'Build the main features according to requirements',
        acceptanceCriteria: [
          'Core features are implemented',
          'Basic error handling is in place',
          'Code follows team standards'
        ],
        guardrails: [
          'Write tests for all new code',
          'Follow existing patterns and conventions'
        ],
        estimatedHours: 16,
        order: 2,
        isTooBig: true,
        tags: ['implementation', 'core']
      }
    ];
  }
}

/**
 * Generate clarification questions (standalone function)
 * Used by ClarificationQuestionPanel component
 */
export async function generateClarificationQuestions(
  config: { apiKey: string },
  issue: { issueTitle: string; issueBody: string }
): Promise<string[]> {
  if (!config.apiKey) {
    throw new Error('OpenAI API key is required');
  }

  if (!issue.issueTitle && !issue.issueBody) {
    throw new Error('Issue title or body is required');
  }

  const client = new OpenAIClient(config.apiKey);
  return client.generateClarificationQuestions(issue);
}