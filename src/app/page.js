"use client";

import { useEffect, useState } from "react";
import {
  Target, Bot, ClipboardCheck, FileText,
  BookOpen, ArrowRight, Lock, Sparkles,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatbotWidget from "@/components/ChatbotWidget";
import HeroSection from "@/components/HeroSection";

function ToolCard({ icon: Icon, title, description, href, cta, gated, isLoggedIn, accent = "blue" }) {
  const accentMap = {
    blue:   { bg: "bg-blue-50",   icon: "text-blue-600",   btn: "bg-blue-600 hover:bg-blue-700",   border: "hover:border-blue-200" },
    purple: { bg: "bg-purple-50", icon: "text-purple-600", btn: "bg-purple-600 hover:bg-purple-700", border: "hover:border-purple-200" },
    green:  { bg: "bg-green-50",  icon: "text-green-600",  btn: "bg-green-600 hover:bg-green-700",  border: "hover:border-green-200" },
    amber:  { bg: "bg-amber-50",  icon: "text-amber-600",  btn: "bg-amber-500 hover:bg-amber-600",  border: "hover:border-amber-200" },
  };
  const c = accentMap[accent];
  const isLocked = gated && !isLoggedIn;
  const link = isLocked ? "/auth?mode=register" : href;

  return (
    <div className={`relative bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4 transition-all duration-200 ${c.border} hover:shadow-md`}>
      {isLocked && (
        <span className="absolute top-4 right-4 flex items-center gap-1 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
          <Lock className="w-3 h-3" /> Login required
        </span>
      )}
      <div className={`w-11 h-11 ${c.bg} rounded-xl flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${c.icon}`} />
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900 text-base mb-1">{title}</h3>
        <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
      </div>
      <a
        href={link}
        className={`inline-flex items-center gap-1.5 text-sm font-semibold text-white ${c.btn} px-4 py-2 rounded-xl transition self-start`}
      >
        {isLocked ? "Sign up to use" : cta}
        <ArrowRight className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      setIsLoggedIn(!!localStorage.getItem("auth_token"));
    };
    checkAuth();
    window.addEventListener("storage", checkAuth);
    return () => window.removeEventListener("storage", checkAuth);
  }, []);

  const tools = [
    {
      icon: BookOpen,
      title: "Career Aptitude Quiz",
      description: "Discover which fields and programs best match your strengths and interests with our AI-powered quiz.",
      href: "/quiz",
      cta: "Take the Quiz",
      accent: "purple",
      gated: false,
    },
    {
      icon: Target,
      title: "University Recommendations",
      description: "Browse universities and programs tailored to your academic background and career goals.",
      href: "/recommendation",
      cta: "Explore Universities",
      accent: "blue",
      gated: false,
    },
    {
      icon: FileText,
      title: "Application Pack Generator",
      description: "Fill one form and instantly generate your admission form, motivation letter, and recommendation request — ready to download as PDFs.",
      href: "/application-pack",
      cta: "Generate Documents",
      accent: "amber",
      gated: true,
    },
  ];

  return (
    <div className="bg-white min-h-screen font-inter">
      <Navbar />

      <main>
        {/* Hero */}
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
              ? { label: "Go to Dashboard", href: "/dashboard" }
              : { label: "Get Started Free", href: "/auth?mode=register" }
          }
          secondaryCta={{ label: "Take the Quiz", href: "/quiz" }}
        />

        {/* How It Works */}
        <section className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
            <p className="mt-3 text-gray-500">Four simple steps to your future</p>
            <div className="mt-10 grid sm:grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { step: "1", title: "Enter Profile", desc: "Provide your academic background and preferences." },
                { step: "2", title: "AI Analysis",   desc: "Our AI analyses your profile using live merit data." },
                { step: "3", title: "Get Recommendations", desc: "Personalised universities and programs suggested." },
                { step: "4", title: "Apply Smartly", desc: "Generate application documents and track deadlines." },
              ].map(({ step, title, desc }) => (
                <div key={step} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-left">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center mb-3">
                    {step}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
                  <p className="text-sm text-gray-500">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tools Grid */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900">Everything You Need to Apply</h2>
              <p className="mt-3 text-gray-500 max-w-xl mx-auto">
                All the tools you need in one place — from choosing the right program to generating your application documents.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {tools.map((t) => (
                <ToolCard key={t.title} {...t} isLoggedIn={isLoggedIn} />
              ))}
            </div>

            {/* Chatbot callout */}
            <div className="mt-6 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-base">Ask SAG AI anything about admissions</h3>
                  <p className="text-purple-200 text-sm mt-0.5">
                    Merit cut-offs, scholarship deadlines, entry test tips — available 24/7.
                    {!isLoggedIn && " Free 1 question, then log in to continue."}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  // Trigger the chatbot widget to open via a custom event
                  window.dispatchEvent(new CustomEvent("open-chatbot"));
                }}
                className="shrink-0 bg-white text-purple-700 font-semibold px-5 py-2.5 rounded-xl hover:bg-purple-50 transition text-sm flex items-center gap-2"
              >
                <Bot className="w-4 h-4" />
                Chat with SAG AI
              </button>
            </div>
          </div>
        </section>

        {/* Admission Chance CTA */}
        <section className="bg-primary py-16 text-white">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold">Unsure About Your Admission Chances?</h2>
            <p className="mt-4 text-lg opacity-90">Use our AI-based admission chance calculator — no sign-up needed.</p>
            <a
              href="/admission-chance"
              className="inline-block mt-6 bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              Check Now →
            </a>
          </div>
        </section>

        {/* Final CTA — only for logged out */}
        {!isLoggedIn && (
          <section className="py-20 bg-gray-50 text-center">
            <h2 className="text-3xl font-bold text-gray-900">Start Your Smart Admission Journey</h2>
            <p className="mt-4 text-gray-500">Join students making smarter academic decisions with AI.</p>
            <div className="mt-6 flex justify-center gap-4 flex-wrap">
              <a
                href="/auth?mode=register"
                className="bg-primary text-white px-8 py-3 rounded-xl shadow hover:bg-blue-700 transition font-semibold"
              >
                Create Free Account
              </a>
              <a
                href="/auth?mode=login"
                className="bg-white text-gray-700 border border-gray-200 px-8 py-3 rounded-xl hover:bg-gray-50 transition font-semibold"
              >
                Log In
              </a>
            </div>
          </section>
        )}
      </main>

      <Footer />
      <ChatbotWidget />
    </div>
  );
}
