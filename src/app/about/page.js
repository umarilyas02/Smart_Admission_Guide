"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatbotWidget from "@/components/ChatbotWidget";

export default function AboutPage() {
  return (
    <div className="bg-secondary min-h-screen font-inter">
      <Navbar />

      <main className="min-h-screen">
        <section className="bg-white py-20">
          <div className="max-w-7xl mx-auto px-6">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              About Smart Admission Guide
            </h1>

            <div className="prose prose-lg max-w-4xl">
              <p className="text-gray-600 mb-6">
                Smart Admission Guide is an AI-powered platform designed to help intermediate students navigate the complex university admission process. Our mission is to empower students with data-driven insights and personalized recommendations.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                Our Vision
              </h2>
              <p className="text-gray-600 mb-6">
                We believe every student deserves access to accurate, personalized guidance when choosing a university. By leveraging artificial intelligence and comprehensive admission data, we make the process transparent and achievable for everyone.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                Key Features
              </h2>
              <ul className="space-y-3 text-gray-600 mb-6">
                <li className="flex items-start">
                  <span className="text-primary font-bold mr-3">✓</span>
                  <span>AI-powered university recommendations based on your academic profile</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary font-bold mr-3">✓</span>
                  <span>Admission chance calculator with real merit cut-offs</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary font-bold mr-3">✓</span>
                  <span>Interactive chatbot for instant admission guidance</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary font-bold mr-3">✓</span>
                  <span>Comprehensive university database with programs and scholarships</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary font-bold mr-3">✓</span>
                  <span>Application tracking and deadline management</span>
                </li>
              </ul>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                Why Choose Us?
              </h2>
              <p className="text-gray-600 mb-6">
                With thousands of students successfully placed, our platform combines academic excellence with user-friendly design. We&apos;re committed to making admission guidance accessible, affordable, and effective.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <ChatbotWidget />
    </div>
  );
}
