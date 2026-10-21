import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

export type NotificationAction =
  | "created"
  | "updated"
  | "converted"
  | "checkin"
  | "checkout";

export type StoredNotification = {
  id: string;
  action: NotificationAction;
  eventName: string;
  eventDate?: string;
  actorName?: string;
  createdAt: string;
  source?: "server";
};

const STORAGE_KEY = "eventflow/notifications";
const MAX_NOTIFICATIONS = 30;

const actionMeta: Record<
  NotificationAction,
  {
    title: string;
    body: (
      eventName: string,
      eventDate?: string,
      actorName?: string,
    ) => string;
  }
> = {
  created: {
    title: "Event created",
    body: (eventName, eventDate, actorName) =>
      `${eventName}${actorName ? ` • By ${actorName}` : ""}${eventDate ? ` • ${eventDate}` : ""}`,
  },
  updated: {
    title: "Event updated",
    body: (eventName, eventDate, actorName) =>
      `${eventName}${actorName ? ` • By ${actorName}` : ""}${eventDate ? ` • ${eventDate}` : ""}`,
  },
  converted: {
    title: "Enquiry converted",
    body: (eventName, eventDate, actorName) =>
      `${eventName}${actorName ? ` • By ${actorName}` : ""}${eventDate ? ` • ${eventDate}` : ""}`,
  },
  checkin: {
    title: "Check-in completed",
    body: (eventName, eventDate, actorName) =>
      `${eventName}${actorName ? ` • By ${actorName}` : ""}${eventDate ? ` • ${eventDate}` : ""}`,
  },
  checkout: {
    title: "Checkout completed",
    body: (eventName, eventDate, actorName) =>
      `${eventName}${actorName ? ` • By ${actorName}` : ""}${eventDate ? ` • ${eventDate}` : ""}`,
  },
};

export async function requestNativeNotificationPermission() {
  if (!Capacitor.isNativePlatform()) {
    return "unsupported";
  }

  const permission = await LocalNotifications.requestPermissions();
  return permission.display;
}

export function requestBrowserNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return Promise.resolve("unsupported");
  }

  if (Notification.permission === "granted") {
    return Promise.resolve("granted");
  }

  if (Notification.permission === "denied") {
    return Promise.resolve("denied");
  }

  return Notification.requestPermission();
}

function notifyViaServiceWorker(notification: StoredNotification) {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return false;
  }

  navigator.serviceWorker.ready
    .then((registration) => {
      const meta = actionMeta[notification.action];
      registration.showNotification(meta.title, {
        body: meta.body(
          notification.eventName,
          notification.eventDate,
          notification.actorName,
        ),
        tag: notification.id,
        icon: "/icon-512.svg",
      });
    })
    .catch(() => {
      // Fall back to in-page browser notification if service worker is unavailable.
    });

  return true;
}

function notifyViaBrowserApi(notification: StoredNotification) {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return;
  }

  if (Notification.permission !== "granted") {
    return;
  }

  const meta = actionMeta[notification.action];
  const notificationInstance = new Notification(meta.title, {
    body: meta.body(
      notification.eventName,
      notification.eventDate,
      notification.actorName,
    ),
    icon: "/icon-512.svg",
    tag: notification.id,
  });

  setTimeout(() => {
    notificationInstance.close();
  }, 6000);
}

export async function triggerNativeNotification(
  notification: StoredNotification,
) {
  if (typeof window === "undefined") {
    return;
  }

  if (Capacitor.isNativePlatform()) {
    const permission = await LocalNotifications.checkPermissions();

    if (permission.display === "granted") {
      await LocalNotifications.schedule({
        notifications: [
          {
            id:
              Number(notification.id.replace(/\D/g, "").slice(0, 8)) ||
              Date.now(),
            title: actionMeta[notification.action].title,
            body: actionMeta[notification.action].body(
              notification.eventName,
              notification.eventDate,
              notification.actorName,
            ),
            schedule: { at: new Date(Date.now() + 1000) },
            sound: "default",
            attachments: undefined,
          },
        ],
      });
    }

    return;
  }

  if (Notification.permission === "granted") {
    if (notifyViaServiceWorker(notification)) {
      return;
    }

    notifyViaBrowserApi(notification);
  }
}

function readStoredNotifications(): StoredNotification[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStoredNotifications(notifications: StoredNotification[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  window.dispatchEvent(new CustomEvent("eventflow:notifications-updated"));
}

export function getStoredNotifications() {
  return readStoredNotifications().sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

export function isStoredNotification(
  value: unknown,
): value is StoredNotification {
  if (!value || typeof value !== "object") return false;

  const notification = value as Record<string, unknown>;
  return (
    typeof notification.id === "string" &&
    ["created", "updated", "converted", "checkin", "checkout"].includes(
      notification.action as string,
    ) &&
    typeof notification.eventName === "string" &&
    (notification.actorName === undefined ||
      typeof notification.actorName === "string") &&
    typeof notification.createdAt === "string"
  );
}

export function mergeStoredNotifications(
  notifications: unknown[],
  notifyNew = false,
) {
  const stored = readStoredNotifications();
  const storedIds = new Set(stored.map((notification) => notification.id));
  const incoming = notifications.filter(isStoredNotification).map((item) => ({
    ...item,
    source: "server" as const,
  }));
  const newNotifications = incoming.filter(
    (notification) => !storedIds.has(notification.id),
  );
  const merged = [...incoming, ...stored].filter(
    (notification, index, all) =>
      all.findIndex((candidate) => candidate.id === notification.id) === index,
  );

  writeStoredNotifications(
    merged
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, MAX_NOTIFICATIONS),
  );

  if (notifyNew) {
    newNotifications.forEach((notification) => {
      void triggerNativeNotification(notification);
    });
  }
}

export function addStoredNotification(
  action: NotificationAction,
  eventName: string,
  eventDate?: string,
  actorName?: string,
) {
  const notification: StoredNotification = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    action,
    eventName,
    eventDate,
    actorName,
    createdAt: new Date().toISOString(),
  };

  const notifications = [notification, ...readStoredNotifications()].slice(
    0,
    MAX_NOTIFICATIONS,
  );

  writeStoredNotifications(notifications);
  void triggerNativeNotification(notification);
}

export function removeStoredNotification(id: string) {
  const notifications = readStoredNotifications().filter(
    (notification) => notification.id !== id,
  );
  writeStoredNotifications(notifications);
}

export function clearStoredNotifications() {
  writeStoredNotifications([]);
}
