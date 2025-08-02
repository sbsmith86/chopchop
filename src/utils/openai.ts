import { ClarificationQuestion, GitHubIssue, ExecutionPlan, Subtask, PlanStep } from '../types';

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
        signal: AbortSignal.timeout(10000),
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

      const questions = this.parseQuestionsFromResponse(content);

      if (questions.length === 0) {
        throw new Error('No valid questions extracted from OpenAI response');
      }

      return questions.slice(0, 5);

    } catch (error) {
      console.warn('OpenAI API call failed, falling back to generic questions:', error);
      return this.getFallbackQuestions(issue);
    }
  }

  /**
   * Generate execution plan from issue and clarifications using OpenAI
   */
  async generateExecutionPlan(issue: GitHubIssue, questions: ClarificationQuestion[]): Promise<ExecutionPlan> {
    try {
      const prompt = this.buildPlanPrompt(issue, questions);

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(15000),
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are an expert software architect and project manager. Create detailed, actionable execution plans that can be broken down into specific development tasks. Focus on practical implementation steps, not just high-level planning.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 2000,
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
        throw new Error('No execution plan content received from OpenAI API');
      }

      const steps = this.parsePlanSteps(content);

      return {
        id: Date.now().toString(),
        title: `Execution Plan: ${issue.title}`,
        description: `AI-generated plan based on issue analysis and clarifications`,
        content: content.trim(),
        steps,
        createdAt: new Date(),
        updatedAt: new Date()
      };

    } catch (error) {
      console.warn('OpenAI execution plan generation failed, falling back to template:', error);
      return this.getFallbackPlan(issue, questions);
    }
  }

  /**
   * Generate subtasks from execution plan (MOCK - Issue 3 will implement this)
   */
  async generateSubtasks(plan: ExecutionPlan): Promise<Subtask[]> {
    // Mock implementation for now - Issue 3 will replace this
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

  // PRIVATE HELPER METHODS

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

**Questions:**`;
  }

  private parseQuestionsFromResponse(content: string): string[] {
    return content
      .split('\n')
      .map(line => line.trim())
      .filter(line => {
        const cleaned = line.replace(/^[\d\-\*\•\s]+/, '').trim();
        return cleaned.endsWith('?') && cleaned.length > 10 && cleaned.length < 200;
      })
      .map(line => line.replace(/^[\d\-\*\•\s]+/, '').trim())
      .filter((question, index, array) => array.indexOf(question) === index);
  }

  private getFallbackQuestions(issue: { issueTitle: string; issueBody: string }): string[] {
    const baseQuestions = [
      'What are the specific technical requirements for this feature?',
      'Are there any dependencies or constraints that should be considered?',
      'What should the acceptance criteria include for this to be complete?',
      'Who are the primary users or stakeholders for this change?',
      'What is the expected timeline or priority for this work?'
    ];

    const title = issue.issueTitle.toLowerCase();
    const body = (issue.issueBody || '').toLowerCase();
    const content = `${title} ${body}`;

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

    return [...contextQuestions, ...baseQuestions].slice(0, 5);
  }

  private buildPlanPrompt(issue: GitHubIssue, questions: ClarificationQuestion[]): string {
    const answeredQuestions = questions
      .filter(q => q.answer && q.answer.trim().length > 0)
      .map(q => `**Q: ${q.question}**\nA: ${q.answer}`)
      .join('\n\n');

    return `Create a detailed execution plan for implementing this GitHub issue. The plan should be practical, actionable, and suitable for breaking down into specific development tasks.

**ISSUE DETAILS:**
**Title:** ${issue.title}
**Description:**
${issue.body || 'No description provided'}

**CLARIFICATIONS PROVIDED:**
${answeredQuestions || 'No clarifications provided'}

**REQUIREMENTS:**
- Create a structured, step-by-step execution plan
- Focus on practical implementation phases (setup, development, testing, deployment)
- Include specific technical considerations based on the issue content
- Consider the clarifications provided when planning implementation approach
- Make each step actionable and measurable
- Include acceptance criteria for each major phase
- Consider dependencies, risks, and prerequisites

**FORMAT:**
Use markdown with the following structure:
# Execution Plan: [Issue Title]

## Overview
Brief summary of what will be implemented and why

## Prerequisites
- Any setup, dependencies, or preparation needed

## Implementation Phases

### Phase 1: [Name]
**Objective:** Clear goal for this phase
**Tasks:**
- Specific actionable tasks
- Each task should be clear and measurable

**Acceptance Criteria:**
- What defines completion of this phase
- Measurable outcomes

### Phase 2: [Name]
[Continue pattern...]

## Testing Strategy
How the implementation will be validated

## Deployment Considerations
How the changes will be deployed and monitored

## Success Criteria
Overall measures of successful completion

Generate a plan that's specific to THIS issue and the provided clarifications.`;
  }

  private parsePlanSteps(content: string): PlanStep[] {
    const steps: PlanStep[] = [];
    const lines = content.split('\n');
    let currentStep: Partial<PlanStep> | null = null;
    let stepOrder = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.match(/^#{2,4}\s+(Phase|Step)\s+\d+/i) || line.match(/^#{2,4}\s+\d+\./)) {
        if (currentStep && currentStep.title) {
          steps.push({
            id: `step-${stepOrder}`,
            title: currentStep.title,
            description: currentStep.description || '',
            order: stepOrder,
            subtasks: []
          });
        }

        stepOrder++;
        const title = line.replace(/^#{2,4}\s+/, '').replace(/^\d+\.\s*/, '').trim();
        currentStep = {
          title,
          description: '',
          order: stepOrder
        };
      }
      else if (currentStep && line.length > 0 && !line.startsWith('#')) {
        if (currentStep.description) {
          currentStep.description += '\n' + line;
        } else {
          currentStep.description = line;
        }
      }
    }

    if (currentStep && currentStep.title) {
      steps.push({
        id: `step-${stepOrder}`,
        title: currentStep.title,
        description: currentStep.description || '',
        order: stepOrder,
        subtasks: []
      });
    }

    return steps;
  }

  private getFallbackPlan(issue: GitHubIssue, questions: ClarificationQuestion[]): ExecutionPlan {
    const answeredQuestions = questions
      .filter(q => q.answer && q.answer.trim().length > 0)
      .map(q => `- **${q.question}** ${q.answer}`)
      .join('\n');

    const content = `# Execution Plan: ${issue.title}

## Overview
Implementation plan for: ${issue.title}

${issue.body}

## Clarifications Provided
${answeredQuestions || 'No additional clarifications provided'}

## Implementation Phases

### Phase 1: Analysis & Setup
**Objective:** Prepare development environment and analyze requirements
**Tasks:**
- Review all requirements and constraints
- Set up development environment
- Identify dependencies and potential blockers
- Create technical specifications

**Acceptance Criteria:**
- Development environment is configured
- Requirements are clearly documented
- Dependencies are identified and available

### Phase 2: Core Implementation
**Objective:** Implement the main functionality
**Tasks:**
- Implement core features according to specifications
- Add error handling and validation
- Follow coding standards and best practices
- Create unit tests for new functionality

**Acceptance Criteria:**
- Core functionality is implemented and working
- Code passes all tests
- Code follows team standards

### Phase 3: Integration & Testing
**Objective:** Ensure the implementation works within the larger system
**Tasks:**
- Integrate with existing systems/APIs
- Perform integration testing
- Conduct user acceptance testing
- Fix any identified issues

**Acceptance Criteria:**
- Integration is successful
- All tests pass
- User acceptance criteria are met

### Phase 4: Documentation & Deployment
**Objective:** Prepare for production deployment
**Tasks:**
- Complete documentation
- Prepare deployment scripts
- Deploy to staging environment
- Deploy to production with monitoring

**Acceptance Criteria:**
- Documentation is complete and accurate
- Deployment is successful
- Monitoring confirms system stability

## Testing Strategy
- Unit tests for all new functionality
- Integration tests for system interactions
- User acceptance testing with stakeholders
- Performance testing if applicable

## Success Criteria
- All acceptance criteria are met
- Code is deployed successfully to production
- Feature works as expected in live environment
- Documentation is complete`;

    return {
      id: Date.now().toString(),
      title: `Execution Plan: ${issue.title}`,
      description: 'Fallback execution plan template',
      content,
      steps: [
        {
          id: 'step-1',
          title: 'Analysis & Setup',
          description: 'Prepare development environment and analyze requirements',
          order: 1,
          subtasks: []
        },
        {
          id: 'step-2',
          title: 'Core Implementation',
          description: 'Implement the main functionality',
          order: 2,
          subtasks: []
        },
        {
          id: 'step-3',
          title: 'Integration & Testing',
          description: 'Ensure the implementation works within the larger system',
          order: 3,
          subtasks: []
        },
        {
          id: 'step-4',
          title: 'Documentation & Deployment',
          description: 'Prepare for production deployment',
          order: 4,
          subtasks: []
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
}

// STANDALONE FUNCTIONS

/**
 * Generate clarification questions (standalone function)
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

/**
 * Generate execution plan (standalone function)
 */
export async function generateExecutionPlan(
  config: { apiKey: string },
  issue: GitHubIssue,
  questions: ClarificationQuestion[]
): Promise<ExecutionPlan> {
  if (!config.apiKey) {
    throw new Error('OpenAI API key is required');
  }

  if (!issue.title && !issue.body) {
    throw new Error('Issue data is required');
  }

  const client = new OpenAIClient(config.apiKey);
  return client.generateExecutionPlan(issue, questions);
}