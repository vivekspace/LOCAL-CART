import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { useEffect, useState } from "react";

export const HeroSlider = () => {
  const slides = [
    {
      title: "Farm Fresh Delivered to You",
      highlight: "Delivered",
      description:
        "Discover the freshest local produce and artisanal goods from trusted farmers in your community.",
      bgFrom: "from-green-600",
      bgTo: "to-emerald-700",
      buttons: [
        { text: "Shop Now", variant: "primary" },
        { text: "Meet Our Farmers", variant: "secondary" },
      ],
      floatingItems: [
        { name: "apple", label: "Fresh Apples" },
        { name: "bread", label: "Artisan Bread" },
        { name: "milk", label: "Organic Milk" },
        { name: "honey", label: "Local Honey" },
        { name: "eggs", label: "Farm Eggs" },
      ],
    },
    {
      title: "Seasonal Specials",
      highlight: "Specials",
      description:
        "Enjoy limited-time offers on seasonal fruits and vegetables at their peak freshness.",
      bgFrom: "from-amber-500",
      bgTo: "to-orange-600",
      buttons: [
        { text: "View Offers", variant: "primary" },
        { text: "Learn More", variant: "secondary" },
      ],
      floatingItems: [
        { name: "strawberry", label: "Summer Berries" },
        { name: "pumpkin", label: "Autumn Pumpkins" },
        { name: "citrus", label: "Winter Citrus" },
        { name: "asparagus", label: "Spring Asparagus" },
      ],
    },
    {
      title: "Organic & Sustainable",
      highlight: "Sustainable",
      description:
        "Products grown with care for the environment and your health.",
      bgFrom: "from-teal-500",
      bgTo: "to-cyan-600",
      buttons: [
        { text: "Browse Organic", variant: "primary" },
        { text: "Our Practices", variant: "secondary" },
      ],
      floatingItems: [
        { name: "milk", label: "Organic Milk" },
        { name: "honey", label: "Raw Honey" },
        { name: "eggs", label: "Free-range Eggs" },
        { name: "vegetables", label: "Fresh Veggies" },
      ],
    },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-advance slides
  useEffect(() => {
    let interval;
    if (isAutoPlaying) {
      interval = setInterval(() => {
        setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isAutoPlaying, slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  return (
    <div className="relative h-screen max-h-[600px] overflow-hidden mb-8 flex justify-center">
      <div
        className="flex transition-transform duration-700 ease-in-out w-full"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`w-full flex-shrink-0 relative bg-gradient-to-r ${slide.bgFrom} ${slide.bgTo} h-full`}
          >
            {/* Decorative elements (consistent across all slides) */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10">
              <div className="absolute top-20 left-10 w-24 h-24 rounded-full bg-white"></div>
              <div className="absolute bottom-10 right-20 w-32 h-32 rounded-full bg-white"></div>
              <div className="absolute top-1/2 left-1/4 w-16 h-16 rounded-full bg-white"></div>
            </div>

            {/* Content (consistent structure) */}
            <div className="container mx-auto h-full flex flex-col justify-center items-center text-center relative z-10 py-12 px-6 md:px-12 lg:px-24">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 md:mb-6 leading-tight">
                {slide.title.split(slide.highlight)[0]}
                <span className="text-yellow-300"> {slide.highlight}</span>
                {slide.title.split(slide.highlight)[1]}
              </h2>
              <p className="text-base md:text-lg lg:text-xl text-white/90 max-w-xl lg:max-w-2xl mx-auto mb-6 md:mb-8">
                {slide.description}
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                {slide.buttons.map((button, i) => (
                  <button
                    key={i}
                    className={`${
                      button.variant === "primary"
                        ? "bg-white text-green-700 hover:bg-gray-100"
                        : "bg-transparent border-2 border-white text-white hover:bg-white/10"
                    } font-semibold py-2 px-6 md:py-3 md:px-8 rounded-full shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center`}
                  >
                    {button.text}
                    <svg
                      className="ml-2 w-4 h-4 md:w-5 md:h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 5l7 7-7 7M5 5l7 7-7 7"
                      ></path>
                    </svg>
                  </button>
                ))}
              </div>
            </div>

            {/* Floating products (consistent styling) */}
            <div className="absolute bottom-6 left-0 w-full flex justify-center items-end">
              <div className="flex space-x-3 md:space-x-6 lg:space-x-8">
                {slide.floatingItems.map((item, i) => (
                  <div key={i} className="flex flex-col items-center group">
                    <div className="w-10 h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 bg-white rounded-full shadow-lg flex items-center justify-center transform hover:-translate-y-2 transition-transform duration-300 mb-1">
                      <img
                        src={`/api/placeholder/48/48`}
                        alt={item.name}
                        className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 object-contain"
                        loading="lazy"
                      />
                    </div>
                    <span className="text-xs font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation controls (consistent across all slides) */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 text-white p-2 rounded-full shadow-lg z-10 transition-all"
        aria-label="Previous slide"
      >
        <FiChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 text-white p-2 rounded-full shadow-lg z-10 transition-all"
        aria-label="Next slide"
      >
        <FiChevronRight className="w-5 h-5 md:w-6 md:h-6" />
      </button>

      {/* Pagination (consistent across all slides) */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-3 rounded-full transition-all ${
              currentSlide === index ? "bg-white w-6" : "bg-white/50 w-3"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
