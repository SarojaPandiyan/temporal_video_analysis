import { FaUser, FaMoon, FaSun } from "react-icons/fa";

const Navbar = ({ onProfileClick, onThemeToggle, isDark }) => {
  return (
    <header
      className={`
        flex items-center justify-between
        px-6 py-3.5
        border-b
        transition-colors duration-200
        ${
          isDark
            ? "bg-neutral-950 border-neutral-800 text-white"
            : "bg-white border-neutral-200 text-neutral-900 shadow-sm"
        }
      `}
    >
      {/* Logo / Brand */}
      <div className="flex items-center gap-2">
        <span className="font-semibold text-xl tracking-tight">
          InsightSphere
        </span>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-6">
        {/* Profile */}
        <button
          type="button"
          onClick={onProfileClick}
          className={`
            p-1.5 rounded-full
            transition-colors
            ${
              isDark
                ? "hover:bg-neutral-800 text-neutral-300"
                : "hover:bg-neutral-100 text-neutral-700"
            }
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500
          `}
          aria-label="Open profile"
        >
          <FaUser className="text-xl" />
        </button>

        {/* Theme toggle */}
        <button
          type="button"
          onClick={onThemeToggle}
          className={`
            p-1.5 rounded-full
            transition-all duration-200
            ${
              isDark
                ? "hover:bg-neutral-800 hover:text-yellow-300 text-neutral-300"
                : "hover:bg-neutral-100 hover:text-gray-600 text-neutral-700"
            }
            focus:outline-none hover:ring-2 focus:ring-offset-2 hover:ring-gray-500
          `}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? (
            <FaSun className="text-xl" />
          ) : (
            <FaMoon className="text-xl" />
          )}
        </button>
      </div>
    </header>
  );
};

export default Navbar;
