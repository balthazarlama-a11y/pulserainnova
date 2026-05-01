"use client";

import { SimulationProvider } from "@/lib/simulationContext";
import SimulationFAB from "@/components/simulation/SimulationFAB";
import SimulationPanel from "@/components/simulation/SimulationPanel";

export default function ClientProviders({ children }) {
  return (
    <SimulationProvider>
      {children}
      <SimulationFAB />
      <SimulationPanel />
    </SimulationProvider>
  );
}
