"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Globe, Link2, Pencil, Trash2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/AdminLayout";
import Breadcrumb from "@/components/Breadcrumb";

const EMPTY_FORM = {
  name: "",
  location: "",
  type: "Public",
  website: "",
  fee_structure_url: "",
  description: "",
  ranking: "",
};

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

function UniversityForm({ form, onChange, onSubmit, onCancel, loading, submitLabel }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">University Name *</label>
        <input
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.name}
          onChange={(e) => onChange("name", e.target.value)}
          placeholder="e.g. University of Punjab"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
        <input
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.location}
          onChange={(e) => onChange("location", e.target.value)}
          placeholder="e.g. Lahore"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
        <select
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.type}
          onChange={(e) => onChange("type", e.target.value)}
        >
          <option value="Public">Public</option>
          <option value="Private">Private</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
        <input
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.website}
          onChange={(e) => onChange("website", e.target.value)}
          placeholder="https://university.edu.pk"
          type="url"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Fee Structure URL</label>
        <input
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.fee_structure_url}
          onChange={(e) => onChange("fee_structure_url", e.target.value)}
          placeholder="https://university.edu.pk/fee-structure"
          type="url"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Ranking</label>
        <input
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.ranking}
          onChange={(e) => onChange("ranking", e.target.value)}
          placeholder="e.g. 1"
          type="number"
          min="1"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          value={form.description}
          onChange={(e) => onChange("description", e.target.value)}
          placeholder="Brief description of the university..."
          rows={3}
        />
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
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

export default function UniversitiesManagement() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [universities, setUniversities] = useState([]);

  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_FORM);
  const [addLoading, setAddLoading] = useState(false);

  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [editLoading, setEditLoading] = useState(false);

  const token = () => localStorage.getItem("auth_token");

  const fetchUniversities = async () => {
    const res = await fetch("/api/admin/universities", {
      headers: { Authorization: `Bearer ${token()}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to load");
    setUniversities(data.universities || []);
  };

  useEffect(() => {
    if (!token()) { router.push("/auth?mode=login"); return; }
    fetchUniversities()
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [router]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      const res = await fetch("/api/admin/universities", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add university");
      // Append the new university returned by the server
      setUniversities((prev) =>
        [...prev, { ...data.university, program_count: 0 }].sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      );
      setShowAdd(false);
      setAddForm(EMPTY_FORM);
      toast.success(`"${data.university.name}" added successfully`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setAddLoading(false);
    }
  };

  const openEdit = (uni) => {
    setEditTarget(uni);
    setEditForm({
      name: uni.name || "",
      location: uni.location || "",
      type: uni.type || "Public",
      website: uni.website || "",
      fee_structure_url: uni.fee_structure_url || "",
      description: uni.description || "",
      ranking: uni.ranking ?? "",
    });
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      const res = await fetch(`/api/admin/universities/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update university");
      // Update state directly from the server response — no re-fetch needed
      setUniversities((prev) =>
        prev.map((u) =>
          u.id === editTarget.id ? { ...u, ...data.university } : u
        )
      );
      setEditTarget(null);
      toast.success(`"${data.university.name}" updated successfully`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}" and all its programs? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/universities/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) throw new Error("Failed to delete university");
      setUniversities((prev) => prev.filter((u) => u.id !== id));
      toast.success(`"${name}" deleted`);
    } catch (e) {
      toast.error(e.message);
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
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-blue-600">Universities</h1>
            <p className="text-gray-500 text-sm mt-1">{universities.length} universities in database</p>
          </div>
          <button
            onClick={() => { setShowAdd(true); setAddForm(EMPTY_FORM); }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
          >
            <Plus className="w-4 h-4" /> Add University
          </button>
        </div>

        {universities.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg font-medium">No universities yet</p>
            <p className="text-sm mt-1">Click "Add University" to get started.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {universities.map((uni) => (
              <div key={uni.id} className="bg-white p-5 rounded-xl shadow hover:shadow-md transition">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-base font-bold text-gray-800 leading-snug flex-1 pr-2">{uni.name}</h3>
                  <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                    uni.type === "Private" ? "bg-purple-100 text-purple-700" : "bg-green-100 text-green-700"
                  }`}>
                    {uni.type || "—"}
                  </span>
                </div>

                {uni.location && (
                  <p className="text-sm text-gray-500 flex items-center gap-1 mb-1">
                    <MapPin className="w-3.5 h-3.5 shrink-0" /> {uni.location}
                  </p>
                )}

                {uni.website && (
                  <a
                    href={uni.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-blue-500 hover:underline flex items-center gap-1 mb-1 truncate"
                  >
                    <Globe className="w-3.5 h-3.5 shrink-0" /> Website
                  </a>
                )}

                {uni.fee_structure_url && (
                  <a
                    href={uni.fee_structure_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-emerald-600 hover:underline flex items-center gap-1 mb-1 truncate"
                  >
                    <Link2 className="w-3.5 h-3.5 shrink-0" /> Fee Structure
                  </a>
                )}

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-400">{uni.program_count} programs</span>
                  <div className="flex gap-3">
                    <button
                      onClick={() => openEdit(uni)}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(uni.id, uni.name)}
                      className="flex items-center gap-1 text-red-500 hover:text-red-700 text-sm font-medium"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Modal */}
        {showAdd && (
          <Modal title="Add University" onClose={() => setShowAdd(false)}>
            <UniversityForm
              form={addForm}
              onChange={(k, v) => setAddForm((f) => ({ ...f, [k]: v }))}
              onSubmit={handleAdd}
              onCancel={() => setShowAdd(false)}
              loading={addLoading}
              submitLabel="Add University"
            />
          </Modal>
        )}

        {/* Edit Modal */}
        {editTarget && (
          <Modal title="Edit University" onClose={() => setEditTarget(null)}>
            <UniversityForm
              form={editForm}
              onChange={(k, v) => setEditForm((f) => ({ ...f, [k]: v }))}
              onSubmit={handleEdit}
              onCancel={() => setEditTarget(null)}
              loading={editLoading}
              submitLabel="Save Changes"
            />
          </Modal>
        )}
      </div>
    </AdminLayout>
  );
}
