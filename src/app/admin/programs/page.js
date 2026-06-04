"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";

export default function ProgramsManagement() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [programs, setPrograms] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      router.push("/auth?mode=login");
      return;
    }

    fetch("/api/admin/programs", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { router.push("/"); return; }
        setPrograms(
          (data.programs || []).map((p) => ({
            ...p,
            field: p.field || "—",
            merit: p.merit_percentage ? `${p.merit_percentage}%` : "—",
          }))
        );
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  const handleDelete = (id, name) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      setPrograms(programs.filter((prog) => prog.id !== id));
    }
  };

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
            Programs Management
          </h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            + Add Program
          </button>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Total Programs</p>
            <p className="text-2xl font-bold text-blue-600">{programs.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-600 text-sm">CS Programs</p>
            <p className="text-2xl font-bold text-purple-600">
              {programs.filter((p) => p.field === "Computer Science").length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Engineering</p>
            <p className="text-2xl font-bold text-green-600">
              {programs.filter((p) => p.field === "Engineering").length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Other Fields</p>
            <p className="text-2xl font-bold text-orange-600">
              {
                programs.filter(
                  (p) =>
                    p.field !== "Computer Science" && p.field !== "Engineering"
                ).length
              }
            </p>
          </div>
        </div>

        {/* Programs Table */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="p-4 text-left">ID</th>
                <th className="p-4 text-left">Program Name</th>
                <th className="p-4 text-left">University</th>
                <th className="p-4 text-left">Field</th>
                <th className="p-4 text-left">Merit %</th>
                <th className="p-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {programs.map((program) => (
                <tr key={program.id} className="border-t hover:bg-gray-50">
                  <td className="p-4">{program.id}</td>
                  <td className="p-4 font-medium">{program.name}</td>
                  <td className="p-4 text-gray-600">{program.university}</td>
                  <td className="p-4">
                    <span className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                      {program.field}
                    </span>
                  </td>
                  <td className="p-4 font-semibold">{program.merit}</td>
                  <td className="p-4">
                    <button className="text-blue-600 hover:text-blue-800 font-medium mr-3">
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(program.id, program.name)}
                      className="text-red-600 hover:text-red-800 font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Modal Placeholder */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Add New Program
              </h2>
              <p className="text-gray-600 mb-4">
                Program creation form will be implemented here.
              </p>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-full bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
