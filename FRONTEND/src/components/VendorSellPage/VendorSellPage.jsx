import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Upload, Image, Plus, Loader2, X, DollarSign, Package, Tag, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const AddProduct = () => {
  const [geoLocation, setGeoLocation] = useState({ lat: null, lng: null });
  const [city, setCity] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "Fruits", // Default category set here
    stock: "",
    vendorId: "",
  });

  useEffect(() => {
    // Attempt to get vendorId from localStorage
    const vendor = JSON.parse(localStorage.getItem("user"));
    if (vendor?.id) {
      setFormData(prev => ({ ...prev, vendorId: vendor.id }));
    }
  }, []);

  const [images, setImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const categories = [
    "Fruits",
    "Bakery",
    "Dairy & Eggs",
    "Honey",
    "Soap & Detergents",
    "Vegetables",
    "Meat & Poultry",
    "Beverages",
    "Mobile",
    "Electronics",
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Limit to a maximum of 5 images
    if (files.length + images.length > 5) {
      toast.error("Maximum 5 images allowed");
      return;
    }

    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    setImages(prev => [...prev, ...files]);
  };

  const removeImage = (index) => {
    // Revoke the object URL to free up memory
    URL.revokeObjectURL(previewUrls[index]);
    // Remove image and its preview URL by index
    const newImages = [...images];
    const newPreviews = [...previewUrls];
    newImages.splice(index, 1);
    newPreviews.splice(index, 1);
    setImages(newImages);
    setPreviewUrls(newPreviews);
  };

  useEffect(() => {
    // Get user's current geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setGeoLocation({ lat: latitude, lng: longitude });

          // Reverse geocode to get city name using OpenStreetMap Nominatim
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await res.json();
            // Extract city from various possible fields
            setCity(
              data.address.city || data.address.town || data.address.village || ""
            );
          } catch (err) {
            console.error("Failed to fetch city:", err);
            toast.error("Could not determine city from your location.");
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          // Inform user if geolocation fails
          toast.error("Geolocation access denied or unavailable. Please enable location services.");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 } // Geolocation options
      );
    } else {
      toast.warn("Geolocation is not supported by your browser.");
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const vendorToken = localStorage.getItem("vendorToken");
      if (!vendorToken) {
        toast.error("Authentication required. Please log in.");
        navigate("/vendor/login"); // Redirect to login if token is missing
        return;
      }

      const formDataToSend = new FormData();
      // Append all form data fields
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });

      // Append location data
      formDataToSend.append(
        "location",
        JSON.stringify({
          type: "Point",
          coordinates: [geoLocation.lng, geoLocation.lat],
          city, // city is part of the location object
        })
      );
      
      // IMPORTANT FIX: Ensure 'city' is appended as a separate top-level field if backend expects it
      formDataToSend.append("city", city); 

      // Append product images
      images.forEach(image => formDataToSend.append("productImages", image));

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/products/vendor`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${vendorToken}` }, // No 'Content-Type' for FormData, browser sets it
          body: formDataToSend,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Product upload failed");
      }

      toast.success("Product listed successfully!");
      navigate("/vendor/dashboard");
    } catch (err) {
      console.error("Product listing error:", err); // Log detailed error for debugging
      toast.error(err.message || "Failed to list product. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state UI
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="mb-4"
        >
          <Loader2 className="h-12 w-12 text-green-600" />
        </motion.div>
        <h2 className="text-xl font-medium text-gray-700">Creating your product listing</h2>
        <p className="text-gray-500 mt-2">This will just take a moment...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 p-8 text-white">
            <h1 className="text-2xl font-bold flex items-center">
              <Tag className="mr-3 w-6 h-6" />
              List Your Product
            </h1>
            <p className="text-green-100 mt-1">Fill in details to showcase your product</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Product Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Info className="w-4 h-4 mr-1 text-gray-500" />
                Product Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                placeholder="Enter product name"
                required
                maxLength={100}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Info className="w-4 h-4 mr-1 text-gray-500" />
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                placeholder="Describe your product in detail"
                required
                maxLength={1000}
              />
            </div>

            {/* Price & Stock */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <DollarSign className="w-4 h-4 mr-1 text-gray-500" />
                  Price
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    name="price"
                    value={formData.price} // Keep as string for input, backend will parse
                    onChange={handleChange}
                    min="0.01"
                    step="0.01"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Package className="w-4 h-4 mr-1 text-gray-500" />
                  Stock Quantity
                </label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  min="1"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Available quantity"
                  required
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Info className="w-4 h-4 mr-1 text-gray-500" />
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Image className="w-4 h-4 mr-1 text-gray-500" />
                Product Images
                <span className="ml-auto text-xs text-gray-500">
                  {previewUrls.length}/5 images
                </span>
              </label>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <AnimatePresence>
                  {previewUrls.map((url, index) => (
                    <motion.div
                      key={url} // Use URL as key as it's unique per preview
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="relative group h-32 overflow-hidden" // Added overflow-hidden
                    >
                      <img
                        src={url}
                        alt={`Preview ${index}`}
                        // Ensured object-cover and full dimensions for fitting
                        className="absolute inset-0 h-full w-full object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10" // Added z-10
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {previewUrls.length < 5 && (
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => fileInputRef.current.click()}
                    className="h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <Plus className="w-6 h-6 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">Add Image</p>
                  </motion.div>
                )}
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                className="hidden"
                accept="image/*"
                multiple
              />
            </div>

            {/* Location Info */}
            {city && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-700 flex items-center">
                  <Info className="w-4 h-4 mr-2" />
                  Your product will be listed in <span className="font-medium ml-1">{city}</span>
                </p>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <motion.button
                type="submit"
                disabled={isLoading || previewUrls.length === 0}
                whileHover={!isLoading && previewUrls.length > 0 ? { scale: 1.02 } : {}}
                whileTap={!isLoading && previewUrls.length > 0 ? { scale: 0.98 } : {}}
                className={`w-full py-3 px-6 rounded-lg font-medium text-white flex items-center justify-center ${
                  isLoading || previewUrls.length === 0
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                } transition-colors`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin mr-2 w-5 h-5" />
                    Listing Product...
                  </>
                ) : (
                  "List Product Now"
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default AddProduct;
