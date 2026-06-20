"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  GraduationCap, ClipboardList, Sparkles, Clock, Target,
  Settings, Monitor, HeartPulse, BarChart2, Palette, FlaskConical,
  Zap, Rocket, RefreshCw, AlertTriangle, Check, ChevronDown, User,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatbotWidget from "@/components/ChatbotWidget";

const LEVEL_OPTIONS = [
  { value: "fa",              label: "FA — Faculty of Arts" },
  { value: "fsc_medical",     label: "FSc Pre-Medical" },
  { value: "fsc_engineering", label: "FSc Pre-Engineering" },
  { value: "ics",             label: "ICS — Computer Science" },
  { value: "icom",            label: "ICom — Commerce" },
];

const LEVEL_LABELS = {
  fa:              "FA (Arts)",
  fsc_medical:     "FSc Pre-Medical",
  fsc_engineering: "FSc Pre-Engineering",
  ics:             "ICS (Computer Science)",
  icom:            "ICom (Commerce)",
};

const fieldStyles = {
  Engineering: { badge: "bg-orange-100 text-orange-700 border-orange-300", Icon: Settings },
  IT:          { badge: "bg-blue-100 text-blue-700 border-blue-300",   Icon: Monitor },
  Medical:     { badge: "bg-red-100 text-red-700 border-red-300",      Icon: HeartPulse },
  Business:    { badge: "bg-green-100 text-green-700 border-green-300", Icon: BarChart2 },
  Arts:        { badge: "bg-purple-100 text-purple-700 border-purple-300", Icon: Palette },
  Science:     { badge: "bg-teal-100 text-teal-700 border-teal-300",   Icon: FlaskConical },
};
const defaultFieldStyle = { badge: "bg-indigo-100 text-indigo-700 border-indigo-300", Icon: GraduationCap };

