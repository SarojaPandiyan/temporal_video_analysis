import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login({ isDark }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isFocused, setIsFocused] = useState({ username: false, password: false });

  const navigate = useNavigate();
  const { login } = useAuth();

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      alert("Please fill in both fields");
      return;
    }

    try {
      await login(username, password);
      navigate("/chat");
    } catch (err) {
      console.error("Login failed:", err);
      alert("Login failed: " + err.message);
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
      <div className="fixed top-3 left-3 sm:top-4 sm:left-4 md:top-6 md:left-6 z-50 animate-fade-in">
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

          {/* Text */}
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
      <div className={`fixed inset-0 flex items-center justify-center ${theme.text} transition-colors duration-300`}>
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
          `}
        >
          {/* Header Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight mb-2">Welcome Back</h2>
            <p className={`text-sm ${theme.label}`}>
              Sign in to access your surveillance dashboard
            </p>
          </div>

          {/* Username Field - enhanced focus glow */}
          <div className="mb-6 group">
            <label className={`mb-2 block text-sm font-medium ${theme.label} transition-colors duration-200 ${isFocused.username ? (isDark ? 'text-gray-300' : 'text-gray-700') : ''}`}>
              Username
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onFocus={() => setIsFocused({...isFocused, username: true})}
                onBlur={() => setIsFocused({...isFocused, username: false})}
                placeholder="Enter username"
                className={`
                  w-full rounded-lg px-4 py-3 pl-11
                  border ${theme.inputBorder}
                  ${theme.inputBg} ${theme.inputText}
                  outline-none transition-all duration-200
                  ${theme.inputFocus}
                  ${isFocused.username ? 'transform scale-[1.02] shadow-[0_0_0_4px_rgb(156,163,175,0.15)]' : ''}
                `}
              />
              <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 ${isFocused.username ? (isDark ? 'text-gray-300' : 'text-gray-700') : theme.label}`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Password Field - enhanced focus glow */}
          <div className="mb-8 group">
            <label className={`mb-2 block text-sm font-medium ${theme.label} transition-colors duration-200 ${isFocused.password ? (isDark ? 'text-gray-300' : 'text-gray-700') : ''}`}>
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setIsFocused({...isFocused, password: true})}
                onBlur={() => setIsFocused({...isFocused, password: false})}
                placeholder="••••••••"
                className={`
                  w-full rounded-lg px-4 py-3 pl-11
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
            </div>
          </div>

          {/* Action Buttons - 3D press feel on active */}
          <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
            <button
              type="button"
              className={`
                px-6 py-3 text-sm font-medium rounded-lg
                border transition-all duration-200 active:scale-[0.97] active:shadow-inner
                ${theme.btnSecondary}
                hover:scale-[1.02] 
                flex items-center justify-center gap-2
              `}
              onClick={() => navigate("/signup")}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Create Account
            </button>

            <button
              type="submit"
              disabled={!username || !password}
              className={`
                px-7 py-3 text-sm font-semibold rounded-lg
                transition-all duration-200 active:scale-[0.97] active:shadow-inner
                ${theme.btnPrimary}
                ${!username || !password ? theme.disabled : 'hover:scale-[1.02] shadow-lg hover:shadow-xl'}
                flex items-center justify-center gap-2
              `}
            >
              Sign In
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>

          {/* Privacy Note */}
          <div className={`mt-8 pt-6 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
            <p className={`text-xs ${theme.label} text-center leading-relaxed`}>
              <svg className="w-3 h-3 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Privacy-conscious event-based analysis
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
      `}</style>
    </>
  );
}