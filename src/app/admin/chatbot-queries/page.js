"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";

export default function ChatbotQueries() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [queries, setQueries] = useState([]);
  const [filter, setFilter] = useState("all"); // all, relevant, irrelevant

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      router.push("/auth?mode=login");
      return;
    }

    // Simulate fetching chatbot queries
    setTimeout(() => {
      setQueries([
        {
          id: 1,
          query: "What is the FAST admission merit?",
          type: "relevant",
          timestamp: "2026-01-27 10:30 AM",
          response: "The merit varies by program, typically 80-85%.",
        },
        {
          id: 2,
          query: "Tell me a joke",
          type: "irrelevant",
          timestamp: "2026-01-27 10:15 AM",
          response: "I'm here to help with admission guidance.",
        },
        {
          id: 3,
          query: "Which universities offer CS programs?",
          type: "relevant",
          timestamp: "2026-01-27 09:45 AM",
          response: "FAST, NUST, COMSATS, and many others offer CS programs.",
        },
        {
          id: 4,
          query: "What is 2+2?",
          type: "irrelevant",
          timestamp: "2026-01-27 09:30 AM",
          response: "Please ask admission-related questions.",
        },
        {
          id: 5,
          query: "NUST entry test preparation tips?",
          type: "relevant",
          timestamp: "2026-01-27 09:00 AM",
          response:
            "Focus on Math, Physics, and practice past papers. Aim for speed and accuracy.",
        },
      ]);
      setLoading(false);
    }, 500);
  }, [router]);

  const filteredQueries = queries.filter((q) => {
    if (filter === "all") return true;
    return q.type === filter;
  });

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-8">
        <h1 className="text-2xl font-bold text-blue-600 mb-6">
          Chatbot Queries Log
        </h1>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Total Queries</p>
            <p className="text-2xl font-bold text-blue-600">{queries.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Relevant</p>
            <p className="text-2xl font-bold text-green-600">
              {queries.filter((q) => q.type === "relevant").length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Irrelevant</p>
            <p className="text-2xl font-bold text-red-600">
              {queries.filter((q) => q.type === "irrelevant").length}
            </p>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg transition ${
              filter === "all"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            All Queries
          </button>
          <button
            onClick={() => setFilter("relevant")}
            className={`px-4 py-2 rounded-lg transition ${
              filter === "relevant"
                ? "bg-green-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            Relevant
          </button>
          <button
            onClick={() => setFilter("irrelevant")}
            className={`px-4 py-2 rounded-lg transition ${
              filter === "irrelevant"
                ? "bg-red-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            Irrelevant
          </button>
        </div>

        {/* Queries List */}
        <div className="space-y-4">
          {filteredQueries.map((query) => (
            <div
              key={query.id}
              className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transform transition duration-300"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="grow">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">
                      {query.type === "relevant" ? "❓" : "❌"}
                    </span>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {query.query}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">
                    {query.timestamp}
                  </p>
                  <div className="bg-gray-50 p-3 rounded-lg mt-3">
                    <p className="text-sm text-gray-700">
                      <strong>Response:</strong> {query.response}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    query.type === "relevant"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {query.type}
                </span>
              </div>
            </div>
          ))}
        </div>

        {filteredQueries.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No queries found for this filter.
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
