"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Plus, X, BookOpen, Sparkles } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/AdminLayout";
import Breadcrumb from "@/components/Breadcrumb";

const EMPTY_FORM = {
  university_id: "",
  name: "",
  field: "",
  duration: "",
  fee: "",
  merit_percentage: "",
  description: "",
  eligibility: "",
};

const FIELDS = [
  "Computer Science",
  "Engineering",
  "Medical",
  "Business",
  "Arts & Humanities",
  "Social Sciences",
  "Natural Sciences",
  "Law",
  "Education",
  "Agriculture",
  "Architecture",
  "Pharmacy",
  "Other",
];

function getProgramFormErrors(form, universities) {
  const errors = [];
  const universityIds = new Set(universities.map((u) => String(u.id)));
  if (!form.university_id || !universityIds.has(String(form.university_id))) errors.push("Select a valid university");
  if (!form.name.trim() || form.name.trim().length < 2) errors.push("Program name is required");
  if (form.field && !FIELDS.includes(form.field)) errors.push("Select a valid field");
  if (form.fee !== "" && (!/^\d+$/.test(String(form.fee)) || Number(form.fee) < 0)) errors.push("Fee must be a valid number");
  if (form.merit_percentage !== "") {
    const merit = Number(form.merit_percentage);
    if (!Number.isFinite(merit) || merit < 0 || merit > 100) errors.push("Merit must be between 0 and 100");
  }
  if (form.description.length > 1000) errors.push("Description must be at most 1000 characters");
  return errors;
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ProgramForm({ form, onChange, onSubmit, onCancel, loading, submitLabel, universities }) {
  const errors = getProgramFormErrors(form, universities);
  const isDisabled = loading || errors.length > 0;
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">University *</label>
        <select
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.university_id}
          onChange={(e) => onChange("university_id", e.target.value)}
          required
        >
          <option value="">Select university...</option>
          {universities.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Program Name *</label>
        <input
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.name}
          onChange={(e) => onChange("name", e.target.value)}
          placeholder="e.g. BS Computer Science"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Field</label>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={form.field}
            onChange={(e) => onChange("field", e.target.value)}
          >
            <option value="">Select field...</option>
            {FIELDS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
          <input
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={form.duration}
            onChange={(e) => onChange("duration", e.target.value)}
            placeholder="e.g. 4 Years"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Annual Fee (PKR)</label>
          <input
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={form.fee}
            onChange={(e) => onChange("fee", e.target.value)}
            placeholder="e.g. 150000"
            type="number"
            min="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Merit % (cutoff)</label>
          <input
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={form.merit_percentage}
            onChange={(e) => onChange("merit_percentage", e.target.value)}
            placeholder="e.g. 85.5"
            type="number"
            min="0"
            max="100"
            step="0.01"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Eligibility</label>
        <input
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.eligibility}
          onChange={(e) => onChange("eligibility", e.target.value)}
          placeholder="e.g. FSc Pre-Engineering with 60%+"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          value={form.description}
          onChange={(e) => onChange("description", e.target.value)}
          placeholder="Brief program description..."
          rows={3}
        />
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isDisabled}
          className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition font-medium"
        >
          {loading ? "Saving..." : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition font-medium"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function ProgramsManagement() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [programs, setPrograms] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [search, setSearch] = useState("");
  const [filterField, setFilterField] = useState("");
  const [filterUni, setFilterUni] = useState("");

  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_FORM);
  const [addLoading, setAddLoading] = useState(false);

  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [editLoading, setEditLoading] = useState(false);

  const [normalizing, setNormalizing] = useState(false);

  const token = () => localStorage.getItem("auth_token");

  const fetchData = async () => {
    const [progRes, uniRes] = await Promise.all([
      fetch("/api/admin/programs", { headers: { Authorization: `Bearer ${token()}` } }),
      fetch("/api/admin/universities", { headers: { Authorization: `Bearer ${token()}` } }),
    ]);
    const [progData, uniData] = await Promise.all([progRes.json(), uniRes.json()]);
    if (!progRes.ok) throw new Error(progData.error || "Failed to load programs");
    setPrograms(progData.programs || []);
    setUniversities(uniData.universities || []);
  };

  useEffect(() => {
    if (!token()) { router.push("/auth?mode=login"); return; }
    fetchData()
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [router]);

  const filtered = programs.filter((p) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.university?.toLowerCase().includes(search.toLowerCase());
    const matchField = !filterField || p.field === filterField;
    const matchUni = !filterUni || String(p.university_id) === filterUni;
    return matchSearch && matchField && matchUni;
  });

  const handleAdd = async (e) => {
    e.preventDefault();
    const errors = getProgramFormErrors(addForm, universities);
    if (errors.length > 0) { toast.error(errors[0]); return; }
    setAddLoading(true);
    try {
      const res = await fetch("/api/admin/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add program");
      const uni = universities.find((u) => u.id === parseInt(addForm.university_id));
      setPrograms((prev) =>
        [...prev, { ...data.program, university: uni?.name || "" }].sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      );
      setShowAdd(false);
      setAddForm(EMPTY_FORM);
      toast.success(`"${data.program.name}" added successfully`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setAddLoading(false);
    }
  };

  const openEdit = (p) => {
    setEditTarget(p);
    setEditForm({
      university_id: String(p.university_id || ""),
      name: p.name || "",
      field: p.field || "",
      duration: p.duration || "",
      fee: p.fee ?? "",
      merit_percentage: p.merit_percentage ?? "",
      description: p.description || "",
      eligibility: p.eligibility || "",
    });
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    const errors = getProgramFormErrors(editForm, universities);
    if (errors.length > 0) { toast.error(errors[0]); return; }
    setEditLoading(true);
    try {
      const res = await fetch(`/api/admin/programs/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update program");
      const uni = universities.find((u) => u.id === parseInt(editForm.university_id));
      setPrograms((prev) =>
        prev.map((p) =>
          p.id === editTarget.id
            ? { ...data.program, university: uni?.name || p.university }
            : p
        )
      );
      setEditTarget(null);
      toast.success(`"${data.program.name}" updated successfully`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete program "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/programs/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete program");
      setPrograms((prev) => prev.filter((p) => p.id !== id));
      toast.success(`"${name}" deleted`);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleNormalize = async () => {
    if (!confirm("Use Claude to normalize all program names?\n\n• Masters/PhD programs will be deleted\n• Aliases (BSCS, BSc CS, etc.) will be merged into canonical names\n\nThis cannot be undone.")) return;
    setNormalizing(true);
    const toastId = toast.loading("Claude is normalizing programs…");
    try {
      const res = await fetch("/api/admin/normalize-programs", {
        method: "POST",
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Normalization failed");
      await fetchData();
      toast.success(
        `Done — ${data.deleted} removed, ${data.renamed} renamed (${data.total_processed} total processed)`,
        { id: toastId }
      );
    } catch (e) {
      toast.error(e.message, { id: toastId });
    } finally {
      setNormalizing(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 md:p-8">
        <Breadcrumb />
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-blue-600">Programs</h1>
            <p className="text-gray-500 text-sm mt-1">{programs.length} total programs</p>
          </div>
          <div className="flex gap-2">
          <button
            onClick={handleNormalize}
            disabled={normalizing}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-60 transition font-medium"
          >
            <Sparkles className="w-4 h-4" />
            {normalizing ? "Normalizing…" : "Normalize with AI"}
          </button>
          <button
            onClick={() => { setShowAdd(true); setAddForm(EMPTY_FORM); }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
          >
            <Plus className="w-4 h-4" /> Add Program
          </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total", value: programs.length, color: "text-blue-600" },
            { label: "CS", value: programs.filter((p) => p.field === "Computer Science").length, color: "text-purple-600" },
            { label: "Engineering", value: programs.filter((p) => p.field === "Engineering").length, color: "text-green-600" },
            { label: "Other", value: programs.filter((p) => !["Computer Science", "Engineering"].includes(p.field)).length, color: "text-orange-500" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white p-4 rounded-lg shadow">
              <p className="text-gray-500 text-sm">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <input
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
            placeholder="Search program or university..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterField}
            onChange={(e) => setFilterField(e.target.value)}
          >
            <option value="">All fields</option>
            {FIELDS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-xs"
            value={filterUni}
            onChange={(e) => setFilterUni(e.target.value)}
          >
            <option value="">All universities</option>
            {universities.map((u) => (
              <option key={u.id} value={String(u.id)}>{u.name}</option>
            ))}
          </select>
          {(search || filterField || filterUni) && (
            <button
              onClick={() => { setSearch(""); setFilterField(""); setFilterUni(""); }}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="p-3 text-left">Program</th>
                <th className="p-3 text-left">University</th>
                <th className="p-3 text-left">Field</th>
                <th className="p-3 text-left">Duration</th>
                <th className="p-3 text-left">Merit %</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    No programs found.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 font-medium text-gray-800">{p.name}</td>
                    <td className="p-3 text-gray-600">{p.university}</td>
                    <td className="p-3">
                      {p.field ? (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 font-medium">
                          {p.field}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="p-3 text-gray-600">{p.duration || "—"}</td>
                    <td className="p-3 font-semibold text-gray-700">
                      {p.merit_percentage != null ? `${p.merit_percentage}%` : "—"}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-3">
                        <button
                          onClick={() => openEdit(p)}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                        >
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          className="flex items-center gap-1 text-red-500 hover:text-red-700 font-medium"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Add Modal */}
        {showAdd && (
          <Modal title="Add Program" onClose={() => setShowAdd(false)}>
            <ProgramForm
              form={addForm}
              onChange={(k, v) => setAddForm((f) => ({ ...f, [k]: v }))}
              onSubmit={handleAdd}
              onCancel={() => setShowAdd(false)}
              loading={addLoading}
              submitLabel="Add Program"
              universities={universities}
            />
          </Modal>
        )}

        {/* Edit Modal */}
        {editTarget && (
          <Modal title="Edit Program" onClose={() => setEditTarget(null)}>
            <ProgramForm
              form={editForm}
              onChange={(k, v) => setEditForm((f) => ({ ...f, [k]: v }))}
              onSubmit={handleEdit}
              onCancel={() => setEditTarget(null)}
              loading={editLoading}
              submitLabel="Save Changes"
              universities={universities}
            />
          </Modal>
        )}
      </div>
    </AdminLayout>
  );
}
