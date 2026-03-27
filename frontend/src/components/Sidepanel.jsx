import { useState, useEffect, useRef } from "react";
import { FiSidebar, FiSettings } from "react-icons/fi";
import { RiEdit2Line } from "react-icons/ri";
import { FaSearch } from "react-icons/fa";
import { FiTrash2 } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const SidePanel = ({ isDark, searchVisible }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [chatSessions, setChatSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [deletingId, setDeletingId] = useState(null); // For delete animation
  const [newSessionId, setNewSessionId] = useState(null); // For new entry bounce

  const { getAccessToken } = useAuth();
  const navigate = useNavigate();
  const panelRef = useRef(null);

  // 3D tilt state
  const [tiltStyle, setTiltStyle] = useState({
    transform: "perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
  });

  const bg = isDark ? "bg-neutral-950" : "bg-white";
  const text = isDark ? "text-neutral-200" : "text-neutral-800";
  const border = isDark ? "border-neutral-800" : "border-neutral-200";
  const hover = isDark ? "hover:bg-neutral-900/70" : "hover:bg-neutral-100";

  // 3D mouse tilt effect
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const handleMouseMove = (e) => {
      const rect = panel.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      
      const rotateY = x * 12;
      
      setTiltStyle({
        transform: `perspective(1200px) rotateX(${rotateX}deg) scale3d(1.015, 1.015, 1.015)`,
      });
    };

    const handleMouseLeave = () => {
      setTiltStyle({
        transform: "perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
      });
    };

    panel.addEventListener("mousemove", handleMouseMove);
    panel.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      panel.removeEventListener("mousemove", handleMouseMove);
      panel.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

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
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) throw new Error("Failed to load chat history");

        const data = await res.json();
        const newSessions = data.chat_sessions || [];

        // Detect new sessions for bounce animation
        if (newSessions.length > chatSessions.length) {
          const latestSession = newSessions[0];
          if (latestSession) setNewSessionId(latestSession.session_id);
          setTimeout(() => setNewSessionId(null), 1200);
        }

        setChatSessions(newSessions);
      } catch (err) {
        console.error("Chat history fetch error:", err);
        setFetchError("Couldn't load chats");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [isExpanded, getAccessToken]);

  const groupSessions = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const groups = { today: [], yesterday: [], previous7days: [], older: [] };

    chatSessions.forEach((session) => {
      const updated = new Date(session.updated_at);
      updated.setHours(0, 0, 0, 0);

      if (updated.getTime() === today.getTime()) groups.today.push(session);
      else if (updated.getTime() === yesterday.getTime()) groups.yesterday.push(session);
      else if (updated >= weekAgo) groups.previous7days.push(session);
      else groups.older.push(session);
    });

    return groups;
  };

  const groups = groupSessions();

  const handleChatClick = (session) => {
    navigate(`/chat/${session.session_id}`);
  };

  const deleteSession = async (sessionId) => {
    if (!window.confirm("Are you sure you want to delete this chat?")) return;

    setDeletingId(sessionId);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/chat/delete-messages/${sessionId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${getAccessToken()}`,
          },
        }
      );

      if (!res.ok) throw new Error("Failed to delete");

      // Remove with delay to allow animation
      setTimeout(() => {
        setChatSessions((prev) => prev.filter((s) => s.session_id !== sessionId));
        setDeletingId(null);

        if (window.location.pathname === `/chat/${sessionId}`) {
          navigate("/chat");
        }
      }, 400);
    } catch (err) {
      console.error("Delete error:", err);
      alert("Couldn't delete chat session");
      setDeletingId(null);
    }
  };

  return (
    <div
      ref={panelRef}
      style={tiltStyle}
      className={`
        h-screen flex flex-col transition-all duration-300 ease-out
        ${isExpanded ? "w-72" : "w-16"}
        ${bg} ${text} ${border} border-r overflow-hidden relative
        shadow-2xl
      `}
    >
      <div className="flex-1 flex flex-col pt-4 overflow-hidden">
        {/* Toggle Button */}
        <div
          className={`flex items-center gap-3 px-4 py-3 cursor-pointer ${hover} transition-all active:scale-95 rounded-xl mx-2`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <FiSidebar className="shrink-0 text-xl" />
          {isExpanded && <span className="text-sm font-semibold tracking-tight">InsightSphere</span>}
        </div>

        {/* Search & New Chat */}
        {isExpanded && (
          <div className="mt-6 px-3 flex flex-col gap-1.5">
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer ${hover} transition-all active:scale-[0.97]`}
              onClick={searchVisible}
            >
              <FaSearch className="shrink-0" />
              <span className="text-sm font-medium">Search Chats</span>
            </div>

            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer ${hover} transition-all active:scale-[0.97]`}
              onClick={() => navigate("/chat")}
            >
              <RiEdit2Line className="shrink-0" />
              <span className="text-sm font-medium">New Analysis</span>
            </div>
          </div>
        )}

        {/* Chat History */}
        {isExpanded && (
          <div className="mt-8 flex-1 overflow-y-auto px-3 custom-scroll">
            <h3 className="px-4 mb-3 text-lg font-semibold tracking-tight opacity-80">Recent Analyses</h3>

            {loading && (
              <div className="px-4 py-8 text-center opacity-70 flex flex-col items-center gap-3">
                <div className="animate-spin h-6 w-6 border-2 border-current border-t-transparent rounded-full" />
                <span className="text-sm">Loading history...</span>
              </div>
            )}

            {!loading && fetchError && (
              <div className="px-4 py-8 text-center text-red-400 text-sm">{fetchError}</div>
            )}

            {!loading && !fetchError && chatSessions.length === 0 && (
              <div className="px-4 py-12 text-center opacity-60 text-sm">
                No analyses yet.<br />Start a new conversation.
              </div>
            )}

            {!loading && !fetchError && chatSessions.length > 0 && (
              <>
                {["today", "yesterday", "previous7days", "older"].map((groupKey) => {
                  const group = groups[groupKey];
                  if (group.length === 0) return null;

                  const labels = {
                    today: "Today",
                    yesterday: "Yesterday",
                    previous7days: "Previous 7 days",
                    older: "Older",
                  };

                  return (
                    <div key={groupKey} className="mb-6">
                      <p className="px-4 mb-2 text-xs opacity-60 font-medium tracking-widest">
                        {labels[groupKey]}
                      </p>
                      {group.map((session) => {
                        const isDeleting = deletingId === session.session_id;
                        const isNew = newSessionId === session.session_id;

                        return (
                          <div
                            key={session.session_id}
                            onClick={() => !isDeleting && handleChatClick(session)}
                            className={`
                              group relative flex items-center justify-between
                              px-4 py-3.5 mb-1 rounded-2xl cursor-pointer text-sm
                              ${hover} transition-all duration-200
                              ${isDeleting ? "opacity-40 pointer-events-none" : ""}
                              ${isNew ? "animate-bounce-in" : ""}
                            `}
                          >
                            <span className="truncate pr-8 font-medium">
                              {session.title || "Untitled Analysis"}
                            </span>

                            {/* Delete Button with Bubble Burst Animation */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteSession(session.session_id);
                              }}
                              className="absolute right-3 opacity-0 group-hover:opacity-100 transition-all p-1.5 hover:bg-red-500/10 rounded-lg"
                            >
                              <FiTrash2 className="text-red-500 hover:text-red-600 transition-colors" />
                            </button>

                            {/* Bubble Burst Effect */}
                            {isDeleting && (
                              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                                {[...Array(8)].map((_, i) => (
                                  <div
                                    key={i}
                                    className="absolute w-2 h-2 bg-red-500 rounded-full animate-bubble-burst"
                                    style={{
                                      left: `${30 + Math.random() * 40}%`,
                                      top: `${30 + Math.random() * 40}%`,
                                      animationDelay: `${i * 40}ms`,
                                    }}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>

      {/* Bottom Settings */}
      <div className="px-3 pb-6">
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer ${hover} transition-all active:scale-[0.97]`}
        >
          <FiSettings className="shrink-0" />
          {isExpanded && <span className="text-sm font-medium">Settings</span>}
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes bounce-in {
          0% { opacity: 0; transform: scale(0.6) translateY(20px); }
          60% { transform: scale(1.15) translateY(-8px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }

        @keyframes bubble-burst {
          0% {
            transform: scale(0.2) translate(0, 0);
            opacity: 0.9;
          }
          40% {
            transform: scale(1.6);
          }
          100% {
            transform: scale(0) translate(var(--x), var(--y));
            opacity: 0;
          }
        }

        .animate-bounce-in {
          animation: bounce-in 620ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .animate-bubble-burst {
          animation: bubble-burst 420ms ease-out forwards;
        }

        .custom-scroll::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: ${isDark ? "#4b5563" : "#d1d5db"};
          border-radius: 20px;
        }
      `}</style>
    </div>
  );
};

export default SidePanel;