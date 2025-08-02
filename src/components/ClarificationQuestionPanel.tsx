import { useEffect, useState, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { OpenAIClient } from '../utils/openai';

/**
 * Clarification questions panel with AI generation
 */
export default function ClarificationQuestionPanel() {
  const { state, dispatch, setStep, setError, setLoading } = useAppContext();
  const [hasGenerated, setHasGenerated] = useState(false);

  /**
   * Generate clarification questions using OpenAI
   */
  const generateQuestions = useCallback(async () => {
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
  }, [state.issue, state.config, dispatch, setError, setLoading]);

  // Auto-generate questions when entering this step
  useEffect(() => {
    if (state.issue && state.config && !hasGenerated && state.clarificationQuestions.length === 0) {
      generateQuestions();
    }
  }, [state.issue, state.config, hasGenerated, state.clarificationQuestions.length, generateQuestions]);

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
      <div className="h-full">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl border border-gray-200 dark:border-gray-700 h-full flex flex-col">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
              <p className="text-gray-600 dark:text-gray-400 text-lg">Generating clarification questions...</p>
              <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">This may take a few moments</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl border border-gray-200 dark:border-gray-700 h-full flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">❓</span>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Clarifying Questions
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                AI-generated questions to clarify requirements before creating the execution plan.
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {/* Issue Context */}
          {state.issue && (
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
              <div className="flex items-start space-x-3">
                <span className="text-blue-500 text-lg flex-shrink-0">📋</span>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Issue Context:
                  </h3>
                  <p className="text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {state.issue.title}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-4">
                    {state.issue.body}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="p-6">
            {/* No Questions Generated */}
            {!state.isLoading && state.clarificationQuestions.length === 0 && (
              <div className="py-12">
                <div className="text-center">
                  <span className="text-6xl">🤖</span>
                  <p className="text-gray-600 dark:text-gray-400 text-lg mt-4 mb-2">
                    No clarification questions generated yet.
                  </p>
                  <p className="text-gray-500 dark:text-gray-500 text-sm mb-6">
                    Click the button below to generate AI-powered questions based on your issue.
                  </p>
                  <button
                    onClick={generateQuestions}
                    disabled={!state.issue || !state.config}
                    className="inline-flex items-center px-6 py-3 text-base font-semibold text-white bg-purple-600 border border-transparent rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
                  >
                    <span className="mr-2">✨</span>
                    Generate Questions
                  </button>
                </div>
              </div>
            )}

            {/* Questions List - New Grid Layout */}
            {state.clarificationQuestions.length > 0 && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Questions ({state.clarificationQuestions.length})
                  </h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                    {state.clarificationQuestions.filter(q => q.answer?.trim()).length} of {state.clarificationQuestions.length} answered
                  </span>
                </div>
                
                {/* Questions in a responsive grid */}
                <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-1">
                  {state.clarificationQuestions.map((question, index) => (
                    <div key={question.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                      {/* Question Header */}
                      <div className="flex items-start space-x-4 mb-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                          <span className="text-purple-600 dark:text-purple-400 font-bold text-sm">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <label className="block text-base font-medium text-gray-900 dark:text-white leading-relaxed">
                            {question.question}
                          </label>
                        </div>
                      </div>

                      {/* Answer Input */}
                      <div className="ml-12">
                        <textarea
                          value={question.answer || ''}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          placeholder="Enter your answer here... Be as detailed as needed to clarify the requirements."
                          rows={4}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white text-base leading-relaxed transition-colors resize-none"
                        />
                        {question.answer?.trim() && (
                          <div className="mt-2 flex items-center text-sm text-green-600 dark:text-green-400">
                            <span className="mr-1">✓</span>
                            Answer provided
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions Footer */}
        {state.clarificationQuestions.length > 0 && (
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750 flex-shrink-0">
            <div className="flex justify-between items-center">
              <button
                onClick={handleSkip}
                className="inline-flex items-center px-6 py-3 text-base font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
              >
                <span className="mr-2">⏭️</span>
                Skip Questions
              </button>
              
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">
                    {state.clarificationQuestions.filter(q => q.answer?.trim()).length}/{state.clarificationQuestions.length}
                  </span>
                  <span className="ml-1">completed</span>
                </div>
                <button
                  onClick={handleProceed}
                  disabled={!allQuestionsAnswered}
                  className="inline-flex items-center px-6 py-3 text-base font-semibold text-white bg-purple-600 border border-transparent rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
                >
                  {allQuestionsAnswered ? (
                    <>
                      <span className="mr-2">🚀</span>
                      Proceed to Plan
                    </>
                  ) : (
                    <>
                      <span className="mr-2">📝</span>
                      Answer All Questions
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}