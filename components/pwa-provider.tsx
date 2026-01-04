"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstallPrompt, setShowIOSInstallPrompt] = useState(false);
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

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

          // Check if there's already a waiting worker
          if (registration.waiting) {
            setWaitingWorker(registration.waiting);
            setShowUpdateBanner(true);
          }

          // Check for updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  // New service worker available, show update banner
                  console.log("New service worker available");
                  setWaitingWorker(newWorker);
                  setShowUpdateBanner(true);
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

  const handleUpdate = () => {
    if (waitingWorker) {
      // Tell the waiting worker to skip waiting and become active
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
      setShowUpdateBanner(false);
    }
  };

  return (
    <>
      {children}
      
      {/* Update Available Banner */}
      {showUpdateBanner && (
        <div className="fixed top-0 left-0 right-0 bg-primary text-primary-foreground p-3 z-50 shadow-lg">
          <div className="flex items-center justify-between gap-4 max-w-screen-lg mx-auto">
            <div className="flex-1">
              <p className="text-sm font-medium">A new version is available!</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleUpdate}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Update Now
              </Button>
              <button
                onClick={() => setShowUpdateBanner(false)}
                className="text-primary-foreground hover:opacity-80 p-1"
                aria-label="Dismiss update"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS Install Prompt */}
      {showIOSInstallPrompt && (
        <div className="fixed bottom-0 left-0 right-0 bg-primary text-primary-foreground p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] z-50 md:hidden">
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

