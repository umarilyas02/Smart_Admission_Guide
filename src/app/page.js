"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatbotWidget from "@/components/ChatbotWidget";
import HeroSection from "@/components/HeroSection";
import Card from "@/components/Card";

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("auth_token");
      setIsLoggedIn(!!token);
    };

    checkAuth();
    window.addEventListener("storage", checkAuth);
    return () => window.removeEventListener("storage", checkAuth);
  }, []);

  return (
    <div className="bg-white min-h-screen font-inter">
      <Navbar />

      <main className="min-h-screen">
        {/* Hero Section */}
        <HeroSection
          title={
            <>
              Your <span className="text-primary">Smart Guide</span> to <br />
              University Admissions
            </>
          }
          subtitle="Smart Admission Guide helps intermediate students choose the best university and program using AI-powered recommendations."
          primaryCta={
            isLoggedIn
              ? null
              : {
                  label: "Get Started",
                  href: "/auth?mode=register",
                }
          }
          secondaryCta={{
            label: "Check Admission Chance",
            href: "/admission-chance",
          }}
          imageSrc="/images/hero.jpg"
        />

        {/* How It Works Section */}
        <section className="bg-secondary py-16">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
            <p className="mt-3 text-gray-600">Just 4 simple steps to your future</p>

            <div className="mt-10 grid md:grid-cols-4 gap-8">
              <Card
                title="1. Enter Profile"
                description="Provide your academic background and preferences."
              />
              <Card
                title="2. AI Analysis"
                description="Our AI analyzes your profile using merit data."
              />
              <Card
                title="3. Get Recommendations"
                description="Personalized universities and programs suggested."
              />
              <Card
                title="4. Apply Smartly"
                description="Generate application documents and track deadlines."
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Powerful AI-Based Features
            </h2>

            <div className="mt-12 grid md:grid-cols-3 gap-8">
              <div className="p-6 border rounded-xl hover:shadow-lg transition">
                <h3 className="text-xl font-semibold text-primary">
                  🎯 Smart Recommendations
                </h3>
                <p className="mt-3 text-gray-600">
                  Get university and program suggestions based on your marks.
                </p>
              </div>

              <div className="p-6 border rounded-xl hover:shadow-lg transition">
                <h3 className="text-xl font-semibold text-primary">
                  📊 Admission Chance Calculator
                </h3>
                <p className="mt-3 text-gray-600">
                  Predict your admission probability using AI.
                </p>
              </div>

              <div className="p-6 border rounded-xl hover:shadow-lg transition">
                <h3 className="text-xl font-semibold text-primary">
                  🤖 AI Chatbot
                </h3>
                <p className="mt-3 text-gray-600">
                  Ask admission-related questions anytime.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Admission Chance CTA */}
        <section className="bg-primary py-16 text-white">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold">
              Unsure About Your Admission Chances?
            </h2>

            <p className="mt-4 text-lg opacity-90">
              Use our AI-based admission chance calculator.
            </p>

            <a
              href="/admission-chance"
              className="inline-block mt-6 bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              Check Now
            </a>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 bg-secondary text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Start Your Smart Admission Journey Today
          </h2>

          <p className="mt-4 text-gray-600">
            Join thousands of students making better academic decisions.
          </p>

          <a
            href="/admission-probability"
            className="inline-block mt-6 bg-primary text-white px-8 py-3 rounded-lg shadow hover:bg-blue-700 transition"
          >
            Admission Probability
          </a>
        </section>
      </main>

      <Footer />
      <ChatbotWidget />
    </div>
  );
}
