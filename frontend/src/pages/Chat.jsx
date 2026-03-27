import { FaSearch } from "react-icons/fa";
import { FiSend } from "react-icons/fi";
import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import SidePanel from "../components/Sidepanel";
import EditProfile from "../components/EditProfile";
import SearchChat from "../components/SearchChat";

const Chat = ({ theme }) => {
  const [profileVisible, setProfileVisible] = useState(false);
  const [isDark, setIsDark] = useState(!theme);
  const [searchVisible, setSearchVisible] = useState(false);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  let chatID = useParams().id;

  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const cameraRef = useRef(null);           // ← New: Camera follower
  const mousePosition = useRef({ x: 0, y: 0 });

  const { getAccessToken } = useAuth();
  const navigate = useNavigate();

  const themeBg = isDark ? "bg-black text-white" : "bg-white text-black";

  // 3D tilt for main chat area
  const [tiltStyle, setTiltStyle] = useState({
    transform: "perspective(1400px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const ThinkingDots = () => (
    <span className="inline-flex gap-1 items-center">
      <span className="w-2 h-2 bg-current rounded-full animate-bounce" />
      <span className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:150ms]" />
      <span className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:300ms]" />
    </span>
  );

  // Mouse follower for Camera Icon
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!cameraRef.current || messages.length > 0) return;

      const rect = chatContainerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = (e.clientX - centerX) * 0.08;   // sensitivity
      const deltaY = (e.clientY - centerY) * 0.08;

      mousePosition.current = { x: deltaX, y: deltaY };

      if (cameraRef.current) {
        cameraRef.current.style.transform = `
          translate(${deltaX}px, ${deltaY}px) 
          scale(1.05)
        `;
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [messages.length]);

  // Reset camera position when messages appear
  useEffect(() => {
    if (messages.length > 0 && cameraRef.current) {
      cameraRef.current.style.transform = "translate(0px, 0px) scale(1)";
    }
  }, [messages.length]);

  // // Existing 3D tilt for chat panel
  // useEffect(() => {
  //   const container = chatContainerRef.current;
  //   if (!container) return;

  //   const handleMouseMoveTilt = (e) => {
  //     const rect = container.getBoundingClientRect();
  //     const x = (e.clientX - rect.left) / rect.width - 0.5;
  //     const y = (e.clientY - rect.top) / rect.height - 0.5;

  //     const rotateY = x * 18;
  //     const rotateX = -y * 18;

  //     setTiltStyle({
  //       transform: `perspective(1400px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
  //     });
  //   };

  //   const handleMouseLeave = () => {
  //     setTiltStyle({
  //       transform: "perspective(1400px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
  //     });
  //   };

  //   container.addEventListener("mousemove", handleMouseMoveTilt);
  //   container.addEventListener("mouseleave", handleMouseLeave);

  //   return () => {
  //     container.removeEventListener("mousemove", handleMouseMoveTilt);
  //     container.removeEventListener("mouseleave", handleMouseLeave);
  //   };
  // }, []);
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/chat/messages/${chatID}`,
          {
            headers: {
              Authorization: `Bearer ${getAccessToken()}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (!res.ok) throw new Error("Failed to load messages");

        const data = await res.json();
        setMessages(data.messages || []);
      } catch (err) {
        console.error("Message fetch error:", err);
        navigate("/not-found");
      }
    };

    if (chatID) fetchMessages();
  }, [chatID]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!query.trim()) return;

    const userMsg = {
      id: crypto.randomUUID(),
      session_id: chatID,
      role: "user",
      content: query.trim(),
      timestamp: new Date().toISOString(),
      metadata: {
        model_name: "gemini-2.5-flash",
        token_count: 0,
        finish_reason: null,
        sources: [],
      },
      is_streaming: true,
      is_error: false,
    };

    const thinkingMsg = {
      id: "thinking",
      role: "assistant",
      content: "Thinking...",
      is_streaming: true,
      is_error: false,
    };

    setMessages((prev) => [...prev, userMsg, thinkingMsg]);
    setQuery("");

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/chat/message`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: userMsg.content,
          session_id: chatID,
        }),
      });

      if (!res.ok) throw new Error(res.statusText);

      const resData = await res.json();
      if (resData.session_id && resData.session_id !== chatID) {
        chatID = resData.session_id;
        navigate(`/chat/${chatID}`);
      }

      const assistantMsg = resData;

      setMessages((prev) =>
        prev
          .map((m) => (m.id === userMsg.id ? { ...m, is_streaming: false } : m))
          .filter((m) => m.id !== "thinking")
          .concat(assistantMsg)
      );
    } catch (err) {
      console.error("Send error:", err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === userMsg.id
            ? { ...m, is_streaming: false, is_error: true }
            : m
        )
      );
    }
  };

  return !profileVisible ? (
    <div className={`h-screen grid grid-cols-[auto_1fr] ${themeBg} overflow-hidden`}>
      <SidePanel isDark={isDark} searchVisible={() => setSearchVisible(true)} />

      {searchVisible && (
        <SearchChat isDark={isDark} onClose={() => setSearchVisible(false)} />
      )}

      <div className="flex flex-col h-screen relative">
        <Navbar
          onProfileClick={() => setProfileVisible(true)}
          onThemeToggle={() => setIsDark(!isDark)}
          isDark={isDark}
        />

        <div
          ref={chatContainerRef}
          style={tiltStyle}
          className="flex-1 flex flex-col min-h-0 relative transition-transform duration-75 ease-out overflow-hidden"
        >
          {/* Dynamic Background Orbs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <div className={`absolute inset-0 opacity-5 ${isDark ? "bg-[radial-gradient(#666_1px,transparent_0)]" : "bg-[radial-gradient(#ccc_1px,transparent_0)]"}`} style={{ backgroundSize: "50px 50px" }} />
            <div className={`absolute top-12 left-12 w-72 h-72 rounded-full blur-3xl opacity-10 ${isDark ? "bg-emerald-400" : "bg-emerald-500"} animate-float-orb`} />
            <div className={`absolute bottom-20 right-20 w-96 h-96 rounded-full blur-3xl opacity-10 ${isDark ? "bg-blue-400" : "bg-blue-500"} animate-float-orb`} style={{ animationDelay: "2.3s" }} />
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-6 pt-8 pb-6 relative z-10 custom-scroll">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center relative">
                {/* Floating Camera Icon that follows mouse */}
                <div 
                  ref={cameraRef}
                  className="relative mb-10 transition-transform duration-200 ease-out"
                >
                    <svg
                      className={`w-28 h-28 ${isDark ? "text-emerald-400" : "text-emerald-600"} drop-shadow-2xl transition-transform`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276L20 10V18H4V6L8.553 3.724 12 6 15.447 3.724 20 6" />
                      <circle cx="12" cy="13" r="3.5" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 20h18" />
                    </svg>
                </div>

                <div className="text-4xl font-semibold tracking-tighter mb-3 animate-fade-in">
                  What&apos;s on your camera today?
                </div>
                <p className={`max-w-md text-base ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  Ask InsightSphere to analyze events, objects, or timestamps from your recordings
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-6 max-w-5xl mx-auto">
                {messages.map((msg, index) => {
                  const isUser = msg.role === "user";
                  return (
                    <div
                      key={msg.id || index}
                      className={`flex ${isUser ? "justify-end" : "justify-start"} animate-message-in`}
                      style={{ animationDelay: `${index * 40}ms` }}
                    >
                      <div
                        className={`
                          px-6 py-4 rounded-3xl max-w-[85%] md:max-w-2xl
                          shadow-[0_8px_30px_-10px_rgb(0,0,0,0.3)]
                          transition-all duration-300 hover:shadow-2xl
                          ${isUser
                            ? isDark ? "bg-emerald-500 text-black" : "bg-emerald-600 text-white"
                            : isDark
                              ? "bg-neutral-800/95 text-white backdrop-blur-md border border-neutral-700"
                              : "bg-white/95 text-black backdrop-blur-md border border-gray-200"
                          }
                        `}
                      >
                        {msg.is_streaming ? <ThinkingDots /> : <div className="leading-relaxed">{msg.content}</div>}
                        {msg.timestamp && (
                          <div className={`text-[10px] mt-3 opacity-75 text-right tracking-widest ${isUser ? (isDark ? "text-black" : "text-white") : isDark ? "text-neutral-400" : "text-gray-500"}`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="sticky bottom-0 px-6 pb-8 pt-4 bg-inherit z-20 border-t border-transparent">
            <div className="max-w-5xl mx-auto relative">
              {query.trim() ? (
                <FiSend
                  className={`absolute right-6 bottom-4 text-3xl cursor-pointer transition-all duration-200 active:scale-90 ${isDark ? "text-emerald-400 hover:text-emerald-300" : "text-emerald-600 hover:text-emerald-500"}`}
                  onClick={handleSend}
                />
              ) : (
                <FaSearch className="absolute right-6 top-1/2 -translate-y-1/2 text-2xl pointer-events-none opacity-40" />
              )}

              <textarea
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  e.target.style.height = "auto";
                  const maxH = 160;
                  if (e.target.scrollHeight > maxH) {
                    e.target.style.height = `${maxH}px`;
                    e.target.style.overflowY = "auto";
                  } else {
                    e.target.style.height = `${e.target.scrollHeight}px`;
                    e.target.style.overflowY = "hidden";
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Query your video recordings... (events, objects, timestamps)"
                rows={1}
                className={`
                  w-full resize-none px-7 py-5 pr-16 rounded-3xl border
                  transition-all duration-300 focus:scale-[1.02] focus:shadow-2xl
                  ${isDark
                    ? "bg-neutral-900/80 border-neutral-700 text-white placeholder:text-neutral-400 backdrop-blur-xl"
                    : "bg-white/90 border-gray-200 text-black placeholder:text-gray-400 backdrop-blur-xl"
                  }
                  focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20
                  text-base shadow-inner
                `}
              />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float-orb {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-45px) scale(1.12); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.08); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes message-in {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .animate-float-orb { animation: float-orb 18s ease-in-out infinite; }
        .animate-pulse-slow { animation: pulse-slow 9s ease-in-out infinite; }
        .animate-fade-in { animation: fade-in 0.6s ease-out; }
        .animate-message-in { animation: message-in 420ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }

        .custom-scroll::-webkit-scrollbar { width: 6px; }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: ${isDark ? "#10b981" : "#10b981"};
          border-radius: 20px;
          box-shadow: 0 0 12px rgba(16, 185, 129, 0.4);
        }
      `}</style>
    </div>
  ) : (
    <EditProfile onCancel={() => setProfileVisible(false)} isDark={isDark} />
  );
};

export default Chat;