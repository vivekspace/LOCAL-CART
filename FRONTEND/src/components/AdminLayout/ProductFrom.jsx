import React, { useState, useEffect } from 'react';
import { Camera, XCircle, ImagePlus, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function ProductForm({ product, onSubmit, isEditing, isLoading, error }) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        stock: '',
        category: '',
        brand: '',
        images: [],
        newImages: [],
        imagePreviews: []
    });

    // Categories for dropdown
    const categories = [
        'Electronics',
        'Clothing',
        'Home & Kitchen',
        'Books',
        'Beauty',
        'Toys',
        'Sports',
        'Other'
    ];

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
                images: product.images || [],
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
        if (files.length + formData.imagePreviews.length > 5) {
            alert('Maximum 5 images allowed');
            return;
        }
        
        setFormData(prev => ({
            ...prev,
            newImages: [...prev.newImages, ...files],
            imagePreviews: [...prev.imagePreviews, ...files.map(file => URL.createObjectURL(file))]
        }));
    };

    const handleRemoveImage = (indexToRemove, isExisting = false) => {
        if (isExisting) {
            const updatedExistingImages = formData.images.filter((_, index) => index !== indexToRemove);
            const updatedExistingPreviews = formData.imagePreviews.filter((_, index) => index !== indexToRemove);
            setFormData(prev => ({
                ...prev,
                images: updatedExistingImages,
                imagePreviews: updatedExistingPreviews
            }));
        } else {
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
        const submitData = new FormData();
        
        // Append all form data except previews
        for (const key in formData) {
            if (key === 'newImages') {
                formData.newImages.forEach(file => {
                    submitData.append('images', file);
                });
            } else if (key !== 'imagePreviews') {
                if (key === 'images') {
                    formData.images.forEach(imgName => {
                        submitData.append('existingImages', imgName);
                    });
                } else {
                    submitData.append(key, formData[key]);
                }
            }
        }
        
        onSubmit(submitData);
    };

    return (
        <motion.form 
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl shadow-sm p-6 space-y-6"
        >
            {/* Error Message */}
            {error && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg"
                >
                    <div className="flex items-center">
                        <svg className="h-5 w-5 text-red-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p className="font-medium">{error}</p>
                    </div>
                </motion.div>
            )}

            {/* Product Name */}
            <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Product Name</label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter product name"
                    required
                />
            </div>

            {/* Description */}
            <div className="space-y-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="4"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe the product in detail"
                    required
                ></textarea>
            </div>

            {/* Price & Stock */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500">₹</span>
                        </div>
                        <input
                            type="number"
                            id="price"
                            name="price"
                            value={formData.price}
                            onChange={handleChange}
                            className="block w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            required
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <label htmlFor="stock" className="block text-sm font-medium text-gray-700">Stock Quantity</label>
                    <input
                        type="number"
                        id="stock"
                        name="stock"
                        value={formData.stock}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                        placeholder="Available quantity"
                        required
                    />
                </div>
            </div>

            {/* Category & Brand */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
                    <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                    >
                        <option value="">Select a category</option>
                        {categories.map(category => (
                            <option key={category} value={category}>{category}</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-2">
                    <label htmlFor="brand" className="block text-sm font-medium text-gray-700">Brand (Optional)</label>
                    <input
                        type="text"
                        id="brand"
                        name="brand"
                        value={formData.brand}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Brand name"
                    />
                </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Product Images</label>
                <p className="text-sm text-gray-500 mb-3">Upload up to 5 images (First image will be featured)</p>
                
                {/* Image Upload Button */}
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <ImagePlus className="w-8 h-8 mb-3 text-gray-400" />
                        <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">JPG, PNG (MAX. 5MB each)</p>
                    </div>
                    <input 
                        id="images" 
                        name="images" 
                        type="file" 
                        accept="image/*" 
                        multiple 
                        onChange={handleImageChange} 
                        className="hidden" 
                    />
                </label>

                {/* Image Previews */}
                <div className="mt-4 flex flex-wrap gap-4">
                    {formData.imagePreviews.map((preview, index) => (
                        <motion.div 
                            key={index}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative w-32 h-32 border border-gray-200 rounded-lg overflow-hidden shadow-sm group"
                        >
                            <img 
                                src={preview} 
                                alt={`Preview ${index + 1}`} 
                                className="w-full h-full object-cover"
                            />
                            <button
                                type="button"
                                onClick={() => handleRemoveImage(index, index < formData.images.length)}
                                className="absolute top-2 right-2 bg-white/80 text-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-500 hover:text-white"
                                title="Remove image"
                            >
                                <XCircle size={18} />
                            </button>
                            {index === 0 && (
                                <span className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                                    Featured
                                </span>
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4">
                <button
                    type="button"
                    onClick={() => window.history.back()}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    className={`px-6 py-2 rounded-lg shadow-md transition-colors flex items-center justify-center ${
                        isLoading ? 'bg-blue-400' : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600'
                    } text-white`}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="animate-spin mr-2 h-4 w-4" />
                            {isEditing ? 'Saving...' : 'Creating...'}
                        </>
                    ) : (
                        isEditing ? 'Save Changes' : 'Create Product'
                    )}
                </button>
            </div>
        </motion.form>
    );
}