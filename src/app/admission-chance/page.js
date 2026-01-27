"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatbotWidget from "@/components/ChatbotWidget";

export default function AdmissionChancePage() {
  const [formData, setFormData] = useState({
    marks: "",
    university: "FAST",
  });
  const [result, setResult] = useState(null);

  const universities = ["FAST", "LUMS", "GIKI", "COMSATS", "IBA", "NED", "UET"];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Placeholder: simulate AI prediction
    const marks = parseInt(formData.marks);
    let chance = 0;

    if (marks >= 85) chance = 95;
    else if (marks >= 80) chance = 85;
    else if (marks >= 75) chance = 70;
    else if (marks >= 70) chance = 50;
    else if (marks >= 60) chance = 30;
    else chance = 10;

    setResult({
      university: formData.university,
      marks: formData.marks,
      chance: chance,
    });
  };

  return (
    <div className="bg-secondary min-h-screen font-inter">
      <Navbar />

      <main className="min-h-screen py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Admission Chance Calculator
            </h1>
            <p className="text-gray-600 mb-8">
              Get an AI-powered prediction of your admission chances based on your academic performance.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Your Marks (Percentage)
                </label>
                <input
                  type="number"
                  name="marks"
                  value={formData.marks}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  required
                  placeholder="Enter your percentage marks"
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Target University
                </label>
                <select
                  name="university"
                  value={formData.university}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  {universities.map((uni) => (
                    <option key={uni} value={uni}>
                      {uni}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Calculate My Chances
              </button>
            </form>

            {result && (
              <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="text-2xl font-bold text-green-700 mb-4">
                  Your Admission Chances
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">University:</span>
                    <span className="text-gray-900 font-semibold">{result.university}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">Your Marks:</span>
                    <span className="text-gray-900 font-semibold">{result.marks}%</span>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-700 font-medium">Admission Probability:</span>
                      <span className="text-3xl font-bold text-primary">{result.chance}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-500"
                        style={{ width: `${result.chance}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
      <ChatbotWidget />
    </div>
  );
}
