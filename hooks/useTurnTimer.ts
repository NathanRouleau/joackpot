import { useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";

type UseTurnTimerOpts = {
  isActive: boolean;        // ex: playerTurn
  durationMs: number;       // ex: 15000
  paused?: boolean;         // ex: showRules || insuranceOffered
  onExpire: () => void;     // ex: stand()
  resetKey?: any;           // ex: [currentHandIndex, lastActionAt]
  tickMs?: number;          // ex: 100
};

export function useTurnTimer({
  isActive,
  durationMs,
  paused = false,
  onExpire,
  resetKey,
  tickMs = 100,
}: UseTurnTimerOpts) {
  const [remaining, setRemaining] = useState(durationMs);
  const endAtRef = useRef<number | null>(null);
  const pausedAtRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  const run = () => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => {
      if (endAtRef.current == null) return;
      const left = Math.max(0, endAtRef.current - Date.now());
      setRemaining(left);
      if (left <= 0) {
        stop();
        endAtRef.current = null;
        onExpire();
      }
    }, tickMs);
  };

  const start = () => {
    if (endAtRef.current == null) {
      endAtRef.current = Date.now() + durationMs;
    }
    if (pausedAtRef.current != null) {
      const delta = Date.now() - pausedAtRef.current;
      endAtRef.current += delta;
      pausedAtRef.current = null;
    }
    run();
  };

  const reset = () => {
    endAtRef.current = Date.now() + durationMs;
    setRemaining(durationMs);
    if (!paused && isActive) {
      stop();
      run();
    } else {
      stop();
    }
  };

  useEffect(() => {
    if (!isActive) {
      stop();
      endAtRef.current = null;
      setRemaining(durationMs);
      return;
    }
    if (paused) {
      if (pausedAtRef.current == null) pausedAtRef.current = Date.now();
      stop();
    } else {
      start();
    }
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, paused]);

  useEffect(() => {
    if (isActive) reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") {
        if (pausedAtRef.current == null) pausedAtRef.current = Date.now();
        stop();
      } else {
        if (!paused && isActive) start();
      }
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, paused]);

  const progress = useMemo(() => 1 - remaining / durationMs, [remaining, durationMs]);

  const mmss = useMemo(() => {
    const s = Math.ceil(remaining / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }, [remaining]);

  return { remaining, progress, mmss, reset, stop, start };
}
