"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";

export default function EntryTestsManagement() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [entryTests, setEntryTests] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      router.push("/auth?mode=login");
      return;
    }

    // Simulate fetching entry tests data
    setTimeout(() => {
      setEntryTests([
        {
          id: 1,
          name: "FAST Entry Test",
          type: "MCQs",
          duration: "120 minutes",
          subjects: ["Math", "Physics", "English", "IQ"],
        },
        {
          id: 2,
          name: "NTS Test",
          type: "MCQs",
          duration: "180 minutes",
          subjects: ["Math", "English", "Analytical"],
        },
        {
          id: 3,
          name: "ECAT",
          type: "MCQs",
          duration: "150 minutes",
          subjects: ["Math", "Physics", "Chemistry", "English"],
        },
        {
          id: 4,
          name: "MDCAT",
          type: "MCQs",
          duration: "210 minutes",
          subjects: ["Biology", "Chemistry", "Physics", "English"],
        },
      ]);
      setLoading(false);
    }, 500);
  }, [router]);

  const handleDelete = (id, name) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      setEntryTests(entryTests.filter((test) => test.id !== id));
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
            Entry Tests Management
          </h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            + Add Entry Test
          </button>
        </div>

        {/* Entry Tests Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {entryTests.map((test) => (
            <div
              key={test.id}
              className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transform transition duration-300"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {test.name}
                  </h3>
                  <p className="text-sm text-gray-500">Type: {test.type}</p>
                  <p className="text-sm text-gray-500">
                    Duration: {test.duration}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(test.id, test.name)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  Subjects:
                </p>
                <div className="flex flex-wrap gap-2">
                  {test.subjects.map((subject, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {subject}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Modal Placeholder */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Add New Entry Test
              </h2>
              <p className="text-gray-600 mb-4">
                Entry test creation form will be implemented here.
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
