import Navbar from "./Navbar";
import SidePanel from "./Sidepanel";

const Chat = () => {
  return (
    <div className="h-screen grid grid-cols-[40px_1fr]">
      {/*Side panel component*/}
      <SidePanel />
      <div className="flex flex-col">
        {/*Navbar panel component*/}
        <Navbar />
        {/*Chat panel component*/}
        <div className="flex flex-1 mt-40 justify-center">
        <div className="flex flex-col items-center gap-6">
            <div className="text-3xl font-semibold">
            What's on your camera today? Let's find !!!
            </div>
            {/* Search Box */}
            <div className="w-2xl">
            <input
                type="text"
                placeholder="Query your video recordings..."
                className="w-full px-4 py-3 rounded-xl border border-gray-300 
                        focus:outline-none focus:ring-2 focus:ring-gray-500"
            />
            </div>

        </div>
        </div>

      </div>
    </div>
  );
};

export default Chat;
