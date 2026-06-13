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
import ValidatedInput from "@/components/ValidatedInput";

const SECTIONS = [
  { id: "personal",  label: "Personal Info",        icon: User,          desc: "Your name and contact details" },
  { id: "academic",  label: "Academic Background",   icon: GraduationCap, desc: "Education level and marks" },
  { id: "test",      label: "Entry Test",            icon: ClipboardList, desc: "MDCAT / ECAT / SAT score" },
  { id: "interests", label: "Interests & Goals",     icon: Lightbulb,     desc: "Tell AI about your passions" },
];

const TEST_TYPES = [
  { value: "mdcat",   label: "MDCAT",       max: 200 },
  { value: "ecat",    label: "ECAT",        max: 400 },
  { value: "nts_nat", label: "NTS NAT",     max: 100 },
  { value: "nums",    label: "NUMS",        max: 200 },
  { value: "gat",     label: "GAT General", max: 100 },
  { value: "other",   label: "Other",       max: 999 },
];

function isSectionComplete(id, f) {
  if (id === "personal")  return !!(f.name?.trim() && f.phone?.trim());
  if (id === "academic")  return !!(f.academic_level && f.matric_marks && f.intermediate_marks);
  if (id === "test")      return !!(f.test_type && f.test_score);
  if (id === "interests") return !!f.interests?.trim();
  return false;
}

function calcCompletion(form) {
  const done = SECTIONS.filter(s => isSectionComplete(s.id, form)).length;
  return Math.round((done / SECTIONS.length) * 100);
}

