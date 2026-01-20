import { useState } from "react";
import { FiSidebar, FiSettings } from "react-icons/fi";
import { RiEdit2Line } from "react-icons/ri";
import { FaSearch } from "react-icons/fa";

const SidePanel = ({ isDark, searchVisible }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const bg = isDark ? "bg-neutral-950" : "bg-white";
  const text = isDark ? "text-neutral-200" : "text-neutral-800";
  const border = isDark ? "border-neutral-800" : "border-neutral-200";
  const hover = isDark ? "hover:bg-neutral-900/60" : "hover:bg-neutral-100";

  return (
    <div
      className={`
        h-screen flex flex-col
        transition-all duration-300 ease-in-out
        ${isExpanded ? "w-64" : "w-16"}
        ${bg} ${text} ${border} border-r
      `}
    >
      <div className="flex-1 flex flex-col pt-4">
        {/* Toggle */}
        <div
          className={`flex items-center gap-3 px-4 py-3 cursor-pointer ${hover} transition-colors`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <FiSidebar className="shrink-0" />
          {isExpanded && <span className="text-sm font-semibold">Menu</span>}
        </div>

        {/* Menu items */}
        <div className="mt-6 flex flex-col gap-1">
          <div
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg cursor-pointer ${hover} transition-colors`}
            onClick={searchVisible}
          >
            <FaSearch className="shrink-0" />
            {isExpanded && <span className="text-sm font-medium">Search</span>}
          </div>

          <div
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg cursor-pointer ${hover} transition-colors`}
          >
            <RiEdit2Line className="shrink-0" />
            {isExpanded && (
              <span className="text-sm font-medium">New Chat</span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="px-3 pb-6">
        <div
          className={`flex items-center gap-3 px-4 py-2.5 rounded-lg cursor-pointer ${hover} transition-colors`}
        >
          <FiSettings className="shrink-0" />
          {isExpanded && <span className="text-sm font-medium">Settings</span>}
        </div>
      </div>
    </div>
  );
};

export default SidePanel;
