import { createContext, useContext } from "react";

export const GOLD = "#C9A227";
export const BRONZE = "#8A5A22";
export const INK = "#0D0C09";
export const PANEL = "#171309";
export const CREAM = "#F5F0E1";
export const MUTED = "#B4A780";

export const LangContext = createContext();
export const useLang = () => useContext(LangContext);
