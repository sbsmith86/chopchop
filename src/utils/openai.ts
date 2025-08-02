import { Config, GitHubIssue, ClarificationQuestion, ExecutionPlan, Subtask } from '../types';

/**
 * OpenAI API client for generating clarification questions and execution plans
 */
export class OpenAIClient {
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Generate clarification questions for a GitHub issue
   */
  async generateClarificationQuestions(issue: GitHubIssue): Promise<ClarificationQuestion[]> {
    const prompt = `Analyze this GitHub issue and generate 3-5 clarifying questions that would help create a more detailed execution plan.

Issue Title: ${issue.title}
Issue Description: ${issue.body}

Generate questions that:
- Identify missing requirements or unclear specifications
- Clarify technical constraints or preferences  
- Ask about scope boundaries and edge cases
- Understand testing or validation expectations
- Identify dependencies or integration points

Return only the questions, one per line, without numbering or extra formatting.`;

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that generates clarifying questions for software development issues.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';
      
      const questions = content
        .split('\n')
        .filter(line => line.trim())
        .map((question, index) => ({
          id: `q-${Date.now()}-${index}`,
          question: question.trim(),
        }));

      return questions;
    } catch (error) {
      console.error('Failed to generate clarification questions:', error);
      throw new Error('Failed to generate clarification questions. Please check your API key and try again.');
    }
  }

  /**
   * Generate execution plan based on issue and clarification answers
   */
  async generateExecutionPlan(
    issue: GitHubIssue, 
    questions: ClarificationQuestion[]
  ): Promise<ExecutionPlan> {
    const answeredQuestions = questions
      .filter(q => q.answer)
      .map(q => `Q: ${q.question}\nA: ${q.answer}`)
      .join('\n\n');

    const prompt = `Create a detailed, step-by-step execution plan for this GitHub issue.

Issue Title: ${issue.title}
Issue Description: ${issue.body}

Clarifications:
${answeredQuestions}

Create a comprehensive execution plan that:
- Breaks down the work into logical, ordered steps
- Includes planning, implementation, testing, and documentation phases
- Considers edge cases and error handling
- Includes code review and quality assurance steps
- Specifies any necessary setup or configuration steps

Format the plan as markdown with clear headings and bullet points.`;

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that creates detailed execution plans for software development tasks.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1500,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';
      
      return { content };
    } catch (error) {
      console.error('Failed to generate execution plan:', error);
      throw new Error('Failed to generate execution plan. Please check your API key and try again.');
    }
  }

  /**
   * Generate subtasks from execution plan
   */
  async generateSubtasks(plan: ExecutionPlan): Promise<Subtask[]> {
    const prompt = `Break down this execution plan into atomic, actionable subtasks.

Execution Plan:
${plan.content}

Create subtasks that:
- Each can be completed in under 2 hours
- Have a single, clear objective
- Include specific acceptance criteria
- Include appropriate guardrails to prevent scope creep
- Are ordered logically for execution

For each subtask, provide:
1. Title (concise, action-oriented)
2. Description (what needs to be done)
3. Acceptance Criteria (how to know it's complete)
4. Guardrails (what NOT to do or change)

Format as JSON array with this structure:
[
  {
    "title": "Task title",
    "description": "Detailed description",
    "acceptanceCriteria": ["criterion 1", "criterion 2"],
    "guardrails": ["guardrail 1", "guardrail 2"]
  }
]`;

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that breaks down execution plans into atomic subtasks. Always respond with valid JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.5,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';
      
      try {
        const subtaskData = JSON.parse(content);
        return subtaskData.map((task: any, index: number) => ({
          id: `task-${Date.now()}-${index}`,
          title: task.title,
          description: task.description,
          acceptanceCriteria: task.acceptanceCriteria || [],
          guardrails: task.guardrails || [],
          isTooBig: this.detectTooBig(task.title, task.description),
          order: index,
        }));
      } catch (parseError) {
        throw new Error('Failed to parse subtasks response');
      }
    } catch (error) {
      console.error('Failed to generate subtasks:', error);
      throw new Error('Failed to generate subtasks. Please check your API key and try again.');
    }
  }

  /**
   * Detect if a task is too big based on heuristics
   */
  private detectTooBig(title: string, description: string): boolean {
    const text = `${title} ${description}`.toLowerCase();
    
    // Check for multiple actions
    const multipleActionWords = ['and', 'also', 'then', 'plus', 'additionally'];
    const hasMultipleActions = multipleActionWords.some(word => text.includes(` ${word} `));
    
    // Check for multiple resources/files
    const multipleResourceIndicators = ['files', 'components', 'modules', 'services'];
    const hasMultipleResources = multipleResourceIndicators.some(word => text.includes(word));
    
    // Check for complex operations
    const complexIndicators = ['refactor', 'redesign', 'overhaul', 'rewrite'];
    const hasComplexOperations = complexIndicators.some(word => text.includes(word));
    
    return hasMultipleActions || hasMultipleResources || hasComplexOperations;
  }
}