"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";
import ValidatedInput from "@/components/ValidatedInput";
import { toast } from "sonner";
import Breadcrumb from "@/components/Breadcrumb";
import { X } from "lucide-react";

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-gray-100 last:border-0">
      <span className="text-gray-500 text-sm font-medium shrink-0">{label}</span>
      <span className="text-gray-800 text-sm text-right">{value || "—"}</span>
    </div>
  );
}

function StudentModal({ student, onClose }) {
  if (!student) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">Student Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div>
          <DetailRow label="Name" value={student.name} />
          <DetailRow label="Email" value={student.email} />
          <DetailRow label="Phone" value={student.phone} />
          <DetailRow label="Academic Level" value={student.academicLevel} />
          <DetailRow
            label="Matric Marks"
            value={student.matric_marks != null ? `${student.matric_marks}%` : null}
          />
          <DetailRow
            label="Intermediate Marks"
            value={student.intermediate_marks != null ? `${student.intermediate_marks}%` : null}
          />
          <DetailRow
            label="Test Score"
            value={student.test_score != null ? String(student.test_score) : null}
          />
          <DetailRow label="Test Type" value={student.test_type} />
          <DetailRow label="Interests" value={student.interests} />
          <DetailRow label="Status" value={student.status} />
          <DetailRow
            label="Registered"
            value={
              student.created_at
                ? new Date(student.created_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : null
            }
          />
        </div>
      </div>
    </div>
  );
}

export default function StudentsManagement() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewStudent, setViewStudent] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      router.push("/auth?mode=login");
      return;
    }

    fetch("/api/admin/students", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { router.push("/"); return; }
        setStudents(
          (data.students || []).map((s) => ({
            ...s,
            academicLevel: s.academic_level || "—",
            status: s.is_blocked ? "Blocked" : "Active",
          }))
        );
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  async function handleBlock(id, name) {
    if (!confirm(`Block ${name}? They will not be able to log in.`)) return;
    const token = localStorage.getItem("auth_token");
    try {
      const res = await fetch(`/api/admin/students/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_blocked: true }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to block");
      setStudents((prev) => prev.map((s) => s.id === id ? { ...s, status: "Blocked" } : s));
      toast.success(`${name} has been blocked`);
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleUnblock(id, name) {
    if (!confirm(`Unblock ${name}?`)) return;
    const token = localStorage.getItem("auth_token");
    try {
      const res = await fetch(`/api/admin/students/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_blocked: false }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to unblock");
      setStudents((prev) => prev.map((s) => s.id === id ? { ...s, status: "Active" } : s));
      toast.success(`${name} has been unblocked`);
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleDelete(id, name) {
    if (!confirm(`Permanently delete ${name}? This cannot be undone.`)) return;
    const token = localStorage.getItem("auth_token");
    try {
      const res = await fetch(`/api/admin/students/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to delete");
      setStudents((prev) => prev.filter((s) => s.id !== id));
      toast.success(`${name} has been deleted`);
    } catch (err) {
      toast.error(err.message);
    }
  }

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      <StudentModal student={viewStudent} onClose={() => setViewStudent(null)} />
      <div className="p-8">
        <Breadcrumb />
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-blue-600">Students Management</h1>
          <ValidatedInput
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search students..."
            inputClassName="px-4 py-2 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 bg-white"
          />
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Total Students</p>
            <p className="text-2xl font-bold text-blue-600">{students.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Active</p>
            <p className="text-2xl font-bold text-green-600">
              {students.filter((s) => s.status === "Active").length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Blocked</p>
            <p className="text-2xl font-bold text-red-600">
              {students.filter((s) => s.status === "Blocked").length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="p-4 text-left">ID</th>
                <th className="p-4 text-left">Name</th>
                <th className="p-4 text-left">Email</th>
                <th className="p-4 text-left">Academic Level</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student.id} className="border-t hover:bg-gray-50">
                  <td className="p-4 text-sm">{student.id}</td>
                  <td className="p-4 font-medium">{student.name}</td>
                  <td className="p-4 text-gray-600 text-sm">{student.email}</td>
                  <td className="p-4 text-sm">{student.academicLevel}</td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        student.status === "Active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {student.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3 text-sm font-medium">
                      <button
                        onClick={() => setViewStudent(student)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        View
                      </button>
                      {student.status === "Active" ? (
                        <button
                          onClick={() => handleBlock(student.id, student.name)}
                          className="text-amber-600 hover:text-amber-800"
                        >
                          Block
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUnblock(student.id, student.name)}
                          className="text-green-600 hover:text-green-800"
                        >
                          Unblock
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(student.id, student.name)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredStudents.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No students found matching your search.
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
