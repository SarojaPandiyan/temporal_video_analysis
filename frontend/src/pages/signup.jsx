import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Signup({ isDark }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();

  // 3D tilt state & ref for professional dynamic card
  const formRef = useRef(null);
  const [tiltStyle, setTiltStyle] = useState({
    transform: "perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
  });

  const theme = {
    bg: isDark ? "bg-black" : "bg-white",
    card: isDark
      ? "bg-black border border-gray-800"
      : "bg-white border border-gray-200 shadow-2xl",
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
      ? "text-gray-400 border border-gray-700 hover:bg-gray-900"
      : "text-gray-700 border border-gray-300 hover:bg-gray-100",
    disabled: "opacity-40 cursor-not-allowed",
    accent: isDark ? "bg-gray-700" : "bg-gray-200",
    accentHover: isDark ? "hover:bg-gray-600" : "hover:bg-gray-300",
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
    const hasMinLength = pwd.length >= 8;
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    return hasMinLength && hasUpper && hasLower && hasNumber;
  };

  // Password strength indicator
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { strength: 0, label: "", color: "" };
    
    let strength = 0;
    const checks = {
      length: pwd.length >= 8,
      upper: /[A-Z]/.test(pwd),
      lower: /[a-z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[^a-zA-Z0-9]/.test(pwd),
    };

    if (checks.length) strength += 20;
    if (checks.upper) strength += 20;
    if (checks.lower) strength += 20;
    if (checks.number) strength += 20;
    if (checks.special) strength += 20;

    if (strength <= 40) {
      return { strength, label: "Weak", color: "bg-red-500" };
    } else if (strength <= 60) {
      return { strength, label: "Fair", color: "bg-orange-500" };
    } else if (strength <= 80) {
      return { strength, label: "Good", color: isDark ? "bg-yellow-500" : "bg-yellow-600" };
    } else {
      return { strength, label: "Strong", color: "bg-green-500" };
    }
  };

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedUsername = trimmedName;

    if (!trimmedName || !trimmedEmail || !password || !confirmPassword) {
      setError("Please fill all fields");
      setLoading(false);
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    if (!validateUsername(trimmedUsername)) {
      setError(
        "Display name must be 3–20 characters and contain only letters, numbers, underscore or hyphen"
      );
      setLoading(false);
      return;
    }

    if (!validatePassword(password)) {
      setError(
        "Password must be at least 8 characters long and contain uppercase, lowercase, and a number"
      );
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/signup`,
        {
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
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Signup failed. Please try again.");
      }

      navigate("/login");
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 3D interactive tilt effect (mouse-driven perspective)
  useEffect(() => {
    const card = formRef.current;
    if (!card) return;

    const handleMouseMove = (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      // Subtle 3D rotation + micro-scale for premium depth
      const rotateY = x * 22;
      const rotateX = -y * 22;

      setTiltStyle({
        transform: `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.035, 1.035, 1.035)`,
      });
    };

    const handleMouseLeave = () => {
      setTiltStyle({
        transform: "perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
      });
    };

    card.addEventListener("mousemove", handleMouseMove);
    card.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      if (card) {
        card.removeEventListener("mousemove", handleMouseMove);
        card.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, []);

  return (
    <>
      {/* Header with Logo - enhanced hover 3D effect */}
      <div className="fixed top-3 left-3 sm:top-2 sm:left-4 md:top-6 md:left-6 z-50 animate-fade-in">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Icon - 3D hover lift + rotation */}
          <div className={`relative w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-xl ${theme.accent} flex items-center justify-center overflow-hidden group hover:scale-110 hover:rotate-6 transition-all duration-500`}>
            <div className={`absolute inset-0 ${isDark ? 'bg-linear-to-br from-gray-600 to-gray-800' : 'bg-linear-to-br from-gray-300 to-gray-400'} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>

            <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 relative z-10" viewBox="0 0 24 24" fill="none">
              <path d="M12 5C8.5 5 5.5 7 4 9.5C5.5 12 8.5 14 12 14C15.5 14 18.5 12 20 9.5C18.5 7 15.5 5 12 5Z"
                stroke="currentColor"
                strokeWidth="2"
                className={theme.text}
              />
              <circle cx="12" cy="9.5" r="2.5"
                stroke="currentColor"
                strokeWidth="2"
                className={theme.text}
              />
              <path d="M2 19L8 13M22 19L16 13"
                stroke="currentColor"
                strokeWidth="2"
                className={theme.text}
              />
            </svg>
          </div>

          {/* Text - fixed sizing bug */}
          <div>
            <span className={`font-semibold text-lg sm:text-xl md:text-2xl ${theme.text} tracking-tight block`}>
              InsightSphere
            </span>

            {/* Hide on very small screens */}
            <span className={`hidden sm:block text-[10px] sm:text-xs ${theme.label} tracking-wide`}>
              Event-Based Video Analysis
            </span>
          </div>
        </div>
      </div>

      {/* Background Pattern */}
      <div className={`fixed inset-0 ${theme.bg} transition-colors duration-300`}>
        <div className={`absolute inset-0 opacity-[0.02] ${isDark ? 'opacity-[0.03]' : ''}`}>
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`fixed inset-0 flex items-center justify-center ${theme.text} transition-colors duration-300 overflow-y-auto py-8`}>
        {/* Enhanced Floating Orbs - more orbs + varied timing for richer dynamism */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-10 ${isDark ? 'bg-gray-500' : 'bg-gray-400'} animate-pulse-slow`}></div>
          <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-10 ${isDark ? 'bg-gray-600' : 'bg-gray-300'} animate-pulse-slow`} style={{animationDelay: '2s'}}></div>
          {/* New orbs for depth & motion */}
          <div className={`absolute top-2/5 right-1/5 w-72 h-72 rounded-full blur-3xl opacity-10 ${isDark ? 'bg-gray-400' : 'bg-gray-500'} animate-pulse-slow`} style={{animationDelay: '3.5s'}}></div>
          <div className={`absolute bottom-2/5 left-1/5 w-80 h-80 rounded-full blur-3xl opacity-10 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-float-slow`} style={{animationDelay: '1.2s'}}></div>
        </div>

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          style={tiltStyle}
          className={`
            relative w-[90%] max-w-md rounded-2xl p-8
            ${theme.card}
            transition-all duration-300 ease-out
            animate-slide-up
            my-auto
          `}
        >
          {/* Header Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight mb-2">Create Account</h2>
            <p className={`text-sm ${theme.label}`}>
              Join InsightSphere for intelligent surveillance
            </p>
          </div>

          {/* Display Name Field - enhanced focus glow */}
          <div className="mb-5 group">
            <label className={`mb-2 block text-sm font-medium ${theme.label} transition-colors duration-200 ${isFocused.name ? (isDark ? 'text-gray-300' : 'text-gray-700') : ''}`}>
              Display Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={() => setIsFocused({...isFocused, name: true})}
                onBlur={() => setIsFocused({...isFocused, name: false})}
                placeholder="Your name"
                className={`
                  w-full rounded-lg px-4 py-3 pl-11
                  border ${theme.inputBorder}
                  ${theme.inputBg} ${theme.inputText}
                  outline-none transition-all duration-200
                  ${theme.inputFocus}
                  ${isFocused.name ? 'transform scale-[1.02] shadow-[0_0_0_4px_rgb(156,163,175,0.15)]' : ''}
                `}
              />
              <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 ${isFocused.name ? (isDark ? 'text-gray-300' : 'text-gray-700') : theme.label}`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Email Field - enhanced focus glow */}
          <div className="mb-5 group">
            <label className={`mb-2 block text-sm font-medium ${theme.label} transition-colors duration-200 ${isFocused.email ? (isDark ? 'text-gray-300' : 'text-gray-700') : ''}`}>
              Email
            </label>
            <div className="relative">
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setIsFocused({...isFocused, email: true})}
                onBlur={() => setIsFocused({...isFocused, email: false})}
                placeholder="your.email@example.com"
                className={`
                  w-full rounded-lg px-4 py-3 pl-11
                  border ${theme.inputBorder}
                  ${theme.inputBg} ${theme.inputText}
                  outline-none transition-all duration-200
                  ${theme.inputFocus}
                  ${isFocused.email ? 'transform scale-[1.02] shadow-[0_0_0_4px_rgb(156,163,175,0.15)]' : ''}
                `}
              />
              <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 ${isFocused.email ? (isDark ? 'text-gray-300' : 'text-gray-700') : theme.label}`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Password Field with Strength Indicator - enhanced focus glow */}
          <div className="mb-5 group">
            <label className={`mb-2 block text-sm font-medium ${theme.label} transition-colors duration-200 ${isFocused.password ? (isDark ? 'text-gray-300' : 'text-gray-700') : ''}`}>
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setIsFocused({...isFocused, password: true})}
                onBlur={() => setIsFocused({...isFocused, password: false})}
                placeholder="••••••••"
                className={`
                  w-full rounded-lg px-4 py-3 pl-11 pr-11
                  border ${theme.inputBorder}
                  ${theme.inputBg} ${theme.inputText}
                  outline-none transition-all duration-200
                  ${theme.inputFocus}
                  ${isFocused.password ? 'transform scale-[1.02] shadow-[0_0_0_4px_rgb(156,163,175,0.15)]' : ''}
                `}
              />
              <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 ${isFocused.password ? (isDark ? 'text-gray-300' : 'text-gray-700') : theme.label}`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors duration-200 ${theme.label} hover:${theme.text}`}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            
            {/* Password Strength Indicator */}
            {password && (
              <div className="mt-2 space-y-1">
                <div className={`h-1.5 w-full rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-200'} overflow-hidden`}>
                  <div 
                    className={`h-full ${passwordStrength.color} transition-all duration-300 rounded-full`}
                    style={{ width: `${passwordStrength.strength}%` }}
                  ></div>
                </div>
                <p className={`text-xs ${theme.label}`}>
                  Password strength: <span className="font-medium">{passwordStrength.label}</span>
                </p>
              </div>
            )}
          </div>

          {/* Confirm Password Field - enhanced focus glow + match state */}
          <div className="mb-6 group">
            <label className={`mb-2 block text-sm font-medium ${theme.label} transition-colors duration-200 ${isFocused.confirmPassword ? (isDark ? 'text-gray-300' : 'text-gray-700') : ''}`}>
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onFocus={() => setIsFocused({...isFocused, confirmPassword: true})}
                onBlur={() => setIsFocused({...isFocused, confirmPassword: false})}
                placeholder="••••••••"
                className={`
                  w-full rounded-lg px-4 py-3 pl-11 pr-11
                  border ${theme.inputBorder}
                  ${theme.inputBg} ${theme.inputText}
                  outline-none transition-all duration-200
                  ${theme.inputFocus}
                  ${isFocused.confirmPassword ? 'transform scale-[1.02] shadow-[0_0_0_4px_rgb(156,163,175,0.15)]' : ''}
                  ${confirmPassword && password === confirmPassword ? 'border-green-500' : ''}
                  ${confirmPassword && password !== confirmPassword ? 'border-red-500' : ''}
                `}
              />
              <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 ${isFocused.confirmPassword ? (isDark ? 'text-gray-300' : 'text-gray-700') : theme.label}`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors duration-200 ${theme.label} hover:${theme.text}`}
              >
                {showConfirmPassword ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {confirmPassword && password === confirmPassword && (
              <p className="mt-1 text-xs text-green-500 flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Passwords match
              </p>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 animate-shake">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-500">{error}</p>
              </div>
            </div>
          )}

          {/* Action Buttons - 3D press feel on active */}
          <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/login")}
              disabled={loading}
              className={`
                px-6 py-3 text-sm font-medium rounded-lg
                border transition-all duration-200 active:scale-[0.97] active:shadow-inner
                ${theme.btnSecondary}
                ${loading ? theme.disabled : 'hover:scale-[1.02]'}
                flex items-center justify-center gap-2
              `}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
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
                px-7 py-3 text-sm font-semibold rounded-lg
                transition-all duration-200 active:scale-[0.97] active:shadow-inner
                ${theme.btnPrimary}
                ${
                  (loading ||
                    !name.trim() ||
                    !email.trim() ||
                    !password ||
                    !confirmPassword)
                    ? theme.disabled
                    : 'hover:scale-[1.02] shadow-lg hover:shadow-xl'
                }
                flex items-center justify-center gap-2
              `}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </div>

          {/* Footer Section */}
          <div className={`mt-8 pt-6 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
            <p className={`text-xs ${theme.label} text-center leading-relaxed`}>
              By creating an account, you agree to our{' '}
              <span className={`${theme.text} font-medium cursor-pointer hover:underline`}>Terms</span>
              {' '}and{' '}
              <span className={`${theme.text} font-medium cursor-pointer hover:underline`}>Privacy Policy</span>
            </p>
            <p className={`text-xs ${theme.label} text-center mt-3 flex items-center justify-center gap-1`}>
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Your data is protected with end-to-end encryption
            </p>
          </div>
        </form>
      </div>

      {/* Custom Animations - extended with float-slow for 3D orb depth */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.1;
            transform: scale(1);
          }
          50% {
            opacity: 0.15;
            transform: scale(1.05);
          }
        }

        @keyframes float-slow {
          0%, 100% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-30px) scale(1.08);
          }
        }

        @keyframes shake {
          0%, 100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-5px);
          }
          75% {
            transform: translateX(5px);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.6s ease-out;
        }

        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }

        .animate-float-slow {
          animation: float-slow 14s ease-in-out infinite;
        }

        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </>
  );
}