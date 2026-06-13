"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import ValidatedInput from "@/components/ValidatedInput";

export default function UniversitiesManagement() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [universities, setUniversities] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUniversity, setNewUniversity] = useState({
    name: "",
    location: "",
    type: "Public",
  });

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      router.push("/auth?mode=login");
      return;
    }

    fetch("/api/universities", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setUniversities(data.universities || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  const handleAddUniversity = async () => {
    if (!newUniversity.name || !newUniversity.location) {
      alert("Please fill in all fields");
      return;
    }

    const token = localStorage.getItem("auth_token");
    const res = await fetch("/api/universities", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify([
        { name: newUniversity.name, location: newUniversity.location },
      ]),
    });
    if (res.ok) {
      const data = await fetch("/api/universities").then((r) => r.json());
      setUniversities(data.universities || []);
      setNewUniversity({ name: "", location: "", type: "Public" });
      setShowAddModal(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      const token = localStorage.getItem("auth_token");
      await fetch(`/api/universities/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setUniversities(universities.filter((uni) => uni.id !== id));
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
          <h1 className="text-2xl font-bold text-blue-600">Universities</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            + Add University
          </button>
        </div>

        {/* Universities Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {universities.map((university) => (
            <div
              key={university.id}
              className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transform transition duration-300"
            >
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {university.name}
              </h3>
              <p className="text-gray-600 mb-1 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{university.location}</p>
              <p className="text-sm text-gray-500 mb-4">
                Type: {university.type}
              </p>
              <div className="flex gap-2">
                <button className="text-blue-600 hover:text-blue-800 font-medium">
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(university.id, university.name)}
                  className="text-red-600 hover:text-red-800 font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add University Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Add New University
              </h2>
              <div className="space-y-4">
                <ValidatedInput
                  type="text"
                  label="University Name"
                  value={newUniversity.name}
                  onChange={(e) => setNewUniversity({ ...newUniversity, name: e.target.value })}
                  placeholder="Enter university name"
                  required
                />
                <ValidatedInput
                  type="text"
                  label="Location"
                  value={newUniversity.location}
                  onChange={(e) => setNewUniversity({ ...newUniversity, location: e.target.value })}
                  placeholder="Enter location"
                  required
                />
                <ValidatedInput
                  type="select"
                  label="Type"
                  value={newUniversity.type}
                  onChange={(e) => setNewUniversity({ ...newUniversity, type: e.target.value })}
                >
                  <option value="Public">Public</option>
                  <option value="Private">Private</option>
                </ValidatedInput>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleAddUniversity}
                  className="grow bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewUniversity({ name: "", location: "", type: "Public" });
                  }}
                  className="grow bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
