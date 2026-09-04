import React from "react";
import {
  mockRecords,
  isRecordCompleted,
  sortRecordsByDateTime,
} from "../../src/data/mock";
import { EventCard, DateRangeFilter } from "../components";
import { useAuth } from "../AuthContext";
import { CalendarDays, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, Typography, Stack, Box, Chip } from "@mui/material";
import Fab from "@mui/material/Fab";
import SearchFilter from "../components/SearchFilter";

export function BookedEventsScreen() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [fromDate, setFromDate] = React.useState<Date | null>(null);
  const [toDate, setToDate] = React.useState<Date | null>(null);
  const [search, setSearch] = React.useState("");

  const filteredEvents = sortRecordsByDateTime(
    mockRecords.filter((record) => {
      if (record.eventSource !== "Booking") return false;
      if (isRecordCompleted(record)) return false;
      if (record.eventDate) {
        const eventDate = new Date(record.eventDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (eventDate < today) return false;
        if (fromDate && eventDate < fromDate) return false;
        if (toDate && eventDate > toDate) return false;
      }
      if (!search) return true;
      const haystack =
        `${record.customerName ?? ""} ${record.title} ${record.venue}`.toLowerCase();
      return haystack.includes(search.toLowerCase());
    }),
  );

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
              Booked Events
            </Typography>
            <Chip
              icon={<CalendarDays size={18} />}
              color="primary"
              label={`${filteredEvents.length} Events`}
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

      {filteredEvents.length === 0 ? (
        <Card elevation={1} sx={{ borderRadius: 4, py: 4 }}>
          <CardContent>
            <Typography color="text.secondary" align="center">
              No active booked events right now.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              {...(isAdmin
                ? { onEdit: () => navigate(`/events/${event.id}/edit`) }
                : {})}
              onCheckIn={() => navigate(`/events/${event.id}/check-in`)}
              onCheckOut={() => navigate(`/events/${event.id}/check-out`)}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
}
