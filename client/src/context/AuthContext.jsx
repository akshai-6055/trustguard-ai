import { createContext, useContext, useState, useEffect } from "react";
import axiosInstance from "../services/axiosInstance";

import {
    generateDeviceFingerprint,
    getBrowserName,
    getOSName,
    getDeviceName
} from "../utils/deviceFingerprint";
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(true);

  // Verify authentication state on initial application load
  useEffect(() => {
    const checkAuthStatus = async () => {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        try {
          const response = await axiosInstance.get("/users/profile");
          if (response.data.success) {
            setUser(response.data.user);
            localStorage.setItem("user", JSON.stringify(response.data.user));
          }
        } catch (err) {
          console.error("Session verification failed:", err.message);
          logout();
        }
      } else {
        setUser(null);
        setToken(null);
      }
      setLoading(false);
    };

    checkAuthStatus();
  }, []);

  // Update user in local state & localStorage
  const updateUser = (updatedUser) => {
    const newUser = { ...user, ...updatedUser };
    setUser(newUser);
    localStorage.setItem("user", JSON.stringify(newUser));
  };

  // Login Function
  // Login Function
const login = async (email, password) => {
    try {

        // Generate device information automatically
        const fingerprint = await generateDeviceFingerprint();
        const browser = getBrowserName();
        const os = getOSName();
        const device_name = getDeviceName();

        let location = "Unknown";
        try {
            const coords = await new Promise((resolve) => {
                if (!navigator.geolocation) return resolve(null);
                navigator.geolocation.getCurrentPosition(
                    (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
                    (err) => resolve(null),
                    { timeout: 5000 }
                );
            });

            if (coords) {
                const osmRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lon}`);
                const osmData = await osmRes.json();
                if (osmData && osmData.address) {
                    const city = osmData.address.city || osmData.address.town || osmData.address.village || osmData.address.county || "";
                    const state = osmData.address.state || "";
                    location = [city, state].filter(Boolean).join(", ");
                }
            }

            if (!location || location === "Unknown" || location.trim() === "") {
                const locRes = await fetch("https://ipinfo.io/json");
                const locData = await locRes.json();
                if (locData.city && locData.region) {
                    location = `${locData.city}, ${locData.region}`;
                }
            }
        } catch (e) {
            console.error("Failed to fetch location", e);
            if (!location || location === "") location = "Unknown";
        }

        console.log("Device Fingerprint:", fingerprint);
        console.log("Browser:", browser);
        console.log("OS:", os);
        console.log("Location:", location);

        const response = await axiosInstance.post(
            "/auth/login",
            {
                email,
                password,
                fingerprint,
                browser,
                os,
                device_name,
                location
            }
        );

        if (response.data.success) {

            const {
                token: newToken,
                user: userData
            } = response.data;

            localStorage.setItem(
                "token",
                newToken
            );

            localStorage.setItem(
                "user",
                JSON.stringify(userData)
            );

            setToken(newToken);
            setUser(userData);

            return {
                success: true,
                message: response.data.message,
                user: userData,
                device: response.data.device
            };
        }

        return {
            success: false,
            message: response.data.message || "Login failed."
        };

    } catch (error) {

        console.error("Login error:", error);

        const errorMessage =
            error.response?.data?.message ||
            "Login failed. Please try again.";

        return {
            success: false,
            message: errorMessage
        };
    }
};
// Admin Login Function
const adminLogin = async (email, password) => {
    try {
        const fingerprint = await generateDeviceFingerprint();
        const browser = getBrowserName();
        const os = getOSName();
        const device_name = getDeviceName();

        let location = "Unknown";
        try {
            const coords = await new Promise((resolve) => {
                if (!navigator.geolocation) return resolve(null);
                navigator.geolocation.getCurrentPosition(
                    (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
                    (err) => resolve(null),
                    { timeout: 5000 }
                );
            });

            if (coords) {
                const osmRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lon}`);
                const osmData = await osmRes.json();
                if (osmData && osmData.address) {
                    const city = osmData.address.city || osmData.address.town || osmData.address.village || osmData.address.county || "";
                    const state = osmData.address.state || "";
                    location = [city, state].filter(Boolean).join(", ");
                }
            }

            if (!location || location === "Unknown" || location.trim() === "") {
                const locRes = await fetch("https://ipinfo.io/json");
                const locData = await locRes.json();
                if (locData.city && locData.region) {
                    location = `${locData.city}, ${locData.region}`;
                }
            }
        } catch (e) {
            console.error("Failed to fetch location", e);
            if (!location || location === "") location = "Unknown";
        }

        const response = await axiosInstance.post(
            "/auth/admin-login",
            { email, password, fingerprint, browser, os, device_name, location }
        );

        if (response.data.success) {
            const { token: newToken, user: userData } = response.data;
            localStorage.setItem("token", newToken);
            localStorage.setItem("user", JSON.stringify(userData));
            setToken(newToken);
            setUser(userData);
            return {
                success: true,
                message: response.data.message,
                user: userData,
                device: response.data.device
            };
        }
        return {
            success: false,
            message: response.data.message || "Admin Login failed."
        };
    } catch (error) {
        console.error("Admin Login error:", error);
        const errorMessage = error.response?.data?.message || "Admin Login failed. Please try again.";
        return {
            success: false,
            message: errorMessage
        };
    }
};


  // Register Function
  const register = async (userData) => {
    try {
      const response = await axiosInstance.post("/auth/register", userData);
      return { success: true, message: response.data.message };
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Registration failed. Please try again.";
      return { success: false, message: errorMessage };
    }
  };

  // Logout Function
  const logout = () => {
    try {
      axiosInstance.post("/auth/logout").catch(() => {});
    } catch (e) {
      // Ignore network errors on logout
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        login,
        adminLogin,
        register,
        logout,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to consume AuthContext easily
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
