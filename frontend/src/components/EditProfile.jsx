import { useState, useEffect } from "react";
import { FaPhotoVideo } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function EditProfile({ onCancel, isDark }) {
  const { user, setUser, logout, getAccessToken, refreshUser } = useAuth();

  const [fullName, setFullName] = useState(user?.full_name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [previewUrl, setPreviewUrl] = useState(user?.profile_picture_url || "");
  const [selectedFile, setSelectedFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setUsername(user.username || "");
      setPreviewUrl(user.profile_picture_url || "");
    }
  }, [user]);

  const theme = {
    bg: isDark ? "bg-black" : "bg-white",
    card: isDark
      ? "bg-[#1a1a1a] border border-gray-800 text-white"
      : "bg-white border border-gray-200 shadow-2xl text-black",
    text: isDark ? "text-gray-100" : "text-gray-900",
    label: isDark ? "text-gray-400" : "text-gray-600",
    inputBg: isDark ? "bg-gray-900/70" : "bg-gray-50",
    inputBorder: isDark ? "border-gray-700" : "border-gray-300",
    inputText: isDark
      ? "text-gray-100 placeholder:text-gray-500"
      : "text-gray-900 placeholder:text-gray-400",
    inputFocus: isDark
      ? "focus:border-emerald-500 focus:ring-emerald-500/30"
      : "focus:border-emerald-600 focus:ring-emerald-500/20",
    btnPrimary: isDark
      ? "bg-white text-black hover:bg-gray-100 active:bg-gray-200"
      : "bg-black text-white hover:bg-gray-900 active:bg-gray-950",
    btnSecondary: isDark
      ? "text-gray-300 border border-gray-700 hover:bg-gray-800 active:bg-gray-900"
      : "text-gray-700 border border-gray-300 hover:bg-gray-100 active:bg-gray-200",
    btnDanger: isDark
      ? "text-red-400 hover:text-red-300 active:text-red-500"
      : "text-red-600 hover:text-red-500 active:text-red-700",
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Only JPG, PNG, or WEBP images are allowed");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError("Image must be smaller than 2MB");
      return;
    }

    setError("");
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const displayProfileUrl = selectedFile ? previewUrl : user?.profile_picture_url || previewUrl;

  const handleSave = async () => {
    setLoading(true);
    setError("");
    setSuccess(false);

    const token = getAccessToken();
    const previousUser = { ...user };

    // Optimistic update
    const optimisticUser = {
      ...user,
      full_name: fullName.trim(),
      username: username.trim(),
      profile_picture_url: previewUrl,
    };
    setUser(optimisticUser);

    try {
      const requests = [];

      const profilePayload = {};
      if (fullName.trim() !== user?.full_name) profilePayload.full_name = fullName.trim();
      if (username.trim() !== user?.username) profilePayload.username = username.trim();

      if (Object.keys(profilePayload).length > 0) {
        requests.push(
          fetch(`${import.meta.env.VITE_API_URL}/users/me`, {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(profilePayload),
          }).then(async (res) => {
            if (!res.ok) {
              const err = await res.json();
              throw new Error(err.detail || "Profile update failed");
            }
            return res.json();
          })
        );
      }

      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);

        requests.push(
          fetch(`${import.meta.env.VITE_API_URL}/users/me/profile-picture`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          }).then(async (res) => {
            if (!res.ok) {
              const err = await res.json();
              throw new Error(err.detail || "Image upload failed");
            }
            return res.json();
          })
        );
      }

      const results = await Promise.all(requests);

      const updatedUser = results.reduce((acc, cur) => ({ ...acc, ...cur }), optimisticUser);
      setUser(updatedUser);
      await refreshUser();

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onCancel();
      }, 800);
    } catch (err) {
      setUser(previousUser);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${theme.bg} transition-colors duration-300`}>
      {/* Backdrop with fade */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-xl animate-fade-in" />

      <div
        className={`
          relative w-[92%] max-w-md rounded-3xl p-8 
          ${theme.card} 
          animate-modal-pop
          shadow-2xl
          ${success ? 'ring-4 ring-emerald-500/30' : ''}
        `}
      >
        {/* Header */}
        <h2 className="mb-8 text-3xl font-bold tracking-tighter text-center">
          Edit Profile
        </h2>

        {/* Profile Photo Section */}
        <div className="relative mx-auto mb-10 flex justify-center">
          <div className="relative group">
            <div
              className={`
                h-32 w-32 sm:h-36 sm:w-36 rounded-full overflow-hidden 
                border-4 transition-all duration-500
                ${isDark ? "border-gray-700" : "border-gray-200"}
                group-hover:border-emerald-500 group-hover:scale-105
                shadow-xl
              `}
            >
              {displayProfileUrl ? (
                <img
                  src={displayProfileUrl}
                  alt="Profile"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              ) : (
                <div
                  className={`flex h-full w-full items-center justify-center text-6xl font-bold
                    ${isDark ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-600"}`}
                >
                  {(user?.username || "U")[0].toUpperCase()}
                </div>
              )}
            </div>

            {/* Upload Button with Ripple Effect */}
            <label
              className={`
                absolute -bottom-1 -right-1 flex h-11 w-11 items-center justify-center 
                rounded-full cursor-pointer shadow-lg border
                ${isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-300"}
                transition-all duration-200 hover:scale-110 active:scale-95
                group-hover:ring-4 group-hover:ring-emerald-500/30
              `}
            >
              <FaPhotoVideo className="text-2xl text-emerald-500" />
              <input
                type="file"
                accept={ALLOWED_TYPES.join(",")}
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>
        </div>

        {/* Success / Error Messages */}
        {success && (
          <div className="mb-6 text-emerald-500 text-sm text-center py-2 px-4 rounded-2xl bg-emerald-500/10 animate-success-pop">
            ✓ Profile updated successfully
          </div>
        )}

        {error && (
          <div className="mb-6 text-red-500 text-sm text-center bg-red-500/10 py-3 px-5 rounded-2xl animate-shake">
            {error}
          </div>
        )}

        {/* Form Inputs */}
        <div className="space-y-6">
          <div>
            <label className={`mb-2 block text-sm font-medium ${theme.label}`}>
              Display Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              className={`
                w-full rounded-2xl px-5 py-4 border ${theme.inputBorder} 
                ${theme.inputBg} ${theme.inputText} outline-none 
                transition-all duration-300 focus:scale-[1.02]
                ${theme.inputFocus}
              `}
            />
          </div>

          <div>
            <label className={`mb-2 block text-sm font-medium ${theme.label}`}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="@username"
              className={`
                w-full rounded-2xl px-5 py-4 border ${theme.inputBorder} 
                ${theme.inputBg} ${theme.inputText} outline-none 
                transition-all duration-300 focus:scale-[1.02]
                ${theme.inputFocus}
              `}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-12 flex flex-col sm:flex-row gap-4">
          <button
            onClick={logout}
            disabled={loading}
            className={`
              flex-1 py-3.5 text-sm font-medium rounded-2xl border 
              transition-all active:scale-[0.97]
              ${theme.btnDanger} ${loading ? "opacity-50 cursor-not-allowed" : ""}
            `}
          >
            Logout
          </button>

          <div className="flex flex-1 gap-3">
            <button
              onClick={onCancel}
              disabled={loading}
              className={`
                flex-1 py-3.5 text-sm font-medium rounded-2xl border 
                transition-all active:scale-[0.97]
                ${theme.btnSecondary} ${loading ? "opacity-50 cursor-not-allowed" : ""}
              `}
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              disabled={loading}
              className={`
                flex-1 py-3.5 text-sm font-semibold rounded-2xl 
                transition-all active:scale-[0.97] shadow-lg
                ${theme.btnPrimary} ${loading ? "opacity-50 cursor-not-allowed" : ""}
              `}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving...
                </span>
              ) : (
                "Save"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes modal-pop {
          from {
            opacity: 0;
            transform: scale(0.88) translateY(40px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }

        @keyframes success-pop {
          0% { transform: scale(0.8); opacity: 0; }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }

        .animate-modal-pop {
          animation: modal-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .animate-fade-in {
          animation: fade-in 0.4s ease-out forwards;
        }

        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }

        .animate-success-pop {
          animation: success-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
    </div>
  );
}