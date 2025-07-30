import { useState, useEffect } from "react";

const initialStaticSlides = [
    {
        title: "Farm Fresh Delivered to You",
        highlight: "Delivered",
        description: "Discover the freshest local produce and artisanal goods from trusted farmers in your community.",
        bgFrom: "#059669",
        bgTo: "#047857",
        buttons: [
            { text: "Shop Now", variant: "primary", link: "/shopping" },
            { text: "Meet Our Farmers", variant: "secondary", link: "/about-us" },
        ],
        floatingItems: [
            { name: "apple", label: "Fresh Apples", image: "/uploads/products/apple.webp" },
            { name: "bread", label: "Artisan Bread", image: "/uploads/products/bread.webp" },
            { name: "milk", label: "Organic Milk", image: "/uploads/products/milk.webp" },
            { name: "honey", label: "Local Honey", image: "/uploads/products/honey.webp" },
            { name: "eggs", label: "Farm Eggs", image: "/uploads/products/eggs.webp" },
        ],
    },
    {
        title: "Seasonal Specials",
        highlight: "Specials",
        description: "Enjoy limited-time offers on seasonal fruits and vegetables at their peak freshness.",
        bgFrom: "#f59e0b",
        bgTo: "#ea580c",
        buttons: [
            { text: "View Offers", variant: "primary", link: "/shopping?category=seasonal" },
            { text: "Learn More", variant: "secondary", link: "/contact-us" },
        ],
        floatingItems: [
            { name: "strawberry", label: "Summer Berries", image: "/uploads/products/strawberry.webp" },
            { name: "pumpkin", label: "Autumn Pumpkins", image: "/uploads/products/pumpkin.webp" },
            { name: "citrus", label: "Winter Citrus", image: "/uploads/products/citrus.webp" },
            { name: "asparagus", label: "Spring Asparagus", image: "/uploads/products/asparagus.webp" },
        ],
    },
    {
        title: "Organic & Sustainable",
        highlight: "Sustainable",
        description: "Products grown with care for the environment and your health.",
        bgFrom: "#14b8a6",
        bgTo: "#0891b2",
        buttons: [
            { text: "Browse Organic", variant: "primary", link: "/shopping?category=organic" },
            { text: "Our Practices", variant: "secondary", link: "/about-us" },
        ],
        floatingItems: [
            { name: "milk", label: "Organic Milk", image: "/uploads/products/milk.webp" },
            { name: "honey", label: "Raw Honey", image: "/uploads/products/honey.webp" },
            { name: "eggs", label: "Free-range Eggs", image: "/uploads/products/eggs.webp" },
            { name: "vegetables", label: "Fresh Veggies", image: "/uploads/products/vegetables.webp" },
        ],
    },
];

// Classic arrow icons
const ChevronLeft = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
);

const ChevronRight = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
);

