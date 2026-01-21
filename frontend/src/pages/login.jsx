import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();
  const {login}=useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!username || !password) {
      alert("Please fill all fields");
      return;
    }

    console.log("Username:", username);
    console.log("Password:", password);
    
    login();
    navigate("/chat");
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60">
      {/* Card */}
      <form
        onSubmit={handleSubmit}
        className="w-[90%] max-w-md rounded-xl bg-[#1f1f1f] p-6 text-white"
      >
        {/* Title */}
        <h2 className="mb-6 text-lg font-semibold">Login</h2>

        {/* Username */}
        <div className="mb-4">
          <label className="mb-2 block text-sm text-gray-400">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-lg border border-[#333] bg-[#2a2a2a] px-4 py-2 outline-none focus:border-gray-500"
          />
        </div>

        {/* Password */}
        <div className="mb-6">
          <label className="mb-2 block text-sm text-gray-400">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-[#333] bg-[#2a2a2a] px-4 py-2 outline-none focus:border-gray-500"
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          <button
            type="submit"
            disabled={!username || !password}
            className="rounded-full bg-white px-5 py-2 text-sm font-medium text-black hover:bg-gray-200 disabled:opacity-50"
          >
            {" "}
            Login
          </button>

          <button
            type="button"
            className="rounded-full px-4 py-2 text-sm text-gray-300 hover:bg-[#2a2a2a]"
          >
            {" "}
            Sign Up{" "}
          </button>
        </div>
      </form>
    </div>
  );
}
