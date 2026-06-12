import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OnboardingClient from "@/components/onboarding/OnboardingClient";

export const metadata = {
  title: "Onboarding | CalmBand"
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function OnboardingPage() {
  return <OnboardingClient />;
}
