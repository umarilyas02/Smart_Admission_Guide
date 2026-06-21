"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatbotWidget from "@/components/ChatbotWidget";
import Breadcrumb from "@/components/Breadcrumb";

export default function AdmissionProbabilityPage() {
  const [marks, setMarks] = useState({
    matric: "",
    intermediate: "",
    expectedTest: "",
  });
  const [calculated, setCalculated] = useState(false);
  const [finalProbability, setFinalProbability] = useState(0);

  const calculateProbability = () => {
    const matricContribution = (parseFloat(marks.matric) * 0.3) || 0;
    const interContribution = (parseFloat(marks.intermediate) * 0.5) || 0;
    const testContribution = (parseFloat(marks.expectedTest) * 0.2) || 0;

    const total = matricContribution + interContribution + testContribution;
    setFinalProbability(Math.min(Math.round(total), 100));
    setCalculated(true);
  };

  const handleChange = (field) => (e) => {
    setMarks({ ...marks, [field]: e.target.value });
    setCalculated(false);
  };

  const strokeDashoffset = 283 - (283 * finalProbability) / 100;

  return (
    <div className="bg-secondary min-h-screen font-inter">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        <Breadcrumb />
        {/* Calculator Card */}
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg">
          <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-4">
            Admission Probability Calculator
          </h1>

          <p className="text-gray-600 mb-6">
            Calculate your admission probability based on academic merit breakdown.
          </p>

          {/* Input Fields */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Matric Percentage (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={marks.matric}
                onChange={handleChange("matric")}
                placeholder="Enter your matric percentage"
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
              />
              <p className="text-sm text-gray-500 mt-1">Contributes 30% to final merit</p>
            </div>

            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Intermediate Percentage (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={marks.intermediate}
                onChange={handleChange("intermediate")}
                placeholder="Enter your intermediate percentage"
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
              />
              <p className="text-sm text-gray-500 mt-1">Contributes 50% to final merit</p>
            </div>

            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Expected Entry Test Score (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={marks.expectedTest}
                onChange={handleChange("expectedTest")}
                placeholder="Estimate your test score"
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
              />
              <p className="text-sm text-gray-500 mt-1">Contributes 20% to final merit</p>
            </div>
          </div>

          {/* Merit Breakdown */}
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">Merit Breakdown</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-gray-700">
                <span>Matric Contribution</span>
                <span className="font-semibold">30%</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Intermediate Contribution</span>
                <span className="font-semibold">50%</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Entry Test (Expected)</span>
                <span className="font-semibold">20%</span>
              </div>
            </div>
          </div>

          <button
            onClick={calculateProbability}
            disabled={!marks.matric || !marks.intermediate || !marks.expectedTest}
            className="w-full bg-primary text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            Calculate Probability
          </button>
        </div>

        {/* Result Card */}
        {calculated && (
          <div className="bg-white p-6 rounded-xl shadow-lg text-center">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              Your Admission Probability
            </h3>

            <div className="relative w-32 h-32 mx-auto mb-4">
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
                {finalProbability}%
              </div>
            </div>

            <p className="text-gray-600 mb-4">
              {finalProbability >= 80
                ? "Excellent! You have a strong chance of admission."
                : finalProbability >= 60
                ? "Good chance! Consider preparing well for the entry test."
                : "Consider improving your academic performance and test preparation."}
            </p>

            <div className="flex gap-3 justify-center">
              <a
                href="/recommendation"
                className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                View Universities
              </a>
              <a
                href="/academic-background"
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition"
              >
                Full Analysis
              </a>
            </div>
          </div>
        )}
      </main>

      <Footer />
      <ChatbotWidget />
    </div>
  );
}
