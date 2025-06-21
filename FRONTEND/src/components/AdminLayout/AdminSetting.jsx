import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../../Context/Context";
import { toast } from "react-toastify";
import {
  Settings,
  User,
  Lock,
  Bell,
  Mail,
  Globe,
  CreditCard,
  Save,
  X,
  Shield,
  Activity,
  Box,
} from "lucide-react";

const SettingsPage = () => {
  const { currentAdmin, updateAdmin } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form state with all fields from your model
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    notifications: true,
    language: "en",
    timezone: "UTC",
    permissions: [],
    isSuperAdmin: false,
  });

  // Initialize form data when currentAdmin changes
  useEffect(() => {
    if (currentAdmin) {
      setFormData({
        name: currentAdmin.name || "",
        email: currentAdmin.email || "",
        password: "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        notifications: true,
        language: "en",
        timezone: "UTC",
        permissions: currentAdmin.permissions || [],
        isSuperAdmin: currentAdmin.isSuperAdmin || false,
      });
    }
  }, [currentAdmin]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handlePermissionChange = (permission) => {
    setFormData(prev => {
      const newPermissions = prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission];
      return { ...prev, permissions: newPermissions };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Prepare update data based on active tab
      let updateData = {};
      if (activeTab === "profile") {
        updateData = { name: formData.name, email: formData.email };
      } else if (activeTab === "security") {
        if (formData.newPassword !== formData.confirmPassword) {
          throw new Error("Passwords don't match");
        }
        updateData = { 
          password: formData.newPassword,
          currentPassword: formData.currentPassword 
        };
      } else if (activeTab === "permissions" && currentAdmin.isSuperAdmin) {
        updateData = { permissions: formData.permissions };
      }

      await updateAdmin(updateData);
      toast.success("Settings updated successfully");
      setIsEditing(false);
    } catch (error) {
      toast.error(error.message || "Failed to update settings");
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: "profile", icon: <User size={18} />, label: "Profile" },
    { id: "security", icon: <Lock size={18} />, label: "Security" },
  ];

  // Add permissions tab only for super admins
  if (currentAdmin?.isSuperAdmin) {
    tabs.push(
      { id: "permissions", icon: <Shield size={18} />, label: "Permissions" }
    );
  }

  // Available permissions (from your model)
  const availablePermissions = [
    "dashboard",
    "users",
    "products",
    "orders",
    "vendors",
    "settings"
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="p-6">
        <h1 className="text-2xl font-bold flex items-center text-gray-800">
          <Settings className="mr-3 text-green-500" size={24} />
          Admin Settings
        </h1>
        <p className="text-gray-600 mt-1">
          {currentAdmin?.isSuperAdmin ? "Super Admin Dashboard" : "Admin Settings"}
        </p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <div className="w-64 bg-white border-r border-gray-200 p-4">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setIsEditing(false);
                }}
                className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? "bg-green-100 text-green-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span className="mr-3">{tab.icon}</span>
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 overflow-auto">
          {activeTab === "profile" && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">
                  Profile Information
                </h2>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                    >
                      <X size={16} className="mr-2" />
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={isLoading}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center disabled:opacity-70"
                    >
                      {isLoading ? (
                        "Saving..."
                      ) : (
                        <>
                          <Save size={16} className="mr-2" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <div className="px-4 py-3 bg-gray-100 rounded-lg">
                    {currentAdmin?.isSuperAdmin ? "Super Admin" : "Admin"}
                  </div>
                </div>
              </form>
            </div>
          )}

          {activeTab === "security" && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                Security Settings
              </h2>

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter current password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    required
                    minLength="8"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter new password (min 8 characters)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                    placeholder="Confirm new password"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center disabled:opacity-70"
                  >
                    {isLoading ? (
                      "Updating..."
                    ) : (
                      <>
                        <Save size={16} className="mr-2" />
                        Update Password
                      </>
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-800 mb-4">
                  Last Login
                </h3>
                <p className="text-gray-600">
                  {currentAdmin?.lastLogin
                    ? new Date(currentAdmin.lastLogin).toLocaleString()
                    : "No login record found"}
                </p>
              </div>
            </div>
          )}

          {activeTab === "permissions" && currentAdmin?.isSuperAdmin && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                Admin Permissions
              </h2>

              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  Manage access permissions for this admin account
                </p>
                
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Edit Permissions
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                    >
                      <X size={16} className="mr-2" />
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={isLoading}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center disabled:opacity-70"
                    >
                      {isLoading ? (
                        "Saving..."
                      ) : (
                        <>
                          <Save size={16} className="mr-2" />
                          Save Permissions
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availablePermissions.map((permission) => (
                  <div
                    key={permission}
                    className={`p-4 border rounded-lg transition-colors ${
                      formData.permissions.includes(permission)
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200"
                    }`}
                  >
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(permission)}
                        onChange={() => handlePermissionChange(permission)}
                        disabled={!isEditing}
                        className="h-4 w-4 text-green-500 rounded focus:ring-green-500 disabled:opacity-50"
                      />
                      <div>
                        <span className="block text-sm font-medium text-gray-700 capitalize">
                          {permission}
                        </span>
                        <span className="block text-xs text-gray-500">
                          {permission === "dashboard" && "Access to dashboard"}
                          {permission === "users" && "Manage user accounts"}
                          {permission === "products" && "Manage products"}
                          {permission === "orders" && "View and manage orders"}
                          {permission === "vendors" && "Manage vendors"}
                          {permission === "settings" && "Change system settings"}
                        </span>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;