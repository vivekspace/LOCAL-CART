import { useContext, useState } from "react";
import { useForm } from "react-hook-form";
import { Dialog } from "@headlessui/react";
import {
  User,
  Mail,
  Edit,
  Lock,
  MapPin,
  ShoppingBag,
  Bell,
  Moon,
  Sun,
  X,
  ChevronRight,
} from "lucide-react";
import { AuthContext } from "../../Context/Context";

const ProfilePage = () => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const {user , setUser} = useContext(AuthContext)
  const { register, handleSubmit } = useForm();

  // Sample user data

  // Sample order history
  const orders = [
    { id: 1, date: "2023-10-15", total: "$49.99", status: "Delivered" },
    { id: 2, date: "2023-09-28", total: "$89.99", status: "Shipped" },
  ];

  // Sample saved addresses
  const addresses = [
    {
      id: 1,
      name: "Home",
      address: "123 Main St, Apt 4B, New York, NY 10001",
    },
    {
      id: 2,
      name: "Work",
      address: "456 Business Ave, Suite 200, Brooklyn, NY 11201",
    },
  ];

  // Handle profile update
  const onSubmit = (data) => {
    setUser({ ...user, ...data });
    setIsEditModalOpen(false);
  };

  return (
    <div className={`min-h-screen ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Profile</h1>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        {/* Profile Card */}
        <div className={`rounded-xl shadow-md p-6 mb-8 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              <img
                src={user.avatar}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-4 border-green-500"
              />
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="absolute bottom-0 right-0 bg-green-500 p-2 rounded-full text-white hover:bg-green-600 transition"
              >
                <Edit size={16} />
              </button>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{user.name}</h2>
              <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                <Mail size={16} /> {user.email}
              </p>
              <p className="mt-3">{user.bio}</p>
            </div>
          </div>
        </div>

        {/* Order History */}
        <div className={`rounded-xl shadow-md p-6 mb-8 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <ShoppingBag size={20} /> Order History
          </h2>
          {orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className={`p-4 rounded-lg border ${darkMode ? "border-gray-700" : "border-gray-200"} flex justify-between items-center`}
                >
                  <div>
                    <p className="font-medium">Order #{order.id}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {order.date} • {order.status}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-bold">{order.total}</p>
                    <ChevronRight size={20} className="text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No orders yet.</p>
          )}
        </div>

        {/* Saved Addresses */}
        <div className={`rounded-xl shadow-md p-6 mb-8 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <MapPin size={20} /> Saved Addresses
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((address) => (
              <div
                key={address.id}
                className={`p-4 rounded-lg border ${darkMode ? "border-gray-700" : "border-gray-200"}`}
              >
                <h3 className="font-bold">{address.name}</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  {address.address}
                </p>
                <button className="mt-3 text-green-600 dark:text-green-400 hover:underline text-sm">
                  Edit
                </button>
              </div>
            ))}
          </div>
          <button className="mt-4 text-green-600 dark:text-green-400 hover:underline flex items-center gap-1">
            <span>+ Add New Address</span>
          </button>
        </div>

        {/* Account Settings */}
        <div className={`rounded-xl shadow-md p-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Lock size={20} /> Account Settings
          </h2>
          <div className="space-y-4">
            <button className="w-full flex justify-between items-center p-3 hover:bg-gray-100 dark:hover:bg-green-50 rounded-lg transition">
              <span className="flex items-center gap-2">
                <Lock size={16} /> Change Password
              </span>
              <ChevronRight size={16} className="text-gray-400" />
            </button>
            <button className="w-full flex justify-between items-center p-3 hover:bg-gray-100 dark:hover:bg-green-50 rounded-lg transition">
              <span className="flex items-center gap-2">
                <Bell size={16} /> Notification Preferences
              </span>
              <ChevronRight size={16} className="text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Dialog
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="fixed inset-0 bg-black/30" />
        <Dialog.Panel
          className={`w-full max-w-md rounded-xl p-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}
        >
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-xl font-bold">
              Edit Profile
            </Dialog.Title>
            <button onClick={() => setIsEditModalOpen(false)}>
              <X size={24} />
            </button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                defaultValue={user.name}
                {...register("name")}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                defaultValue={user.email}
                {...register("email")}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bio</label>
              <textarea
                defaultValue={user.bio}
                {...register("bio")}
                rows={3}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition"
            >
              Save Changes
            </button>
          </form>
        </Dialog.Panel>
      </Dialog>
    </div>
  );
};

export default ProfilePage;