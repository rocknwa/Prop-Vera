import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { UserProfile, DashboardMetrics } from "@/lib/types";

export function useUserProfile() {
  const { address, isConnected } = useAccount();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!isConnected || !address) {
      setProfile(null);
      setMetrics(null);
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        // TODO: Replace with actual API call
        const response = await fetch(`/api/users/${address}`);
        if (!response.ok) throw new Error("Failed to fetch profile");
        
        const data = await response.json();
        setProfile(data.profile);
        setMetrics(data.metrics);
      } catch (err) {
        setError(err as Error);
        console.error("Error fetching user profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [isConnected, address]);

  return { profile, metrics, loading, error, isConnected };
}
