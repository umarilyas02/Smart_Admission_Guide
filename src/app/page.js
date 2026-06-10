"use client";

import { useEffect, useState } from "react";
import {
  Target, Bot, FileText, BookOpen, ArrowRight, Lock, Sparkles,
  GraduationCap, Brain, CheckCircle, Clock, Users, Building2,
  ChevronRight, Star,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatbotWidget from "@/components/ChatbotWidget";
import HeroSection from "@/components/HeroSection";

function ToolCard({ icon: Icon, title, description, href, cta, gated, isLoggedIn, accent = "blue" }) {
  const accentMap = {
    blue:   { bg: "bg-blue-50",   icon: "text-blue-600",   btn: "bg-blue-600 hover:bg-blue-700",   border: "hover:border-blue-200", ring: "focus-visible:ring-blue-400" },
    purple: { bg: "bg-purple-50", icon: "text-purple-600", btn: "bg-purple-600 hover:bg-purple-700", border: "hover:border-purple-200", ring: "focus-visible:ring-purple-400" },
    green:  { bg: "bg-green-50",  icon: "text-green-600",  btn: "bg-green-600 hover:bg-green-700",  border: "hover:border-green-200", ring: "focus-visible:ring-green-400" },
    amber:  { bg: "bg-amber-50",  icon: "text-amber-600",  btn: "bg-amber-500 hover:bg-amber-600",  border: "hover:border-amber-200", ring: "focus-visible:ring-amber-400" },
  };
  const c = accentMap[accent];
  const isLocked = gated && !isLoggedIn;
  const link = isLocked ? "/auth?mode=register" : href;

  return (
    <div className={`relative bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4 transition-all duration-200 ${c.border} hover:shadow-md group`}>
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
        aria-label={isLocked ? `Sign up to use ${title}` : `${cta} — ${title}`}
        className={`inline-flex items-center gap-1.5 text-sm font-semibold text-white ${c.btn} px-4 py-2 rounded-xl transition self-start focus-visible:outline-none focus-visible:ring-2 ${c.ring} focus-visible:ring-offset-2`}
      >
        {isLocked ? "Sign up to use" : cta}
        <ArrowRight className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}

const stats = [
  { icon: Building2,     value: "30+",    label: "Universities" },
  { icon: GraduationCap, value: "100+",   label: "Programs" },
  { icon: Brain,         value: "AI",     label: "Powered" },
  { icon: CheckCircle,   value: "Free",   label: "To Get Started" },
];

const features = [
  {
    icon: Brain,
    title: "AI-Powered Matching",
    description: "Our AI analyses your academic profile, strengths, and goals to surface the programs most likely to accept you and align with your career path.",
    color: "purple",
  },
  {
    icon: Clock,
    title: "Save Hours of Research",
    description: "Instead of manually browsing university websites, get personalised shortlists instantly — with merit cut-offs, deadlines, and scholarship info in one place.",
    color: "blue",
  },
  {
    icon: Users,
    title: "Built for Pakistani Students",
    description: "SAG is specifically designed for intermediate students navigating Pakistan's admission landscape — FSc, ICS, ICOM, and more.",
    color: "green",
  },
];

const featureColorMap = {
  purple: { bg: "bg-purple-50", icon: "text-purple-600", border: "border-purple-100" },
  blue:   { bg: "bg-blue-50",   icon: "text-blue-600",   border: "border-blue-100" },
  green:  { bg: "bg-green-50",  icon: "text-green-600",  border: "border-green-100" },
};

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = () => setIsLoggedIn(!!localStorage.getItem("auth_token"));
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
      href: "/universities",
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
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 bg-primary text-white px-4 py-2 rounded-lg">
        Skip to main content
      </a>

      <Navbar />

      <main id="main-content">
        {/* Hero */}
        <HeroSection
          title={
            <>
              Your <span className="text-primary">Smart Guide</span> to{" "}
              <br className="hidden sm:block" />
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

        {/* Stats Strip */}
        <section className="bg-primary py-6" aria-label="Platform statistics">
          <div className="max-w-4xl mx-auto px-6">
            <ul className="grid grid-cols-2 sm:grid-cols-4 gap-6 list-none m-0 p-0">
              {stats.map(({ icon: Icon, value, label }) => (
                <li key={label} className="flex flex-col items-center gap-1 text-white">
                  <Icon className="w-5 h-5 opacity-80" aria-hidden="true" />
                  <span className="text-2xl font-bold leading-none">{value}</span>
                  <span className="text-sm text-blue-100">{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* How It Works */}
        <section className="bg-gray-50 py-20" aria-labelledby="how-it-works-heading">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-2">Simple Process</p>
            <h2 id="how-it-works-heading" className="text-3xl font-bold text-gray-900">How It Works</h2>
            <p className="mt-3 text-gray-500 max-w-md mx-auto">Four simple steps from profile to perfect university match</p>
            <ol className="mt-12 grid sm:grid-cols-2 md:grid-cols-4 gap-6 list-none m-0 p-0 mt-10">
              {[
                { step: "1", title: "Enter Profile",          desc: "Provide your academic background, marks, and interests.",       icon: Users },
                { step: "2", title: "AI Analysis",            desc: "Our AI scores your profile against live merit and deadline data.", icon: Brain },
                { step: "3", title: "Get Recommendations",    desc: "Receive a personalised shortlist of universities and programs.",  icon: Target },
                { step: "4", title: "Apply Smartly",          desc: "Generate application documents and track deadlines in one click.", icon: FileText },
              ].map(({ step, title, desc, icon: Icon }, idx, arr) => (
                <li key={step} className="relative">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-left h-full">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center shrink-0" aria-hidden="true">
                        {step}
                      </div>
                      <Icon className="w-4 h-4 text-gray-400" aria-hidden="true" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                  </div>
                  {idx < arr.length - 1 && (
                    <ChevronRight className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5 z-10" aria-hidden="true" />
                  )}
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Why Choose SAG */}
        <section className="py-20 bg-white" aria-labelledby="why-sag-heading">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-2">Why SAG?</p>
              <h2 id="why-sag-heading" className="text-3xl font-bold text-gray-900">Built for Your Success</h2>
              <p className="mt-3 text-gray-500 max-w-xl mx-auto">
                More than just a list of universities — a complete decision-making engine for Pakistani students.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {features.map(({ icon: Icon, title, description, color }) => {
                const c = featureColorMap[color];
                return (
                  <div key={title} className={`rounded-2xl border ${c.border} p-6`}>
                    <div className={`w-11 h-11 ${c.bg} rounded-xl flex items-center justify-center mb-4`}>
                      <Icon className={`w-5 h-5 ${c.icon}`} aria-hidden="true" />
                    </div>
                    <h3 className="font-semibold text-gray-900 text-base mb-2">{title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Tools Grid */}
        <section className="py-20 bg-gray-50" aria-labelledby="tools-heading">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-2">Toolkit</p>
              <h2 id="tools-heading" className="text-3xl font-bold text-gray-900">Everything You Need to Apply</h2>
              <p className="mt-3 text-gray-500 max-w-xl mx-auto">
                All the tools you need in one place — from choosing the right program to generating your application documents.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {tools.map((t) => (
                <ToolCard key={t.title} {...t} isLoggedIn={isLoggedIn} />
              ))}
            </div>

            {/* Chatbot callout */}
            <div className="mt-6 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4" role="complementary" aria-label="AI Chatbot">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0" aria-hidden="true">
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
                onClick={() => window.dispatchEvent(new CustomEvent("open-chatbot"))}
                className="shrink-0 bg-white text-purple-700 font-semibold px-5 py-2.5 rounded-xl hover:bg-purple-50 transition text-sm flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-purple-600"
              >
                <Bot className="w-4 h-4" aria-hidden="true" />
                Chat with SAG AI
              </button>
            </div>
          </div>
        </section>

        {/* Testimonial / Trust Strip */}
        <section className="py-14 bg-white border-y border-gray-100" aria-label="Student trust">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <div className="flex justify-center gap-0.5 mb-3" aria-label="5 stars">
              {Array(5).fill(null).map((_, i) => (
                <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" aria-hidden="true" />
              ))}
            </div>
            <blockquote className="text-gray-700 text-lg font-medium leading-relaxed">
              &ldquo;SAG helped me figure out which universities actually matched my FSc marks — saved me weeks of confusion.&rdquo;
            </blockquote>
            <p className="mt-3 text-sm text-gray-400">— Final-year student, Punjab</p>
          </div>
        </section>

        {/* Final CTA — only for logged-out users */}
        {!isLoggedIn && (
          <section className="py-20 bg-gray-50 text-center" aria-labelledby="cta-heading">
            <div className="max-w-2xl mx-auto px-6">
              <h2 id="cta-heading" className="text-3xl font-bold text-gray-900">Start Your Smart Admission Journey</h2>
              <p className="mt-4 text-gray-500">Join students making smarter academic decisions with AI. No credit card needed.</p>
              <div className="mt-8 flex justify-center gap-4 flex-wrap">
                <a
                  href="/auth?mode=register"
                  className="bg-primary text-white px-8 py-3 rounded-xl shadow hover:bg-blue-700 transition font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  Create Free Account
                </a>
                <a
                  href="/auth?mode=login"
                  className="bg-white text-gray-700 border border-gray-200 px-8 py-3 rounded-xl hover:bg-gray-50 transition font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                >
                  Log In
                </a>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
      <ChatbotWidget />
    </div>
  );
}
