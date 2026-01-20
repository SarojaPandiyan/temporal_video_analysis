import { FaSearch } from "react-icons/fa";
import { FiSend } from "react-icons/fi";
import { useState, useRef } from "react";
import Navbar from "./Navbar";
import SidePanel from "./Sidepanel";
import EditProfile from "./EditProfile";
import SearchChat from "./SearchChat";

const Chat = () => {
  const [profileVisible, setProfileVisible] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [query, setQuery] = useState("");

  const inputRef = useRef(null);

  const themeBg = isDark ? "bg-black text-white" : "bg-white text-black";

  {/* Function ti handle input send*/}
  const handleSend = () => {
    if (!query.trim()) return;
    console.log("Send:", query);
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
        <div className="flex flex-1 mt-40 justify-center">
          <div className="flex flex-col items-center gap-6">
            <div className="text-3xl font-semibold text-center">
              What's on your camera today? Let's find !!!
            </div>

            {/* Search Input */}
            <div className="w-2xl relative">
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
