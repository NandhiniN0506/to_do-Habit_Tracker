export type MeditationStats = { sessions: number; minutes: number };

const KEYS = {
  pomodoros: "stats_pomodoros_completed",
  meditationSessions: "stats_meditation_sessions",
  meditationMinutes: "stats_meditation_minutes",
} as const;

function readNumber(key: string): number {
  const v = Number(localStorage.getItem(key) || 0);
  return Number.isFinite(v) ? v : 0;
}

export const LocalStats = {
  getPomodoros(): number {
    return readNumber(KEYS.pomodoros);
  },
  addPomodoro(n = 1) {
    const cur = readNumber(KEYS.pomodoros);
    localStorage.setItem(KEYS.pomodoros, String(cur + n));
  },
  getMeditation(): MeditationStats {
    return {
      sessions: readNumber(KEYS.meditationSessions),
      minutes: readNumber(KEYS.meditationMinutes),
    };
  },
  addMeditationSession(minutes: number) {
    const s = readNumber(KEYS.meditationSessions) + 1;
    const m = readNumber(KEYS.meditationMinutes) + Math.max(0, minutes);
    localStorage.setItem(KEYS.meditationSessions, String(s));
    localStorage.setItem(KEYS.meditationMinutes, String(m));
  },
};
