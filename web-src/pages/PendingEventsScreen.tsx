import React from "react";
import { CalendarClock } from "lucide-react";
import { Box, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { sortRecordsByDateTime } from "../../src/data/mock";
import { EventCard, LoadingState } from "../components";
import SearchFilter from "../components/SearchFilter";
import apiFetch from "../utils/api";
import { useNavigate } from "react-router-dom";

function toLocalIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function PendingEventsScreen() {
  const navigate = useNavigate();
  const [search, setSearch] = React.useState("");
  const [events, setEvents] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    void apiFetch("/api/events", { method: "GET" })
      .then((response) => response.json())
      .then((data) => {
        if (!mounted) return;
        setEvents(Array.isArray(data) ? data : []);
      })
      .catch(() => setEvents([]))
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const todayKey = toLocalIsoDate(new Date());
  const pendingEvents = sortRecordsByDateTime(
    events.filter((event) => {
      const eventDate = event.eventDate?.slice(0, 10);
      if (
        event.eventSource !== "Booking" ||
        event.completed === true ||
        !eventDate ||
        eventDate >= todayKey
      ) {
        return false;
      }

      if (!search.trim()) return true;
      const haystack =
        `${event.customerName ?? ""} ${event.title ?? ""} ${event.venue ?? ""}`.toLowerCase();
      return haystack.includes(search.trim().toLowerCase());
    }),
  );

  const showLoader = loading && events.length === 0;
  const showEmptyState = !loading && pendingEvents.length === 0;

  return (
    <Box sx={{ maxWidth: 480, mx: "auto", mt: 2, px: 1 }}>
      <Card
        elevation={3}
        sx={{
          mb: 1.5,
          borderRadius: 4,
          boxShadow: "0 4px 24px rgba(39,48,66,0.08)",
        }}
      >
        <CardContent sx={{ py: 1.5, px: 2 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography variant="h5" fontWeight={800} color="primary">
              Pending Events
            </Typography>
            <Chip
              icon={<CalendarClock size={18} />}
              color="primary"
              label={`${pendingEvents.length} Pending`}
              sx={{
                fontWeight: 700,
                fontSize: "1rem",
                px: 1.5,
                borderRadius: 2,
              }}
            />
          </Stack>
        </CardContent>
      </Card>

      <SearchFilter
        value={search}
        onChange={setSearch}
        placeholder="Search event/customer/venue"
        className="modern-search"
        sx={{ mb: 1.5 }}
      />

      {showLoader ? (
        <LoadingState message="Loading pending events..." minHeight={120} />
      ) : showEmptyState ? (
        <Card elevation={1} sx={{ borderRadius: 4, py: 4 }}>
          <CardContent>
            <Typography color="text.secondary" align="center">
              No overdue events are waiting for checkout.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {pendingEvents.map((event, index) => {
            const eventId = event.id ?? event._id;
            return (
              <EventCard
                key={eventId ?? index}
                event={event}
                showCheckOut
                onEdit={() => {
                  if (eventId) navigate(`/events/${eventId}/edit`);
                }}
                onCheckOut={() => {
                  if (eventId) navigate(`/events/${eventId}/check-out`);
                }}
              />
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
