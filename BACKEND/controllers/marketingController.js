const Product = require('../models/Product');
const Vendor = require('../models/Vendor');

exports.getHeroSlides = async (req, res) => {
    try {
        const slides = [];

        const topProducts = await Product.find({})
            .sort({ salesCount: -1 })
            .limit(3)
            .select('name description price images _id');

        // Define different color schemes for variety
        const colorSchemes = [
            { bgFrom: "#059669", bgTo: "#047857" }, // green-600 to emerald-700
            { bgFrom: "#dc2626", bgTo: "#b91c1c" }, // red-600 to red-700
            { bgFrom: "#7c3aed", bgTo: "#6d28d9" }, // violet-600 to violet-700
            { bgFrom: "#0891b2", bgTo: "#0e7490" }, // cyan-600 to cyan-700
            { bgFrom: "#ea580c", bgTo: "#c2410c" }, // orange-600 to orange-700
        ];

        topProducts.forEach((product, index) => {
            const colorScheme = colorSchemes[index % colorSchemes.length];
            slides.push({
                title: `${product.name} - Exclusive Offer`,
                highlight: product.name.split(' ')[0],
                description: `Get ${product.name} for just ₹${product.price.toFixed(2)}! Locally sourced, premium quality.`,
                bgFrom: colorScheme.bgFrom,
                bgTo: colorScheme.bgTo,
                buttons: [
                    { text: "Shop Now", variant: "primary", link: `/product-info/${product._id}` },
                    { text: "View Details", variant: "secondary", link: `/product-info/${product._id}` },
                ],
                floatingItems: product.images && product.images.length > 0
                    ? [{ name: product.name, label: product.name, image: product.images[0] }]
                    : [],
            });
        });

        const featuredVendor = await Vendor.findOne({ isApproved: true, rating: { $gte: 4.5 } })
            .select('name description profilePicture _id');

        if (featuredVendor) {
            slides.push({
                title: `Discover ${featuredVendor.name}'s Farm`,
                highlight: featuredVendor.name,
                description: `Explore fresh produce and unique crafts from our trusted partner, ${featuredVendor.name}.`,
                bgFrom: "#8b5cf6", // purple-500
                bgTo: "#7c3aed",   // violet-600
                buttons: [
                    { text: "Shop from them", variant: "primary", link: `/vendor/${featuredVendor._id}/products` },
                    { text: "Learn More", variant: "secondary", link: `/vendors/${featuredVendor._id}` },
                ],
                floatingItems: featuredVendor.profilePicture
                    ? [{ name: featuredVendor.name, label: featuredVendor.name, image: featuredVendor.profilePicture }]
                    : [],
            });
        }

        slides.push({
            title: "Summer Harvest Festival!",
            highlight: "Harvest Festival",
            description: "Celebrate the bounty of summer with special discounts on fruits and vegetables.",
            bgFrom: "#f59e0b", // amber-500
            bgTo: "#f97316",   // orange-500
            buttons: [
                { text: "View Deals", variant: "primary", link: "/shopping?tag=summer-harvest" },
            ],
            floatingItems: []
        });

        res.json({ success: true, data: slides });
        
    } catch (error) {
        console.error("Error in getHeroSlides controller:", error);
        res.status(500).json({ success: false, message: "Failed to fetch slider content." });
    }
};