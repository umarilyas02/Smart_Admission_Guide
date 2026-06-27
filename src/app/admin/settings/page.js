"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";
import ValidatedInput from "@/components/ValidatedInput";
import Breadcrumb from "@/components/Breadcrumb";
import { validate } from "@/lib/validators";

export default function AdminSettings() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [adminInfo, setAdminInfo] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const formErrors = [
    validate("name", adminInfo.name, { required: true }),
    validate("email", adminInfo.email, { required: true }),
    adminInfo.password ? validate("password", adminInfo.password, { required: false }) : null,
  ].filter(Boolean);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      router.push("/auth?mode=login");
      return;
    }

    // Simulate fetching admin info
    setTimeout(() => {
      setAdminInfo({
        name: "Admin User",
        email: "admin@smartadmission.com",
        password: "",
      });
      setLoading(false);
    }, 500);
  }, [router]);

  const handleSave = async () => {
    if (formErrors.length > 0) {
      alert(formErrors[0]);
      return;
    }

    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      alert("Settings saved successfully!");
      setIsSaving(false);
      setAdminInfo({ ...adminInfo, password: "" });
    }, 1000);
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
        <Breadcrumb />
        <h1 className="text-2xl font-bold text-blue-600 mb-6">
          Admin Settings
        </h1>

        <div className="max-w-2xl">
          {/* Admin Info Card */}
          <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Update Admin Information
            </h2>

            <div className="space-y-4">
              <ValidatedInput
                type="name"
                label="Name"
                value={adminInfo.name}
                onChange={(e) => setAdminInfo({ ...adminInfo, name: e.target.value })}
                placeholder="Admin Name"
                required
              />

              <ValidatedInput
                type="email"
                label="Email"
                value={adminInfo.email}
                onChange={(e) => setAdminInfo({ ...adminInfo, email: e.target.value })}
                placeholder="admin@example.com"
                required
              />

              <ValidatedInput
                type="password"
                label="New Password"
                value={adminInfo.password}
                onChange={(e) => setAdminInfo({ ...adminInfo, password: e.target.value })}
                placeholder="Leave blank to keep current password"
                hint="Leave blank if you don't want to change your password"
                showPasswordStrength
              />

              <button
                onClick={handleSave}
                disabled={isSaving || formErrors.length > 0}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>

          {/* System Settings Card */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              System Settings
            </h2>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b">
                <div>
                  <p className="font-medium text-gray-800">
                    Email Notifications
                  </p>
                  <p className="text-sm text-gray-500">
                    Receive email alerts for system events
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex justify-between items-center py-3 border-b">
                <div>
                  <p className="font-medium text-gray-800">
                    Auto-approve Programs
                  </p>
                  <p className="text-sm text-gray-500">
                    Automatically approve new program submissions
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex justify-between items-center py-3">
                <div>
                  <p className="font-medium text-gray-800">Maintenance Mode</p>
                  <p className="text-sm text-gray-500">
                    Put the system in maintenance mode
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
