import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'syntaxlab_teams';

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveToStorage(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function useTeams(seedTeams) {
  const [activeTeams, setActiveTeams] = useState([]);
  const [completedTeams, setCompletedTeams] = useState([]);

  // Hydrate from localStorage or seed
  useEffect(() => {
    const stored = loadFromStorage();
    if (stored) {
      setActiveTeams(stored.activeTeams || []);
      setCompletedTeams(stored.completedTeams || []);
    } else {
      setActiveTeams(seedTeams || []);
      setCompletedTeams([]);
    }
  }, []);

  // Persist on every change
  useEffect(() => {
    saveToStorage({ activeTeams, completedTeams });
  }, [activeTeams, completedTeams]);

  // Add a team
  const addTeam = useCallback((name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setActiveTeams(prev => [...prev, trimmed]);
  }, []);

  // Delete a team from active
  const deleteTeam = useCallback((name) => {
    setActiveTeams(prev => prev.filter(t => t !== name));
  }, []);

  // Mark a team as completed (move from active → completed)
  const completeTeam = useCallback((name) => {
    setActiveTeams(prev => prev.filter(t => t !== name));
    setCompletedTeams(prev => [...prev, name]);
  }, []);

  // Reset: move all completed back to active
  const resetSession = useCallback(() => {
    setActiveTeams(prev => [...prev, ...completedTeams]);
    setCompletedTeams([]);
  }, [completedTeams]);

  return { activeTeams, completedTeams, addTeam, deleteTeam, completeTeam, resetSession };
}
