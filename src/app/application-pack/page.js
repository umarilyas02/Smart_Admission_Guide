"use client";

import { useState, useEffect } from "react";
import {
  FileText, Mail, FilePen, Save, Download,
  CheckSquare, Square, ChevronDown, ChevronUp,
  Info, Lock, Sparkles, AlertCircle, CheckCircle2, User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatbotWidget from "@/components/ChatbotWidget";

/* ── helpers ── */
function pct(obtained, total) {
  if (!obtained || !total) return null;
  return ((parseFloat(obtained) / parseFloat(total)) * 100).toFixed(1);
}

function FieldInput({ field, value, onChange }) {
  const base =
    "w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white";
  if (field.type === "textarea") {
    return (
      <textarea
        value={value || ""}
        onChange={onChange}
        placeholder={field.placeholder}
        rows={field.rows || 3}
        className={`${base} resize-none`}
      />
    );
  }
  if (field.type === "select") {
    return (
      <select value={value || ""} onChange={onChange} className={base}>
        {field.options.map((opt) => (
          <option key={opt} value={opt}>{opt || "— Select —"}</option>
        ))}
      </select>
    );
  }
  return (
    <input
      type={field.type}
      value={value || ""}
      onChange={onChange}
      placeholder={field.placeholder}
      className={base}
    />
  );
}

function FormSection({ section, formData, onChange, openSections, toggleSection }) {
  const isOpen = openSections[section.id];
  const filledCount = section.fields.filter((f) => formData[f.id]?.toString().trim()).length;
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => toggleSection(section.id)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-gray-50 hover:bg-gray-100 transition text-left"
      >
        <div className="flex items-center gap-3">
          <span className="font-semibold text-gray-800 text-sm">{section.title}</span>
          <span className="text-xs text-gray-400">{filledCount}/{section.fields.length} filled</span>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {isOpen && (
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {section.fields.map((field) => (
            <div key={field.id} className={field.span ? "md:col-span-2" : ""}>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <FieldInput field={field} value={formData[field.id]} onChange={onChange(field.id)} />
            </div>
          ))}
          {section.id === "academic" && (
            <>
              {formData.matricTotal && formData.matricObtained && (
                <div className="bg-blue-50 border border-blue-100 rounded-md px-3 py-2 text-sm text-blue-700">
                  Matric %: <strong>{pct(formData.matricObtained, formData.matricTotal)}%</strong>
                </div>
              )}
              {formData.interTotal && formData.interObtained && (
                <div className="bg-blue-50 border border-blue-100 rounded-md px-3 py-2 text-sm text-blue-700">
                  Intermediate %: <strong>{pct(formData.interObtained, formData.interTotal)}%</strong>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function DocumentChecklist({ checklist, checked, onToggle }) {
  const required = checklist.filter((d) => d.required);
  const optional = checklist.filter((d) => !d.required);
  const doneCount = checklist.filter((d) => checked[d.id]).length;
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <span className="font-semibold text-gray-800 text-sm">Required Documents</span>
        <span className="text-xs text-gray-500">{doneCount}/{checklist.length} ready</span>
      </div>
      <div className="p-5 space-y-5">
        <div>
          <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-2">Mandatory</p>
          <div className="space-y-2">
            {required.map((doc) => (
              <button key={doc.id} type="button" onClick={() => onToggle(doc.id)} className="flex items-start gap-2.5 w-full text-left group">
                {checked[doc.id]
                  ? <CheckSquare className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  : <Square className="w-4 h-4 text-gray-300 group-hover:text-gray-400 shrink-0 mt-0.5" />}
                <span className={`text-sm ${checked[doc.id] ? "line-through text-gray-400" : "text-gray-700"}`}>{doc.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">May be required</p>
          <div className="space-y-2">
            {optional.map((doc) => (
              <button key={doc.id} type="button" onClick={() => onToggle(doc.id)} className="flex items-start gap-2.5 w-full text-left group">
                {checked[doc.id]
                  ? <CheckSquare className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  : <Square className="w-4 h-4 text-gray-300 group-hover:text-gray-400 shrink-0 mt-0.5" />}
                <span className={`text-sm ${checked[doc.id] ? "line-through text-gray-400" : "text-gray-700"}`}>{doc.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-md p-3">
          <p className="text-xs text-amber-700 leading-relaxed">
            <strong>Tip:</strong> Most Pakistani universities require attested photocopies. Get them done at a notary in advance.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Recommender Form ── */
function RecommenderForm({ info, onChange }) {
  const base = "w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white";
  const fields = [
    { id: "name",         label: "Recommender's Full Name",       placeholder: "e.g. Dr. Asif Iqbal",         required: true },
    { id: "designation",  label: "Designation / Title",           placeholder: "e.g. Associate Professor",    required: true },
    { id: "department",   label: "Department / Institution",      placeholder: "e.g. Dept. of CS, FAST Lahore", required: true },
    { id: "email",        label: "Email Address",                 placeholder: "recommender@example.com",     required: false },
    { id: "relationship", label: "Your relationship to them",     placeholder: "e.g. Class Teacher, Lab Supervisor", required: true },
  ];
  return (
    <div className="mt-4 border border-purple-100 bg-purple-50 rounded-lg p-4 space-y-3">
      <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide flex items-center gap-1.5">
        <User className="w-3.5 h-3.5" /> Recommender Information
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        {fields.map((f) => (
          <div key={f.id} className={f.id === "department" || f.id === "relationship" ? "sm:col-span-2" : ""}>
            <label className="block text-xs text-purple-700 font-medium mb-1">
              {f.label}{f.required && <span className="text-red-400 ml-1">*</span>}
            </label>
            <input
              type="text"
              value={info[f.id] || ""}
              onChange={(e) => onChange(f.id, e.target.value)}
              placeholder={f.placeholder}
              className={base}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Document Card ── */
function DocumentCard({ doc, isLoggedIn, generated, onGenerate, generating, recommenderInfo, onRecommenderChange, showRecommenderForm, onToggleRecommenderForm }) {
  const isGenerated = generated.includes(doc.type);
  const isGenerating = generating[doc.type];
  const isMotivation = doc.type === "motivation-letter";
  const isRec = doc.type === "recommendation-request";

  return (
    <div className={`bg-white border rounded-xl p-5 flex flex-col gap-3 ${isGenerated && isMotivation ? "border-gray-200 opacity-75" : "border-gray-200"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
            doc.type === "admission-form"       ? "bg-blue-50"   :
            doc.type === "motivation-letter"    ? "bg-purple-50" : "bg-green-50"
          }`}>
            <doc.Icon className={`w-4.5 h-4.5 ${
              doc.type === "admission-form"       ? "text-blue-600"   :
              doc.type === "motivation-letter"    ? "text-purple-600" : "text-green-600"
            }`} />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{doc.name}</p>
            <p className="text-xs text-gray-500">{doc.desc}</p>
          </div>
        </div>

        {/* Status badge */}
        {isGenerated && isMotivation && (
          <span className="shrink-0 flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
            <CheckCircle2 className="w-3 h-3" /> Generated
          </span>
        )}
      </div>

      {/* Motivation letter: AI badge + one-time warning */}
      {isMotivation && (
        <div className={`rounded-lg px-3 py-2 text-xs flex items-start gap-2 ${isGenerated ? "bg-amber-50 border border-amber-100 text-amber-700" : "bg-purple-50 border border-purple-100 text-purple-700"}`}>
          {isGenerated
            ? <><AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> You have already generated your motivation letter. Each student may generate it once — make sure you saved the file.</>
            : <><Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5" /> Written by Claude AI based on your form details. You get <strong>one generation</strong> — save the PDF immediately.</>
          }
        </div>
      )}

      {/* Recommendation request: toggle recommender form */}
      {isRec && (
        <div>
          <button
            type="button"
            onClick={onToggleRecommenderForm}
            className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
          >
            <User className="w-3.5 h-3.5" />
            {showRecommenderForm ? "Hide recommender details" : "Enter recommender details first"}
            {showRecommenderForm ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {showRecommenderForm && (
            <RecommenderForm info={recommenderInfo} onChange={onRecommenderChange} />
          )}
        </div>
      )}

      {/* Action button */}
      {!isLoggedIn ? (
        <a href="/auth?mode=login" className="self-start text-xs bg-gray-100 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-200 transition font-medium flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5" /> Log in to download
        </a>
      ) : isGenerated && isMotivation ? (
        <p className="text-xs text-gray-400 italic">Not available for re-download.</p>
      ) : (
        <button
          type="button"
          onClick={() => onGenerate(doc.type)}
          disabled={isGenerating || (isRec && !recommenderInfo?.name?.trim())}
          className={`self-start flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition disabled:opacity-50 disabled:cursor-not-allowed ${
            doc.type === "admission-form"    ? "bg-blue-600 hover:bg-blue-700"   :
            doc.type === "motivation-letter" ? "bg-purple-600 hover:bg-purple-700" : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {isGenerating ? (
            <><div className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" /> Generating…</>
          ) : (
            <><Download className="w-3.5 h-3.5" /> {isMotivation ? "Generate with AI" : "Download PDF"}</>
          )}
        </button>
      )}
    </div>
  );
}

/* ══════════════════════════════════════
   Main Page
══════════════════════════════════════ */
export default function ApplicationPackPage() {
  const router = useRouter();
  const [isLoggedIn,          setIsLoggedIn]          = useState(false);
  const [loading,             setLoading]              = useState(true);
  const [saving,              setSaving]               = useState(false);
  const [generating,          setGenerating]           = useState({});
  const [formSchema,          setFormSchema]           = useState(null);
  const [formData,            setFormData]             = useState({});
  const [docChecked,          setDocChecked]           = useState({});
  const [openSections,        setOpenSections]         = useState({ personal: true });
  const [generatedDocuments,  setGeneratedDocuments]   = useState([]);
  const [recommenderInfo,     setRecommenderInfo]      = useState({});
  const [showRecommenderForm, setShowRecommenderForm]  = useState(false);
  const [error,               setError]                = useState("");
  const [success,             setSuccess]              = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const schemaRes = await fetch("/api/admission-form/schema");
        const schema = await schemaRes.json();
        setFormSchema(schema);

        const token = localStorage.getItem("auth_token");
        setIsLoggedIn(!!token);

        if (token) {
          const profileRes = await fetch("/api/admission-form", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (profileRes.ok) {
            const data = await profileRes.json();
            setGeneratedDocuments(data.generatedDocuments || []);
            if (data.savedForm) {
              setFormData(data.savedForm);
            } else if (data.student) {
              setFormData({
                fullName: data.student.name || "",
                email:    data.student.email || "",
                phone:    data.student.phone || "",
              });
            }
          }
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load form");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleChange  = (field) => (e) => { setFormData((p) => ({ ...p, [field]: e.target.value })); setError(""); };
  const toggleSection = (id) => setOpenSections((p) => ({ ...p, [id]: !p[id] }));
  const toggleDoc     = (id) => setDocChecked((p) => ({ ...p, [id]: !p[id] }));

  const handleRecommenderChange = (field, value) =>
    setRecommenderInfo((p) => ({ ...p, [field]: value }));

  const handleSave = async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) { router.push("/auth?mode=login"); return; }
    try {
      setSaving(true);
      const res  = await fetch("/api/admission-form", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) { setSuccess("Form saved!"); setTimeout(() => setSuccess(""), 3000); }
      else        { setError(data.error || "Failed to save form"); }
    } catch { setError("Failed to save form"); }
    finally { setSaving(false); }
  };

  const generateDocument = async (documentType) => {
    const token = localStorage.getItem("auth_token");
    if (!token) { router.push("/auth?mode=login"); return; }
    try {
      setGenerating((p) => ({ ...p, [documentType]: true }));
      setError("");
      const res = await fetch("/api/documents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ formData, documentType, recommenderInfo }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url  = window.URL.createObjectURL(blob);
        const a    = document.createElement("a");
        a.href = url;
        a.download = `${documentType}-${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setSuccess(`${documentType === "motivation-letter" ? "AI Motivation Letter" : documentType} downloaded!`);
        setTimeout(() => setSuccess(""), 4000);
        // Mark as generated locally
        setGeneratedDocuments((p) => [...new Set([...p, documentType])]);
      } else {
        const data = await res.json();
        setError(data.error || `Failed to generate ${documentType}`);
      }
    } catch { setError("Failed to generate document"); }
    finally { setGenerating((p) => ({ ...p, [documentType]: false })); }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  const documents = [
    { name: "Application Form (PDF)", desc: "Complete form with all your details — take this to the university",        type: "admission-form",        Icon: FileText },
    { name: "Motivation Letter (AI)", desc: "AI-written SOP based on your goals, marks, and achievements",              type: "motivation-letter",     Icon: Mail     },
    { name: "Recommendation Request", desc: "Addressed letter to your teacher asking for a recommendation",             type: "recommendation-request", Icon: FilePen  },
  ];

  return (
    <div className="bg-gray-50 min-h-screen font-inter">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">University Application Form</h1>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" />
            Practice filling this form — most Pakistani universities ask for the same information.
          </p>
        </div>

        {error   && <div className="mb-4 bg-red-50   border border-red-200   p-3 rounded-lg text-red-700   text-sm">{error}</div>}
        {success && <div className="mb-4 bg-green-50 border border-green-200 p-3 rounded-lg text-green-700 text-sm">{success}</div>}

        {!isLoggedIn && (
          <div className="mb-5 bg-amber-50 border border-amber-200 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-500 shrink-0" />
              <p className="text-amber-800 text-sm">Fill the form freely, but <strong>log in to save and download.</strong></p>
            </div>
            <div className="flex gap-2 shrink-0">
              <a href="/auth?mode=login"    className="text-xs bg-white border border-amber-300 text-amber-800 px-3 py-1.5 rounded-lg hover:bg-amber-50 transition font-medium">Log in</a>
              <a href="/auth?mode=register" className="text-xs bg-amber-500 text-white px-3 py-1.5 rounded-lg hover:bg-amber-600 transition font-medium">Sign up free</a>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">

          {/* ── Left: Form ── */}
          <div className="lg:col-span-2 space-y-3">
            {/* Form header */}
            <div className="bg-white border border-gray-200 rounded-lg px-5 py-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-md flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-base">Undergraduate Admission Application</p>
                <p className="text-xs text-gray-500">Academic Session 2025–26 &nbsp;·&nbsp; Fill all sections marked <span className="text-red-500 font-semibold">*</span></p>
              </div>
            </div>

            {/* Form sections */}
            {formSchema?.sections?.map((section) => (
              <FormSection
                key={section.id}
                section={section}
                formData={formData}
                onChange={handleChange}
                openSections={openSections}
                toggleSection={toggleSection}
              />
            ))}

            {/* Save bar */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <button
                onClick={handleSave}
                disabled={saving || !isLoggedIn}
                className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 text-sm font-medium"
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving…" : "Save Progress"}
              </button>
              {!isLoggedIn && <p className="text-xs text-gray-400 mt-2"><a href="/auth?mode=login" className="text-blue-600 underline">Log in</a> to save your progress</p>}
            </div>

            {/* ── Document Cards ── */}
            <div className="pt-2">
              <h2 className="text-base font-bold text-gray-900 mb-3">Generate Documents</h2>
              <div className="space-y-3">
                {documents.map((doc) => (
                  <DocumentCard
                    key={doc.type}
                    doc={doc}
                    isLoggedIn={isLoggedIn}
                    generated={generatedDocuments}
                    onGenerate={generateDocument}
                    generating={generating}
                    recommenderInfo={recommenderInfo}
                    onRecommenderChange={handleRecommenderChange}
                    showRecommenderForm={showRecommenderForm && doc.type === "recommendation-request"}
                    onToggleRecommenderForm={() => setShowRecommenderForm((p) => !p)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* ── Right sidebar ── */}
          <div className="space-y-4">
            {formSchema?.documentChecklist && (
              <DocumentChecklist
                checklist={formSchema.documentChecklist}
                checked={docChecked}
                onToggle={toggleDoc}
              />
            )}

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <p className="text-xs font-semibold text-blue-700 mb-2 uppercase tracking-wide">Why fill this?</p>
              <ul className="text-xs text-blue-800 space-y-1.5 leading-relaxed">
                <li>• Know exactly what universities will ask</li>
                <li>• Prepare your documents checklist early</li>
                <li>• Get an AI-written motivation letter based on your real details</li>
                <li>• Download a pre-filled recommendation request for your teacher</li>
              </ul>
            </div>

            {formData.interObtained && formData.interTotal && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-xs font-semibold text-gray-500 mb-1">Your Intermediate %</p>
                <p className="text-3xl font-bold text-blue-600">{pct(formData.interObtained, formData.interTotal)}%</p>
                <p className="text-xs text-gray-500 mt-1">
                  {parseFloat(pct(formData.interObtained, formData.interTotal)) >= 70
                    ? "✅ Above the typical 70% minimum for top engineering universities."
                    : "⚠️ Most top engineering universities require ≥70%."}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
      <ChatbotWidget />
    </div>
  );
}
