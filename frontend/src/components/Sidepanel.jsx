import { useState } from "react";
import { FiSidebar, FiSettings } from "react-icons/fi";
import { RiEdit2Line } from "react-icons/ri";
import { FaSearch } from "react-icons/fa";

const SidePanel = ({ isDark, searchVisible }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <div
      className={`
        h-screen flex flex-col justify-between
        transition-[width] duration-500 ease-in
        ${isExpanded ? "w-52" : "w-10"}
        ${isDark ? "bg-black  text-white" : "bg-white text-black"}
        border-gray-300 border-r
      `}
    >
      {/* Top Section */}
      <div className="flex flex-col gap-y-6 py-6">
        {/* Toggle Button */}
        <div
          className="flex items-center gap-3 px-2 cursor-pointer "
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <FiSidebar className="text-xl" />
          {isExpanded && <span className="text-sm font-semibold">Menu</span>}
        </div>

        {/* Menu Items */}
        <div className="flex flex-col gap-4 px-2">
          <div className="flex items-center gap-3 cursor-pointer" onClick={searchVisible}>
            <FaSearch className="text-xl"/>
            {isExpanded && <span className="text-sm font-medium">Search</span>}
          </div>

          <div className="flex items-center gap-3 cursor-pointer">
            <RiEdit2Line className="text-xl" />
            {isExpanded && <span className="text-sm font-medium">New Chat</span>}
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="px-2 py-6">
        <div className="flex items-center gap-3 cursor-pointer transition-[width] duration-500 ease-in">
          <FiSettings className="text-xl" />
          {isExpanded && <span className="text-sm font-medium text-wrap">Settings</span>}
        </div>
      </div>
    </div>
  );
};

export default SidePanel;
