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
    setMessages(...messages, {"time": Date.now(), "message": query})
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

          <div className="flex flex-col items-center gap-6">
            {messages.length == 0 ? <div className="text-3xl font-semibold text-center">
              What's on your camera today? Let's find !!!
            </div>: "" }

            {/* Search Input */}
            <div className={`w-2xl relative`}>
              {query ? (
                <FiSend
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg cursor-pointer"
                  onClick={handleSend}
                />
              ) : (
                <FaSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
              )}
              <input
                type="text"
                placeholder="Query your video recordings..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                ref={inputRef}
                className={`w-full px-4 py-3 pr-12 rounded-xl border
                  ${
                    isDark
                      ? "bg-[#1f1f1f] border-[#333] text-white"
                      : "bg-white border-gray-300"
                  }
                  focus:outline-none focus:ring-2 focus:ring-gray-500`}
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
