import React, { useState, useEffect } from 'react';
import { Camera, XCircle } from 'lucide-react'; // Example icons

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function ProductForm({ product, onSubmit, isEditing, isLoading, error }) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        stock: '',
        category: '',
        brand: '',
        images: [], // Existing image filenames (string array)
        newImages: [], // New files to be uploaded (File object array)
        imagePreviews: [] // URLs for previewing existing/new images
    });

    useEffect(() => {
        if (product) {
            setFormData(prev => ({
                ...prev,
                name: product.name || '',
                description: product.description || '',
                price: product.price || '',
                stock: product.stock || '',
                category: product.category || '',
                brand: product.brand || '',
                images: product.images || [], // Existing images from DB
                // Generate previews for existing images
                imagePreviews: (product.images || []).map(img => `${API_BASE_URL}/uploads/products/${img}`),
            }));
        }
    }, [product]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        setFormData(prev => ({
            ...prev,
            newImages: [...prev.newImages, ...files],
            // Create object URLs for new image previews
            imagePreviews: [...prev.imagePreviews, ...files.map(file => URL.createObjectURL(file))]
        }));
    };

    const handleRemoveImage = (indexToRemove, isExisting = false) => {
        if (isExisting) {
            // Logic to mark an existing image for deletion on the backend
            // For now, we'll just remove it from preview, backend logic would handle actual deletion
            const updatedExistingImages = formData.images.filter((_, index) => index !== indexToRemove);
            const updatedExistingPreviews = formData.imagePreviews.filter((_, index) => index !== indexToRemove);
            setFormData(prev => ({
                ...prev,
                images: updatedExistingImages,
                imagePreviews: updatedExistingPreviews
            }));
        } else {
            // Logic for new images (not yet uploaded)
            const updatedNewImages = formData.newImages.filter((_, index) => index !== (indexToRemove - formData.images.length));
            const updatedNewPreviews = formData.imagePreviews.filter((_, index) => index !== indexToRemove);
            setFormData(prev => ({
                ...prev,
                newImages: updatedNewImages,
                imagePreviews: updatedNewPreviews
            }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Construct FormData for file uploads
        const submitData = new FormData();
        for (const key in formData) {
            if (key === 'newImages') {
                formData.newImages.forEach(file => {
                    submitData.append('images', file); // 'images' should match your multer field name
                });
            } else if (key === 'imagePreviews') {
                // Do not append previews
            } else if (key === 'images') {
                // Send existing image filenames to backend if needed for 'keep' logic
                formData.images.forEach(imgName => {
                    submitData.append('existingImages', imgName);
                });
            }
            else {
                submitData.append(key, formData[key]);
            }
        }
        onSubmit(submitData);
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-6">
            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
                    <p className="font-bold">Error:</p>
                    <p>{error}</p>
                </div>
            )}

            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    required
                />
            </div>

            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="4"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    required
                ></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                    <input
                        type="number"
                        id="price"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                        min="0"
                        step="0.01"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                    <input
                        type="number"
                        id="stock"
                        name="stock"
                        value={formData.stock}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                        min="0"
                        required
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <input
                        type="text"
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                    <input
                        type="text"
                        id="brand"
                        name="brand"
                        value={formData.brand}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    />
                </div>
            </div>

            {/* Image Upload Section */}
            <div>
                <label htmlFor="images" className="block text-sm font-medium text-gray-700 mb-1">Product Images</label>
                <input
                    type="file"
                    id="images"
                    name="images"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
                />
                <p className="mt-1 text-sm text-gray-500">Upload up to 5 images (JPG, PNG).</p>

                <div className="mt-4 flex flex-wrap gap-3">
                    {formData.imagePreviews.map((preview, index) => (
                        <div key={index} className="relative w-24 h-24 border border-gray-300 rounded-md overflow-hidden">
                            <img src={preview} alt={`Product Image ${index + 1}`} className="w-full h-full object-cover" />
                            <button
                                type="button"
                                onClick={() => handleRemoveImage(index, index < formData.images.length)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"
                                title="Remove image"
                            >
                                <XCircle size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>


            <div className="flex justify-end space-x-3">
                <button
                    type="button"
                    onClick={() => window.history.back()} // Go back to previous page
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <span className="flex items-center">
                            <span className="animate-spin h-5 w-5 mr-2 border-b-2 border-white rounded-full"></span>
                            {isEditing ? 'Updating...' : 'Adding...'}
                        </span>
                    ) : (
                        isEditing ? 'Update Product' : 'Add Product'
                    )}
                </button>
            </div>
        </form>
    );
}