"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { SIMULATION_WEEK } from "@/lib/simulationData";

const SimulationContext = createContext(null);

export function useSimulation() {
  const ctx = useContext(SimulationContext);
  if (!ctx) throw new Error("useSimulation must be used within SimulationProvider");
  return ctx;
}

export function SimulationProvider({ children }) {
  const [active, setActive] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [currentDay, setCurrentDay] = useState(0);
  const [currentHour, setCurrentHour] = useState(6);
  const [currentMinute, setCurrentMinute] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);
  const [firedEvents, setFiredEvents] = useState(new Set());
  const [latestEvent, setLatestEvent] = useState(null);

  const intervalRef = useRef(null);

  // Clear interval on unmount
  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  // Timer effect
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!active || !playing) return;

    const ms = Math.max(50, 1000 / speed);

    intervalRef.current = setInterval(() => {
      setCurrentMinute((prevMin) => {
        let nextMin = prevMin + 1;
        if (nextMin >= 60) {
          nextMin = 0;
          setCurrentHour((prevHour) => {
            let nextHour = prevHour + 1;
            if (nextHour >= 24) {
              nextHour = 0;
              setCurrentDay((prevDay) => {
                const nextDay = prevDay + 1;
                if (nextDay >= 7) {
                  // Loop back or stop
                  setPlaying(false);
                  return 0;
                }
                setFiredEvents(new Set());
                return nextDay;
              });
            }
            return nextHour;
          });
        }
        return nextMin;
      });
    }, ms);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [active, playing, speed]);

  // Check for event triggers
  useEffect(() => {
    if (!active) return;
    const dayData = SIMULATION_WEEK[currentDay];
    if (!dayData) return;

    const currentTimeDecimal = currentHour + currentMinute / 60;

    dayData.events.forEach((evt) => {
      const eventKey = `${currentDay}-${evt.time}`;
      if (!firedEvents.has(eventKey) && currentTimeDecimal >= evt.hour) {
        setFiredEvents((prev) => new Set(prev).add(eventKey));
        setLatestEvent({ ...evt, dayIndex: currentDay });
        // Auto-clear latest event notification after 5s
        setTimeout(() => {
          setLatestEvent((curr) => {
            if (curr && curr.time === evt.time && curr.dayIndex === currentDay) return null;
            return curr;
          });
        }, 5000);
      }
    });
  }, [active, currentDay, currentHour, currentMinute, firedEvents]);

  const startSimulation = useCallback(() => {
    setActive(true);
    setPlaying(true);
    setCurrentDay(0);
    setCurrentHour(6);
    setCurrentMinute(0);
    setFiredEvents(new Set());
    setLatestEvent(null);
    setPanelOpen(true);
  }, []);

  // Salta directamente a un momento de estrés alto (miércoles 15:00 — conflicto con amiga)
  const triggerStressEvent = useCallback(() => {
    setActive(true);
    setPlaying(true);
    setCurrentDay(2); // Miércoles — día con pico de estrés 80
    setCurrentHour(14);
    setCurrentMinute(45);
    setFiredEvents(new Set());
    setLatestEvent(null);
    setPanelOpen(false); // Ocultar panel para ver el dashboard en vivo
  }, []);

  const stopSimulation = useCallback(() => {
    setActive(false);
    setPlaying(false);
    setCurrentDay(0);
    setCurrentHour(6);
    setCurrentMinute(0);
    setFiredEvents(new Set());
    setLatestEvent(null);
    setPanelOpen(false);
  }, []);

  const togglePlay = useCallback(() => {
    setPlaying((p) => !p);
  }, []);

  const jumpToDay = useCallback((dayIndex) => {
    setCurrentDay(Math.max(0, Math.min(6, dayIndex)));
    setCurrentHour(6);
    setCurrentMinute(0);
    setFiredEvents(new Set());
    setLatestEvent(null);
  }, []);

  const jumpToHour = useCallback((hour) => {
    setCurrentHour(Math.max(0, Math.min(23, Math.floor(hour))));
    setCurrentMinute(Math.round((hour % 1) * 60));
  }, []);

  // Interpolate stress/BPM between hourly datapoints
  const getCurrentSimData = useCallback(() => {
    const dayData = SIMULATION_WEEK[currentDay];
    if (!dayData) return { stress: 20, bpm: 72, sleeping: false };

    const hourly = dayData.hourlyData;
    const h = currentHour;
    const t = currentMinute / 60;

    const current = hourly[h] || { stress: 20, bpm: 72, sleeping: false };
    const next = hourly[Math.min(23, h + 1)] || current;

    return {
      stress: Math.round(current.stress + (next.stress - current.stress) * t),
      bpm: Math.round(current.bpm + (next.bpm - current.bpm) * t),
      sleeping: current.sleeping,
    };
  }, [currentDay, currentHour, currentMinute]);

  // Get events that have already fired (for timeline display)
  const getVisibleEvents = useCallback(() => {
    const dayData = SIMULATION_WEEK[currentDay];
    if (!dayData) return [];
    const currentTimeDecimal = currentHour + currentMinute / 60;
    return dayData.events.filter((evt) => currentTimeDecimal >= evt.hour);
  }, [currentDay, currentHour, currentMinute]);

  // Get hourly data up to current time (for progressive chart)
  const getProgressiveHourlyData = useCallback(() => {
    const dayData = SIMULATION_WEEK[currentDay];
    if (!dayData) return [];
    return dayData.hourlyData.map((hd, i) => {
      if (i <= currentHour) return hd;
      return { ...hd, stress: null, bpm: null };
    });
  }, [currentDay, currentHour]);

  // Get weekly summary with simulation data
  const getSimWeeklyData = useCallback(() => {
    return SIMULATION_WEEK.map((d, i) => ({
      day: d.dayShort,
      avgStress: d.summary.avgStress,
      isToday: i === currentDay,
    }));
  }, [currentDay]);

  const getTimeLabel = useCallback(() => {
    const dayData = SIMULATION_WEEK[currentDay];
    const dayName = dayData ? dayData.day : "Lunes";
    const hh = String(currentHour).padStart(2, "0");
    const mm = String(currentMinute).padStart(2, "0");
    return `${dayName} ${hh}:${mm}`;
  }, [currentDay, currentHour, currentMinute]);

  const value = {
    // State
    active,
    playing,
    speed,
    currentDay,
    currentHour,
    currentMinute,
    panelOpen,
    latestEvent,
    weekData: SIMULATION_WEEK,

    // Setters
    setSpeed,
    setPanelOpen,

    // Actions
    startSimulation,
    stopSimulation,
    triggerStressEvent,
    togglePlay,
    jumpToDay,
    jumpToHour,

    // Computed
    getCurrentSimData,
    getVisibleEvents,
    getProgressiveHourlyData,
    getSimWeeklyData,
    getTimeLabel,
  };

  return (
    <SimulationContext.Provider value={value}>
      {children}
    </SimulationContext.Provider>
  );
}
