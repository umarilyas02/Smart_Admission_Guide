"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import Link from "next/link";
import {
  MapPin,
  Globe,
  Calendar,
  BookOpen,
  Clock,
  DollarSign,
  FileText,
  ChevronRight,
  Receipt,
} from "lucide-react";

function isRawDescription(desc) {
  if (!desc || desc.length < 40) return true;
  if (/\|/.test(desc)) return true;
  if (/\b(menu|home page|sign in|login|copyright|all rights reserved|admissions open|click here|read more)\b/i.test(desc)) return true;
  return false;
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatEventType(type) {
  if (!type) return type;
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatbotWidget from "@/components/ChatbotWidget";
import Breadcrumb from "@/components/Breadcrumb";

function InfoBadge({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 text-sm">
      <Icon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
      <div>
        <span className="text-gray-400 text-xs block">{label}</span>
        <span className="text-gray-800 font-medium">{value}</span>
      </div>
    </div>
  );
}

function getProgramGuidance(name = "") {
  const n = name.toLowerCase();
  if (/(computer|software|data|artificial|cyber|information technology|it)/.test(n)) {
    return {
      roadmap: ["Programming fundamentals", "Databases and systems", "Projects, internship, final-year product"],
      careers: ["Software Engineer", "Data Analyst", "Cybersecurity Analyst"],
    };
  }
  if (/(medical|mbbs|dentistry|pharmacy|nursing|physio|biotechnology|microbiology|nutrition)/.test(n)) {
    return {
      roadmap: ["Core science foundation", "Clinical/lab training", "House job, internship, or supervised practice"],
      careers: ["Healthcare Professional", "Clinical Researcher", "Public Health Officer"],
    };
  }
  if (/(engineering|civil|mechanical|electrical|chemical|architecture|mechatronics)/.test(n)) {
    return {
      roadmap: ["Math and physics foundation", "Discipline labs and design studios", "Capstone project and industrial training"],
      careers: ["Design Engineer", "Project Engineer", "Operations Engineer"],
    };
  }
  if (/(business|bba|accounting|finance|commerce|banking|marketing|human resource|supply chain)/.test(n)) {
    return {
      roadmap: ["Business and economics foundation", "Specialization courses", "Case studies, internship, and final project"],
      careers: ["Business Analyst", "Finance Officer", "Marketing Executive"],
    };
  }
  return {
    roadmap: ["Foundation courses", "Major specialization", "Internship, portfolio, or final-year project"],
    careers: ["Program Specialist", "Research Assistant", "Project Coordinator"],
  };
}

export default function UniversityProgramsPage({ params }) {
  const { id } = use(params);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`/api/universities/${id}/programs`)
      .then((res) => {
        if (!res.ok) throw new Error("University not found");
        return res.json();
      })
      .then((json) => setData(json.university))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="bg-gray-50 min-h-screen font-inter">
      <Navbar />

      <main className="min-h-screen py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">

          <Breadcrumb items={[
            { label: "Home", href: "/" },
            { label: "Universities", href: "/universities" },
            { label: data?.name ?? "...", href: `/universities/${id}` },
          ]} />

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-32 gap-3">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400 text-sm">Loading…</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="text-center py-32 text-red-500">{error}</div>
          )}

          {data && (
            <>
              {/* University header card */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                      {data.name}
                    </h1>
                    {data.location && (
                      <p className="text-gray-400 text-sm flex items-center gap-1 mb-3">
                        <MapPin className="w-3.5 h-3.5" />
                        {data.location}
                      </p>
                    )}
                    {data.description && !isRawDescription(data.description) && (
                      <p className="text-gray-600 text-sm leading-relaxed max-w-2xl">
                        {data.description}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    {data.fee_structure_url && (
                      <a
                        href={data.fee_structure_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition"
                      >
                        <Receipt className="w-4 h-4" />
                        Fee Structure
                      </a>
                    )}
                    {data.website && (
                      <a
                        href={data.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition"
                      >
                        <Globe className="w-4 h-4" />
                        Official Site
                      </a>
                    )}
                  </div>
                </div>

                {/* Events row */}
                {data.events?.length > 0 && (
                  <div className="mt-5 pt-5 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                      Admission Events
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {data.events.map((ev) => (
                        <div
                          key={ev.id}
                          className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm"
                        >
                          <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="font-medium text-gray-700">
                            {formatEventType(ev.event_type)}
                          </span>
                          {ev.start_date && (
                            <span className="text-gray-400">
                              {formatDate(ev.start_date)}
                              {ev.end_date ? ` – ${formatDate(ev.end_date)}` : ""}
                            </span>
                          )}
                          {ev.status && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                ev.status.toLowerCase() === "open"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-blue-100 text-primary"
                              }`}
                            >
                              {ev.status}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Programs section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    Programs Offered
                    <span className="ml-1 bg-blue-100 text-primary text-sm font-semibold px-2.5 py-0.5 rounded-full">
                      {data.programs?.length || 0}
                    </span>
                  </h2>
                </div>

                {data.programs?.length === 0 && (
                  <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                    <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-400">No programs listed yet.</p>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  {data.programs?.map((prog) => {
                    const guidance = getProgramGuidance(prog.name);
                    return (
                    <div
                      key={prog.id}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-gray-200 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <h3 className="font-semibold text-gray-900 leading-snug">{prog.name}</h3>
                        <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <InfoBadge
                          icon={DollarSign}
                          label="Fee"
                          value={prog.fee ? `PKR ${Number(prog.fee).toLocaleString()}` : null}
                        />
                        <InfoBadge
                          icon={Clock}
                          label="Duration"
                          value={prog.duration}
                        />
                        <InfoBadge
                          icon={FileText}
                          label="Eligibility"
                          value={prog.eligibility}
                        />
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                        <div>
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Roadmap</p>
                          <ol className="space-y-1 text-sm text-gray-600 list-decimal list-inside">
                            {guidance.roadmap.map((step) => <li key={step}>{step}</li>)}
                          </ol>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Career Paths</p>
                          <div className="flex flex-wrap gap-1.5">
                            {guidance.careers.map((career) => (
                              <span key={career} className="text-xs px-2.5 py-1 bg-blue-50 border border-blue-100 rounded-full text-primary">
                                {career}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
      <ChatbotWidget />
    </div>
  );
}
