import { useState, useEffect, useContext } from "react";
import { FiSidebar, FiSettings } from "react-icons/fi";
import { RiEdit2Line } from "react-icons/ri";
import { FaSearch } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

const SidePanel = ({ isDark, searchVisible }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [chatSessions, setChatSessions] = useState([]);
  const [loading, setLoading] = useState(true);     // ← NEW: loading state
  const [fetchError, setFetchError] = useState(null); // ← optional: error state
  const {getAccessToken} = useAuth()

  const bg = isDark ? "bg-neutral-950" : "bg-white";
  const text = isDark ? "text-neutral-200" : "text-neutral-800";
  const border = isDark ? "border-neutral-800" : "border-neutral-200";
  const hover = isDark ? "hover:bg-neutral-900/60" : "hover:bg-neutral-100";

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

        const res = await fetch(`${import.meta.env.VITE_API_URL}/chat/fetch-history`, {
              method: "POST",                      // ← THIS WAS MISSING
              headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json", // optional but good practice
              },
            });
        if (!res.ok) {
          throw new Error("Failed to load chat history");
        }

        const data = await res.json();
        console.log("Fetched chat sessions:", data.chat_sessions);
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
    console.log(chatSessions)
    return groups;
  };

  const groups = groupSessions();

  return (
    <div
      className={`
        h-screen flex flex-col
        transition-all duration-300 ease-in-out
        ${isExpanded ? "w-64" : "w-16"}
        ${bg} ${text} ${border} border-r overflow-hidden
      `}
    >
      <div className="flex-1 flex flex-col pt-4 overflow-hidden">
        {/* Toggle */}
        <div
          className={`flex items-center gap-3 px-4 py-3 cursor-pointer ${hover} transition-colors`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <FiSidebar className="shrink-0" />
          {isExpanded && <span className="text-sm font-semibold">Menu</span>}
        </div>

        {/* Search & New Chat */}
        {isExpanded && (
          <div className="mt-4 px-3 flex flex-col gap-2">
            <div
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg cursor-pointer ${hover}`}
              onClick={searchVisible}
            >
              <FaSearch className="shrink-0" />
              <span className="text-sm font-medium">Search</span>
            </div>

            <div
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg cursor-pointer ${hover}`}
            >
              <RiEdit2Line className="shrink-0" />
              <span className="text-sm font-medium">New Chat</span>
            </div>
          </div>
        )}

        {/* Chat History Section */}
        {isExpanded && (
          <div className="mt-6 flex-1 overflow-y-auto px-2">
            <h3 className="px-3 mb-2 text-xs font-semibold opacity-70">Chats</h3>

            {/* Loading State */}
            {loading && (
              <div className="px-4 py-6 text-center text-sm opacity-70 flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                <span>Loading chats...</span>
              </div>
            )}

            {/* Error State */}
            {!loading && fetchError && (
              <div className="px-4 py-6 text-center text-sm text-red-400">
                {fetchError}
              </div>
            )}

            {/* No chats */}
            {!loading && !fetchError && chatSessions.length === 0 && (
              <div className="px-4 py-6 text-center text-sm opacity-70">
                No chats yet.<br />Start a new conversation!
              </div>
            )}

            {/* Grouped Chats */}
            {!loading && !fetchError && chatSessions.length > 0 && (
              <>
                {/* Today */}
                {groups.today.length > 0 && (
                  <div>
                    <p className="px-3 mb-1 text-xs opacity-60">Today</p>
                    {groups.today.map((session) => (
                      <div
                        key={session.session_id}
                        className={`px-3 py-2.5 rounded-lg cursor-pointer text-sm ${hover} transition-colors`}
                      >
                        {session.title || "Untitled Chat"}
                      </div>
                    ))}
                  </div>
                )}

                {/* Yesterday */}
                {groups.yesterday.length > 0 && (
                  <div className="mt-4">
                    <p className="px-3 mb-1 text-xs opacity-60">Yesterday</p>
                    {groups.yesterday.map((session) => (
                      <div
                        key={session.session_id}
                        className={`px-3 py-2.5 rounded-lg cursor-pointer text-sm ${hover} transition-colors`}
                      >
                        {session.title || "Untitled Chat"}
                      </div>
                    ))}
                  </div>
                )}

                {/* Previous 7 Days */}
                {groups.previous7days.length > 0 && (
                  <div className="mt-4">
                    <p className="px-3 mb-1 text-xs opacity-60">Previous 7 days</p>
                    {groups.previous7days.map((session) => (
                      <div
                        key={session.session_id}
                        className={`px-3 py-2.5 rounded-lg cursor-pointer text-sm ${hover} transition-colors`}
                      >
                        {session.title || "Untitled Chat"}
                      </div>
                    ))}
                  </div>
                )}

                {/* Older */}
                {groups.older.length > 0 && (
                  <div className="mt-4">
                    <p className="px-3 mb-1 text-xs opacity-60">Older</p>
                    {groups.older.map((session) => (
                      <div
                        key={session.session_id}
                        className={`px-3 py-2.5 rounded-lg cursor-pointer text-sm ${hover} transition-colors`}
                      >
                        {session.title || "Untitled Chat"}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Bottom Settings */}
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