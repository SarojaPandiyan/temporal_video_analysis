import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Signup({ isDark }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

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

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.trim());
  };

  const validateUsername = (username) => {
    const trimmed = username.trim();
    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    return usernameRegex.test(trimmed);
  };

  const validatePassword = (pwd) => {
    // At least 8 chars, 1 uppercase, 1 lowercase, 1 number
    const hasMinLength = pwd.length >= 8;
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    return hasMinLength && hasUpper && hasLower && hasNumber;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedUsername = trimmedName; // using name as username for now

    // 1. All fields required
    if (!trimmedName || !trimmedEmail || !password || !confirmPassword) {
      setError("Please fill all fields");
      setLoading(false);
      return;
    }

    // 2. Email format
    if (!validateEmail(trimmedEmail)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    // 3. Username validation (if using name as username)
    if (!validateUsername(trimmedUsername)) {
      setError(
        "Display name must be 3–20 characters and contain only letters, numbers, underscore or hyphen"
      );
      setLoading(false);
      return;
    }

    // 4. Password strength
    if (!validatePassword(password)) {
      setError(
        "Password must be at least 8 characters long and contain uppercase, lowercase, and a number"
      );
      setLoading(false);
      return;
    }

    // 5. Password match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    // ────────────────────────────────────────────────
    // All client-side checks passed → send to backend
    // ────────────────────────────────────────────────

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: trimmedUsername,
          email: trimmedEmail,
          full_name: trimmedName,
          password: password,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(
          errData.detail || "Signup failed. Please try again."
        );
      }

      // Success
      navigate("/login");

    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed top-6 left-6 z-50">
        <div className="flex items-center gap-2">
          <span className={`font-semibold text-2xl ${theme.text} tracking-tight`}>
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
          <h2 className="mb-8 text-2xl font-bold tracking-tight">
            Create Account
          </h2>

          {/* Display Name */}
          <div className="mb-6">
            <label className={`mb-2 block text-sm font-medium ${theme.label}`}>
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className={`
                w-full rounded-lg px-4 py-3
                border ${theme.inputBorder}
                ${theme.inputBg} ${theme.inputText}
                outline-none transition-all duration-200
                ${theme.inputFocus}
              `}
            />
          </div>

          {/* Email */}
          <div className="mb-6">
            <label className={`mb-2 block text-sm font-medium ${theme.label}`}>
              Email
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
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
          <div className="mb-6">
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

          {/* Confirm Password */}
          <div className="mb-8">
            <label className={`mb-2 block text-sm font-medium ${theme.label}`}>
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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

          {/* Error message */}
          {error && (
            <div className="mb-6 text-red-500 text-sm text-center">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row sm:justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className={`
                px-6 py-2.5 text-sm font-medium rounded-full
                border transition-colors duration-200
                ${theme.btnSecondary}
              `}
              disabled={loading}
            >
              Login
            </button>

            <button
              type="submit"
              disabled={
                loading ||
                !name.trim() ||
                !email.trim() ||
                !password ||
                !confirmPassword
              }
              className={`
                px-7 py-2.5 text-sm font-semibold rounded-full
                transition-all duration-200
                ${theme.btnPrimary}
                ${(loading ||
                  !name.trim() ||
                  !email.trim() ||
                  !password ||
                  !confirmPassword) &&
                  theme.disabled}
              `}
            >
              {loading ? "Signing up..." : "Sign Up"}
            </button>
          </div>

          {/* Footer text */}
          <p className="mt-6 text-xs text-gray-500 text-center">
            By creating an account, you agree to our Terms and Privacy Policy.
          </p>
        </form>
      </div>
    </>
  );
}