export const HeroSlider = () => {
    const [slides, setSlides] = useState([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [data , setData] = useState([]);
    
    const getProductImageUrl = (imagePath) => {
       const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        return imagePath
            ? data.imagePath
            : `${API_BASE_URL}/uploads/default-product.png`;
    };
    console.log("The data is " ,data)

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const fetchSlideData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/marketing/hero-slides`);
            setData(response)

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success && Array.isArray(result.data) && result.data.length > 0) {
                setSlides(result.data);
            } else {
                console.warn("Backend returned no dynamic slides or an invalid format. Falling back to static slides.");
                setSlides(initialStaticSlides);
            }
        } catch (err) {
            console.error("Failed to fetch hero slider data from backend:", err);
            setError("Failed to load special offers. Displaying default offers.");
            setSlides(initialStaticSlides);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSlideData();
    }, []);

    useEffect(() => {
        let interval;
        if (isAutoPlaying && slides.length > 0) {
            interval = setInterval(() => {
                setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
            }, 4000); 
        }
        return () => clearInterval(interval);
    }, [isAutoPlaying, slides.length]);

    const handleSlideChange = (newSlide) => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setCurrentSlide(newSlide);
        setIsAutoPlaying(false);
        
        setTimeout(() => {
            setIsTransitioning(false);
        }, 1000); // Only disable during the actual transition
        
        setTimeout(() => {
            setIsAutoPlaying(true);
        }, 5000); // Resume autoplay after 5 seconds
    };

    const nextSlide = () => {
        const newSlide = currentSlide === slides.length - 1 ? 0 : currentSlide + 1;
        handleSlideChange(newSlide);
    };

    const prevSlide = () => {
        const newSlide = currentSlide === 0 ? slides.length - 1 : currentSlide - 1;
        handleSlideChange(newSlide);
    };

    const goToSlide = (index) => {
        handleSlideChange(index);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col justify-center items-center h-96 bg-gradient-to-r from-green-100 to-emerald-100 rounded-3xl shadow-xl">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent mb-4"></div>
                <p className="text-green-700 font-medium">Loading amazing offers...</p>
            </div>
        );
    }

    if (slides.length === 0) {
        return (
            <div className="flex flex-col justify-center items-center h-96 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-3xl shadow-xl">
                <div className="text-6xl mb-4">🌾</div>
                <p className="text-yellow-700 font-medium text-center px-6">
                    No special offers available at the moment. Check back soon!
                </p>
                {error && <p className="text-sm mt-2 text-yellow-600">{error}</p>}
            </div>
        );
    }

    return (
        <div className="relative h-[600px] overflow-hidden mb-8 rounded-br-3xl rounded-bl-3xl shadow-2xl bg-white">
            {/* Progress bar */}
            <div className="absolute top-0 left-0 w-full h-1 bg-black/10 z-30">
                <div 
                    className="h-full bg-white/80 transition-all duration-300 ease-out"
                    style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
                />
            </div>

            <div
                className="flex transition-transform duration-1000 ease-in-out w-full h-full"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
                {slides.map((slide, index) => (
                    <div
                        key={slide._id || index}
                        className="w-full flex-shrink-0 relative h-full"
                        style={{
                            background: `linear-gradient(135deg, ${slide.bgFrom} 0%, ${slide.bgTo} 100%)`
                        }}
                    >
                        {/* Enhanced Decorative Elements */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            {/* Animated floating shapes */}
                            <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-white/10 backdrop-blur-sm animate-pulse"></div>
                            <div className="absolute bottom-20 right-16 w-24 h-24 rounded-full bg-white/15 backdrop-blur-sm animate-bounce" style={{ animationDelay: '1s' }}></div>
                            <div className="absolute top-1/3 left-1/4 w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm animate-pulse" style={{ animationDelay: '2s' }}></div>
                            <div className="absolute top-1/2 right-1/3 w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm animate-bounce" style={{ animationDelay: '3s' }}></div>
                            
                            {/* Geometric patterns */}
                            <div className="absolute top-0 right-0 w-96 h-96 opacity-10">
                                <div className="w-full h-full bg-white rounded-full transform rotate-45 scale-150"></div>
                            </div>
                        </div>

                        {/* Main Content with enhanced animations */}
                        <div className="container mx-auto h-full flex flex-col justify-center items-center text-center relative z-10 py-12 px-6 md:px-12 lg:px-24">
                            <div className="animate-fade-in-up">
                                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
                                    {slide.title.split(slide.highlight)[0]}
                                    <span className="text-yellow-300 drop-shadow-md animate-pulse"> {slide.highlight}</span>
                                    {slide.title.split(slide.highlight)[1]}
                                </h2>
                            </div>
                            
                            <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                                <p className="text-lg md:text-xl lg:text-2xl text-white/95 max-w-2xl lg:max-w-3xl mx-auto mb-8 leading-relaxed drop-shadow-md">
                                    {slide.description}
                                </p>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row justify-center gap-6 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                                {slide.buttons.map((button, i) => (
                                    <a
                                        key={i}
                                        href={button.link || '#'}
                                        className={`group relative overflow-hidden ${
                                            button.variant === "primary"
                                                ? "bg-white text-green-700 hover:bg-gray-50 shadow-xl"
                                                : "bg-transparent border-2 border-white text-white hover:bg-white hover:text-green-700 shadow-lg"
                                        } font-bold py-4 px-8 md:py-5 md:px-10 rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-2xl flex items-center justify-center min-w-[200px]`}
                                    >
                                        <span className="relative z-10 flex items-center">
                                            {button.text}
                                            <ChevronRight />
                                        </span>
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Enhanced Floating Items */}
                        <div className="absolute bottom-8 left-0 w-full flex justify-center items-end z-10">
                            <div className="flex space-x-4 md:space-x-8 lg:space-x-12">
                                {slide.floatingItems.map((item, i) => (
                                    <div key={i} className="flex flex-col items-center group cursor-pointer">
                                        <div className="relative w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-white rounded-2xl shadow-xl flex items-center justify-center transform hover:-translate-y-4 transition-all duration-500 mb-2 hover:shadow-2xl hover:bg-gray-50 group-hover:rotate-3">
                                            <img
                                                src={item.image.url}
                                                alt={item.label}
                                                className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 object-contain transition-transform duration-300 group-hover:scale-110"
                                                loading="lazy"
                                            />
                                            {/* Subtle glow effect */}
                                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-transparent to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                        </div>
                                        <span className="text-sm font-semibold text-white bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                                            {item.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Enhanced Navigation */}
            <button
                onClick={prevSlide}
                disabled={isTransitioning}
                className="absolute left-6 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-4 rounded-full shadow-xl z-20 transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
                aria-label="Previous slide"
            >
                <ChevronLeft />
            </button>
            <button
                onClick={nextSlide}
                disabled={isTransitioning}
                className="absolute right-6 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-4 rounded-full shadow-xl z-20 transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
                aria-label="Next slide"
            >
                <ChevronRight />
            </button>

            {/* Enhanced Pagination Dots */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-3 z-20">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        disabled={isTransitioning}
                        className={`h-3 rounded-full transition-all duration-300 transform hover:scale-125 disabled:cursor-not-allowed ${
                            currentSlide === index 
                                ? "bg-white w-8 shadow-lg" 
                                : "bg-white/50 w-3 hover:bg-white/70"
                        }`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>

            <div className="absolute top-6 right-6 bg-black/30 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium z-20">
                {currentSlide + 1} / {slides.length}
            </div>
        </div>
    );
}

