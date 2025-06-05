import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../Context/Context";
import { useForm } from "react-hook-form";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Pie } from "react-chartjs-2";
import { format } from "date-fns";

import axios from "axios";

import {
  ShoppingBag,
  Users,
  CreditCard,
  Package,
  TrendingUp,
  Settings,
  LogOut,
  Moon,
  Sun,
  Bell,
  Search,
  ChevronDown,
  Plus,
  Trash,
  Edit,
  Check,
  X,
} from "lucide-react";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const AdminPanel = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const { register, handleSubmit } = useForm();
  const { isOpen } = useContext(AuthContext);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get("VITE_API_URL/api/products");
        setProducts(data.products);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await axios.delete(`VITE_API_URL/api/products/${id}`);
        setProducts(products.filter((product) => product._id !== id));
      } catch (error) {
        console.error("Error deleting product:", error);
      }
    }
  };

  // Sample data
  const salesData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Sales ($)",
        data: [4500, 5200, 7800, 9100, 12300, 9800],
        backgroundColor: "#10B981",
        borderColor: "#059669",
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  const orderStatusData = {
    labels: ["Delivered", "Processing", "Cancelled"],
    datasets: [
      {
        data: [65, 25, 10],
        backgroundColor: ["#10B981", "#F59E0B", "#EF4444"],
        borderWidth: 0,
      },
    ],
  };

  const recentOrders = [
    {
      id: "#LC-1001",
      customer: "Alex Johnson",
      date: "2023-06-15",
      amount: "$89.99",
      status: "Delivered",
    },
    {
      id: "#LC-1002",
      customer: "Sarah Miller",
      date: "2023-06-14",
      amount: "$124.50",
      status: "Shipped",
    },
    {
      id: "#LC-1003",
      customer: "Michael Chen",
      date: "2023-06-13",
      amount: "$56.75",
      status: "Processing",
    },
    {
      id: "#LC-1004",
      customer: "Emily Wilson",
      date: "2023-06-12",
      amount: "$210.00",
      status: "Cancelled",
    },
  ];

  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 768);

  const recentProducts = [
    { id: "P-1001", name: "Organic Apples", stock: 45, price: "$3.99" },
    { id: "P-1002", name: "Farm Fresh Eggs", stock: 120, price: "$4.50" },
    { id: "P-1003", name: "Artisan Bread", stock: 32, price: "$5.25" },
    { id: "P-1004", name: "Local Honey", stock: 18, price: "$8.99" },
  ];

  const vendorRequests = [
    {
      id: "V-1001",
      name: "Green Valley Farms",
      email: "contact@greenvalley.com",
      status: "Pending",
    },
    {
      id: "V-1002",
      name: "Sunny Side Eggs",
      email: "info@sunnyside.com",
      status: "Approved",
    },
    {
      id: "V-1003",
      name: "Golden Grain Bakery",
      email: "hello@goldengrain.com",
      status: "Rejected",
    },
  ];
  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return (
    <div
      className={`min-h-screen ${
        darkMode
          ? "bg-gray-900 text-gray-100 duration-300"
          : "bg-gray-50 text-gray-900 duration-300"
      }`}
    >
      {/* fixed inset-y-0 left-0 z-50 */}

      <div className="p-2 lg:md:p-6 duration-200">
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Dashboard Content */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    icon: <TrendingUp size={24} />,
                    title: "Total Sales",
                    value: "$24,580",
                    change: "+12%",
                    trend: "up",
                  },
                  {
                    icon: <ShoppingBag size={24} />,
                    title: "Orders",
                    value: "1,245",
                    change: "+8%",
                    trend: "up",
                  },
                  {
                    icon: <Users size={24} />,
                    title: "Customers",
                    value: "856",
                    change: "+5%",
                    trend: "up",
                  },
                  {
                    icon: <Package size={24} />,
                    title: "Products",
                    value: "324",
                    change: "-2%",
                    trend: "down",
                  },
                ].map((stat, index) => (
                  <div
                    key={index}
                    className={`p-6 rounded-xl shadow ${
                      darkMode ? "bg-gray-800" : "bg-white"
                    }`}
                  >
                    <div className="flex justify-between">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {stat.title}
                        </p>
                        <h3 className="text-2xl font-bold mt-1">
                          {stat.value}
                        </h3>
                      </div>
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          stat.trend === "up"
                            ? "bg-green-100 text-green-600"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {stat.icon}
                      </div>
                    </div>
                    <p
                      className={`mt-4 text-sm ${
                        stat.trend === "up" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      <span className="font-medium">{stat.change}</span> from
                      last month
                    </p>
                  </div>
                ))}
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div
                  className={`p-6 rounded-xl shadow ${
                    darkMode ? "bg-gray-800" : "bg-white"
                  } lg:col-span-2`}
                >
                  <h3 className="font-medium mb-4">Sales Overview</h3>
                  <Bar
                    data={salesData}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          position: "top",
                        },
                      },
                    }}
                  />
                </div>
                <div
                  className={`p-6 rounded-xl shadow ${
                    darkMode ? "bg-gray-800" : "bg-white"
                  }`}
                >
                  <h3 className="font-medium mb-4">Order Status</h3>
                  <div className="h-64">
                    <Pie
                      data={orderStatusData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: "bottom",
                          },
                        },
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Recent Orders */}
              <div
                className={`p-6 rounded-xl shadow ${
                  darkMode ? "bg-gray-800" : "bg-white"
                }`}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">Recent Orders</h3>
                  <button className="text-sm text-green-600 hover:text-green-700">
                    View All
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left border-b border-gray-200 dark:border-gray-700">
                        <th className="pb-3">Order ID</th>
                        <th className="pb-3">Customer</th>
                        <th className="pb-3">Date</th>
                        <th className="pb-3">Amount</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((order) => (
                        <tr
                          key={order.id}
                          className="border-b border-gray-200 dark:border-gray-700"
                        >
                          <td className="py-3">{order.id}</td>
                          <td className="py-3">{order.customer}</td>
                          <td className="py-3">
                            {format(new Date(order.date), "MMM dd, yyyy")}
                          </td>
                          <td className="py-3">{order.amount}</td>
                          <td className="py-3">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                order.status === "Delivered"
                                  ? "bg-green-100 text-green-800"
                                  : order.status === "Shipped"
                                  ? "bg-blue-100 text-blue-800"
                                  : order.status === "Processing"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {order.status}
                            </span>
                          </td>
                          <td className="py-3">
                            <button className="text-green-600 hover:text-green-700">
                              <Edit size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Products Management */}
          {activeTab === "products" && (
            <div
              className={`p-6 rounded-xl shadow ${
                darkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-medium">Products</h3>
                <button className="flex items-center bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg">
                  <Plus size={16} className="mr-2" />
                  Add Product
                </button>
              </div>
              <div className="flex justify-between items-center mb-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search products..."
                    className={`pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none ${
                      darkMode
                        ? "bg-gray-700 border-gray-600"
                        : "bg-white border-gray-300"
                    }`}
                  />
                </div>
                <div className="flex space-x-2">
                  <select
                    className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none ${
                      darkMode
                        ? "bg-gray-700 border-gray-600"
                        : "bg-white border-gray-300"
                    }`}
                  >
                    <option>All Categories</option>
                    <option>Fruits</option>
                    <option>Vegetables</option>
                    <option>Dairy</option>
                    <option>Bakery</option>
                  </select>
                  <select
                    className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none ${
                      darkMode
                        ? "bg-gray-700 border-gray-600"
                        : "bg-white border-gray-300"
                    }`}
                  >
                    <option>Sort By</option>
                    <option>Newest</option>
                    <option>Price: Low to High</option>
                    <option>Price: High to Low</option>
                  </select>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-gray-200 dark:border-gray-700">
                      <th className="pb-3">Product ID</th>
                      <th className="pb-3">Name</th>
                      <th className="pb-3">Stock</th>
                      <th className="pb-3">Price</th>
                      <th className="pb-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentProducts.map((product) => (
                      <tr
                        key={product.id}
                        className="border-b border-gray-200 dark:border-gray-700"
                      >
                        <td className="py-3">{product.id}</td>
                        <td className="py-3">{product.name}</td>
                        <td className="py-3">{product.stock}</td>
                        <td className="py-3">{product.price}</td>
                        <td className="py-3 flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-700">
                            <Edit size={16} />
                          </button>
                          <button className="text-red-600 hover:text-red-700">
                            <Trash size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-gray-500">
                  Showing 1 to 4 of 24 entries
                </div>
                <div className="flex space-x-1">
                  <button className="px-3 py-1 rounded border">Previous</button>
                  <button className="px-3 py-1 rounded bg-green-500 text-white">
                    1
                  </button>
                  <button className="px-3 py-1 rounded border">2</button>
                  <button className="px-3 py-1 rounded border">3</button>
                  <button className="px-3 py-1 rounded border">Next</button>
                </div>
              </div>
            </div>
          )}

          {/* Vendors Management */}
          {activeTab === "vendors" && (
            <div
              className={`p-6 rounded-xl shadow ${
                darkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-medium">Vendor Requests</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-gray-200 dark:border-gray-700">
                      <th className="pb-3">Vendor ID</th>
                      <th className="pb-3">Name</th>
                      <th className="pb-3">Email</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendorRequests.map((vendor) => (
                      <tr
                        key={vendor.id}
                        className="border-b border-gray-200 dark:border-gray-700"
                      >
                        <td className="py-3">{vendor.id}</td>
                        <td className="py-3">{vendor.name}</td>
                        <td className="py-3">{vendor.email}</td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              vendor.status === "Approved"
                                ? "bg-green-100 text-green-800"
                                : vendor.status === "Pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {vendor.status}
                          </span>
                        </td>
                        <td className="py-3 flex space-x-2">
                          {vendor.status === "Pending" && (
                            <>
                              <button className="text-green-600 hover:text-green-700">
                                <Check size={16} />
                              </button>
                              <button className="text-red-600 hover:text-red-700">
                                <X size={16} />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
