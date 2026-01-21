import React from "react";
import { Link } from "react-router-dom"; // ← assuming you're using React Router
// If you're not, just use <a href="/"> instead

export default function NotFound({ isDark }) { 
  const theme = {
    bg: isDark ? "bg-gray-950" : "bg-gray-50",
    text: isDark ? "text-gray-100" : "text-gray-900",
    muted: isDark ? "text-gray-400" : "text-gray-600",
    heading: isDark ? "text-white" : "text-gray-900",
    accent: "text-indigo-500",
  };

  return (
    <main
      className={`min-h-screen ${theme.bg} ${theme.text} flex items-center justify-center px-6 py-24 sm:py-32 lg:px-8`}
    >
      <div className="text-center max-w-2xl mx-auto animate-fade-in">
        <h1
          className={`text-8xl sm:text-9xl font-black tracking-tighter bg-linear-to-r from-indigo-500 via-purple-500 to-blue-600 bg-clip-text text-transparent leading-none`}
        >
          404
        </h1>

        <h2 className={`mt-4 text-4xl sm:text-5xl font-bold ${theme.heading}`}>
          Page not found
        </h2>

        <p className={`mt-6 text-lg sm:text-xl ${theme.muted} leading-relaxed`}>
          Sorry, the page you’re looking for doesn’t exist or has been moved.
          <br className="hidden sm:inline" /> Maybe you mistyped the URL?
        </p>

        {/* Optional helpful suggestions */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
          <Link
            to="/"
            className={`
              inline-flex items-center justify-center
              rounded-full bg-linear-to-r from-indigo-600 to-blue-600
              px-8 py-3.5 text-base font-semibold text-white shadow-lg
              hover:from-indigo-700 hover:to-blue-700
                focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600
              transition-all duration-300 transform hover:scale-[1.03] active:scale-95
            `}
          >
            ← Back to Home
          </Link>

        </div>
      </div>
    </main>
  );
}

/* Optional: add to your global CSS or use tailwind.config with plugin */