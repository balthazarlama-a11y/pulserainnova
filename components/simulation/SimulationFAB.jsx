"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSimulation } from "@/lib/simulationContext";

export default function SimulationFAB() {
  const {
    active, playing, panelOpen, setPanelOpen,
    startSimulation, triggerStressEvent, togglePlay, stopSimulation, getTimeLabel,
  } = useSimulation();
  const pathname = usePathname();
  const [isCompact, setIsCompact] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(max-width: 768px)");
    const update = () => setIsCompact(media.matches);
    update();
    media.addEventListener("change", update);

    const handleImmersive = (e) => setIsHidden(e.detail);
    window.addEventListener("immersive-mode-change", handleImmersive);

    return () => {
      media.removeEventListener("change", update);
      window.removeEventListener("immersive-mode-change", handleImmersive);
    };
  }, []);

  return null;
}
