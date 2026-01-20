import { useState } from "react";
import { FaPhotoVideo } from "react-icons/fa";
export default function EditProfile({ onCancel, isDark }) {
  const [name, setName] = useState("Saroja P");
  const [username, setUsername] = useState("sarojap");
  const themeBg = isDark ? "bg-black text-white" : "bg-white text-black";
  return (
    <div className={`fixed inset-0 flex items-center justify-center ${themeBg}`}>
      {/* Card */}
      <div className={`w-[90%] max-w-md rounded-xl ${isDark ? "text-white bg-[#1f1f1f]": "text-black bg-gray-200"} p-6}`}>
        <div className="my-5 mx-3">
            
            {/* Title */}
            <h2 className="mt-6 ml-4 text-lg font-semibold"> Edit Profile </h2>

            {/*Photo*/}
            <div className="relative mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-[#8a9a9a] text-3xl font-medium">
            SP
            <div className={`absolute bottom-1 right-1 rounded-full ${isDark? "bg-[#2a2a2a]": "bg-white"} p-2 text-xs`}>
                <FaPhotoVideo />
            </div>
            </div>

            {/* Display Name */}
            <div className="mb-4">
            <label className={`mb-2 block text-sm ${isDark? "text-gray-400" : "text-black"}`}>
                Display Name
            </label>
            <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full rounded-lg border mb-4 border-[#333]  ${isDark? "bg-[#2a2a2a] text-white" : "bg-gray-200 - text-black"} px-4 py-2 outline-none focus:border-gray-500`}
            />
            </div>

            {/* UserName */}
            <div className="mb-4">
            <label className={`mb-2 block text-sm ${isDark? "text-gray-400" : "text-black"}`}>Username</label>
            <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`w-full rounded-lg border mb-4 border-[#333]  ${isDark? "bg-[#2a2a2a] text-white" : "bg-gray-200 - text-black"} px-4 py-2 outline-none focus:border-gray-500`}
            />
            </div>
            {/*Button*/}
            <div className="flex justify-end gap-3">
            <button
                className={`rounded-full px-4 py-2 text-sm{${isDark ? "text-gray-300 hover:bg-[#2a2a2a]" : "text-black hover:bg-[#2a2a2a] hover:text-white"}`}
                onClick={onCancel}
            >
                Cancel
            </button>
            <button className="rounded-full bg-white px-5 py-2 text-sm font-medium text-black hover:bg-gray-200">
                Save
            </button>
            </div>
        </div>
      </div>
      
    </div>
  );
}
