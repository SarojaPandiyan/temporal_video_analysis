import { FaSearch } from "react-icons/fa";
import { FiSend } from "react-icons/fi";
import { useState, useRef } from "react";
import Navbar from "./Navbar";
import SidePanel from "./Sidepanel";
import EditProfile from "./EditProfile";
import SearchChat from "./SearchChat";

// Get System preferred theme
const getSystemPreferenceTheme = () => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return isDarkMode ? true : false;
    }
    // Default to 'light' if not in a browser environment or matchMedia is unsupported
    return false;
  };

const Chat = () => {
  const [profileVisible, setProfileVisible] = useState(false);
  const [isDark, setIsDark] = useState(getSystemPreferenceTheme());
  const [searchVisible, setSearchVisible] = useState(false);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);

  const inputRef = useRef(null);
  const themeBg = isDark ? "bg-black text-white" : "bg-white text-black";

  {/* Function ti handle input send*/}
  const handleSend = () => {
    if (!query.trim()) return;
    console.log("Send:", query);
    setMessages((prev) => [
      ...prev,
      { time: Date.now(), message: query }
    ]);
    setQuery("");
    inputRef.current?.focus();
  };

  return !profileVisible ? (
    <div className={`h-screen grid grid-cols-[auto_1fr] ${themeBg}`}>
      <SidePanel
        isDark={isDark}
        searchVisible={() => setSearchVisible(true)}
      />

      {searchVisible && (
        <SearchChat
          isDark={isDark}
          onClose={() => setSearchVisible(false)}
        />
      )}

      <div className="flex flex-col">
        <Navbar
          onProfileClick={() => setProfileVisible(true)}
          onThemeToggle={() => setIsDark(!isDark)}
          isDark={isDark}
        />

        {/* Main Chat */}
        <div
          className={`flex flex-1 justify-center transition-all duration-500
            ${messages.length === 0 ? "items-start pt-40" : "items-end pb-6"}
          `}
        >

          <div
            className={`flex flex-col gap-6 transition-all duration-500 items-center
              ${messages.length === 0
                ? "w-2xl"
                : "w-full max-w-5xl"}
            `}
          >
            {messages.length === 0 ? (
              <div className="text-3xl font-semibold text-center">
                What's on your camera today? Let's find !!!
              </div>
              ) : (
              <div className="w-full flex flex-col gap-3 px-4 max-h-[70vh] overflow-y-auto">
                {messages.map((msg, index) => (
                  <div
                    key={msg.time || index}
                    className={`self-end px-4 py-2 rounded-xl max-w-md
                      ${isDark ? "bg-[#2f2f2f] text-white" : "bg-gray-200 text-black"}
                    `}
                  >
                    {msg.message}
                  </div>
                ))}
              </div>
            )}

            {/* Search Input */}
            <div className={`${messages.length === 0 ? "w-2xl" : "w-4xl"} transition-[width] duration-200 ease-linear relative`}>
              {query ? (
                <FiSend
                  className="text-3xl absolute right-4 bottom-0.5 pr-2 -translate-y-1/2 text-gray-500 cursor-pointer"
                  onClick={handleSend}
                />
              ) : (
                <FaSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
              )}
              <textarea
                ref={inputRef}
                value={query}
                placeholder="Query your video recordings..."
                rows={1}
                onChange={(e) => {
                  setQuery(e.target.value);

                  // Reset height
                  e.target.style.height = "auto";

                  const maxHeight = 160;

                  if (e.target.scrollHeight > maxHeight) {
                    e.target.style.height = `${maxHeight}px`;
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
                    e.target.style.height = "auto";
                    e.target.style.overflowY = "hidden";
                  }
                }}
                className={`w-full resize-none px-4 py-3 pr-12 rounded-xl border
                  ${
                    isDark
                      ? "bg-[#1f1f1f] border-[#333] text-white"
                      : "bg-white border-gray-300"
                  }
                  max-h-40
                  focus:outline-none focus:ring-2 focus:ring-gray-500
                `}
              />

            </div>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <EditProfile
      onCancel={() => setProfileVisible(false)}
      isDark={isDark}
    />
  );
};

export default Chat;
