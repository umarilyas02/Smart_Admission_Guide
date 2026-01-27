"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatbotWidget from "@/components/ChatbotWidget";

export default function QuizPage() {
  const [started, setStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  const questions = [
    {
      id: 1,
      question: "What does CPU stand for?",
      options: [
        "Central Processing Unit",
        "Computer Power Unit",
        "Control Processing Unit",
        "Central Power Unit",
      ],
      correct: 0,
    },
    {
      id: 2,
      question: "Which programming language is known as the 'language of the web'?",
      options: ["Python", "JavaScript", "Java", "C++"],
      correct: 1,
    },
    {
      id: 3,
      question: "What is the full form of RAM?",
      options: [
        "Random Access Memory",
        "Read Access Memory",
        "Rapid Access Memory",
        "Remote Access Memory",
      ],
      correct: 0,
    },
    {
      id: 4,
      question: "Which of the following is NOT a programming language?",
      options: ["Python", "HTML", "JavaScript", "Photoshop"],
      correct: 3,
    },
    {
      id: 5,
      question: "What does SQL stand for?",
      options: [
        "Structured Query Language",
        "Simple Query Language",
        "Standard Query Language",
        "System Query Language",
      ],
      correct: 0,
    },
  ];

  const handleStart = () => {
    setStarted(true);
    setCurrentQuestion(0);
    setAnswers({});
    setShowResults(false);
    setScore(0);
  };

  const handleAnswer = (optionIndex) => {
    setAnswers({ ...answers, [currentQuestion]: optionIndex });
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      calculateScore();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.correct) {
        correct++;
      }
    });
    setScore(correct);
    setShowResults(true);
  };

  const percentage = Math.round((score / questions.length) * 100);

  return (
    <div className="bg-secondary min-h-screen font-inter">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-10">
        {!started && !showResults ? (
          // Welcome Screen
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg text-center">
            <div className="text-6xl mb-4">📝</div>
            <h1 className="text-2xl sm:text-3xl font-bold text-blue-600 mb-4">
              Entry Test Practice Quiz
            </h1>
            <p className="text-gray-600 mb-6">
              Test your knowledge with this sample entry test. This quiz contains{" "}
              {questions.length} multiple-choice questions.
            </p>

            <div className="bg-blue-50 p-4 rounded-lg mb-6 text-left">
              <h3 className="font-semibold text-gray-800 mb-2">Quiz Details:</h3>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• Total Questions: {questions.length}</li>
                <li>• Time Limit: None (Practice Mode)</li>
                <li>• Passing Score: 60%</li>
                <li>• Question Type: Multiple Choice</li>
              </ul>
            </div>

            <button
              onClick={handleStart}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Start Quiz
            </button>
          </div>
        ) : showResults ? (
          // Results Screen
          <div className="space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg text-center">
              <div className="text-6xl mb-4">
                {percentage >= 60 ? "🎉" : "📚"}
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Quiz Completed!
              </h2>

              <div className="bg-blue-50 p-6 rounded-lg mb-6">
                <p className="text-5xl font-bold text-blue-600 mb-2">
                  {percentage}%
                </p>
                <p className="text-gray-700">
                  You scored {score} out of {questions.length}
                </p>
              </div>

              <p className="text-gray-600 mb-6">
                {percentage >= 80
                  ? "Excellent work! You're well prepared."
                  : percentage >= 60
                  ? "Good job! Keep practicing to improve."
                  : "Keep studying and try again!"}
              </p>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleStart}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Retake Quiz
                </button>
                <a
                  href="/dashboard"
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  Go to Dashboard
                </a>
              </div>
            </div>

            {/* Answers Review */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">
                Review Answers
              </h3>
              <div className="space-y-4">
                {questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className={`p-4 rounded-lg border ${
                      answers[idx] === q.correct
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    <p className="font-medium text-gray-800 mb-2">
                      {idx + 1}. {q.question}
                    </p>
                    <p className="text-sm text-gray-700">
                      Your answer: {q.options[answers[idx]] || "Not answered"}
                    </p>
                    {answers[idx] !== q.correct && (
                      <p className="text-sm text-green-700 mt-1">
                        Correct answer: {q.options[q.correct]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Quiz Screen
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg">
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>
                  Question {currentQuestion + 1} of {questions.length}
                </span>
                <span>{Math.round(((currentQuestion + 1) / questions.length) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${((currentQuestion + 1) / questions.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Question */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                {questions[currentQuestion].question}
              </h2>

              <div className="space-y-3">
                {questions[currentQuestion].options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition ${
                      answers[currentQuestion] === idx
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                    }`}
                  >
                    <span className="font-medium text-gray-700">
                      {String.fromCharCode(65 + idx)}.
                    </span>{" "}
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
                className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={handleNext}
                disabled={answers[currentQuestion] === undefined}
                className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {currentQuestion === questions.length - 1 ? "Finish" : "Next"}
              </button>
            </div>
          </div>
        )}
      </main>

      <Footer />
      <ChatbotWidget />
    </div>
  );
}
