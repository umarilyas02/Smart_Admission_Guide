"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/AdminLayout";
import Breadcrumb from "@/components/Breadcrumb";

const EMPTY_FORM = {
  name: "",
  type: "",
  subjects: "",
  duration: "",
  total_marks: "",
  description: "",
};

const TEST_TYPES = ["ECAT", "MCAT", "HAT", "NTS", "SAT", "GAT", "Other"];

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

function TestForm({ form, onChange, onSubmit, onCancel, loading, submitLabel }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Test Name *</label>
        <input
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.name}
          onChange={(e) => onChange("name", e.target.value)}
          placeholder="e.g. Engineering College Admission Test"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={form.type}
            onChange={(e) => onChange("type", e.target.value)}
          >
            <option value="">Select type...</option>
            {TEST_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
          <input
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={form.duration}
            onChange={(e) => onChange("duration", e.target.value)}
            placeholder="e.g. 3 hours"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Total Marks</label>
        <input
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.total_marks}
          onChange={(e) => onChange("total_marks", e.target.value)}
          placeholder="e.g. 400"
          type="number"
          min="0"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Subjects <span className="text-gray-400 font-normal">(comma-separated)</span>
        </label>
        <input
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.subjects}
          onChange={(e) => onChange("subjects", e.target.value)}
          placeholder="e.g. Physics, Chemistry, Mathematics"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          value={form.description}
          onChange={(e) => onChange("description", e.target.value)}
          placeholder="Brief description..."
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

export default function EntryTestsManagement() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tests, setTests] = useState([]);

  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_FORM);
  const [addLoading, setAddLoading] = useState(false);

  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [editLoading, setEditLoading] = useState(false);

  const token = () => localStorage.getItem("auth_token");

  useEffect(() => {
    if (!token()) { router.push("/auth?mode=login"); return; }
    fetch("/api/admin/entry-tests", { headers: { Authorization: `Bearer ${token()}` } })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { router.push("/"); return; }
        setTests(data.tests || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      const res = await fetch("/api/admin/entry-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add entry test");
      setTests((prev) => [...prev, data.test]);
      setShowAdd(false);
      setAddForm(EMPTY_FORM);
      toast.success(`"${data.test.name}" added successfully`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setAddLoading(false);
    }
  };

  const openEdit = (t) => {
    setEditTarget(t);
    setEditForm({
      name: t.name || "",
      type: t.type || "",
      subjects: Array.isArray(t.subjects) ? t.subjects.join(", ") : (t.subjects || ""),
      duration: t.duration || "",
      total_marks: t.total_marks ?? "",
      description: t.description || "",
    });
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      const res = await fetch(`/api/admin/entry-tests/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update entry test");
      setTests((prev) => prev.map((t) => (t.id === editTarget.id ? data.test : t)));
      setEditTarget(null);
      toast.success(`"${data.test.name}" updated successfully`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete entry test "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/entry-tests/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete entry test");
      setTests((prev) => prev.filter((t) => t.id !== id));
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
            <h1 className="text-2xl font-bold text-blue-600">Entry Tests</h1>
            <p className="text-gray-500 text-sm mt-1">{tests.length} tests configured</p>
          </div>
          <button
            onClick={() => { setShowAdd(true); setAddForm(EMPTY_FORM); }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
          >
            <Plus className="w-4 h-4" /> Add Entry Test
          </button>
        </div>

        {tests.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg font-medium">No entry tests yet</p>
            <p className="text-sm mt-1">Click "Add Entry Test" to get started.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {tests.map((test) => {
              const subjects = Array.isArray(test.subjects) ? test.subjects : [];
              return (
                <div key={test.id} className="bg-white p-5 rounded-xl shadow hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 pr-3">
                      <h3 className="text-base font-bold text-gray-800">{test.name}</h3>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {test.type && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                            {test.type}
                          </span>
                        )}
                        {test.duration && (
                          <span className="text-xs text-gray-500">{test.duration}</span>
                        )}
                        {test.total_marks && (
                          <span className="text-xs text-gray-500">{test.total_marks} marks</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => openEdit(test)}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(test.id, test.name)}
                        className="flex items-center gap-1 text-red-500 hover:text-red-700 text-sm font-medium"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>

                  {subjects.length > 0 && (
                    <div className="border-t pt-3">
                      <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Subjects</p>
                      <div className="flex flex-wrap gap-1.5">
                        {subjects.map((s, i) => (
                          <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {test.description && (
                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">{test.description}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {showAdd && (
          <Modal title="Add Entry Test" onClose={() => setShowAdd(false)}>
            <TestForm
              form={addForm}
              onChange={(k, v) => setAddForm((f) => ({ ...f, [k]: v }))}
              onSubmit={handleAdd}
              onCancel={() => setShowAdd(false)}
              loading={addLoading}
              submitLabel="Add Entry Test"
            />
          </Modal>
        )}

        {editTarget && (
          <Modal title="Edit Entry Test" onClose={() => setEditTarget(null)}>
            <TestForm
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
