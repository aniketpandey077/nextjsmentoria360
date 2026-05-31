"use client";
// Shared coaching selection for all student routes (layout → pages).

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import { getStudentCoachings } from "../services/firestoreService";

const StudentCoachingContext = createContext(null);

function coachingIdsKey(profile) {
  if (!profile) return "";
  if (profile.coachingIds?.length) {
    return [...profile.coachingIds].sort().join(",");
  }
  return profile.coachingId || "";
}

export function StudentCoachingProvider({ children }) {
  const { profile } = useAuth();
  const [coachings, setCoachings] = useState([]);
  const [activeCoachingId, setActiveCoachingId] = useState(null);
  const [loadingCoachings, setLoadingCoachings] = useState(true);

  const idsKey = useMemo(() => coachingIdsKey(profile), [profile]);

  const reloadCoachings = useCallback(async () => {
    if (!profile) {
      setCoachings([]);
      setActiveCoachingId(null);
      setLoadingCoachings(false);
      return;
    }
    setLoadingCoachings(true);
    try {
      const list = await getStudentCoachings(profile);
      setCoachings(list);
      setActiveCoachingId((prev) => {
        if (prev && list.some((c) => c.id === prev)) return prev;
        return list[0]?.id ?? null;
      });
    } catch {
      setCoachings([]);
      setActiveCoachingId(null);
    } finally {
      setLoadingCoachings(false);
    }
  }, [profile]);

  useEffect(() => {
    reloadCoachings();
  }, [profile?.uid, idsKey, reloadCoachings]);

  return (
    <StudentCoachingContext.Provider
      value={{
        coachings,
        setCoachings,
        activeCoachingId,
        setActiveCoachingId,
        loadingCoachings,
        reloadCoachings,
      }}
    >
      {children}
    </StudentCoachingContext.Provider>
  );
}

export function useStudentCoaching() {
  const ctx = useContext(StudentCoachingContext);
  if (!ctx) {
    throw new Error("useStudentCoaching must be used within StudentCoachingProvider");
  }
  return ctx;
}
