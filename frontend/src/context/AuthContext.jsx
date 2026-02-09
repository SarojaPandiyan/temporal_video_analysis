import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL
const setCookie = (name, value, days = null) => {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = `expires=${date.toUTCString()}; `;
  }
  const secure = location.protocol === "https:" ? "Secure; " : "";
  document.cookie = `${name}=${value || ""}; ${expires}path=/; SameSite=Lax; ${secure}`;
};

const getCookie = (name) => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

const eraseCookie = (name) => {
  document.cookie = `${name}=; Max-Age=-99999999; path=/; SameSite=Lax;`;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const getAccessToken = () => getCookie("access_token");
  const getRefreshToken = () => getCookie("refresh_token");

  const login = async (username, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      let errorMsg = "Login failed";
      try {
        const err = await res.json();
        if (err.detail) {
          errorMsg = Array.isArray(err.detail)
            ? err.detail.map((e) => e.msg).join(" • ")
            : err.detail;
        }
      } catch (_) {}
      throw new Error(errorMsg);
    }

    const data = await res.json();

    setCookie("access_token", data.access_token);                    // session cookie (no expiry)
    setCookie("refresh_token", data.refresh_token, 7);               // 7 days

    await fetchCurrentUser();
    setIsAuthenticated(true);

    return { success: true, user: data.user };
  };

  const logout = async () => {
    try {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        await fetch(`${API_URL}/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${refreshToken}` },
        });
      }
    } catch (_) {}

    eraseCookie("access_token");
    eraseCookie("refresh_token");

    setUser(null);
    setIsAuthenticated(false);
  };

  const fetchCurrentUser = async () => {
    const token = getAccessToken();
    if (!token) return;

    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      const data = await res.json();
      console.log("Fetched user:", data);
      setUser(data);
      setIsAuthenticated(true);
    } else {
      await refreshAccessToken();
    }
  };

  const refreshUser = async () => {
    const token = sessionStorage.getItem("access_token");
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const fresh = await res.json();
        setUser(fresh);
      }
    } catch (err) {
      console.error("Refresh user failed", err);
    }
  };


  const refreshAccessToken = async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return logout();

    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) return logout();

    const data = await res.json();
    setCookie("access_token", data.access_token);
    await fetchCurrentUser();
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        await fetchCurrentUser();
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        loading,
        setUser,
        login,
        logout,
        refreshAccessToken,
        getAccessToken,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};