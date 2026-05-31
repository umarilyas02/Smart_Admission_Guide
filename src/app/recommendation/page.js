"use client";

import { MapPin } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatbotWidget from "@/components/ChatbotWidget";

export default function RecommendationPage() {
  const universities = [
    {
      name: "FAST (National University of Sciences and Technology)",
      location: "Islamabad",
      programs: ["CS", "SE", "EE", "ME"],
      cutoff: 85,
    },
    {
      name: "LUMS (Lahore University of Management Sciences)",
      location: "Lahore",
      programs: ["CS", "EE", "BBA"],
      cutoff: 82,
    },
    {
      name: "GIKI (Ghulam Ishaq Khan Institute)",
      location: "Topi, KP",
      programs: ["CS", "EE", "ME", "BBA"],
      cutoff: 80,
    },
    {
      name: "COMSATS (Pakistan Institute of Information Technology)",
      location: "Multiple Cities",
      programs: ["CS", "EE", "SE", "ME"],
      cutoff: 75,
    },
    {
      name: "IBA (Institute of Business Administration)",
      location: "Karachi",
      programs: ["BBA", "CS", "Economics"],
      cutoff: 78,
    },
    {
      name: "NED (NED University of Engineering & Technology)",
      location: "Karachi",
      programs: ["CS", "EE", "CE", "ME"],
      cutoff: 72,
    },
  ];

  return (
    <div className="bg-secondary min-h-screen font-inter">
      <Navbar />

      <main className="min-h-screen py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Top Universities in Pakistan
            </h1>
            <p className="text-gray-600 text-lg">
              Explore leading universities and their programs. Use our calculator to check your admission chances.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {universities.map((uni, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{uni.name}</h3>
                    <p className="text-gray-600 text-sm flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{uni.location}</p>
                  </div>
                  <div className="bg-primary text-white px-3 py-1 rounded-full text-sm font-semibold">
                    Cutoff: {uni.cutoff}%
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-gray-700 font-medium mb-2">Programs:</p>
                  <div className="flex flex-wrap gap-2">
                    {uni.programs.map((prog) => (
                      <span
                        key={prog}
                        className="bg-blue-100 text-primary px-3 py-1 rounded-full text-xs font-semibold"
                      >
                        {prog}
                      </span>
                    ))}
                  </div>
                </div>

                <a
                  href="/admission-chance"
                  className="inline-block w-full text-center bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Check Your Chances
                </a>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
      <ChatbotWidget />
    </div>
  );
}
