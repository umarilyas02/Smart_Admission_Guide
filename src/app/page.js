import Navbar from "@/components/Navbar";
import Image from "next/image";

export default function Home() {
  return (
    <div className="bg-secondary font-inter">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="min-h-screen">
        {/* HERO SECTION */}
        <section className="bg-white py-12 sm:py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 grid md:grid-cols-2 gap-8 md:gap-10 items-center">
            {/* Text */}
            <div className="fade-in">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                Your <span className="text-primary">Smart Guide</span> to <br className="hidden sm:block" />
                University Admissions
              </h1>

              <p className="mt-4 sm:mt-5 text-gray-600 text-base sm:text-lg">
                Smart Admission Guide helps intermediate students choose the
                best university and program using AI-powered recommendations.
              </p>

              <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:gap-4">
                <a
                  href="/auth"
                  className="bg-primary text-white px-6 py-3 rounded-lg shadow hover:bg-blue-700 transition"
                >
                  Get Started
                </a>

                <a
                  href="/admission-chance"
                  className="border border-primary text-primary px-6 py-3 rounded-lg hover:bg-primary hover:text-white transition"
                >
                  Check Admission Chance
                </a>
              </div>
            </div>

            {/* Image Placeholder */}
            <div className="hidden md:block fade-in">
              <Image
                src="/images/hero.jpg"
                alt="Students pursuing university admissions"
                width={600}
                height={400}
                className="rounded-xl shadow-lg"
                priority
              />
            </div>
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section className="bg-secondary py-16">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
            <p className="mt-3 text-gray-600">Just 4 simple steps to your future</p>

            <div className="mt-10 grid md:grid-cols-4 gap-8">
              <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transform transition duration-300 fade-in">
                <h3 className="text-xl font-semibold text-primary">1. Enter Profile</h3>
                <p className="mt-2 text-gray-600">
                  Provide your academic background and preferences.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transform transition duration-300 fade-in">
                <h3 className="text-xl font-semibold text-primary">2. AI Analysis</h3>
                <p className="mt-2 text-gray-600">
                  Our AI analyzes your profile using merit data.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transform transition duration-300 fade-in">
                <h3 className="text-xl font-semibold text-primary">3. Get Recommendations</h3>
                <p className="mt-2 text-gray-600">
                  Personalized universities and programs suggested.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transform transition duration-300 fade-in">
                <h3 className="text-xl font-semibold text-primary">4. Apply Smartly</h3>
                <p className="mt-2 text-gray-600">
                  Generate application documents and track deadlines.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Powerful AI-Based Features
            </h2>

            <div className="mt-12 grid md:grid-cols-3 gap-8">
              <div className="p-6 border rounded-xl hover:shadow-lg transition fade-in">
                <h3 className="text-xl font-semibold text-primary">
                  🎯 Smart Recommendations
                </h3>
                <p className="mt-3 text-gray-600">
                  Get university and program suggestions based on your marks.
                </p>
              </div>

              <div className="p-6 border rounded-xl hover:shadow-lg transition fade-in">
                <h3 className="text-xl font-semibold text-primary">
                  📊 Admission Chance Calculator
                </h3>
                <p className="mt-3 text-gray-600">
                  Predict your admission probability using AI.
                </p>
              </div>

              <div className="p-6 border rounded-xl hover:shadow-lg transition fade-in">
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

        {/* ADMISSION CHANCE PREVIEW */}
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

        {/* FINAL CALL TO ACTION */}
        <section className="py-20 bg-secondary text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Start Your Smart Admission Journey Today
          </h2>

          <p className="mt-4 text-gray-600">
            Join thousands of students making better academic decisions.
          </p>

          <a
            href="/auth"
            className="inline-block mt-6 bg-primary text-white px-8 py-3 rounded-lg shadow hover:bg-blue-700 transition"
          >
            Create Free Account
          </a>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white py-8 border-t">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-600">
          <p className="font-medium text-gray-900 mb-2">Smart Admission Guide</p>
          <p className="text-sm">&copy; 2026 Smart Admission Guide. All rights reserved.</p>
          <div className="mt-4 flex justify-center gap-6 text-sm">
            <a href="/about" className="hover:text-primary">About</a>
            <a href="/auth" className="hover:text-primary">Login</a>
            <a href="/contact" className="hover:text-primary">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
