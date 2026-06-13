"use client";

import { PeopleProvider } from "@/lib/peopleContext";

export default function ClientProviders({ children }) {
  return <PeopleProvider>{children}</PeopleProvider>;
}
