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
  Menu, // Added for mobile menu
} from "lucide-react";

const SettingsPage = () => {
  const { user:currentAdmin , updateAdmin } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // New state for mobile sidebar
  

  // Form state with all fields from your model
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "", // Not used directly in form display, but kept for clarity
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    notifications: true,
    language: "en",
    timezone: "UTC",
    permissions: [],
    isSuperAdmin: false,
  });

  // Log currentAdmin to see its value
  useEffect(() => {
    console.log("SettingsPage mounted or currentAdmin changed.");
    console.log("Current Admin in SettingsPage:", currentAdmin);

    if (currentAdmin) {
      setFormData({
        name: currentAdmin.name || "",
        email: currentAdmin.email || "",
        password: "", // Don't pre-fill passwords for security
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        notifications: currentAdmin.notifications ?? true, // Use nullish coalescing
        language: currentAdmin.language || "en",
        timezone: currentAdmin.timezone || "UTC",
        permissions: currentAdmin.permissions || [],
        isSuperAdmin: currentAdmin.isSuperAdmin || false,
      });
      console.log("FormData updated from currentAdmin:", currentAdmin);
    } else {
      console.log("currentAdmin is null or undefined. Showing loading message.");
    }
  }, [currentAdmin]); // Dependency array ensures this runs when currentAdmin changes

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handlePermissionChange = (permission) => {
    setFormData((prev) => {
      const newPermissions = prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
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
          throw new Error("New passwords do not match.");
        }
        if (!formData.currentPassword) {
            throw new Error("Current password is required.");
        }
        if (!formData.newPassword || formData.newPassword.length < 8) {
            throw new Error("New password must be at least 8 characters.");
        }

        updateData = {
          password: formData.newPassword, // Sending newPassword as 'password' to the backend
          currentPassword: formData.currentPassword,
        };
      } else if (activeTab === "permissions" && currentAdmin?.isSuperAdmin) { // Use optional chaining
        updateData = { permissions: formData.permissions };
      }

      await updateAdmin(updateData);
      toast.success("Settings updated successfully!");
      setIsEditing(false); // Exit editing mode after successful save
      // Reset password fields after successful update
      setFormData(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    } catch (error) {
      toast.error(error.message || "Failed to update settings. Please try again.");
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
    tabs.push({ id: "permissions", icon: <Shield size={18} />, label: "Permissions" });
  }

  // Available permissions (from your model)
  const availablePermissions = [
    "dashboard",
    "users",
    "products",
    "orders",
    "vendors",
    "settings",
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header for mobile view with hamburger menu */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <h1 className="text-xl font-bold flex items-center text-gray-800">
          <Settings className="mr-2 text-green-500" size={20} />
          Admin Settings
        </h1>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
        >
          <Menu size={24} />
        </button>
      </div>

      <div className="p-6 hidden md:block"> {/* Hide on mobile, show on md+ */}
        <h1 className="text-2xl font-bold flex items-center text-gray-800">
          <Settings className="mr-3 text-green-500" size={24} />
          Admin Settings
        </h1>
        <p className="text-gray-600 mt-1">
          {currentAdmin?.isSuperAdmin ? "Super Admin Dashboard" : "Admin Settings"}
        </p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation - Responsive */}
        <div
          className={`fixed inset-y-0 left-0 bg-white border-r border-gray-200 p-4 z-30 transform w-64 ${isSidebarOpen ? "pt-25" : "pt-4"}  ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:relative md:translate-x-0 md:w-64 transition-transform duration-300 ease-in-out`}
        >
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setIsEditing(false); // Reset editing mode when changing tabs
                  setIsSidebarOpen(false); // Close sidebar on tab click for mobile
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

        {/* Overlay for mobile sidebar */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 backdrop-blur bg-opacity-50 z-20 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}

        {/* Main Content */}
        <div className="flex-1 p-4 md:p-6 overflow-y-auto"> {/* Adjusted padding for mobile */}
          {activeTab === "profile" && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 md:mb-0">
                  Profile Information
                </h2>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full md:w-auto px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 w-full md:w-auto">
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        // Re-initialize formData to original currentAdmin values on cancel
                        if (currentAdmin) {
                          setFormData({
                            name: currentAdmin.name || "",
                            email: currentAdmin.email || "",
                            password: "",
                            currentPassword: "",
                            newPassword: "",
                            confirmPassword: "",
                            notifications: currentAdmin.notifications ?? true,
                            language: currentAdmin.language || "en",
                            timezone: currentAdmin.timezone || "UTC",
                            permissions: currentAdmin.permissions || [],
                            isSuperAdmin: currentAdmin.isSuperAdmin || false,
                          });
                        }
                      }}
                      className="w-full md:w-auto px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
                    >
                      <X size={16} className="mr-2" />
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={isLoading}
                      className="w-full md:w-auto px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center disabled:opacity-70"
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

              {/* Added a null check for currentAdmin before rendering inputs */}
              {currentAdmin ? (
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
              ) : (
                <p className="text-gray-500 text-center py-8">Loading profile data...</p>
              )}
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
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors w-full md:w-auto"
                  >
                    Edit Permissions
                  </button>
                ) : (
                  <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 w-full md:w-auto">
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        // Re-initialize permissions on cancel
                        if (currentAdmin) {
                          setFormData(prev => ({
                            ...prev,
                            permissions: currentAdmin.permissions || [],
                          }));
                        }
                      }}
                      className="w-full md:w-auto px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
                    >
                      <X size={16} className="mr-2" />
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={isLoading}
                      className="w-full md:w-auto px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center disabled:opacity-70"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"> {/* Adjusted for smaller screens */}
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