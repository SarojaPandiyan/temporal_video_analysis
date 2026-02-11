import { FiSearch, FiX } from "react-icons/fi";

const chats = [
  { label: "Today", items: ["Default - Today"] },
  { label: "Yesterday", items: ["Default - yesterday"] },
  { label: "Previous 7 Days", items: ["Default - Previous 7 Days"] },
];

useEffect(() => {
  const fetchHistory = async () => {
    setLoading(true);
    setFetchError(null);

    try {
      const token = getAccessToken();
      if (!token) {
        setFetchError("Not logged in");
        return;
      }

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/chat/fetch-history`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json", // optional but good practice
          },
        },
      );
      if (!res.ok) {
        throw new Error("Failed to load chat history");
      }

      const data = await res.json();
      // console.log("Fetched chat sessions:", data.chat_sessions);
      setChatSessions(data.chat_sessions || []);
    } catch (err) {
      console.error("Chat history fetch error:", err);
      setFetchError("Couldn't load chats");
    } finally {
      setLoading(false);
    }
  };

  fetchHistory();
}, []);

// Group sessions by recency
const groupSessions = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const groups = {
    today: [],
    yesterday: [],
    previous7days: [],
    older: [],
  };

  chatSessions.forEach((session) => {
    const updated = new Date(session.updated_at);
    updated.setHours(0, 0, 0, 0);

    if (updated.getTime() === today.getTime()) {
      groups.today.push(session);
    } else if (updated.getTime() === yesterday.getTime()) {
      groups.yesterday.push(session);
    } else if (updated >= weekAgo) {
      groups.previous7days.push(session);
    } else {
      groups.older.push(session);
    }
  });
  // console.log(groups);
  return groups;
};

const groups = groupSessions();

const SearchChat = ({ onClose, isDark }) => {
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center
      ${isDark ? "bg-black/60" : "bg-black/40"} backdrop-blur-sm`}
    >
      <div
        className={`w-170 max-h-screen rounded-xl shadow-xl overflow-hidden
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
