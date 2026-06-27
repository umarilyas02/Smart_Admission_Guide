"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatbotWidget from "@/components/ChatbotWidget";
import Breadcrumb from "@/components/Breadcrumb";
import { validate } from "@/lib/validators";

export default function AcademicBackgroundPage() {
  const [formData, setFormData] = useState({
    educationLevel: "FSc Pre-Engineering",
    board: "BISE Lahore",
    matricMarks: "",
    intermediateMarks: "",
  });
  const [analyzing, setAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [probability, setProbability] = useState(0);
  const [recommendations, setRecommendations] = useState([]);
  const formErrors = [
    validate("percentage", formData.matricMarks, { required: true, min: 33, max: 100 }),
    validate("percentage", formData.intermediateMarks, { required: true, min: 33, max: 100 }),
  ].filter(Boolean);
  const isAnalyzeDisabled = analyzing || formErrors.length > 0;

  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handleAnalyze = () => {
    if (isAnalyzeDisabled) return;
    setAnalyzing(true);
    
    // Simulate analysis
    setTimeout(() => {
      // Calculate probability based on marks
      const avgMarks = (parseFloat(formData.matricMarks) + parseFloat(formData.intermediateMarks)) / 2;
      const calculatedProb = Math.min(Math.round(avgMarks * 0.9), 95);
      
      setProbability(calculatedProb);
      setRecommendations([
        { name: "BS Computer Science", university: "FAST University", merit: "80%" },
        { name: "BS Software Engineering", university: "COMSATS", merit: "78%" },
        { name: "BS Data Science", university: "NUST", merit: "82%" },
      ]);
      setShowResults(true);
      setAnalyzing(false);
    }, 1500);
  };

  const strokeDashoffset = 283 - (283 * probability) / 100;

  return (
    <div className="bg-secondary min-h-screen font-inter">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        <Breadcrumb />
        {/* Form Section */}
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg">
          <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-6">
            Academic Background
          </h1>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Education Level
              </label>
              <select
                value={formData.educationLevel}
                onChange={handleChange("educationLevel")}
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option>FSc Pre-Engineering</option>
                <option>FSc Pre-Medical</option>
                <option>ICS</option>
                <option>I.Com</option>
                <option>A-Levels</option>
              </select>
            </div>

            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Board
              </label>
              <select
                value={formData.board}
                onChange={handleChange("board")}
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option>BISE Lahore</option>
                <option>BISE Gujranwala</option>
                <option>BISE Rawalpindi</option>
                <option>BISE Faisalabad</option>
                <option>Cambridge</option>
                <option>Federal Board</option>
              </select>
            </div>

            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Matric Marks (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.matricMarks}
                onChange={handleChange("matricMarks")}
                placeholder="Enter percentage"
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Intermediate Marks (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.intermediateMarks}
                onChange={handleChange("intermediateMarks")}
                placeholder="Enter percentage"
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block mb-2 font-medium text-gray-700">
                Upload Documents (Optional)
              </label>
              <input
                type="file"
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzeDisabled}
                className="bg-primary text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {analyzing ? "Analyzing..." : "Analyze Profile"}
              </button>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {showResults && (
          <>
            {/* Probability Meter */}
            <div className="bg-white p-6 rounded-xl shadow-lg text-center">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                Admission Probability
              </h3>

              <div className="relative w-32 h-32 mx-auto">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="50%"
                    cy="50%"
                    r="45%"
                    stroke="#E5E7EB"
                    strokeWidth="10"
                    fill="none"
                  />
                  <circle
                    cx="50%"
                    cy="50%"
                    r="45%"
                    stroke="#16A34A"
                    strokeWidth="10"
                    fill="none"
                    strokeDasharray="283"
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-success">
                  {probability}%
                </div>
              </div>

              <p className="text-gray-500 mt-3 text-sm">
                Based on your academic profile
              </p>
            </div>

            {/* Recommendations */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">
                Recommended Programs & Universities
              </h3>

              <ul className="space-y-3">
                {recommendations.map((rec, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-gray-700 p-3 hover:bg-gray-50 rounded-lg transition"
                  >
                    <span className="text-success text-xl">✔</span>
                    <div>
                      <p className="font-medium">{rec.name}</p>
                      <p className="text-sm text-gray-600">
                        {rec.university} • Merit: {rec.merit}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex gap-3">
                <a
                  href="/recommendation"
                  className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  View All Universities
                </a>
                <a
                  href="/dashboard"
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  Go to Dashboard
                </a>
              </div>
            </div>
          </>
        )}
      </main>

      <Footer />
      <ChatbotWidget />
    </div>
  );
}
