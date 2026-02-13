"use client"

import { useDarkMode } from "@/hooks/use-dark-mode";

export default function Page() {
  const isDarkMode = useDarkMode();

  return (
    <div
      className={
        isDarkMode ? "text-white" : "text-gray-900"
      }
    >
      <h1 className="text-3xl mb-2">Settings</h1>
      <p
        className={
          isDarkMode ? "text-gray-400" : "text-gray-600"
        }
      >
        Configure your account and preferences
      </p>
    </div>
  );
}