export default function QuizPage() {
  // phases: welcome | generating | quiz | loading | results | error
  const [phase, setPhase]               = useState("welcome");
  const [profile, setProfile]           = useState(null);
  const [selectedLevel, setSelectedLevel] = useState("");
  const [questions, setQuestions]       = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers]           = useState({});
  const [recommendation, setRecommendation] = useState(null);
  const [errorMsg, setErrorMsg]         = useState("");
  const [uniResults, setUniResults]     = useState(null);
  const [uniLoading, setUniLoading]     = useState(false);

  // Fetch profile on mount if logged in
  useEffect(() => {
    const token = typeof window !== "undefined" && localStorage.getItem("auth_token");
    if (!token) return;
    fetch("/api/profile", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        setProfile(data);
        if (data.student?.academic_level) setSelectedLevel(data.student.academic_level);
      })
      .catch(() => {});
  }, []);

  const effectiveLevel = selectedLevel;

  const handleStart = async () => {
    if (!effectiveLevel) return;
    setPhase("generating");
    setCurrentQuestion(0);
    setAnswers({});
    setRecommendation(null);
    setErrorMsg("");
    setUniResults(null);

    try {
      const res = await fetch("/api/quiz/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          academic_level:     effectiveLevel,
          matric_marks:       profile?.student?.matric_marks       ?? null,
          intermediate_marks: profile?.student?.intermediate_marks ?? null,
          interests:          profile?.student?.interests          ?? null,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed to generate questions");
      setQuestions(data.questions);
      setPhase("quiz");
    } catch (err) {
      setErrorMsg(err.message || "Could not generate questions. Please try again.");
      setPhase("error");
    }
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
    setAnswers(prev => ({ ...prev, [currentQuestion]: optionIdx }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(q => q + 1);
    } else {
      submitForRecommendation();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) setCurrentQuestion(q => q - 1);
  };

  const submitForRecommendation = async () => {
    setPhase("loading");
    try {
      const res = await fetch("/api/quiz/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions, answers, academic_level: effectiveLevel || undefined }),
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

  const progress    = questions.length ? Math.round(((currentQuestion + 1) / questions.length) * 100) : 0;
  const fieldStyle  = fieldStyles[recommendation?.field] ?? defaultFieldStyle;
  const FieldIcon   = fieldStyle.Icon;
  const hasProfile  = !!profile?.student?.academic_level;

  return (
    <div className="bg-secondary min-h-screen font-inter">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-10 min-h-[calc(100vh-80px)] flex flex-col justify-center">

        {/* ── Welcome ── */}
        {phase === "welcome" && (
          <div className="bg-white p-8 rounded-2xl shadow-lg">
            <div className="flex justify-center mb-4">
              <GraduationCap className="w-14 h-14 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-blue-600 mb-2 text-center">
              Personalized Department Quiz
            </h1>
            <p className="text-gray-500 mb-6 text-sm text-center leading-relaxed">
              Our AI reads your profile and crafts questions specific to your education level and interests.
            </p>

            {/* Profile summary card */}
            {hasProfile && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-700">Your Profile</span>
                  <span className="ml-auto text-xs text-blue-400">
                    <Link href="/dashboard/profile-progress" className="hover:underline">Edit</Link>
                  </span>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><span className="font-medium text-gray-700">Level:</span> {LEVEL_LABELS[profile.student.academic_level]}</p>
                  {profile.student.matric_marks && (
                    <p><span className="font-medium text-gray-700">Matric:</span> {profile.student.matric_marks}%</p>
                  )}
                  {profile.student.intermediate_marks && (
                    <p><span className="font-medium text-gray-700">Intermediate:</span> {profile.student.intermediate_marks}%</p>
                  )}
                  {profile.student.interests && (
                    <p className="line-clamp-1">
                      <span className="font-medium text-gray-700">Interests:</span> {profile.student.interests}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Level picker — shown when not logged in or profile has no level */}
            {!hasProfile && (
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Select your education level to get started
                </label>
                <div className="relative">
                  <select
                    value={selectedLevel}
                    onChange={e => setSelectedLevel(e.target.value)}
                    className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
                  >
                    <option value="">Choose your level…</option>
                    {LEVEL_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            )}

            <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2.5 text-sm text-gray-600">
              <div className="flex items-center gap-2.5">
                <ClipboardList className="w-4 h-4 text-blue-500 shrink-0" />
                8 AI-generated questions tailored to your level
              </div>
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-blue-500 shrink-0" />
                Questions generated fresh from your profile
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-blue-500 shrink-0" />
                Takes about 2–3 minutes
              </div>
              <div className="flex items-center gap-2.5">
                <Target className="w-4 h-4 text-blue-500 shrink-0" />
                Get a recommendation within your eligible programs
              </div>
            </div>

            <button
              onClick={handleStart}
              disabled={!effectiveLevel}
              className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition font-semibold text-base disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Generate My Quiz
            </button>
          </div>
        )}

        {/* ── Generating ── */}
        {phase === "generating" && (
          <div className="bg-white p-10 rounded-2xl shadow-lg text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Crafting your questions…
            </h2>
            <p className="text-gray-500 text-sm">
              Our AI is reading your profile and generating questions specific to{" "}
              <strong>{LEVEL_LABELS[effectiveLevel] || "your level"}</strong>.
            </p>
          </div>
        )}

        {/* ── Quiz ── */}
        {phase === "quiz" && questions.length > 0 && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg">
            {/* Header bar */}
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                {LEVEL_LABELS[effectiveLevel]}
              </span>
              <span className="text-xs text-gray-400">
                {currentQuestion + 1} / {questions.length}
              </span>
            </div>

            {/* Progress */}
            <div className="mb-6 mt-2">
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Question */}
            <h2 className="text-lg font-semibold text-gray-800 mb-5">
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
                {currentQuestion === questions.length - 1 ? "Get My Recommendation" : "Next"}
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
              Analyzing your answers…
            </h2>
            <p className="text-gray-500 text-sm">
              Our AI is finding the best department match for you.
            </p>
          </div>
        )}

        {/* ── Results ── */}
        {phase === "results" && recommendation && (
          <div className="space-y-5">
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
              <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full border ${fieldStyle.badge} mb-4`}>
                {recommendation.field}
              </span>
              <div className="mb-5">
                <div className="flex justify-between text-sm text-gray-500 mb-1">
                  <span>AI Confidence</span>
                  <span className="font-semibold text-blue-600">{recommendation.confidence}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-700"
                    style={{ width: `${recommendation.confidence}%` }}
                  />
                </div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">{recommendation.explanation}</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" /> Your Key Strengths
              </h3>
              <div className="space-y-2">
                {recommendation.strengths?.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> {s}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Rocket className="w-5 h-5 text-blue-500" /> Potential Career Paths
              </h3>
              <div className="flex flex-wrap gap-2">
                {recommendation.careers?.map((c, i) => (
                  <span key={i} className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full border border-blue-200">
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-gray-500" /> You Could Also Consider
              </h3>
              <div className="flex flex-wrap gap-2">
                {recommendation.alternativeDepartments?.map((d, i) => (
                  <span key={i} className="text-sm bg-gray-100 text-gray-700 px-4 py-2 rounded-xl border border-gray-200">
                    {d}
                  </span>
                ))}
              </div>
            </div>

            {uniResults === null && (
              <div className="text-center pb-2">
                <button
                  onClick={() => fetchUniversities(recommendation.primaryDepartment)}
                  disabled={uniLoading}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition font-semibold text-sm disabled:opacity-60"
                >
                  {uniLoading ? "Searching…" : `See Universities Offering ${recommendation.primaryDepartment}`}
                </button>
              </div>
            )}

            {uniResults !== null && (
              <div className="bg-white p-6 rounded-2xl shadow-lg">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-blue-500" />
                  Universities Offering {recommendation.primaryDepartment}
                  <span className="ml-auto text-xs font-normal text-gray-400">{uniResults.length} found</span>
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
                            {uni.location && <p className="text-xs text-gray-500 mt-0.5">{uni.location}</p>}
                          </div>
                          {uni.website && (
                            <a href={uni.website} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline shrink-0">
                              Visit
                            </a>
                          )}
                        </div>
                        {uni.programs?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {uni.programs.map((p) => (
                              <span key={p.id} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-lg border border-blue-100">
                                {p.name}{p.duration && ` · ${p.duration}`}
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

            <div className="flex gap-3 justify-center pb-4">
              <button
                onClick={() => setPhase("welcome")}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 transition font-medium"
              >
                Retake Quiz
              </button>
              <Link href="/universities" className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-xl hover:bg-gray-200 transition font-medium">
                View Universities
              </Link>
              <Link href="/dashboard" className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-xl hover:bg-gray-200 transition font-medium">
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
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Something went wrong</h2>
            <p className="text-gray-500 text-sm mb-6">{errorMsg}</p>
            <button
              onClick={() => setPhase("welcome")}
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
