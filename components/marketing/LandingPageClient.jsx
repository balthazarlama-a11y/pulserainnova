"use client";

import { useRouter } from "next/navigation";
import LandingPage from "@/components/marketing/landing";

export default function LandingPageClient() {
  const router = useRouter();

  return (
    <LandingPage
      onSignUp={() => router.push("/sign-up")}
      onSignIn={() => router.push("/sign-in")}
      onTalk={() => router.push("/sign-up")}
    />
  );
}
