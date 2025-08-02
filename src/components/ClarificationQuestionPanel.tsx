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
        <div className="h-full flex flex-col">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-6"></div>
              <p className="text-gray-700 text-lg font-medium mb-2">Generating clarification questions...</p>
              <p className="text-gray-500 text-sm">Our AI is analyzing your issue to create relevant questions</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="px-6 py-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
              ❓
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Clarification Questions
              </h2>
              <p className="text-gray-600 leading-relaxed">
                AI-generated questions to clarify requirements and ensure we understand your issue completely.
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {/* Issue Context */}
          {state.issue && (
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600">📋</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Issue Context
                  </h3>
                  <p className="text-base font-medium text-gray-700 mb-2">
                    {state.issue.title}
                  </p>
                  <p className="text-sm text-gray-600 leading-relaxed line-clamp-4">
                    {state.issue.body}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="p-6">
            {/* No Questions Generated */}
            {!state.isLoading && state.clarificationQuestions.length === 0 && (
              <div className="py-16">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <span className="text-3xl">🤖</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Ready to Generate Questions
                  </h3>
                  <p className="text-gray-600 text-base mb-6 max-w-md mx-auto">
                    Our AI will analyze your issue and create targeted questions to clarify requirements and gather missing details.
                  </p>
                  <button
                    onClick={generateQuestions}
                    disabled={!state.issue || !state.config}
                    className="inline-flex items-center px-6 py-3 text-base font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-600 border border-transparent rounded-xl hover:from-purple-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all"
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
                  <h3 className="text-lg font-semibold text-gray-900">
                    Clarification Questions ({state.clarificationQuestions.length})
                  </h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-600 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${(state.clarificationQuestions.filter(q => q.answer?.trim()).length / state.clarificationQuestions.length) * 100}%` 
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-600">
                      {state.clarificationQuestions.filter(q => q.answer?.trim()).length} / {state.clarificationQuestions.length}
                    </span>
                  </div>
                </div>
                
                {/* Questions in a responsive grid */}
                <div className="space-y-6">
                  {state.clarificationQuestions.map((question, index) => (
                    <div key={question.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
                      {/* Question Header */}
                      <div className="flex items-start space-x-4 mb-4">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                          question.answer?.trim() 
                            ? 'bg-gradient-to-br from-green-100 to-emerald-100' 
                            : 'bg-gradient-to-br from-purple-100 to-pink-100'
                        }`}>
                          <span className={`font-bold text-sm ${
                            question.answer?.trim() ? 'text-green-600' : 'text-purple-600'
                          }`}>
                            {question.answer?.trim() ? '✓' : index + 1}
                          </span>
                        </div>
                        <div className="flex-1">
                          <label className="block text-base font-medium text-gray-900 leading-relaxed">
                            {question.question}
                          </label>
                        </div>
                      </div>

                      {/* Answer Input */}
                      <div className="ml-14">
                        <textarea
                          value={question.answer || ''}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          placeholder="Enter your answer here... Be as detailed as needed to clarify the requirements."
                          rows={4}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-base leading-relaxed transition-all resize-none hover:border-gray-400"
                        />
                        {question.answer?.trim() && (
                          <div className="mt-3 flex items-center text-sm text-green-600">
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
          <div className="p-6 border-t border-gray-100 bg-gray-50 flex-shrink-0">
            <div className="flex justify-between items-center">
              <button
                onClick={handleSkip}
                className="inline-flex items-center px-6 py-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all shadow-sm"
              >
                <span className="mr-2">⏭️</span>
                Skip Questions
              </button>
              
              <div className="flex items-center space-x-6">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">
                    {state.clarificationQuestions.filter(q => q.answer?.trim()).length}/{state.clarificationQuestions.length}
                  </span>
                  <span className="ml-1">questions answered</span>
                </div>
                <button
                  onClick={handleProceed}
                  disabled={!allQuestionsAnswered}
                  className={`inline-flex items-center px-6 py-3 text-base font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all shadow-lg ${
                    allQuestionsAnswered
                      ? 'text-white bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700'
                      : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                  }`}
                >
                  {allQuestionsAnswered ? (
                    <>
                      <span className="mr-2">🚀</span>
                      Continue to Plan Review
                    </>
                  ) : (
                    <>
                      <span className="mr-2">📝</span>
                      Answer All Questions First
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