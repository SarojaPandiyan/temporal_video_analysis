import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login({ isDark }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();
  const { login } = useAuth();

  const theme = {
    bg: isDark ? "bg-black" : "bg-white",
    card: isDark
      ? "bg-black border border-gray-800"
      : "bg-white border border-white-200 shadow-2xl",
    text: isDark ? "text-gray-100" : "text-gray-900",
    label: isDark ? "text-gray-500" : "text-gray-600",
    inputBg: isDark ? "bg-gray-900/60" : "bg-gray-50",
    inputBorder: isDark ? "border-gray-700" : "border-gray-300",
    inputText: isDark
      ? "text-gray-100 placeholder:text-gray-600"
      : "text-gray-900 placeholder:text-gray-400",
    inputFocus: isDark
      ? "focus:border-gray-400 focus:ring-gray-500/30"
      : "focus:border-gray-500 focus:ring-gray-400/20",
    btnPrimary: isDark
      ? "bg-white text-black hover:bg-gray-600"
      : "bg-black text-white hover:bg-gray-800",
    btnSecondary: isDark
      ? "text-gray-400 border border-gray-700 hover:bg-gray-900 "
      : "text-gray-700 border border-gray-300 hover:bg-gray-100",
    disabled: "opacity-40 cursor-not-allowed",
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      alert("Please fill in both fields");
      return;
    }

    try {
      await login(username, password);   // ← now we wait
      navigate("/chat");
    } catch (err) {
      console.error("Login failed:", err);
      alert("Login failed: " + err.message);
    }
  };

  return (
    <>
      <div className="fixed top-6 left-6 z-50">
        {" "}
        {/* ← increased z-index + better spacing */}
        <div className="flex items-center gap-2">
          <span className={`ont-semibold text-2xl ${theme.text} tracking-tight`}>
            InsightSphere
          </span>
        </div>
      </div>
      <div
        className={`fixed inset-0 flex items-center justify-center ${theme.bg} ${theme.text} transition-colors duration-300`}
      >
        <form
          onSubmit={handleSubmit}
          className={`
          w-[90%] max-w-md rounded-2xl p-8
          ${theme.card}
          transition-all duration-300
        `}
        >
          <h2 className="mb-8 text-2xl font-bold tracking-tight">Sign In</h2>

          {/* Username */}
          <div className="mb-6">
            <label className={`mb-2 block text-sm font-medium ${theme.label}`}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              className={`
              w-full rounded-lg px-4 py-3
              border ${theme.inputBorder}
              ${theme.inputBg} ${theme.inputText}
              outline-none transition-all duration-200
              ${theme.inputFocus}
            `}
            />
          </div>

          {/* Password */}
          <div className="mb-8">
            <label className={`mb-2 block text-sm font-medium ${theme.label}`}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`
              w-full rounded-lg px-4 py-3
              border ${theme.inputBorder}
              ${theme.inputBg} ${theme.inputText}
              outline-none transition-all duration-200
              ${theme.inputFocus}
            `}
            />
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row sm:justify-end gap-4">
            <button
              type="button"
              className={`
              px-6 py-2.5 text-sm font-medium rounded-full
              border transition-colors duration-200
              ${theme.btnSecondary}
            `}
              onClick={() => navigate("/signup")}
            >
              Create Account
            </button>

            <button
              type="submit"
              disabled={!username || !password}
              className={`
              px-7 py-2.5 text-sm font-semibold rounded-full
              transition-all duration-200
              ${theme.btnPrimary}
              ${!username || !password ? theme.disabled : ""}
            `}
            >
              Login
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
