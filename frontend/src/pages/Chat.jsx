import { FaSearch } from "react-icons/fa";
import { FiSend } from "react-icons/fi";
import { useState, useRef, useEffect } from "react";
import { useParams } from 'react-router-dom';
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
  let chatID = useParams().id; // Get chat ID from URL params
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const {getAccessToken} = useAuth();
  const navigate = useNavigate();

  const themeBg = isDark ? "bg-black text-white" : "bg-white text-black";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const ThinkingDots = () => (
    <span className="inline-flex gap-1 items-center">
      <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" />
      <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce delay-150" />
      <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce delay-300" />
    </span>
  );

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
          }
        );

        if (!res.ok) throw new Error("Failed to load messages");

        const data = await res.json();
        setMessages(data.messages || []);
      } catch (err) {
        console.error("Message fetch error:", err);
        navigate('/not-found')
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

    // Optimistic UI update
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
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/chat/message`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getAccessToken()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: userMsg.content,
            session_id: chatID,
          }),
        }
      );

      if (!res.ok){
        throw new Error(res.statusText);
      } 
      // Update chatID if it was a new session
      const resData = await res.json();
      if (resData.session_id && resData.session_id !== chatID) {
        chatID = resData.session_id;
        navigate(`/chat/${chatID}`); // Navigate to the chat page if not already there
      }
      const assistantMsg = resData;

      setMessages((prev) =>
        prev
          .map((m) =>
            m.id === userMsg.id ? { ...m, is_streaming: false } : m
          )
          .filter((m) => m.id !== "thinking")
          .concat(assistantMsg)
      );


    } catch (err) {
      console.error("Send error:", err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === userMsg.id ? { ...m, is_streaming: false, is_error: true } : m
        )
      );
    }
  };


  return !profileVisible ? (
    <div className={`h-screen grid grid-cols-[auto_1fr] ${themeBg}`}>
      <SidePanel isDark={isDark} searchVisible={() => setSearchVisible(true)} />

      {searchVisible && (
        <SearchChat isDark={isDark} onClose={() => setSearchVisible(false)} />
      )}

      <div className="flex flex-col h-screen">
        <Navbar
          onProfileClick={() => setProfileVisible(true)}
          onThemeToggle={() => setIsDark(!isDark)}
          isDark={isDark}
        />

        {/* Main content – always full height, flex column */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Messages area – grows and scrolls */}
          <div
            className="flex-1 overflow-y-auto px-4 pt-6 pb-2
            [&::-webkit-scrollbar]:w-2 
            [&::-webkit-scrollbar-thumb]:bg-gray-500 
            [&::-webkit-scrollbar-track]:bg-gray-300 
          "
          >
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-3xl font-semibold text-center opacity-80">
                  What's on your camera today? Let's find !!!
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4 max-w-7xl mx-auto">
                {messages.map((msg, index) => {
                  const isUser = msg.role === "user";

                  return (
                    <div
                      key={msg.id || index}
                      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`
                          px-4 py-2.5 rounded-2xl max-w-[80%] md:max-w-2xl wrap-break-words
                          ${
                            isUser
                              ? isDark
                                ? "bg-emerald-500 text-black"
                                : "bg-emerald-500 text-white"
                              : isDark
                              ? "bg-neutral-800 text-white"
                              : "bg-gray-200 text-black"
                          }
                        `}
                      >
                        {msg.is_streaming ? <ThinkingDots /> : msg.content}
                        <div
                          className={`
                            text-[10px] mt-1 text-right
                            ${
                            isUser
                              ? isDark
                                ? "text-black"
                                : "text-white"
                              : isDark
                              ? "text-white"
                              : "text-black"
                          }
                          `}
                        >
                          {isUser? new Date(msg.timestamp).toLocaleTimeString(): null}
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="sticky bottom-0 px-4 pb-6 pt-2 bg-inherit z-10">
            <div className="max-w-5xl mx-auto relative">
              {query.trim() ? (
                <FiSend
                  className="absolute right-5 bottom-3 text-2xl text-gray-400 hover:text-gray-200 cursor-pointer transition-colors"
                  onClick={handleSend}
                />
              ) : (
                <FaSearch className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 text-xl pointer-events-none" />
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
                placeholder="Query your video recordings..."
                rows={1}
                className={`w-full resize-none px-5 py-3 pr-14 rounded-2xl border transition-all
                  ${
                    isDark
                      ? "bg-neutral-900 border-neutral-700 text-white placeholder:text-neutral-500"
                      : "bg-white border-gray-300 text-black placeholder:text-gray-400"
                  }
                  focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500
                  max-h-40 text-base md:text-lg
                `}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <EditProfile onCancel={() => setProfileVisible(false)} isDark={isDark} />
  );
};

export default Chat;
