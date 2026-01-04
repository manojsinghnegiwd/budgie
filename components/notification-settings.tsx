"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  subscribeUser,
  unsubscribeUser,
  sendNotification,
} from "@/app/actions/notifications";
import { useUser } from "@/components/user-provider";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function NotificationSettings() {
  const { selectedUserId } = useUser();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    async function checkSubscription() {
      if ("serviceWorker" in navigator && "PushManager" in window) {
        setIsSupported(true);
        
        // Check notification permission
        if ("Notification" in window) {
          setPermission(Notification.permission);
        }

        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          setIsSubscribed(!!subscription);
        } catch (error) {
          console.error("Error checking subscription:", error);
        }
      }
      setIsLoading(false);
    }
    checkSubscription();
  }, []);

  async function handleToggle(enabled: boolean) {
    setIsLoading(true);

    try {
      if (enabled) {
        // Request notification permission
        if ("Notification" in window) {
          const permission = await Notification.requestPermission();
          setPermission(permission);
          
          if (permission !== "granted") {
            setIsLoading(false);
            return;
          }
        }

        // Subscribe to push notifications
        const registration = await navigator.serviceWorker.ready;
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        
        if (!vapidPublicKey) {
          console.error("VAPID public key not configured");
          setIsLoading(false);
          return;
        }

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
        });

        // Convert ArrayBuffer keys to base64url strings
        const p256dhKey = subscription.getKey("p256dh");
        const authKey = subscription.getKey("auth");
        
        const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
          const bytes = new Uint8Array(buffer);
          let binary = "";
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          // Convert to base64 and then to base64url (replace + with -, / with _, remove =)
          return btoa(binary)
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=/g, "");
        };

        const serializedSub = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(p256dhKey!),
            auth: arrayBufferToBase64(authKey!),
          },
        };

        const result = await subscribeUser(serializedSub, selectedUserId || undefined);
        if (result.success) {
          setIsSubscribed(true);
        }
      } else {
        // Unsubscribe from push notifications
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
          await subscription.unsubscribe();
          await unsubscribeUser(subscription.endpoint);
          setIsSubscribed(false);
        }
      }
    } catch (error) {
      console.error("Error toggling notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleTestNotification() {
    if (!isSubscribed) return;

    try {
      await sendNotification(
        "Test Notification",
        "This is a test notification from Budgie!",
        {
          userId: selectedUserId || undefined,
          url: "/",
        }
      );
    } catch (error) {
      console.error("Error sending test notification:", error);
    }
  }

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Push Notifications</CardTitle>
          <CardDescription>
            Push notifications are not supported in this browser
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Push Notifications</CardTitle>
        <CardDescription>
          Get reminders for bills and budget alerts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isSubscribed ? (
              <Bell className="h-5 w-5 text-primary" />
            ) : (
              <BellOff className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <Label htmlFor="notifications" className="text-base font-medium">
                Enable Push Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                {permission === "granted"
                  ? "Notifications are allowed"
                  : permission === "denied"
                  ? "Notifications are blocked. Please enable them in your browser settings."
                  : "Click to enable notifications"}
              </p>
            </div>
          </div>
          <Switch
            id="notifications"
            checked={isSubscribed}
            onCheckedChange={handleToggle}
            disabled={isLoading || permission === "denied"}
          />
        </div>
        {isSubscribed && (
          <Button
            variant="outline"
            onClick={handleTestNotification}
            className="w-full"
          >
            Send Test Notification
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

