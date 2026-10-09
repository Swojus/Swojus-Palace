import React from "react";
import { isRecordCompleted, sortRecordsByDateTime } from "../../src/data/mock";
import apiFetch from "../utils/api";
import { EventCard, DateRangeFilter, LoadingState } from "../components";
import { useAuth } from "../AuthContext";
import { CalendarDays, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  Stack,
  Box,
  Chip,
} from "@mui/material";
import Fab from "@mui/material/Fab";
import SearchFilter from "../components/SearchFilter";

export function BookedEventsScreen() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const toLocalIsoDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const [deleteTarget, setDeleteTarget] = React.useState<null | {
    id: string;
    title: string;
    customerName?: string;
  }>(null);

  const handleDeleteRequest = (
    eventId?: string,
    title?: string,
    customerName?: string,
  ) => {
    if (!eventId) return;
    setDeleteTarget({
      id: eventId,
      title: title ?? "This event",
      customerName,
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;

    void apiFetch(`/api/events/${deleteTarget.id}`, { method: "DELETE" })
      .then((response) => {
        if (!response.ok) throw new Error("Delete failed");
        setEvents((prev) =>
          prev.filter((item) => (item.id ?? item._id) !== deleteTarget.id),
        );
        setDeleteTarget(null);
      })
      .catch(() => {
        setDeleteTarget(null);
      });
  };

  const [fromDate, setFromDate] = React.useState<Date | null>(null);
  const [toDate, setToDate] = React.useState<Date | null>(null);
  const [search, setSearch] = React.useState("");
  const [events, setEvents] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const filteredEvents = sortRecordsByDateTime(
    events.filter((record) => {
      if (record.eventSource !== "Booking") return false;
      if (isRecordCompleted(record)) return false;
      if (record.eventDate) {
        const recordDateKey = record.eventDate.slice(0, 10);
        const todayKey = toLocalIsoDate(new Date());
        if (recordDateKey < todayKey) return false;
        if (fromDate) {
          const fromKey = toLocalIsoDate(fromDate);
          if (recordDateKey < fromKey) return false;
        }
        if (toDate) {
          const toKey = toLocalIsoDate(toDate);
          if (recordDateKey > toKey) return false;
        }
      }
      if (!search) return true;
      const haystack =
        `${record.customerName ?? ""} ${record.title} ${record.venue}`.toLowerCase();
      return haystack.includes(search.toLowerCase());
    }),
  );

  const showLoader = loading && events.length === 0;
  const showEmptyState = !loading && filteredEvents.length === 0;

  React.useEffect(() => {
    let mounted = true;
    setLoading(true);
    void apiFetch(`/api/events`, { method: "GET" })
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        setEvents(Array.isArray(data) ? data : []);
      })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Box sx={{ maxWidth: 480, mx: "auto", mt: 2, px: 1, position: "relative" }}>
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
            <Typography
              variant="h5"
              fontWeight={800}
              color="primary"
              sx={{ letterSpacing: 0.5 }}
            >
              Booked
            </Typography>
            <Chip
              icon={<CalendarDays size={18} />}
              color="primary"
              label={`${filteredEvents.length} Booked`}
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
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: "fixed", bottom: 150, right: 24, zIndex: 1000 }}
        onClick={() => navigate("/events/new")}
      >
        <Plus />
      </Fab>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 1.5 }}>
        <Box sx={{ width: "100%", mb: 0.5 }}>
          <DateRangeFilter
            onFilter={(from, to) => {
              setFromDate(from);
              setToDate(to);
            }}
          />
        </Box>
        <Box sx={{ width: "100%", mt: 0 }}>
          <SearchFilter
            value={search}
            onChange={setSearch}
            placeholder="Search event/customer/venue"
            className="modern-search"
            sx={{ mb: 0 }}
          />
        </Box>
      </Box>

      {showLoader ? (
        <LoadingState message="Loading booked events..." minHeight={120} />
      ) : showEmptyState ? (
        <Card elevation={1} sx={{ borderRadius: 4, py: 4 }}>
          <CardContent>
            <Typography color="text.secondary" align="center">
              No active booked events right now.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {filteredEvents.map((event, idx) => {
            const eventId = event.id ?? event._id;
            return (
              <EventCard
                key={eventId ?? idx}
                event={event}
                {...(isAdmin
                  ? {
                      onEdit: () => {
                        if (!eventId) return;
                        navigate(`/events/${eventId}/edit`);
                      },
                      onDelete: () =>
                        handleDeleteRequest(
                          eventId,
                          event.title,
                          event.customerName,
                        ),
                    }
                  : {})}
                onCheckIn={() => {
                  if (!eventId) return;
                  navigate(`/events/${eventId}/check-in`);
                }}
                onCheckOut={() => {
                  if (!eventId) return;
                  navigate(`/events/${eventId}/check-out`);
                }}
              />
            );
          })}
        </Stack>
      )}

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 4,
            boxShadow: "0 12px 32px rgba(39,48,66,0.14)",
          },
        }}
      >
        <DialogTitle sx={{ px: 2, pt: 1.75, pb: 1 }}>Delete Event</DialogTitle>
        <DialogContent sx={{ px: 2, pt: 1, pb: 1.5 }}>
          <Typography variant="body1" color="text.secondary">
            Are you sure you want to delete this event?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {deleteTarget?.customerName || "Customer"} — {deleteTarget?.title}
          </Typography>
        </DialogContent>
        <DialogActions
          sx={{
            px: 2,
            pb: 2,
            pt: 0.5,
            justifyContent: "flex-end",
            gap: 1,
          }}
        >
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => setDeleteTarget(null)}
            sx={{ px: 2.25, py: 0.8, borderRadius: 2, fontWeight: 700 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            sx={{ px: 2.25, py: 0.8, borderRadius: 2, fontWeight: 700 }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
