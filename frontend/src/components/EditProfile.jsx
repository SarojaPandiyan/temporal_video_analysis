import { useState } from "react";
import { FaPhotoVideo } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function EditProfile({ onCancel, isDark }) {
  const { user, setUser, logout, getAccessToken } = useAuth();

  const [fullName, setFullName] = useState(user?.full_name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [previewUrl, setPreviewUrl] = useState(user?.profile_picture_url || "");
  const [selectedFile, setSelectedFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const theme = {
    bg: isDark ? "bg-black" : "bg-white",
    card: isDark
      ? "bg-[#1f1f1f] border border-gray-800 text-white"
      : "bg-white border border-gray-200 shadow-2xl text-black",
    text: isDark ? "text-gray-100" : "text-gray-900",
    label: isDark ? "text-gray-400" : "text-gray-600",
    inputBg: isDark ? "bg-gray-900/60" : "bg-gray-50",
    inputBorder: isDark ? "border-gray-700" : "border-gray-300",
    inputText: isDark
      ? "text-gray-100 placeholder:text-gray-500"
      : "text-gray-900 placeholder:text-gray-400",
    inputFocus: isDark
      ? "focus:border-gray-400 focus:ring-gray-500/30"
      : "focus:border-gray-500 focus:ring-gray-400/20",
    btnPrimary: isDark
      ? "bg-white text-black hover:bg-gray-200"
      : "bg-black text-white hover:bg-gray-800",
    btnSecondary: isDark
      ? "text-gray-300 border border-gray-700 hover:bg-gray-800"
      : "text-gray-700 border border-gray-300 hover:bg-gray-100",
    btnDanger: isDark
      ? "text-red-400 hover:text-red-300"
      : "text-red-600 hover:text-red-500",
    disabled: "opacity-50 cursor-not-allowed",
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

  const handleSave = async () => {
    setLoading(true);
    setError("");

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

      // 1. Text profile update
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

      // 2. Profile picture upload
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);

        requests.push(
          fetch(`${import.meta.env.VITE_API_URL}/users/me/profile-picture`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
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

      // Run parallel
      const results = await Promise.all(requests);

      // Merge real data from backend
      const updatedUser = results.reduce((acc, cur) => ({ ...acc, ...cur }), optimisticUser);
      setUser(updatedUser);

      onCancel(); // close modal
    } catch (err) {
      setUser(previousUser); // rollback
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${theme.bg} transition-colors duration-300`}
    >
      <div
        className={`w-[90%] max-w-md rounded-2xl p-8 ${theme.card} transition-all duration-300`}
      >
        {/* Header */}
        <h2 className="mb-8 text-2xl font-bold tracking-tight text-center">
          Edit Profile
        </h2>

        {/* Profile Photo */}
        <div className="relative mx-auto mb-8 h-28 w-28 sm:h-32 sm:w-32 group">
          <div
            className={`h-full w-full rounded-full overflow-hidden border-2
            ${isDark ? "border-gray-700" : "border-gray-300"}
            transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg`}
          >
            {previewUrl ? (
              <img src={previewUrl} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <div
                className={`flex h-full w-full items-center justify-center text-4xl font-bold
                ${isDark ? "bg-gray-800 text-gray-300" : "bg-gray-200 text-gray-700"}`}
              >
                {(user?.username || "U")[0].toUpperCase()}
              </div>
            )}
          </div>

          {/* Upload overlay */}
          <label
            className={`absolute bottom-0 right-0 rounded-full p-3 cursor-pointer shadow-md
            ${isDark ? "bg-gray-800 text-white" : "bg-white text-black"}
            border ${isDark ? "border-gray-700" : "border-gray-300"}
            transition-all duration-200 hover:scale-110 hover:shadow-lg`}
          >
            <FaPhotoVideo className="text-xl" />
            <input
              type="file"
              accept={ALLOWED_TYPES.join(",")}
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 text-red-500 text-sm text-center bg-red-500/10 py-2 px-4 rounded-lg">
            {error}
          </div>
        )}

        {/* Inputs */}
        <div className="space-y-6">
          <div>
            <label className={`mb-2 block text-sm font-medium ${theme.label}`}>
              Display Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your display name"
              className={`w-full rounded-lg px-4 py-3 border ${theme.inputBorder} ${theme.inputBg} ${theme.inputText} outline-none transition-all duration-200 ${theme.inputFocus}`}
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
              placeholder="@yourusername"
              className={`w-full rounded-lg px-4 py-3 border ${theme.inputBorder} ${theme.inputBg} ${theme.inputText} outline-none transition-all duration-200 ${theme.inputFocus}`}
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row sm:justify-between gap-4">
          <button
            onClick={logout}
            disabled={loading}
            className={`px-6 py-2.5 text-sm font-medium rounded-full border transition-colors ${theme.btnDanger} ${loading ? theme.disabled : ""}`}
          >
            Logout
          </button>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-3">
            <button
              onClick={onCancel}
              disabled={loading}
              className={`px-6 py-2.5 text-sm font-medium rounded-full border transition-colors ${theme.btnSecondary} ${loading ? theme.disabled : ""}`}
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              disabled={loading}
              className={`px-7 py-2.5 text-sm font-semibold rounded-full transition-all ${theme.btnPrimary} ${loading ? theme.disabled : ""}`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving...
                </span>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}