"use client";

import { useEffect, useState } from "react";

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstallPrompt, setShowIOSInstallPrompt] = useState(false);

  useEffect(() => {
    // Check if running on iOS
    const isIOSDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIsIOS(isIOSDevice);

    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        })
        .then((registration) => {
          console.log("Service Worker registered:", registration.scope);

          // Check for updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  // New service worker available, prompt user to refresh
                  console.log("New service worker available");
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error);
        });

      // Listen for controller changes (when new SW takes control)
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        window.location.reload();
      });
    }

    // Show iOS install prompt if needed
    if (isIOSDevice) {
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true;
      if (!isStandalone) {
        setShowIOSInstallPrompt(true);
      }
    }
  }, []);

  return (
    <>
      {children}
      {showIOSInstallPrompt && (
        <div className="fixed bottom-0 left-0 right-0 bg-primary text-primary-foreground p-4 z-50 md:hidden">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium">Install Budgie</p>
              <p className="text-xs opacity-90">
                Tap the share button and select "Add to Home Screen"
              </p>
            </div>
            <button
              onClick={() => setShowIOSInstallPrompt(false)}
              className="text-primary-foreground hover:opacity-80"
              aria-label="Close install prompt"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}

