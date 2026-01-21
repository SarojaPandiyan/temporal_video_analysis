import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name || !username || !password || !confirmPassword) {
      alert("Please fill all fields");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    console.log({ name, username, password });

    navigate("/login");
    
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60">
      {/* Card */}
      <form
        onSubmit={handleSubmit}
        className="w-[90%] max-w-md rounded-xl bg-[#1f1f1f] p-6 text-white"
      >
        {/* Title */}
        <h2 className="mb-6 text-lg font-semibold"> Create account </h2>

        {/* Display Name */}
        <div className="mb-4">
          <label className="mb-2 block text-sm text-gray-400">
            {" "}
            Display name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-[#333] bg-[#2a2a2a] px-4 py-2 outline-none focus:border-gray-500"
          />
        </div>

        {/* Username */}
        <div className="mb-4">
          <label className="mb-2 block text-sm text-gray-400">
            Username or Email
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-lg border border-[#333] bg-[#2a2a2a] px-4 py-2 outline-none focus:border-gray-500"
          />
        </div>

        {/* Password */}
        <div className="mb-4">
          <label className="mb-2 block text-sm text-gray-400">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-[#333] bg-[#2a2a2a] px-4 py-2 outline-none focus:border-gray-500"
          />
        </div>

        {/* Confirm Password */}
        <div className="mb-6">
          <label className="mb-2 block text-sm text-gray-400">
            Confirm password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-lg border border-[#333] bg-[#2a2a2a] px-4 py-2 outline-none focus:border-gray-500"
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          <button
            type="submit"
            disabled={!name || !username || !password || !confirmPassword}
            className="rounded-full bg-white px-5 py-2 text-sm font-medium text-black hover:bg-gray-200 disabled:opacity-50"
          >
            Sign up
          </button>
          <button
            type="button"
            className="rounded-full px-4 py-2 text-sm text-gray-300 hover:bg-[#2a2a2a]"
          >
            Login
          </button>
        </div>

        {/* Footer Text */}
        <p className="mt-4 text-xs text-gray-400">
          By creating an account, you agree to our Terms and Privacy Policy.
        </p>
      </form>
    </div>
  );
}
