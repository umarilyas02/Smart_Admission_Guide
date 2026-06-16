"use client";

import { useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  ClipboardList,
  Sparkles,
  Clock,
  Target,
  Settings,
  Monitor,
  HeartPulse,
  BarChart2,
  Palette,
  FlaskConical,
  Zap,
  Rocket,
  RefreshCw,
  AlertTriangle,
  Check,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatbotWidget from "@/components/ChatbotWidget";

const questions = [
  {
    id: 1,
    question: "Which subject excites you the most?",
    options: [
      "Mathematics & Statistics",
      "Biology & Chemistry",
      "Programming & Computers",
      "Business & Economics",
      "History, Literature & Social Studies",
      "Physics & Engineering concepts",
    ],
  },
  {
    id: 2,
    question: "How do you prefer to solve problems?",
    options: [
      "Analyzing data and spotting patterns",
      "Experimenting hands-on in a lab",
      "Writing code or building digital solutions",
      "Collaborating and persuading people",
      "Researching and reading deeply",
    ],
  },
  {
    id: 3,
    question: "Which career path appeals to you most?",
    options: [
      "Developing software or AI systems",
      "Treating patients and saving lives",
      "Running or managing a business",
      "Designing buildings or structures",
      "Teaching, researching, or educating",
      "Working in media, law, or social services",
    ],
  },
  {
    id: 4,
    question: "What would you most enjoy doing on a free weekend?",
    options: [
      "Coding a personal project or building an app",
      "Reading science books or doing experiments",
      "Learning about investing or starting a business",
      "Sketching designs, writing, or making art",
      "Volunteering or helping the community",
      "Playing strategy games or solving puzzles",
    ],
  },
  {
    id: 5,
    question: "Which environment sounds ideal to work in?",
    options: [
      "In front of a computer, building software",
      "In a hospital or clinic helping patients",
      "In an office managing teams and projects",
      "In a lab conducting research and experiments",
      "On-site — construction, machines, or outdoors",
      "In a studio, court, or classroom",
    ],
  },
  {
    id: 6,
    question: "What kind of global problem do you most want to solve?",
    options: [
      "Cybersecurity and technological gaps",
      "Diseases and mental health crises",
      "Poverty, business inequality, and economic growth",
      "Infrastructure, transport, and housing",
      "Climate change and environmental damage",
      "Injustice, education gaps, and social issues",
    ],
  },
  {
    id: 7,
    question: "Which of these best describes your personality?",
    options: [
      "Logical — I love puzzles and structured thinking",
      "Empathetic — I care deeply about people's wellbeing",
      "Creative — I love expressing myself and making things",
      "Ambitious — I'm driven by goals and leadership",
      "Curious — I always want to understand how things work",
      "Communicative — I'm great at expressing and persuading",
    ],
  },
  {
    id: 8,
    question: "In a group project, what role do you naturally take?",
    options: [
      "The techie — I handle the digital or analytical parts",
      "The leader — I organize and manage the team",
      "The researcher — I gather and organize information",
      "The presenter — I communicate the ideas clearly",
      "The designer — I focus on visuals and creativity",
    ],
  },
  {
    id: 9,
    question: "What motivates you most in life?",
    options: [
      "Building innovative products and technologies",
      "Helping people live healthier, better lives",
      "Financial success and entrepreneurship",
      "Discovering new knowledge and advancing science",
      "Making a social or cultural impact",
      "Leaving behind a physical legacy — structures, systems",
    ],
  },
  {
    id: 10,
    question: "Which activity sounds most exciting to you?",
    options: [
      "Training an AI model or launching an app",
      "Diagnosing a condition or developing a cure",
      "Pitching a startup idea to investors",
      "Designing a bridge, circuit, or building",
      "Writing a research paper or teaching a class",
      "Reporting news, arguing a case in court, or directing a film",
    ],
  },
];

const fieldStyles = {
  Engineering: {
    badge: "bg-orange-100 text-orange-700 border-orange-300",
    Icon: Settings,
  },
  IT: {
    badge: "bg-blue-100 text-blue-700 border-blue-300",
    Icon: Monitor,
  },
  Medical: {
    badge: "bg-red-100 text-red-700 border-red-300",
    Icon: HeartPulse,
  },
  Business: {
    badge: "bg-green-100 text-green-700 border-green-300",
    Icon: BarChart2,
  },
  Arts: {
    badge: "bg-purple-100 text-purple-700 border-purple-300",
    Icon: Palette,
  },
  Science: {
    badge: "bg-teal-100 text-teal-700 border-teal-300",
    Icon: FlaskConical,
  },
};

const defaultFieldStyle = {
  badge: "bg-indigo-100 text-indigo-700 border-indigo-300",
  Icon: GraduationCap,
};

export default function QuizPage() {
  const [phase, setPhase] = useState("welcome"); // welcome | quiz | loading | results | error
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [recommendation, setRecommendation] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [uniResults, setUniResults] = useState(null);
  const [uniLoading, setUniLoading] = useState(false);

  const handleStart = () => {
    setPhase("quiz");
    setCurrentQuestion(0);
    setAnswers({});
    setRecommendation(null);
    setErrorMsg("");
    setUniResults(null);
  };

  const fetchUniversities = async (department) => {
    setUniLoading(true);
    try {
      const res = await fetch(`/api/universities/search?program=${encodeURIComponent(department)}`);
      const data = await res.json();
      setUniResults(data.universities || []);
    } catch {
      setUniResults([]);
    } finally {
      setUniLoading(false);
    }
  };

  const handleAnswer = (optionIdx) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion]: optionIdx }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((q) => q + 1);
    } else {
      submitForRecommendation();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) setCurrentQuestion((q) => q - 1);
  };

  const submitForRecommendation = async () => {
    setPhase("loading");
    try {
      const res = await fetch("/api/quiz/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions, answers }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Server error");
      setRecommendation(data.recommendation);
      setPhase("results");
    } catch (err) {
      setErrorMsg(err.message || "Something went wrong.");
      setPhase("error");
    }
  };

  const progress = Math.round(((currentQuestion + 1) / questions.length) * 100);
  const fieldStyle = fieldStyles[recommendation?.field] ?? defaultFieldStyle;
  const FieldIcon = fieldStyle.Icon;

  return (
    <div className="bg-secondary min-h-screen font-inter">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-10 min-h-[calc(100vh-80px)] flex flex-col justify-center">
        {/* ── Welcome ── */}
        {phase === "welcome" && (
          <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
            <div className="flex justify-center mb-4">
              <GraduationCap className="w-14 h-14 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-blue-600 mb-3">
              Department Finder Quiz
            </h1>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Answer 10 questions about your interests, personality, and goals.
              Our AI will analyze your responses and recommend the academic
              department that fits you best.
            </p>

            <div className="bg-blue-50 p-4 rounded-xl mb-6 text-left space-y-3 text-sm text-gray-700">
              <div className="flex items-center gap-3">
                <ClipboardList className="w-4 h-4 text-blue-500 shrink-0" />
                10 multiple-choice questions
              </div>
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-blue-500 shrink-0" />
                Powered by SAG AI
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-blue-500 shrink-0" />
                Takes about 3–4 minutes
              </div>
              <div className="flex items-center gap-3">
                <Target className="w-4 h-4 text-blue-500 shrink-0" />
                Get personalized department recommendation
              </div>
            </div>

            <button
              onClick={handleStart}
              className="bg-blue-600 text-white px-10 py-3 rounded-xl hover:bg-blue-700 transition font-semibold text-lg"
            >
              Start Quiz
            </button>
          </div>
        )}

        {/* ── Quiz ── */}
        {phase === "quiz" && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg">
            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-500 mb-2">
                <span>
                  Question {currentQuestion + 1} of {questions.length}
                </span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Question */}
            <h2 className="text-xl font-semibold text-gray-800 mb-5">
              {questions[currentQuestion].question}
            </h2>

            <div className="space-y-3 mb-8">
              {questions[currentQuestion].options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition text-sm ${
                    answers[currentQuestion] === idx
                      ? "border-blue-600 bg-blue-50 text-blue-800 font-medium"
                      : "border-gray-200 hover:border-blue-300 hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <span className="font-semibold mr-2 text-gray-400">
                    {String.fromCharCode(65 + idx)}.
                  </span>
                  {option}
                </button>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <button
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
                className="px-6 py-2 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={handleNext}
                disabled={answers[currentQuestion] === undefined}
                className="px-6 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
              >
                {currentQuestion === questions.length - 1
                  ? "Get My Recommendation"
                  : "Next"}
              </button>
            </div>
          </div>
        )}

        {/* ── Loading ── */}
        {phase === "loading" && (
          <div className="bg-white p-10 rounded-2xl shadow-lg text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Analyzing your answers...
            </h2>
            <p className="text-gray-500 text-sm">
              Our AI is reviewing your responses and finding the best department
              match for you.
            </p>
          </div>
        )}

        {/* ── Results ── */}
        {phase === "results" && recommendation && (
          <div className="space-y-5">
            {/* Primary Recommendation */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg text-center">
              <div className="flex justify-center mb-3">
                <FieldIcon className="w-12 h-12 text-blue-600" />
              </div>
              <p className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-1">
                Your Best-Fit Department
              </p>
              <h2 className="text-3xl font-bold text-blue-600 mb-3">
                {recommendation.primaryDepartment}
              </h2>

              <span
                className={`inline-block text-xs font-semibold px-3 py-1 rounded-full border ${fieldStyle.badge} mb-4`}
              >
                {recommendation.field}
              </span>

              {/* Confidence bar */}
              <div className="mb-5">
                <div className="flex justify-between text-sm text-gray-500 mb-1">
                  <span>AI Confidence</span>
                  <span className="font-semibold text-blue-600">
                    {recommendation.confidence}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-700"
                    style={{ width: `${recommendation.confidence}%` }}
                  />
                </div>
              </div>

              <p className="text-gray-600 text-sm leading-relaxed">
                {recommendation.explanation}
              </p>
            </div>

            {/* Strengths */}
            <div className="bg-white p-6 rounded-2xl shadow-lg">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Your Key Strengths
              </h3>
              <div className="space-y-2">
                {recommendation.strengths?.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-sm text-gray-700"
                  >
                    <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    {s}
                  </div>
                ))}
              </div>
            </div>

            {/* Career Paths */}
            <div className="bg-white p-6 rounded-2xl shadow-lg">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Rocket className="w-5 h-5 text-blue-500" />
                Potential Career Paths
              </h3>
              <div className="flex flex-wrap gap-2">
                {recommendation.careers?.map((c, i) => (
                  <span
                    key={i}
                    className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full border border-blue-200"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>

            {/* Alternatives */}
            <div className="bg-white p-6 rounded-2xl shadow-lg">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-gray-500" />
                You Could Also Consider
              </h3>
              <div className="flex flex-wrap gap-2">
                {recommendation.alternativeDepartments?.map((d, i) => (
                  <span
                    key={i}
                    className="text-sm bg-gray-100 text-gray-700 px-4 py-2 rounded-xl border border-gray-200"
                  >
                    {d}
                  </span>
                ))}
              </div>
            </div>

            {/* See Universities */}
            {uniResults === null && (
              <div className="text-center pb-2">
                <button
                  onClick={() => fetchUniversities(recommendation.primaryDepartment)}
                  disabled={uniLoading}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition font-semibold text-sm disabled:opacity-60"
                >
                  {uniLoading ? "Searching..." : `See Universities Offering ${recommendation.primaryDepartment}`}
                </button>
              </div>
            )}

            {uniResults !== null && (
              <div className="bg-white p-6 rounded-2xl shadow-lg">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-blue-500" />
                  Universities Offering {recommendation.primaryDepartment}
                  <span className="ml-auto text-xs font-normal text-gray-400">
                    {uniResults.length} found
                  </span>
                </h3>

                {uniResults.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No universities found for this program in the database yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {uniResults.map((uni) => (
                      <div key={uni.id} className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-gray-800 text-sm">{uni.name}</p>
                            {uni.location && (
                              <p className="text-xs text-gray-500 mt-0.5">{uni.location}</p>
                            )}
                          </div>
                          {uni.website && (
                            <a
                              href={uni.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline shrink-0"
                            >
                              Visit
                            </a>
                          )}
                        </div>
                        {uni.programs?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {uni.programs.map((p) => (
                              <span
                                key={p.id}
                                className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-lg border border-blue-100"
                              >
                                {p.name}
                                {p.duration && ` · ${p.duration}`}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-center pb-4">
              <button
                onClick={handleStart}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 transition font-medium"
              >
                Retake Quiz
              </button>
              <Link
                href="/universities"
                className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-xl hover:bg-gray-200 transition font-medium"
              >
                View Universities
              </Link>
              <Link
                href="/dashboard"
                className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-xl hover:bg-gray-200 transition font-medium"
              >
                Dashboard
              </Link>
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {phase === "error" && (
          <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="w-12 h-12 text-yellow-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-500 text-sm mb-6">{errorMsg}</p>
            <button
              onClick={handleStart}
              className="bg-blue-600 text-white px-8 py-2.5 rounded-xl hover:bg-blue-700 transition"
            >
              Try Again
            </button>
          </div>
        )}
      </main>

      <Footer />
      <ChatbotWidget />
    </div>
  );
}
