import { FaUser, FaMoon, FaSun } from "react-icons/fa";

const Navbar = ({ onProfileClick, onThemeToggle, isDark }) => {
  return (
    <div
      className={`flex justify-between px-6 py-4 
      ${isDark ? "bg-black text-white" : "bg-white text-black shadow-md"}`}
    >
      <div className="font-semibold text-xl">InsightSphere</div>

      <div className="flex gap-5 items-center">
        <FaUser className="text-xl cursor-pointer" onClick={onProfileClick} />

        {isDark ? (
          <FaSun
            className="text-xl cursor-pointer hover:text-yellow-300"
            onClick={onThemeToggle}
          />
        ) : (
          <FaMoon
            className="text-xl cursor-pointer hover:text-gray-500"
            onClick={onThemeToggle}
          />
        )}
      </div>
    </div>
  );
};

export default Navbar;
