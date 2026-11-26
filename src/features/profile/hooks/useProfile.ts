import { useContext } from "react";
import {
  ProfileContext,
  type ProfileContextValue,
} from "../context/ProfileContext";

export function useProfile(): ProfileContextValue {
  const context = useContext(ProfileContext);

  if (!context) {
    throw new Error("useProfile debe utilizarse dentro de un ProfileProvider.");
  }

  return context;
}

