import { FiSearch, FiX } from "react-icons/fi";

const chats = [
  { label: "Today", items: ["Profile Edit Toggle"] },
  { label: "Yesterday", items: ["Chess AI Bot Creation"] },
  { label: "Previous 7 Days", items: ["Website Announcement Refinement"] },
];

const SearchChat = ({ onClose, isDark }) => {
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center
      ${isDark ? "bg-black/60" : "bg-black/40"} backdrop-blur-sm`}
    >
      <div
        className={`w-170 max-h-[100vh] rounded-xl shadow-xl overflow-hidden
        ${isDark ? "bg-[#2f2f2f] text-white" : "bg-white text-black"}`}
      >
        {/* Search bar */}
        <div
          className={`flex items-center gap-2 px-4 py-3 border-b
          ${isDark ? "border-white/10" : "border-black/10"}`}
        >
          <FiSearch className={isDark ? "text-gray-400" : "text-gray-500"} />

          <input
            type="text"
            placeholder="Search chats..."
            className={`flex-1 bg-transparent outline-none text-sm
            ${isDark ? "placeholder-gray-400" : "placeholder-gray-500"}`}
          />

          <button onClick={onClose}>
            <FiX
              className={`transition
              ${isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-black"}`}
            />
          </button>
        </div>

        {/* Chat list */}
        <div className="overflow-y-auto max-h-[60vh] px-2 py-2">
          <div
            className={`px-3 py-2 rounded-lg cursor-pointer flex items-center gap-2
            ${isDark ? "hover:bg-white/5" : "hover:bg-black/5"}`}
          >
            <span className="text-sm font-medium">New chat</span>
          </div>

          {chats.map((group) => (
            <div key={group.label} className="mt-3">
              <p
                className={`px-3 mb-1 text-xs
                ${isDark ? "text-gray-400" : "text-gray-500"}`}
              >
                {group.label}
              </p>

              {group.items.map((item) => (
                <div
                  key={item}
                  className={`px-3 py-2 rounded-lg cursor-pointer text-sm
                  ${isDark ? "hover:bg-white/5" : "hover:bg-black/5"}`}
                >
                  {item}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchChat;
