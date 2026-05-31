"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatbotWidget from "@/components/ChatbotWidget";
import {
  User, GraduationCap, ClipboardList, Lightbulb,
  Check, ChevronRight, Save, ArrowLeft, Loader2, Sparkles,
} from "lucide-react";

const SECTIONS = [
  { id: "personal",  label: "Personal Info",        icon: User,          desc: "Your name and contact details" },
  { id: "academic",  label: "Academic Background",   icon: GraduationCap, desc: "Education level and marks" },
  { id: "test",      label: "Entry Test",            icon: ClipboardList, desc: "MDCAT / ECAT / SAT score" },
  { id: "interests", label: "Interests & Goals",     icon: Lightbulb,     desc: "Tell AI about your passions" },
];

function isSectionComplete(id, f) {
  if (id === "personal")  return !!(f.name?.trim() && f.phone?.trim());
  if (id === "academic")  return !!(f.academic_level && f.matric_marks && f.intermediate_marks);
  if (id === "test")      return !!f.test_score;
  if (id === "interests") return !!f.interests?.trim();
  return false;
}

function calcCompletion(form) {
  const done = SECTIONS.filter(s => isSectionComplete(s.id, form)).length;
  return Math.round((done / SECTIONS.length) * 100);
}

export default function ProfileProgressPage() {
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [active,   setActive]   = useState("personal");
  const [saved,    setSaved]    = useState(false);
  const [apiError, setApiError] = useState("");
  const [form, setForm] = useState({
    name: "", phone: "", academic_level: "", matric_marks: "",
    intermediate_marks: "", test_score: "", interests: "",
  });
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) { router.push("/auth?mode=login"); return; }

    fetch("/api/profile", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        setForm({
          name:               data.user?.name              || "",
          phone:              data.student?.phone           || "",
          academic_level:     data.student?.academic_level  || "",
          matric_marks:       data.student?.matric_marks    != null ? String(data.student.matric_marks) : "",
          intermediate_marks: data.student?.intermediate_marks != null ? String(data.student.intermediate_marks) : "",
          test_score:         data.student?.test_score      != null ? String(data.student.test_score) : "",
          interests:          data.student?.interests        || "",
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  const set = (field, value) => setForm(p => ({ ...p, [field]: value }));

  const handleSave = async () => {
    const token = localStorage.getItem("auth_token");
    setSaving(true);
    setApiError("");
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
      setTimeout(() => router.push("/"), 1000);
    } catch {
      setApiError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const completion   = calcCompletion(form);
  const activeIdx    = SECTIONS.findIndex(s => s.id === active);
  const isLastSection = activeIdx === SECTIONS.length - 1;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen font-inter">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">

        {/* Back */}
        <button
          onClick={() => router.push("/dashboard")}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Complete Your Profile</h1>
          <p className="text-gray-500 mt-1 text-sm">
            A complete profile helps our AI give you the best university recommendations.
          </p>
        </div>

        {/* Progress banner */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-sm font-semibold text-gray-700">Profile Completion</span>
            <span className={`text-xl font-bold ${completion === 100 ? "text-green-600" : "text-blue-600"}`}>
              {completion}%
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-2.5 rounded-full transition-all duration-700 ${
                completion === 100 ? "bg-green-500" : "bg-blue-600"
              }`}
              style={{ width: `${completion}%` }}
            />
          </div>
          {completion === 100 && (
            <p className="text-green-600 text-xs font-medium mt-2 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Profile complete — you'll get the most accurate recommendations!
            </p>
          )}
          {completion < 100 && (
            <p className="text-gray-400 text-xs mt-2">
              {SECTIONS.filter(s => !isSectionComplete(s.id, form)).length} section
              {SECTIONS.filter(s => !isSectionComplete(s.id, form)).length !== 1 ? "s" : ""} remaining
            </p>
          )}
        </div>

        <div className="grid lg:grid-cols-4 gap-6 items-start">

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 space-y-1 sticky top-6">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 pt-1 pb-2">
                Sections
              </p>
              {SECTIONS.map((sec) => {
                const done     = isSectionComplete(sec.id, form);
                const isActive = active === sec.id;
                const Icon     = sec.icon;
                return (
                  <button
                    key={sec.id}
                    onClick={() => setActive(sec.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "bg-blue-50 text-blue-700 shadow-sm"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      done ? "bg-green-100" : isActive ? "bg-blue-100" : "bg-gray-100"
                    }`}>
                      <Icon className={`w-4 h-4 ${done ? "text-green-600" : isActive ? "text-blue-600" : "text-gray-400"}`} />
                    </span>
                    <span className="flex-1 text-left leading-tight">
                      <span className="block">{sec.label}</span>
                      <span className={`block text-[11px] font-normal ${isActive ? "text-blue-400" : "text-gray-400"}`}>
                        {sec.desc}
                      </span>
                    </span>
                    {done ? (
                      <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-green-600" />
                      </span>
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Form card */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">

              {/* ── Personal Info ── */}
              {active === "personal" && (
                <div>
                  <SectionHeader icon={User} title="Personal Information" subtitle="Your name and contact details" />
                  <div className="grid sm:grid-cols-2 gap-5">
                    <Field label="Full Name" required>
                      <input
                        type="text"
                        value={form.name}
                        onChange={e => set("name", e.target.value)}
                        placeholder="e.g. Ahmed Ali"
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Phone Number" required>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={e => set("phone", e.target.value)}
                        placeholder="+92 300 0000000"
                        className={inputCls}
                      />
                    </Field>
                  </div>
                </div>
              )}

              {/* ── Academic Background ── */}
              {active === "academic" && (
                <div>
                  <SectionHeader icon={GraduationCap} title="Academic Background" subtitle="Your education level and exam results" />
                  <div className="space-y-5">
                    <Field label="Current Education Level" required>
                      <select
                        value={form.academic_level}
                        onChange={e => set("academic_level", e.target.value)}
                        className={selectCls}
                      >
                        <option value="">Select your current level</option>
                        <option value="matric">Matric (10th Grade)</option>
                        <option value="intermediate">Intermediate (12th Grade / FSc / ICS)</option>
                        <option value="bachelors">Bachelor's Degree</option>
                        <option value="masters">Master's Degree</option>
                      </select>
                    </Field>

                    <div className="grid sm:grid-cols-2 gap-5">
                      <Field label="Matric Marks (%)" required hint="Enter percentage, e.g. 85.5">
                        <div className="relative">
                          <input
                            type="number"
                            min="0" max="100" step="0.1"
                            value={form.matric_marks}
                            onChange={e => set("matric_marks", e.target.value)}
                            placeholder="e.g. 85.5"
                            className={inputCls + " pr-10"}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                        </div>
                      </Field>
                      <Field label="Intermediate Marks (%)" required hint="Enter percentage, e.g. 78.0">
                        <div className="relative">
                          <input
                            type="number"
                            min="0" max="100" step="0.1"
                            value={form.intermediate_marks}
                            onChange={e => set("intermediate_marks", e.target.value)}
                            placeholder="e.g. 78.0"
                            className={inputCls + " pr-10"}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                        </div>
                      </Field>
                    </div>

                    {/* Marks meter */}
                    {(form.matric_marks || form.intermediate_marks) && (
                      <div className="bg-blue-50 rounded-xl p-4 space-y-2">
                        {form.matric_marks && (
                          <MarksBar label="Matric" value={parseFloat(form.matric_marks)} />
                        )}
                        {form.intermediate_marks && (
                          <MarksBar label="Intermediate" value={parseFloat(form.intermediate_marks)} />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Entry Test ── */}
              {active === "test" && (
                <div>
                  <SectionHeader icon={ClipboardList} title="Entry Test Score" subtitle="MDCAT, ECAT, SAT, or any other entry test" />
                  <div className="max-w-sm space-y-5">
                    <Field label="Test Score" hint="Leave blank if you haven't attempted any test yet">
                      <input
                        type="number"
                        value={form.test_score}
                        onChange={e => set("test_score", e.target.value)}
                        placeholder="e.g. 920"
                        className={inputCls}
                      />
                    </Field>
                  </div>

                  <div className="mt-6 p-4 bg-yellow-50 border border-yellow-100 rounded-xl text-sm text-yellow-700">
                    <strong>Tip:</strong> Your entry test score is used to match you with universities whose merit criteria you meet.
                  </div>
                </div>
              )}

              {/* ── Interests ── */}
              {active === "interests" && (
                <div>
                  <SectionHeader icon={Lightbulb} title="Interests & Goals" subtitle="Help our AI understand your passions and career direction" />
                  <Field label="Describe your interests and career goals">
                    <textarea
                      rows={6}
                      value={form.interests}
                      onChange={e => set("interests", e.target.value)}
                      placeholder="e.g. I'm passionate about software development and machine learning. I want to build innovative products that help people in daily life. I enjoy problem-solving and am drawn to computer science and AI-related fields..."
                      className={`${inputCls} resize-none`}
                    />
                    <p className="text-xs text-gray-400 mt-1.5 text-right">
                      {form.interests?.length || 0} characters
                    </p>
                  </Field>

                  <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>The more detail you provide, the better our AI can match you with the right departments and universities.</span>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="mt-8 pt-5 border-t border-gray-100 flex items-center justify-between flex-wrap gap-3">
                <div className="min-h-[20px]">
                  {saved && (
                    <p className="text-green-600 text-sm font-medium flex items-center gap-1.5">
                      <Check className="w-4 h-4" /> Saved successfully
                    </p>
                  )}
                  {apiError && <p className="text-red-500 text-sm">{apiError}</p>}
                </div>

                <div className="flex gap-3">
                  {!isLastSection && (
                    <button
                      type="button"
                      onClick={() => setActive(SECTIONS[activeIdx + 1].id)}
                      className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
                    >
                      Next Section
                    </button>
                  )}
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? "Saving…" : "Save Profile"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <ChatbotWidget />
    </div>
  );
}

/* ── Shared sub-components ── */

const inputCls =
  "w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white";

const selectCls =
  "w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white appearance-none";

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-3 mb-7">
      <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-blue-600" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-gray-900 leading-tight">{title}</h2>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
}

function Field({ label, required, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

function MarksBar({ label, value }) {
  const clamped = Math.min(100, Math.max(0, value || 0));
  const color =
    clamped >= 80 ? "bg-green-500" :
    clamped >= 60 ? "bg-blue-500"  :
    clamped >= 45 ? "bg-yellow-500" : "bg-red-400";

  return (
    <div>
      <div className="flex justify-between text-xs text-blue-700 mb-1">
        <span>{label}</span>
        <span className="font-semibold">{clamped}%</span>
      </div>
      <div className="w-full bg-blue-100 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all duration-500`} style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}
