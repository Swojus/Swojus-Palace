import React from "react";
import {
  getStoredNotifications,
  removeStoredNotification,
} from "../../src/data/notificationLog";
import apiFetch from "../utils/api";
import { RecordItem } from "../../src/types";
import { useMuhurt } from "../MuhurtContext";
import {
  AlertTriangle,
  BellOff,
  BellRing,
  CalendarDays,
  CheckCircle2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { Box, Card, CardContent, Chip, Stack, Typography } from "@mui/material";

function listMissing(record: RecordItem) {
  return (record.inventory ?? [])
    .map((item) => ({
      item,
      missing: Math.max(0, item.issuedQty - item.returnedQty),
    }))
    .filter(({ missing }) => missing > 0);
}

const REMINDER_DISMISS_KEY = "eventflow/dismissed-reminders";

function readDismissedReminderIds() {
  if (typeof window === "undefined") return new Set<string>();

  try {
    const raw = window.localStorage.getItem(REMINDER_DISMISS_KEY);
    if (!raw) return new Set<string>();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed.filter(Boolean) : []);
  } catch {
    return new Set<string>();
  }
}

function writeDismissedReminderIds(ids: Set<string>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    REMINDER_DISMISS_KEY,
    JSON.stringify(Array.from(ids)),
  );
}

const actionMeta = {
  created: {
    title: "New event created",
    icon: Sparkles,
    accent: "#3b82f6",
  },
  updated: {
    title: "Event updated",
    icon: RefreshCw,
    accent: "#8b5cf6",
  },
  converted: {
    title: "Event converted",
    icon: RefreshCw,
    accent: "#10b981",
  },
  checkin: {
    title: "Check-in completed",
    icon: CheckCircle2,
    accent: "#0ea5e9",
  },
  checkout: {
    title: "Checkout completed",
    icon: CheckCircle2,
    accent: "#10b981",
  },
};

const reminderMeta = {
  muhurt: {
    title: "Muhurt reminder",
    icon: CalendarDays,
    accent: "#f59e0b",
  },
  missing: {
    title: "Inventory alert",
    icon: AlertTriangle,
    accent: "#ef4444",
  },
};

