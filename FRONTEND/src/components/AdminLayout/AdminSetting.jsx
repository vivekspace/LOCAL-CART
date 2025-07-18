import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../../Context/Context";
import { toast } from "react-toastify";
import {
  Settings,
  User,
  Lock,
  Shield,
  Save,
  X,
  Menu,
  ChevronRight,
  Check,
  AlertTriangle,
  Loader2 // <--- Added Loader2 import
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SettingsPage = () => {
  const { user: currentAdmin, updateAdmin } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("profile");
  const [isProfileEditing, setIsProfileEditing] = useState(false);
  const [isSecurityEditing, setIsSecurityEditing] = useState(false); // New state
  const [isPermissionsEditing, setIsPermissionsEditing] = useState(false); // New state
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    permissions: [],
  });

  useEffect(() => {
    if (currentAdmin) {
      setFormData({
        name: currentAdmin.name || "",
        email: currentAdmin.email || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        permissions: currentAdmin.permissions || [],
      });
    }
  }, [currentAdmin]);

  // Reset editing states and form data when changing tabs
  useEffect(() => {
    setIsProfileEditing(false);
    setIsSecurityEditing(false);
    setIsPermissionsEditing(false);

    // Clear password fields if switching away from security tab
    if (activeTab !== "security") {
      setFormData(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    }
    // Re-initialize formData for profile and permissions if switching to them, in case user cancelled edits previously
    if (currentAdmin) {
        if (activeTab === "profile") {
            setFormData(prev => ({
                ...prev,
                name: currentAdmin.name || "",
                email: currentAdmin.email || "",
            }));
        } else if (activeTab === "permissions") {
            setFormData(prev => ({
                ...prev,
                permissions: currentAdmin.permissions || [],
            }));
        }
    }
  }, [activeTab, currentAdmin]); // Add currentAdmin to dependency array for effect to re-run if admin data changes

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handlePermissionChange = (permission) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let updateData = {};
      if (activeTab === "profile") {
        updateData = { name: formData.name, email: formData.email };
      } else if (activeTab === "security") {
        if (formData.newPassword !== formData.confirmPassword) {
          throw new Error("New passwords do not match");
        }
        if (!formData.currentPassword) {
          throw new Error("Current password is required");
        }
        if (formData.newPassword.length < 8) {
          throw new Error("Password must be at least 8 characters");
        }

        updateData = {
          password: formData.newPassword,
          currentPassword: formData.currentPassword,
        };
      } else if (activeTab === "permissions" && currentAdmin?.isSuperAdmin) {
        updateData = { permissions: formData.permissions };
      }

      await updateAdmin(updateData);
      toast.success("Settings updated successfully!");

      // Reset editing state for the active tab after successful submission
      if (activeTab === "profile") setIsProfileEditing(false);
      if (activeTab === "security") setIsSecurityEditing(false);
      if (activeTab === "permissions") setIsPermissionsEditing(false);

      // Clear password fields for security tab after successful update
      if (activeTab === "security") {
        setFormData((prev) => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }));
      }

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

  if (currentAdmin?.isSuperAdmin) {
    tabs.push({ id: "permissions", icon: <Shield size={18} />, label: "Permissions" });
  }

  const availablePermissions = [
    "dashboard",
    "users",
    "products",
    "orders",
    "vendors",
    "settings",
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white shadow-sm">
        <div className="flex items-center">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 mr-2 text-gray-600 rounded-md hover:bg-gray-100"
          >
            <Menu size={20} />
          </button>
          <h1 className="text-xl font-bold flex items-center text-gray-800">
            <Settings className="mr-2 text-blue-600" size={20} />
            Settings
          </h1>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block p-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center"
        >
          <Settings className="mr-3 text-blue-600" size={24} />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Admin Settings</h1>
            <p className="text-gray-600">
              {currentAdmin?.isSuperAdmin ? "Super Admin Dashboard" : "Admin Settings"}
            </p>
          </div>
        </motion.div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#00000025] backdrop-blur-xs bg-opacity-50 z-20 md:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: isSidebarOpen ? 0 : '-100%' }}
          transition={{ type: 'tween' }}
          className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg z-30 md:relative md:translate-x-0"
        >
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Settings</h2>
            </div>
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`flex items-center justify-between w-full px-4 py-3 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center">
                    <span className="mr-3">{tab.icon}</span>
                    <span className="font-medium">{tab.label}</span>
                  </div>
                  <ChevronRight size={16} />
                </button>
              ))}
            </nav>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 p-4 md:p-6 overflow-y-auto">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {activeTab === "profile" && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">
                        Profile Information
                      </h2>
                      <p className="text-gray-600 mt-1">
                        Update your account details
                      </p>
                    </div>
                    {!isProfileEditing ? (
                      <button
                        onClick={() => setIsProfileEditing(true)}
                        className="mt-4 md:mt-0 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg shadow-md hover:from-blue-700 hover:to-blue-600 transition-all"
                      >
                        Edit Profile
                      </button>
                    ) : (
                      <div className="flex space-x-2 mt-4 md:mt-0">
                        <button
                          onClick={() => {
                            setIsProfileEditing(false);
                            if (currentAdmin) {
                              setFormData({
                                ...formData,
                                name: currentAdmin.name || "",
                                email: currentAdmin.email || "",
                              });
                            }
                          }}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSubmit}
                          disabled={isLoading}
                          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg shadow-md hover:from-blue-700 hover:to-blue-600 transition-all disabled:opacity-70 flex items-center"
                        >
                          {isLoading ? (
                            <Loader2 className="animate-spin mr-2" size={16} />
                          ) : (
                            <Save className="mr-2" size={16} />
                          )}
                          Save Changes
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  {currentAdmin ? (
                    <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Full Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          disabled={!isProfileEditing} 
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Email
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          disabled={!isProfileEditing} 
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                        />
                      </div>

                      <div className="md:col-span-2 space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Role
                        </label>
                        <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                          <span className="font-medium">
                            {currentAdmin?.isSuperAdmin ? "Super Admin" : "Admin"}
                          </span>
                        </div>
                      </div>
                    </form>
                  ) : (
                    <div className="flex justify-center items-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">
                        Security Settings
                      </h2>
                      <p className="text-gray-600 mt-1">
                        Change your password and manage security
                      </p>
                    </div>
                    {!isSecurityEditing ? (
                      <button
                        onClick={() => setIsSecurityEditing(true)}
                        className="mt-4 md:mt-0 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg shadow-md hover:from-blue-700 hover:to-blue-600 transition-all"
                      >
                        Change Password
                      </button>
                    ) : (
                      <div className="flex space-x-2 mt-4 md:mt-0">
                        <button
                          onClick={() => {
                            setIsSecurityEditing(false);
                            // Reset password fields if cancelled
                            setFormData(prev => ({
                                ...prev,
                                currentPassword: "",
                                newPassword: "",
                                confirmPassword: "",
                            }));
                          }}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit" // Corrected: This button should submit the form
                          form="security-form" // Corrected: Link to the form's id
                          disabled={isLoading}
                          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg shadow-md hover:from-blue-700 hover:to-blue-600 transition-all disabled:opacity-70 flex items-center"
                        >
                          {isLoading ? (
                            <Loader2 className="animate-spin mr-2" size={16} />
                          ) : (
                            <Save className="mr-2" size={16} />
                          )}
                          Update Password
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Added id="security-form" to the form */}
                <form id="security-form" onSubmit={handleSubmit} className="p-6 space-y-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Current Password
                    </label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleInputChange}
                      required
                      disabled={!isSecurityEditing} 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                      placeholder="Enter current password"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      New Password
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      required
                      minLength="8"
                      disabled={!isSecurityEditing} 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                      placeholder="At least 8 characters"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                      disabled={!isSecurityEditing}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                      placeholder="Re-enter new password"
                    />
                  </div>
                  {/* Removed the redundant submit button from here, as it's now controlled in the header */}
                </form>

                <div className="p-6 border-t border-gray-200">
                  <h3 className="text-lg font-medium text-gray-800 mb-2">
                    Security Activity
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Last login:</span>{" "}
                      {currentAdmin?.lastLogin
                        ? new Date(currentAdmin.lastLogin).toLocaleString()
                        : "No login record found"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "permissions" && currentAdmin?.isSuperAdmin && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">
                        Admin Permissions
                      </h2>
                      <p className="text-gray-600 mt-1">
                        Manage access permissions for this admin
                      </p>
                    </div>
                    {!isPermissionsEditing ? (
                      <button
                        onClick={() => setIsPermissionsEditing(true)}
                        className="mt-4 md:mt-0 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg shadow-md hover:from-blue-700 hover:to-blue-600 transition-all"
                      >
                        Edit Permissions
                      </button>
                    ) : (
                      <div className="flex space-x-2 mt-4 md:mt-0">
                        <button
                          onClick={() => {
                            setIsPermissionsEditing(false);
                            if (currentAdmin) {
                              setFormData({
                                ...formData,
                                permissions: currentAdmin.permissions || [],
                              });
                            }
                          }}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSubmit}
                          disabled={isLoading}
                          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg shadow-md hover:from-blue-700 hover:to-blue-600 transition-all disabled:opacity-70 flex items-center"
                        >
                          {isLoading ? (
                            <Loader2 className="animate-spin mr-2" size={16} />
                          ) : (
                            <Save className="mr-2" size={16} />
                          )}
                          Save Permissions
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {availablePermissions.map((permission) => (
                      <motion.div
                        key={permission}
                        whileHover={{ scale: 1.02 }}
                        className={`p-4 border rounded-lg transition-all ${
                          formData.permissions.includes(permission)
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        } ${!isPermissionsEditing ? "cursor-not-allowed" : "cursor-pointer"}`}
                        onClick={() => isPermissionsEditing && handlePermissionChange(permission)}
                      >
                        <div className="flex items-start">
                          <div
                            className={`mt-1 flex-shrink-0 h-5 w-5 rounded border flex items-center justify-center ${
                              formData.permissions.includes(permission)
                                ? "bg-blue-500 border-blue-500"
                                : "bg-white border-gray-300"
                            }`}
                          >
                            {formData.permissions.includes(permission) && (
                              <Check size={14} className="text-white" />
                            )}
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-gray-800 capitalize">
                              {permission}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">
                              {permission === "dashboard" && "Access to dashboard"}
                              {permission === "users" && "Manage user accounts"}
                              {permission === "products" && "Manage products"}
                              {permission === "orders" && "View and manage orders"}
                              {permission === "vendors" && "Manage vendors"}
                              {permission === "settings" && "Change system settings"}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;