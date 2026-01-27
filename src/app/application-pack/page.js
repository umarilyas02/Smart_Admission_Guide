"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatbotWidget from "@/components/ChatbotWidget";

export default function ApplicationPackPage() {
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    targetProgram: "",
    targetUniversity: "",
    achievements: "",
    goals: "",
  });

  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handleGenerate = () => {
    setGenerating(true);
    // Simulate document generation
    setTimeout(() => {
      setGenerating(false);
      setGenerated(true);
    }, 2000);
  };

  const documents = [
    {
      name: "Personal Statement",
      description: "Customized personal statement for your application",
      icon: "📄",
    },
    {
      name: "Cover Letter",
      description: "Professional cover letter template",
      icon: "✉️",
    },
    {
      name: "CV/Resume",
      description: "Academic CV highlighting your achievements",
      icon: "📋",
    },
    {
      name: "Recommendation Request",
      description: "Template for requesting recommendation letters",
      icon: "📝",
    },
  ];

  return (
    <div className="bg-secondary min-h-screen font-inter">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-10">
        {!generated ? (
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg text-center">
            <div className="text-6xl mb-4">📄</div>
            <h1 className="text-2xl sm:text-3xl font-bold text-blue-600 mb-4">
              Application Pack Generator
            </h1>

            <p className="text-gray-600 mb-6">
              Generate personalized application documents including personal
              statement, CV, and cover letter.
            </p>

            {/* Form */}
            <div className="text-left space-y-4 mb-6">
              <div>
                <label className="block mb-2 font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={handleChange("fullName")}
                  placeholder="Enter your full name"
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700">
                  Target Program
                </label>
                <input
                  type="text"
                  value={formData.targetProgram}
                  onChange={handleChange("targetProgram")}
                  placeholder="e.g., BS Computer Science"
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700">
                  Target University
                </label>
                <input
                  type="text"
                  value={formData.targetUniversity}
                  onChange={handleChange("targetUniversity")}
                  placeholder="e.g., FAST University"
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700">
                  Key Achievements
                </label>
                <textarea
                  value={formData.achievements}
                  onChange={handleChange("achievements")}
                  placeholder="List your academic and extracurricular achievements..."
                  rows="3"
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700">
                  Career Goals
                </label>
                <textarea
                  value={formData.goals}
                  onChange={handleChange("goals")}
                  placeholder="Describe your career aspirations and why you want to pursue this program..."
                  rows="3"
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={
                generating ||
                !formData.fullName ||
                !formData.targetProgram ||
                !formData.targetUniversity
              }
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {generating ? "Generating Pack..." : "Generate Application Pack"}
            </button>

            {generating && (
              <div className="mt-4 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Success Message */}
            <div className="bg-green-50 border border-green-200 p-6 rounded-xl text-center">
              <div className="text-4xl mb-2">✅</div>
              <h2 className="text-xl font-bold text-green-800 mb-2">
                Application Pack Generated!
              </h2>
              <p className="text-green-700">
                Your personalized documents are ready to download.
              </p>
            </div>

            {/* Documents List */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">
                Your Application Documents
              </h3>

              <div className="space-y-3">
                {documents.map((doc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{doc.icon}</span>
                      <div>
                        <p className="font-medium text-gray-800">{doc.name}</p>
                        <p className="text-sm text-gray-600">{doc.description}</p>
                      </div>
                    </div>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm">
                      Download
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    setGenerated(false);
                    setFormData({
                      fullName: "",
                      targetProgram: "",
                      targetUniversity: "",
                      achievements: "",
                      goals: "",
                    });
                  }}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  Generate New Pack
                </button>
                <a
                  href="/dashboard"
                  className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Go to Dashboard
                </a>
              </div>
            </div>

            {/* Tips Section */}
            <div className="bg-blue-50 p-6 rounded-xl">
              <h4 className="font-semibold text-gray-800 mb-3">💡 Pro Tips</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Review and customize each document before submitting</li>
                <li>• Have a teacher or mentor review your personal statement</li>
                <li>• Keep your documents updated with new achievements</li>
                <li>• Tailor each application to the specific university</li>
              </ul>
            </div>
          </div>
        )}
      </main>

      <Footer />
      <ChatbotWidget />
    </div>
  );
}
