"use client";

import React, { useState } from "react";
import { TweaksProvider } from "@/context/tweaksContext";
import DashboardShell from "@/components/DashboardShell";
import LandingPage from "@/components/LandingPage";

export default function Home() {
  const [view, setView] = useState<"landing" | "dashboard">("landing");

  return (
    <TweaksProvider>
      {view === "landing" ? (
        <LandingPage onLaunchPlatform={() => setView("dashboard")} />
      ) : (
        <DashboardShell onBackToLanding={() => setView("landing")} />
      )}
    </TweaksProvider>
  );
}
