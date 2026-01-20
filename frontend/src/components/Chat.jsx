import { FaSearch } from "react-icons/fa";
import { useState } from "react";
import Navbar from "./Navbar";
import SidePanel from "./Sidepanel";
import EditProfile from "./EditProfile";
import SearchChat from "./SearchChat";

const Chat = () => {
  const [profileVisible, setProfileVisible] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);

  const themeBg = isDark ? "bg-black text-white" : "bg-white text-black";

  return !profileVisible ? (
    <div className={`h-screen grid grid-cols-[auto_1fr] ${themeBg}`}>
      <SidePanel isDark={isDark} searchVisible={()=>setSearchVisible(true)}/>
      {searchVisible && <SearchChat isDark={isDark} onClose={() => setSearchVisible(false)} />}
      <div className="flex flex-col">
        <Navbar
          onProfileClick={() => setProfileVisible(true)}
          onThemeToggle={() => setIsDark(!isDark)}
          isDark={isDark}
        />

        <div className="flex flex-1 mt-40 justify-center">
          <div className="flex flex-col items-center gap-6">
            <div className="text-3xl font-semibold">
              What's on your camera today? Let's find !!!
            </div>

            <div className="w-2xl relative">
              <FaSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
              <input
                type="text"
                placeholder="Query your video recordings..."
                className={`w-full px-4 py-3 rounded-xl border
                  ${isDark ? "bg-[#1f1f1f] border-[#333] text-white" : "bg-white border-gray-300"}
                  focus:outline-none focus:ring-2 focus:ring-gray-500`}
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
