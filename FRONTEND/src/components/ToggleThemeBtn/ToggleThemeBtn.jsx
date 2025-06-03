import { Moon, Sun } from "lucide-react";
import { useContext } from "react";
import { AuthContext } from "../../Context/Context";

const ThemeToggle = () => {
  const { isDark, toggleDarkMode } = useContext(AuthContext);

  return (
    <button
      onClick={toggleDarkMode}
      className="relative w-14 h-8 rounded-full p-1 bg-gray-200 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all duration-300"
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      {/* Track */}
      <div className="absolute inset-0 rounded-full overflow-hidden">
        <div
          className={`absolute inset-0 bg-gradient-to-r from-yellow-200 to-orange-300 transition-opacity duration-300 ${
            isDark ? "opacity-0" : "opacity-100"
          }`}
        />
        <div
          className={`absolute inset-0 bg-gradient-to-r from-blue-800 to-purple-900 transition-opacity duration-300 ${
            isDark ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>

      {/* Thumb */}
      <div
        className={`relative w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center transform transition-transform duration-300 ${
          isDark ? "translate-x-6" : "translate-x-0"
        }`}
      >
        {isDark ? (
          <Moon className="w-4 h-4 text-blue-900" />
        ) : (
          <Sun className="w-4 h-4 text-orange-400" />
        )}
      </div>
    </button>
  );
};

export default ThemeToggle;
