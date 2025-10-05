import { useState, useEffect } from "react";
import apiInstance from "../utils/axios";
import UserData from "./UserData";

export default function UserProfileData() {
  const [profile, setProfile] = useState(null); // null for loading/empty, not []
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const userData = UserData();

  useEffect(() => {
    const fetchProfile = async () => {
      const userId = userData?.user_id;

      // ✅ CORE GUARD: Skip fetch if no valid user ID (guest or invalid)
      if (!userId || isNaN(Number(userId)) || Number(userId) <= 0) {
        console.log("Profile fetch skipped: Invalid user ID", userId);
        setProfile(null);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await apiInstance.get(`user/profile/${userId}/`);
        setProfile(res.data);
        console.log("Profile loaded:", res.data);
      } catch (err) {
        console.error("Profile fetch error:", err);
        setError(err.response?.data?.detail || "Failed to load profile");
        setProfile(null);
        // Optional: If 401, trigger logout (import { logout } from "../utils/auth")
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userData?.user_id]); // ✅ Dep on user_id: Refetches on login/logout, skips re-runs if stable

  // Return object for easier consumption (loading, error states)
  return { profile, loading, error };
}
