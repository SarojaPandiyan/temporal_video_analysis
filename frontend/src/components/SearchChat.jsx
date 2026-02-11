import { FiSearch, FiX } from "react-icons/fi";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const SearchChat = ({ onClose, isDark }) => {
  const [chatSessions, setChatSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const { getAccessToken } = useAuth();
  const [searchKey, setSearchKey] = useState("");
  const navigate = useNavigate();

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
              "Content-Type": "application/json",
            },
          },
        );

        if (!res.ok) throw new Error("Failed to load chat history");

        const data = await res.json();
        setChatSessions(data.chat_sessions || []);
      } catch (err) {
        console.error("Chat history fetch error:", err);
        setFetchError("Couldn't load chats");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [getAccessToken]);

  // Combined logic: Filter first, then Group
  const getDisplayChats = () => {
    // 1. Filter the raw sessions based on the search key
    const filtered = chatSessions.filter((session) => {
      const title = session.title || "Untitled chat";
      return title.toLowerCase().includes(searchKey.toLowerCase());
    });

    // 2. Setup date boundaries
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const groups = {
      Today: [],
      Yesterday: [],
      "Previous 7 Days": [],
      Older: [],
    };

    // 3. Group the filtered results
    filtered.forEach((session) => {
      const updated = new Date(session.updated_at);
      updated.setHours(0, 0, 0, 0);

      if (updated.getTime() === today.getTime()) {
        groups.Today.push(session);
      } else if (updated.getTime() === yesterday.getTime()) {
        groups.Yesterday.push(session);
      } else if (updated >= weekAgo) {
        groups["Previous 7 Days"].push(session);
      } else {
        groups.Older.push(session);
      }
    });

    return Object.entries(groups)
      .map(([label, items]) => ({ label, items }))
      .filter((g) => g.items.length > 0);
  };

  const chats = getDisplayChats();

  const handleChatClick = (session) => {
    navigate(`/chat/${session.session_id}`);
    onClose(); // Close modal on navigation
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center
      ${isDark ? "bg-black/60" : "bg-black/40"} backdrop-blur-sm`}
      onClick={onClose} // Close if clicking outside the modal
    >
      <div
        className={`w-full max-w-2xl mx-4 max-h-[80vh] rounded-xl shadow-xl overflow-hidden
        ${isDark ? "bg-[#2f2f2f] text-white" : "bg-white text-black"}`}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        {/* Search bar */}
        <div
          className={`flex items-center gap-2 px-4 py-3 border-b
          ${isDark ? "border-white/10" : "border-black/10"}`}
        >
          <FiSearch className={isDark ? "text-gray-400" : "text-gray-500"} />

          <input
            autoFocus
            type="text"
            placeholder="Search chats..."
            value={searchKey}
            onChange={(e) => setSearchKey(e.target.value)}
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
          {/* Default New Chat Action */}
          <div
            className={`px-3 py-2 rounded-lg cursor-pointer flex items-center gap-2
            ${isDark ? "hover:bg-white/5" : "hover:bg-black/5"}`}
            onClick={() => {
              navigate("/chat");
              onClose();
            }}
          >
            <span className="text-sm font-medium">New chat</span>
          </div>

          {loading ? (
            <p className="p-4 text-center text-sm text-gray-400">Loading history...</p>
          ) : fetchError ? (
            <p className="p-4 text-center text-sm text-red-400">{fetchError}</p>
          ) : chats.length === 0 ? (
            <p className="p-4 text-center text-sm text-gray-500">No chats found</p>
          ) : (
            chats.map((group) => (
              <div key={group.label} className="mt-3">
                <p
                  className={`px-3 mb-1 text-xs font-semibold
                  ${isDark ? "text-gray-400" : "text-gray-500"}`}
                >
                  {group.label}
                </p>

                {group.items.map((item) => (
                  <div
                    key={item.session_id}
                    className={`px-3 py-2 rounded-lg cursor-pointer text-sm
                    ${isDark ? "hover:bg-white/5" : "hover:bg-black/5"}`}
                    onClick={() => handleChatClick(item)}
                  >
                    {item.title || "Untitled chat"}
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchChat;