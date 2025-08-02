import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { generateClarificationQuestions } from '../utils/openai';
import { ClarificationQuestion } from '../types';

/**
 * Panel for collecting clarification questions and answers from users
 * Uses AI to generate relevant questions based on the issue content
 */
export const ClarificationQuestionPanel: React.FC = () => {
  const { state, dispatch, setError, setLoading, nextStep } = useAppContext();
  const [isGenerating, setIsGenerating] = useState(false);

  /**
   * Generates clarification questions using OpenAI API
   */
  const generateQuestions = async (): Promise<void> => {
    if (!state.issue) {
      setError('No issue data available for generating questions');
      return;
    }

    if (!state.config.openaiApiKey) {
      setError('OpenAI API key is required. Please configure it in settings.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const questions = await generateClarificationQuestions(
        { apiKey: state.config.openaiApiKey },
        {
          issueTitle: state.issue.title,
          issueBody: state.issue.body
        }
      );

      // Convert to ClarificationQuestion format
      const clarificationQuestions: ClarificationQuestion[] = questions.map((question, index) => ({
        id: `q-${Date.now()}-${index}`,
        question,
        answer: '',
        required: true
      }));

      dispatch({ type: 'SET_CLARIFICATION_QUESTIONS', payload: clarificationQuestions });

      // Show success feedback if using fallback questions
      if (questions.some(q => q.includes('specific technical requirements'))) {
        setError('Using fallback questions due to OpenAI API issue. Questions may be less specific.');
      }

    } catch (error) {
      console.error('Failed to generate questions:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate clarification questions';
      setError(`${errorMessage}. Please check your OpenAI API key and try again.`);
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Auto-generate questions when component mounts
   */
  useEffect(() => {
    if (state.clarificationQuestions.length === 0 && state.issue) {
      generateQuestions();
    }
  }, [state.issue]);

  /**
   * Updates an answer for a specific question
   */
  const updateAnswer = (questionId: string, answer: string): void => {
    dispatch({
      type: 'UPDATE_CLARIFICATION_ANSWER',
      payload: { id: questionId, answer }
    });
  };

  /**
   * Checks if all required questions are answered
   */
  const canProceed = (): boolean => {
    return state.clarificationQuestions.every(q =>
      !q.required || (q.answer && q.answer.trim().length > 0)
    );
  };

  /**
   * Proceeds to next step after validation
   */
  const handleNext = (): void => {
    if (canProceed()) {
      nextStep();
    }
  };

  if (isGenerating) {
    return (
      <div className="p-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="w-12 h-12 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600"></div>
          <p className="text-gray-600 font-medium">Analyzing issue and generating clarification questions...</p>
          <p className="text-sm text-gray-500">This may take a few seconds</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Clarification Questions</h2>
          <p className="text-gray-600 mt-2">
            AI-generated questions based on your issue to help create a better execution plan.
          </p>
          {state.issue && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Analyzing Issue:</h3>
              <p className="text-blue-800 font-medium">{state.issue.title}</p>
              {state.issue.body && (
                <p className="text-blue-700 text-sm mt-1 line-clamp-3">
                  {state.issue.body.substring(0, 200)}...
                </p>
              )}
            </div>
          )}
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {state.clarificationQuestions.map((question, index) => (
            <div
              key={question.id}
              className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100"
            >
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold text-sm">{index + 1}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-3">
                    {question.question}
                    {question.required && <span className="text-red-500 ml-1">*</span>}
                  </h3>
                  <textarea
                    value={question.answer || ''}
                    onChange={(e) => updateAnswer(question.id, e.target.value)}
                    placeholder="Enter your answer here..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-vertical"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No questions generated */}
        {state.clarificationQuestions.length === 0 && !isGenerating && (
          <div className="text-center py-16">
            <div className="flex flex-col items-center space-y-6">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center">
                <span className="text-3xl">❓</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Questions Generated
                </h3>
                <p className="text-gray-600 text-base mb-6 max-w-md mx-auto">
                  We couldn't generate clarification questions for this issue. You can proceed to plan generation or try regenerating questions.
                </p>
              </div>
              <button
                onClick={generateQuestions}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Generate Questions
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        {state.clarificationQuestions.length > 0 && (
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={generateQuestions}
              disabled={isGenerating}
              className="px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all border border-blue-200 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? 'Generating...' : 'Regenerate Questions'}
            </button>

            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue to Plan Review
            </button>
          </div>
        )}
      </div>
    </div>
  );
};