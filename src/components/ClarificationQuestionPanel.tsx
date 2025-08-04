import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { ClarificationQuestion } from '../types';
import { postClarificationQuestions, postClarificationAnswers } from '../utils/github';

/**
 * Panel for displaying and answering clarification questions
 */
export const ClarificationQuestionPanel: React.FC = () => {
  const { state, dispatch, setError, nextStep } = useAppContext();
  const [localAnswers, setLocalAnswers] = useState<{ [key: string]: string }>({});
  const [hasPostedQuestions, setHasPostedQuestions] = useState(false);
  const [isPostingAnswers, setIsPostingAnswers] = useState(false);

  // Initialize local answers from state
  React.useEffect(() => {
    const initialAnswers: { [key: string]: string } = {};
    state.clarificationQuestions.forEach(q => {
      initialAnswers[q.id] = q.answer || '';
    });
    setLocalAnswers(initialAnswers);
  }, [state.clarificationQuestions]);

  // Post questions to GitHub when they are first generated
  React.useEffect(() => {
    const postQuestionsToGitHub = async () => {
      if (
        state.clarificationQuestions.length > 0 && 
        !hasPostedQuestions && 
        state.issue?.url && 
        state.config.githubPat &&
        state.config.githubRepo
      ) {
        try {
          const questions = state.clarificationQuestions.map(q => q.question);
          await postClarificationQuestions(
            { pat: state.config.githubPat, repo: state.config.githubRepo },
            state.issue.url,
            questions
          );
          setHasPostedQuestions(true);
        } catch (error) {
          console.warn('Failed to post clarification questions to GitHub:', error);
          // Don't show error to user - this is optional functionality
        }
      }
    };

    postQuestionsToGitHub();
  }, [state.clarificationQuestions, hasPostedQuestions, state.issue?.url, state.config.githubPat, state.config.githubRepo]);

  const handleAnswerChange = (questionId: string, answer: string) => {
    // Update local state immediately for responsiveness
    setLocalAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));

    // Update global state
    dispatch({
      type: 'UPDATE_CLARIFICATION_ANSWER',
      payload: { questionId, answer }
    });
  };

  const handleProceed = async () => {
    // Validate that all required questions are answered
    const unansweredQuestions = state.clarificationQuestions.filter(
      q => q.required && (!localAnswers[q.id] || localAnswers[q.id].trim() === '')
    );

    if (unansweredQuestions.length > 0) {
      setError(`Please answer all required questions: ${unansweredQuestions.map(q => q.question).join(', ')}`);
      return;
    }

    setError(null);

    // Post answers to GitHub if we have them and a URL
    if (
      state.issue?.url && 
      state.config.githubPat &&
      state.config.githubRepo &&
      state.clarificationQuestions.some(q => localAnswers[q.id]?.trim())
    ) {
      try {
        setIsPostingAnswers(true);
        
        const answeredQuestions = state.clarificationQuestions
          .filter(q => localAnswers[q.id]?.trim())
          .map(q => ({
            question: q.question,
            answer: localAnswers[q.id]
          }));

        if (answeredQuestions.length > 0) {
          await postClarificationAnswers(
            { pat: state.config.githubPat, repo: state.config.githubRepo },
            state.issue.url,
            answeredQuestions
          );
        }
      } catch (error) {
        console.warn('Failed to post clarification answers to GitHub:', error);
        // Don't block progression - this is optional functionality
      } finally {
        setIsPostingAnswers(false);
      }
    }

    nextStep();
  };

  const handleSkipQuestions = () => {
    // Allow user to proceed without answering questions
    setError(null);
    nextStep();
  };

  if (state.clarificationQuestions.length === 0) {
    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">✅</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No Additional Questions Needed
          </h2>
          <p className="text-gray-600 mb-6">
            The issue description is clear enough to proceed with creating an execution plan.
          </p>
          <button
            onClick={nextStep}
            className="inline-flex items-center px-6 py-3 text-base font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 border border-transparent rounded-xl hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg transition-all"
          >
            <span className="mr-2">→</span>
            Continue to Plan Review
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Clarification Questions</h2>
        <p className="text-gray-600 mb-8">
          Please provide additional details to help create a more accurate execution plan.
        </p>

        <div className="space-y-6">
          {state.clarificationQuestions.map((question, index) => (
            <div
              key={question.id}
              className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-sm">
                      {index + 1}
                    </span>
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-3">
                    <h3 className="text-base font-semibold text-gray-900">
                      {question.question}
                    </h3>
                    {question.required && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                        Required
                      </span>
                    )}
                  </div>

                  {question.context && (
                    <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                      {question.context}
                    </p>
                  )}

                  {question.type === 'text' && (
                    <textarea
                      value={localAnswers[question.id] || ''}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                      placeholder="Enter your answer here..."
                    />
                  )}

                  {question.type === 'choice' && question.options && (
                    <div className="space-y-2">
                      {question.options.map((option, optionIndex) => (
                        <label
                          key={optionIndex}
                          className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <input
                            type="radio"
                            name={question.id}
                            value={option}
                            checked={localAnswers[question.id] === option}
                            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{option}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {question.type === 'number' && (
                    <input
                      type="number"
                      value={localAnswers[question.id] || ''}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Enter a number..."
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Progress Summary */}
        <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600">📝</span>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Progress</h3>
                <p className="text-sm text-gray-600">
                  {state.clarificationQuestions.filter(q => localAnswers[q.id] && localAnswers[q.id].trim() !== '').length} of {state.clarificationQuestions.length} questions answered
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleSkipQuestions}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all"
              >
                Skip Questions
              </button>
              
              <button
                onClick={handleProceed}
                disabled={isPostingAnswers}
                className="inline-flex items-center px-6 py-3 text-base font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 border border-transparent rounded-xl hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPostingAnswers ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Posting Answers...
                  </>
                ) : (
                  <>
                    <span className="mr-2">→</span>
                    Continue to Plan Review
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};