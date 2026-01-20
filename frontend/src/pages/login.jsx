import {useState} from "react";

export default function Login(){

    const [username,setUsername] = useState("");
    const [password,setPassword] = useState("");

    return(
        <div className="fixed inset-0 flex items-center justify-center bg-black/60">

            {/* Card */}
            <div className="w-[90%] max-w-md rounded-xl bg-[#1f1f1f] p-6 text-white">

                {/* Title */}
                <h2 className="mb-6 text-lg font-semibold"> Login </h2>

                {/* User Name */}
                <div className="mb-4">

                    <label className="mb-2 block text-sm text-gray-400">Username</label>
                    <input value={username} onChange={(e)=>setUsername(e.target.value)} className="w-full rounded-lg border border-[#333] bg-[#2a2a2a] px-4 py-2 outline-none focus:border-gray-500"/>

                </div>

                {/* Password */}
                <div className="mb-4">

                    <label className="mb-2 block text-sm text-gray-400">Password</label>
                    <input value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full rounded-lg border mb-4 border-[#333] bg-[#2a2a2a] px-4 py-2 outline-none focus:border-gray-500"/> 
                
                </div>

                {/*Button*/}
                <div className="flex justify-end gap-3">

                    <button className="rounded-full bg-white px-5 py-2 text-sm font-medium text-black hover:bg-gray-200">Login</button>
                    <button className="rounded-full px-4 py-2 text-sm text-gray-300 hover:bg-[#2a2a2a]">Sign Up</button>
                
                </div>   
            </div>

        </div>
    );
}