export default function ProfileProgressPage() {
  const [loading,            setLoading]            = useState(true);
  const [saving,             setSaving]             = useState(false);
  const [active,             setActive]             = useState("personal");
  const [saved,              setSaved]              = useState(false);
  const [apiError,           setApiError]           = useState("");
  const [suggestions,        setSuggestions]        = useState(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", phone: "", academic_level: "", matric_marks: "",
    intermediate_marks: "", test_type: "", test_score: "", interests: "",
  });
  const router = useRouter();

  const fetchSuggestions = async (formData) => {
    const token = localStorage.getItem("auth_token");
    setSuggestionsLoading(true);
    try {
      const res = await fetch("/api/profile/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          academic_level:     formData.academic_level,
          matric_marks:       formData.matric_marks,
          intermediate_marks: formData.intermediate_marks,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data);
      }
    } catch {
      // silently fail — suggestions are non-critical
    } finally {
      setSuggestionsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) { router.push("/auth?mode=login"); return; }

    fetch("/api/profile", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        const loaded = {
          name:               data.user?.name              || "",
          phone:              data.student?.phone           || "",
          academic_level:     data.student?.academic_level  || "",
          matric_marks:       data.student?.matric_marks    != null ? String(data.student.matric_marks) : "",
          intermediate_marks: data.student?.intermediate_marks != null ? String(data.student.intermediate_marks) : "",
          test_type:          data.student?.test_type        || "",
          test_score:         data.student?.test_score      != null ? String(data.student.test_score) : "",
          interests:          data.student?.interests        || "",
        };
        setForm(loaded);
        setLoading(false);
        // auto-fetch suggestions if profile is already complete on load
        if (calcCompletion(loaded) === 100) {
          fetchSuggestions(loaded);
        }
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
      if (calcCompletion(form) === 100) {
        // profile just became complete — fetch suggestions instantly, stay on page
        fetchSuggestions(form);
      } else {
        setTimeout(() => router.push("/"), 1000);
      }
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
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
        <Footer />
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
                    <ValidatedInput
                      type="name"
                      label="Full Name"
                      value={form.name}
                      onChange={e => set("name", e.target.value)}
                      placeholder="e.g. Ahmed Ali"
                      required
                      inputClassName="px-4 py-3 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 bg-white"
                    />
                    <ValidatedInput
                      type="phone"
                      label="Phone Number"
                      value={form.phone}
                      onChange={e => set("phone", e.target.value)}
                      placeholder="+92 300 0000000"
                      required
                      inputClassName="px-4 py-3 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 bg-white"
                    />
                  </div>
                </div>
              )}

              {/* ── Academic Background ── */}
              {active === "academic" && (
                <div>
                  <SectionHeader icon={GraduationCap} title="Academic Background" subtitle="Your education level and exam results" />
                  <div className="space-y-5">
                    <ValidatedInput
                      type="select"
                      label="Current Education Level"
                      value={form.academic_level}
                      onChange={e => set("academic_level", e.target.value)}
                      required
                      inputClassName="px-4 py-3 rounded-xl text-sm text-gray-900 bg-white appearance-none pr-10"
                    >
                      <option value="">Select your current level</option>
                      <option value="matric">Matric (10th Grade)</option>
                      <option value="intermediate">Intermediate (12th Grade / FSc / ICS)</option>
                    </ValidatedInput>

                    <div className="grid sm:grid-cols-2 gap-5">
                      <ValidatedInput
                        type="percentage"
                        label="Matric Marks (%)"
                        value={form.matric_marks}
                        onChange={e => {
                          const v = e.target.value;
                          if (v === "" || (parseFloat(v) >= 33 && parseFloat(v) <= 100)) set("matric_marks", v);
                        }}
                        min={33}
                        max={100}
                        placeholder="e.g. 85.5"
                        required
                        hint="Enter percentage, e.g. 85.5"
                        suffix="%"
                        inputClassName="px-4 py-3 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 bg-white pr-10"
                      />
                      <ValidatedInput
                        type="percentage"
                        label="Intermediate Marks (%)"
                        value={form.intermediate_marks}
                        onChange={e => {
                          const v = e.target.value;
                          if (v === "" || (parseFloat(v) >= 33 && parseFloat(v) <= 100)) set("intermediate_marks", v);
                        }}
                        min={33}
                        max={100}
                        placeholder="e.g. 78.0"
                        required
                        hint="Enter percentage, e.g. 78.0"
                        suffix="%"
                        inputClassName="px-4 py-3 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 bg-white pr-10"
                      />
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
                  <SectionHeader icon={ClipboardList} title="Entry Test Score" subtitle="Select your test type and enter your score" />
                  <div className="max-w-sm space-y-5">
                    <ValidatedInput
                      type="select"
                      label="Test Type"
                      value={form.test_type}
                      onChange={e => { set("test_type", e.target.value); set("test_score", ""); }}
                      required
                      hint="Select the entry test you have attempted"
                      inputClassName="px-4 py-3 rounded-xl text-sm text-gray-900 bg-white appearance-none pr-10"
                    >
                      <option value="">Select test type</option>
                      {TEST_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </ValidatedInput>

                    {form.test_type && (() => {
                      const testDef = TEST_TYPES.find(t => t.value === form.test_type);
                      return (
                        <ValidatedInput
                          type="number"
                          label={`${testDef.label} Score`}
                          value={form.test_score}
                          onChange={e => {
                            const v = e.target.value;
                            if (v === "" || (parseFloat(v) >= 0 && parseFloat(v) <= testDef.max)) {
                              set("test_score", v);
                            }
                          }}
                          min={0}
                          max={testDef.max}
                          placeholder={`0 – ${testDef.max}`}
                          required
                          hint={`Enter a value between 0 and ${testDef.max}`}
                          suffix={`/ ${testDef.max}`}
                          inputClassName="px-4 py-3 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 bg-white pr-20"
                        />
                      );
                    })()}
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
                  <div>
                    <ValidatedInput
                      type="textarea"
                      label="Describe your interests and career goals"
                      value={form.interests}
                      onChange={e => set("interests", e.target.value)}
                      rows={6}
                      placeholder="e.g. I'm passionate about software development and machine learning. I want to build innovative products that help people in daily life. I enjoy problem-solving and am drawn to computer science and AI-related fields..."
                      inputClassName="px-4 py-3 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 bg-white resize-none"
                    />
                    <p className="text-xs text-gray-400 mt-1.5 text-right">
                      {form.interests?.length || 0} characters
                    </p>
                  </div>

                  <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>The more detail you provide, the better our AI can match you with the right departments and universities.</span>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="mt-8 pt-5 border-t border-gray-100 flex items-center justify-between flex-wrap gap-3">
                <div className="min-h-5">
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

        {/* ── Suggestion panel — shown below the form when profile is 100% complete ── */}
        {(suggestionsLoading || suggestions) && (
          <div className="mt-6">
            <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">AI Program Suggestion</h3>
                  <p className="text-xs text-blue-600 font-medium">
                    This suggestion is based on your previous studies
                  </p>
                </div>
              </div>

              {suggestionsLoading && !suggestions && (
                <div className="flex items-center gap-3 py-6 justify-center text-gray-400 text-sm">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                  Analyzing your academic background…
                </div>
              )}

              {suggestions?.suggestions?.[0] && (
                <div className="mt-4">
                  <SuggestionCard suggestion={suggestions.suggestions[0]} />
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
      <ChatbotWidget />
    </div>
  );
}

/* ── Shared sub-components ── */

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

function SuggestionCard({ suggestion }) {
  const score = suggestion.matchScore ?? 0;

  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50 p-5 flex flex-col gap-4 sm:flex-row sm:items-start">
      {/* Left: score circle */}
      <div className="flex-shrink-0 flex flex-col items-center justify-center w-16 h-16 rounded-full bg-white border-2 border-blue-200 self-start">
        <span className="text-lg font-bold text-blue-600 leading-none">{score}%</span>
        <span className="text-[9px] text-gray-400 leading-none mt-0.5">match</span>
      </div>

      {/* Right: content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <h4 className="text-base font-bold text-gray-900 leading-tight">{suggestion.department}</h4>
            <span className="text-xs text-blue-500 font-medium">{suggestion.field}</span>
          </div>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed mt-2">{suggestion.reason}</p>

        {suggestion.eligibility && (
          <div className="flex items-start gap-1.5 text-xs text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2 mt-3">
            <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            {suggestion.eligibility}
          </div>
        )}

        {suggestion.careers?.length > 0 && (
          <div className="mt-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Career Paths</p>
            <div className="flex flex-wrap gap-1.5">
              {suggestion.careers.map((c, i) => (
                <span key={i} className="text-xs px-2.5 py-1 bg-white border border-blue-200 rounded-full text-gray-600">
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
