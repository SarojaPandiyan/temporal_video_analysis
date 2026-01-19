import {useState} from "react";

export default function EditProfile(){

    const [name,setName] = useState("Saroja P");
    const [username,setUsername] = useState("sarojap");

    return(
        <div className="fixed inset-0 flex items-center justify-center bg-black/60">

            {/* Card */}
            <div className="w-[90%] max-w-md rounded-xl bg-[#1f1f1f] p-6 text-white">

                {/* Title */}
                <h2 className="mb-6 text-lg font-semibold"> Edit Profile </h2>

                {/*Photo*/}
                <div className="relative mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-[#8a9a9a] text-3xl font-medium">SP
                    
                    <div className="absolute bottom-1 right-1 rounded-full bg-[#2a2a2a] p-2 text-xs">📷</div>
                
                </div>

                {/* Display NAme */}
                <div className="mb-4">

                    <label className="mb-2 block text-sm text-gray-400">Display Name</label>
                    <input value={name} onChange={(e)=>setName(e.target.value)} className="w-full rounded-lg border border-[#333] bg-[#2a2a2a] px-4 py-2 outline-none focus:border-gray-500"/>

                </div>

                {/* UserName */}
                <div className="mb-4">

                    <label className="mb-2 block text-sm text-gray-400">Username</label>
                    <input value={username} onChange={(e)=>setUsername(e.target.value)} className="w-full rounded-lg border mb-4 border-[#333] bg-[#2a2a2a] px-4 py-2 outline-none focus:border-gray-500"/> 
                
                </div>

                {/* Info */}
                <p className="mb-6 text-xs text-gray-400">Your profile helps people recognize you. Your name and username are also used in the app.</p>

                {/*Button*/}
                <div className="flex justify-end gap-3">

                    <button className="rounded-full px-4 py-2 text-sm text-gray-300 hover:bg-[#2a2a2a]">Cancel</button>
                    <button className="rounded-full bg-white px-5 py-2 text-sm font-medium text-black hover:bg-gray-200">Save</button>
                
                </div>   
            </div>

        </div>
    );
}