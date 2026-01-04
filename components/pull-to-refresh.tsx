"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  className?: string;
}

const THRESHOLD = 80; // Minimum pull distance to trigger refresh
const MAX_PULL = 120; // Maximum pull distance for visual feedback

export function PullToRefresh({ children, onRefresh, className }: PullToRefreshProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isPulling = useRef(false);

  // Detect mobile/tablet devices
  useEffect(() => {
    const checkMobile = () => {
      const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(isTouchDevice && isSmallScreen);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Find the scroll parent (main element with overflow-y-auto)
  const getScrollParent = useCallback((): HTMLElement | null => {
    let element = containerRef.current?.parentElement;
    while (element) {
      const style = window.getComputedStyle(element);
      if (style.overflowY === "auto" || style.overflowY === "scroll") {
        return element;
      }
      element = element.parentElement;
    }
    return null;
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (isRefreshing) return;
    
    const scrollParent = getScrollParent();
    const scrollTop = scrollParent?.scrollTop ?? 0;
    
    // Only start pull if at the top of the scroll
    if (scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  }, [isRefreshing, getScrollParent]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling.current || isRefreshing) return;

    const scrollParent = getScrollParent();
    const scrollTop = scrollParent?.scrollTop ?? 0;
    
    // If user has scrolled down, stop pull-to-refresh mode
    if (scrollTop > 0) {
      isPulling.current = false;
      setPullDistance(0);
      return;
    }

    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;

    if (diff > 0) {
      // Apply resistance to the pull
      const resistance = 0.5;
      const resistedPull = Math.min(diff * resistance, MAX_PULL);
      setPullDistance(resistedPull);

      // Prevent default scrolling when pulling down
      if (resistedPull > 10) {
        e.preventDefault();
      }
    } else {
      // User is scrolling up, disable pull mode
      isPulling.current = false;
      setPullDistance(0);
    }
  }, [isRefreshing, getScrollParent]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current) return;
    isPulling.current = false;

    if (pullDistance >= THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(60); // Keep indicator visible during refresh
      
      try {
        await onRefresh();
      } catch (error) {
        console.error("Refresh failed:", error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, isRefreshing, onRefresh]);

  useEffect(() => {
    if (!isMobile) return;

    // Use document-level touch events for better detection
    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isMobile, handleTouchStart, handleTouchMove, handleTouchEnd]);

  const progress = Math.min(pullDistance / THRESHOLD, 1);
  const shouldTrigger = pullDistance >= THRESHOLD;

  return (
    <div 
      ref={containerRef} 
      className={cn("relative", className)}
    >
      {/* Pull indicator */}
      {isMobile && (pullDistance > 0 || isRefreshing) && (
        <div 
          className="fixed left-0 right-0 flex items-center justify-center pointer-events-none z-50"
          style={{ 
            top: `calc(env(safe-area-inset-top, 0px) + 60px + ${Math.min(pullDistance, 60)}px)`,
            transition: isPulling.current ? "none" : "top 0.2s ease-out",
          }}
        >
          <div 
            className={cn(
              "flex items-center justify-center rounded-full shadow-lg",
              "w-10 h-10 transition-all duration-200",
              shouldTrigger || isRefreshing 
                ? "bg-primary text-primary-foreground" 
                : "bg-card border border-border text-muted-foreground"
            )}
            style={{
              opacity: Math.max(progress, isRefreshing ? 1 : 0),
              transform: `scale(${0.6 + progress * 0.4})`,
            }}
          >
            <RefreshCw 
              className={cn(
                "h-5 w-5 transition-transform",
                isRefreshing && "animate-spin"
              )} 
              style={{
                transform: isRefreshing ? undefined : `rotate(${progress * 180}deg)`,
              }}
            />
          </div>
        </div>
      )}

      {/* Content with transform for pull effect */}
      <div 
        style={{ 
          transform: isMobile && (pullDistance > 0 || isRefreshing) 
            ? `translateY(${pullDistance}px)` 
            : "translateY(0)",
          transition: isPulling.current ? "none" : "transform 0.2s ease-out",
        }}
      >
        {children}
      </div>
    </div>
  );
}
