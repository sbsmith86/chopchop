import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { ClarificationQuestion } from '../types';
import { OpenAIClient } from '../utils/openai';

/**
 * Clarification questions panel with AI generation
 */
export default function ClarificationQuestionPanel() {
  const { state, dispatch, setStep, setError, setLoading } = useAppContext();
  const [hasGenerated, setHasGenerated] = useState(false);

  // Auto-generate questions when entering this step
  useEffect(() => {
    if (state.issue && state.config && !hasGenerated && state.clarificationQuestions.length === 0) {
      generateQuestions();
    }
  }, [state.issue, state.config, hasGenerated, state.clarificationQuestions.length]);

  /**
   * Generate clarification questions using OpenAI
   */
  const generateQuestions = async () => {
    if (!state.issue || !state.config) {
      setError('Issue and configuration are required');
      return;
    }

    setLoading(true);
    setError(null);
    setHasGenerated(true);

    try {
      const openaiClient = new OpenAIClient(state.config.openaiApiKey);
      const questions = await openaiClient.generateClarificationQuestions(state.issue);
      
      dispatch({ type: 'SET_CLARIFICATION_QUESTIONS', payload: questions });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to generate clarification questions');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle answer change for a question
   */
  const handleAnswerChange = (questionId: string, answer: string) => {
    dispatch({ 
      type: 'UPDATE_CLARIFICATION_ANSWER', 
      payload: { id: questionId, answer } 
    });
  };

  /**
   * Check if all questions are answered
   */
  const allQuestionsAnswered = state.clarificationQuestions.every(q => q.answer?.trim());

  /**
   * Proceed to plan generation
   */
  const handleProceed = () => {
    if (!allQuestionsAnswered) {
      setError('Please answer all clarification questions before proceeding');
      return;
    }
    
    setError(null);
    setStep(3); // Move to Plan Review step
  };

  /**
   * Skip clarification (proceed with empty answers)
   */
  const handleSkip = () => {
    setError(null);
    setStep(3); // Move to Plan Review step
  };

  if (state.isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Generating clarification questions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
            ❓ Clarifying Questions
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            AI-generated questions to clarify requirements before planning.
          </p>
        </div>

        <div className="px-6 py-4">
          {/* Issue Context */}
          {state.issue && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-750 rounded-md">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Issue Context:
              </h3>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {state.issue.title}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                {state.issue.body}
              </p>
            </div>
          )}

          {/* No Questions Generated */}
          {!state.isLoading && state.clarificationQuestions.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                No clarification questions generated yet.
              </p>
              <button
                onClick={generateQuestions}
                disabled={!state.issue || !state.config}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Generate Questions
              </button>
            </div>
          )}

          {/* Questions List */}
          {state.clarificationQuestions.length > 0 && (
            <div className="space-y-6">
              {state.clarificationQuestions.map((question, index) => (
                <div key={question.id} className="border border-gray-200 dark:border-gray-600 rounded-md p-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {index + 1}. {question.question}
                  </label>
                  <textarea
                    value={question.answer || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    placeholder="Enter your answer here..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          {state.clarificationQuestions.length > 0 && (
            <div className="mt-6 flex justify-between items-center">
              <button
                onClick={handleSkip}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Skip Questions
              </button>
              
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {state.clarificationQuestions.filter(q => q.answer?.trim()).length} of {state.clarificationQuestions.length} answered
                </span>
                <button
                  onClick={handleProceed}
                  disabled={!allQuestionsAnswered}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {allQuestionsAnswered ? 'Proceed to Plan' : 'Answer All Questions'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}