function NoticeCard({
  title,
  description,
  icon: Icon,
  accent,
  onClick,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  accent: string;
  onClick?: () => void;
}) {
  return (
    <Card
      elevation={0}
      onClick={onClick}
      sx={{
        borderRadius: 3,
        border: `1px solid ${accent}22`,
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.99), rgba(248,250,252,0.96))",
        overflow: "hidden",
        position: "relative",
        boxShadow: "0 10px 22px rgba(39,48,66,0.08)",
        cursor: onClick ? "pointer" : "default",
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          left: 0,
          width: 4,
          background: `linear-gradient(180deg, ${accent}, ${accent}cc)`,
        },
      }}
    >
      <CardContent sx={{ px: 1.5, py: 1.4, pl: 2.1 }}>
        <Stack direction="row" spacing={1.2} alignItems="flex-start">
          <Box
            sx={{
              mt: 0.15,
              width: 36,
              height: 36,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              background: `${accent}14`,
              color: accent,
              flexShrink: 0,
            }}
          >
            <Icon size={18} />
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="subtitle1"
              fontWeight={800}
              color="text.primary"
              sx={{ fontSize: "0.98rem", lineHeight: 1.25 }}
            >
              {title}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.4, lineHeight: 1.5, fontSize: "0.92rem" }}
            >
              {description}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export function NotificationsScreen() {
  const { todayMuhurtDates } = useMuhurt();
  const [events, setEvents] = React.useState<any[]>([]);
  const [dismissedActivityIds, setDismissedActivityIds] = React.useState<
    Set<string>
  >(new Set());
  const [dismissedReminderIds, setDismissedReminderIds] = React.useState<
    Set<string>
  >(() => readDismissedReminderIds());

  React.useEffect(() => {
    writeDismissedReminderIds(dismissedReminderIds);
  }, [dismissedReminderIds]);

  React.useEffect(() => {
    let mounted = true;
    void apiFetch(`/api/events`, { method: "GET" })
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        setEvents(Array.isArray(data) ? data : []);
      })
      .catch(() => setEvents([]));

    return () => {
      mounted = false;
    };
  }, []);

  const missing = events.flatMap((record) =>
    listMissing(record).map(({ item, missing: qty }) => ({
      id: `${record.id ?? record._id}-${item.id}`,
      event: record.title,
      item: item.name,
      qty,
    })),
  );

  const activityNotifications = getStoredNotifications()
    .filter((notification) => !dismissedActivityIds.has(notification.id))
    .map((notification) => ({
      id: notification.id,
      title: actionMeta[notification.action].title,
      description: `${notification.eventName}${notification.eventDate ? ` • ${notification.eventDate}` : ""}`,
      icon: actionMeta[notification.action].icon,
      accent: actionMeta[notification.action].accent,
    }));

  const reminderNotifications = [
    ...todayMuhurtDates.map((muhurt) => ({
      id: `muhurt-${muhurt.id}`,
      title: reminderMeta.muhurt.title,
      description: `${muhurt.description} • ${muhurt.date}`,
      icon: reminderMeta.muhurt.icon,
      accent: reminderMeta.muhurt.accent,
    })),
    ...missing.map((notice) => ({
      id: `missing-${notice.id}`,
      title: reminderMeta.missing.title,
      description: `${notice.event} • Missing ${notice.qty} × ${notice.item}`,
      icon: reminderMeta.missing.icon,
      accent: reminderMeta.missing.accent,
    })),
  ].filter((notice) => !dismissedReminderIds.has(notice.id));

  const totalAlerts =
    activityNotifications.length + reminderNotifications.length;

  const handleDismissActivity = (id: string) => {
    setDismissedActivityIds((prev) => new Set(prev).add(id));
    removeStoredNotification(id);
  };

  const handleDismissReminder = (id: string) => {
    setDismissedReminderIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  return (
    <Box sx={{ maxWidth: 640, mx: "auto", mt: 2, px: 1.25, pb: 3 }}>
      <Card
        elevation={3}
        sx={{
          mb: 2,
          borderRadius: 4,
          background:
            "linear-gradient(135deg, rgba(59,130,246,0.12), rgba(20,184,166,0.08), rgba(255,255,255,0.98))",
        }}
      >
        <CardContent sx={{ py: 1.6, px: 1.8 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={1}
          >
            <Box>
              <Typography
                variant="overline"
                color="primary.main"
                fontWeight={800}
              >
                Mobile alert centre
              </Typography>
              <Typography variant="h5" fontWeight={800} color="text.primary">
                Notifications
              </Typography>
            </Box>
            <Chip
              color="primary"
              label={`${totalAlerts} alerts`}
              sx={{ fontWeight: 800, px: 1.2, borderRadius: 999 }}
            />
          </Stack>
        </CardContent>
      </Card>

      {totalAlerts === 0 ? (
        <Card elevation={1} sx={{ p: 3, textAlign: "center", borderRadius: 3 }}>
          <CardContent>
            <BellOff size={48} style={{ color: "#bdbdbd", marginBottom: 8 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No notifications for today
            </Typography>
            <Typography variant="body2" color="text.secondary">
              New events, checkouts, and Muhurt reminders will appear here.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2.2}>
          <Box>
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ mb: 1 }}
            >
              <BellRing size={18} color="#3b82f6" />
              <Typography
                variant="subtitle1"
                fontWeight={800}
                color="primary.main"
              >
                Activity
              </Typography>
              <Chip
                size="small"
                label={`${activityNotifications.length}`}
                sx={{ fontWeight: 700, borderRadius: 999 }}
              />
            </Stack>
            {activityNotifications.length === 0 ? (
              <Card
                elevation={0}
                sx={{
                  borderRadius: 3,
                  border: "1px dashed rgba(59,130,246,0.24)",
                  background: "rgba(59,130,246,0.03)",
                }}
              >
                <CardContent sx={{ py: 1.4, px: 1.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    No activity alerts yet.
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Stack spacing={1}>
                {activityNotifications.map((notice) => (
                  <NoticeCard
                    key={notice.id}
                    title={notice.title}
                    description={notice.description}
                    icon={notice.icon}
                    accent={notice.accent}
                    onClick={() => handleDismissActivity(notice.id)}
                  />
                ))}
              </Stack>
            )}
          </Box>

          <Box>
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ mb: 1 }}
            >
              <CalendarDays size={18} color="#f59e0b" />
              <Typography
                variant="subtitle1"
                fontWeight={800}
                color="warning.main"
              >
                Reminders
              </Typography>
              <Chip
                size="small"
                label={`${reminderNotifications.length}`}
                sx={{ fontWeight: 700, borderRadius: 999 }}
              />
            </Stack>
            {reminderNotifications.length === 0 ? (
              <Card
                elevation={0}
                sx={{
                  borderRadius: 3,
                  border: "1px dashed rgba(245,158,11,0.24)",
                  background: "rgba(245,158,11,0.03)",
                }}
              >
                <CardContent sx={{ py: 1.4, px: 1.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    No reminders right now.
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Stack spacing={1}>
                {reminderNotifications.map((notice) => (
                  <NoticeCard
                    key={notice.id}
                    title={notice.title}
                    description={notice.description}
                    icon={notice.icon}
                    accent={notice.accent}
                    onClick={() => handleDismissReminder(notice.id)}
                  />
                ))}
              </Stack>
            )}
          </Box>
        </Stack>
      )}
    </Box>
  );
}
