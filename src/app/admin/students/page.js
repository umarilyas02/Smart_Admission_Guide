"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";
import ValidatedInput from "@/components/ValidatedInput";

export default function StudentsManagement() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

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
            status: "Active",
          }))
        );
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  const handleBlock = (id, name) => {
    if (confirm(`Are you sure you want to block ${name}?`)) {
      setStudents(
        students.map((student) =>
          student.id === id ? { ...student, status: "Blocked" } : student
        )
      );
    }
  };

  const handleUnblock = (id, name) => {
    if (confirm(`Are you sure you want to unblock ${name}?`)) {
      setStudents(
        students.map((student) =>
          student.id === id ? { ...student, status: "Active" } : student
        )
      );
    }
  };

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase())
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
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-blue-600">
            Students Management
          </h1>
          <div className="flex gap-2">
            <ValidatedInput
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search students..."
              inputClassName="px-4 py-2 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 bg-white"
            />
          </div>
        </div>

        {/* Stats Summary */}
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

        {/* Students Table */}
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
                  <td className="p-4">{student.id}</td>
                  <td className="p-4 font-medium">{student.name}</td>
                  <td className="p-4 text-gray-600">{student.email}</td>
                  <td className="p-4">{student.academicLevel}</td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        student.status === "Active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {student.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <button className="text-blue-600 hover:text-blue-800 font-medium mr-3">
                      View
                    </button>
                    {student.status === "Active" ? (
                      <button
                        onClick={() => handleBlock(student.id, student.name)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        Block
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUnblock(student.id, student.name)}
                        className="text-green-600 hover:text-green-800 font-medium"
                      >
                        Unblock
                      </button>
                    )}
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
