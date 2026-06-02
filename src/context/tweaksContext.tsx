"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface AccentOption {
  hex: string;
  light: string;
}

export const ACCENTS: AccentOption[] = [
  { hex: "#1d4e82", light: "#e8f0f7" }, // Navy
  { hex: "#1c6072", light: "#e6f1f4" }, // Teal
  { hex: "#45506b", light: "#ebedf2" }, // Slate
  { hex: "#7c2f3c", light: "#f4e9eb" }  // Burgundy
];

interface TweaksContextType {
  accent: string;
  density: "default" | "dense";
  displayType: "serif" | "sans";
  setAccent: (hex: string) => void;
  setDensity: (density: "default" | "dense") => void;
  setDisplayType: (type: "serif" | "sans") => void;
}

const TweaksContext = createContext<TweaksContextType | undefined>(undefined);

export function TweaksProvider({ children }: { children: React.ReactNode }) {
  const [accent, setAccentState] = useState("#1d4e82");
  const [density, setDensityState] = useState<"default" | "dense">("default");
  const [displayType, setDisplayTypeState] = useState<"serif" | "sans">("serif");

  useEffect(() => {
    // Apply accent to CSS variables
    const selected = ACCENTS.find(a => a.hex === accent) || ACCENTS[0];
    document.documentElement.style.setProperty("--accent", selected.hex);
    document.documentElement.style.setProperty("--accent-l", selected.light);
  }, [accent]);

  useEffect(() => {
    // Apply density class to body
    if (density === "dense") {
      document.body.classList.add("dense");
    } else {
      document.body.classList.remove("dense");
    }
  }, [density]);

  useEffect(() => {
    // Apply type class to body
    if (displayType === "sans") {
      document.body.classList.add("type-sans");
    } else {
      document.body.classList.remove("type-sans");
    }
  }, [displayType]);

  const setAccent = (hex: string) => setAccentState(hex);
  const setDensity = (d: "default" | "dense") => setDensityState(d);
  const setDisplayType = (t: "serif" | "sans") => setDisplayTypeState(t);

  return (
    <TweaksContext.Provider
      value={{
        accent,
        density,
        displayType,
        setAccent,
        setDensity,
        setDisplayType
      }}
    >
      {children}
    </TweaksContext.Provider>
  );
}

export function useTweaks() {
  const context = useContext(TweaksContext);
  if (!context) {
    throw new Error("useTweaks must be used within a TweaksProvider");
  }
  return context;
}
