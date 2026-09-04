import React from "react";
import { useNavigate } from "react-router-dom";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  isSameMonth,
  isSameDay,
} from "date-fns";
import {
  mockRecords,
  sortRecordsByDateTime,
  isRecordCompleted,
} from "../../src/data/mock";
import { EventCard } from "../components";
import { useAuth } from "../AuthContext";
import { useMuhurt } from "../MuhurtContext";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  IconButton,
} from "@mui/material";
import { ArrowLeft, ArrowRight } from "lucide-react";

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getCalendarDays(month: Date) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days: Date[] = [];
  let current = startDate;
  while (current <= endDate) {
    days.push(current);
    current = addDays(current, 1);
  }
  return days;
}

export function CalendarScreen() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = React.useState<Date>(
    startOfMonth(new Date()),
  );
  const { muhurtDates } = useMuhurt();
  const { isAdmin } = useAuth();

  const selectedDateKey = format(selectedDate, "yyyy-MM-dd");
  const eventsForDay = sortRecordsByDateTime(
    mockRecords.filter((record) => record.eventDate === selectedDateKey),
  );

  const days = getCalendarDays(currentMonth);
  const today = new Date();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const eventCountByDate = new Map<string, number>();
  mockRecords.forEach((record) => {
    if (record.eventDate) {
      eventCountByDate.set(
        record.eventDate,
        (eventCountByDate.get(record.eventDate) ?? 0) + 1,
      );
    }
  });

  const muhurtByDate = new Map<string, string>();
  muhurtDates.forEach((item) => muhurtByDate.set(item.date, item.description));
  const selectedMuhurtDescription = muhurtByDate.get(selectedDateKey);

  const renderDayBadge = (
    muhurtDescription: string | undefined,
    count: number,
    isPast: boolean,
    dayKey: string,
    day: Date,
    isMuted: boolean,
    isSelected: boolean,
  ) => {
    if (muhurtDescription) {
      if (count === 0) {
        return (
          <Box
            sx={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.5,
            }}
          >
            <Typography
              variant="caption"
              align="center"
              sx={{
                color: "error.main",
                fontWeight: 700,
                lineHeight: 1.1,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "100%",
                wordBreak: "break-word",
                textAlign: "center",
              }}
            >
              {muhurtDescription}
            </Typography>
            {!isPast && (
              <Box
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/events/new?date=${dayKey}`);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.stopPropagation();
                    navigate(`/events/new?date=${dayKey}`);
                  }
                }}
                aria-label={`Add event for ${format(day, "MMM d, yyyy")}`}
                sx={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  bgcolor: "transparent",
                  color: isMuted ? "text.disabled" : "text.primary",
                  fontSize: "0.85rem",
                  border: "1px solid rgba(0,0,0,0.06)",
                  zIndex: 1200,
                  position: "relative",
                  pointerEvents: "auto",
                  cursor: "pointer",
                  "&:hover": { bgcolor: "rgba(0,0,0,0.04)" },
                }}
              >
                +
              </Box>
            )}
          </Box>
        );
      }

      return (
        <Typography
          variant="caption"
          align="center"
          sx={{
            color: "error.main",
            fontWeight: 700,
            lineHeight: 1.1,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: "100%",
            wordBreak: "break-word",
            textAlign: "center",
          }}
        >
          {muhurtDescription}
        </Typography>
      );
    }

    if (count > 0) {
      return (
        <Box
          sx={{
            width: 20,
            height: 20,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            bgcolor: isSelected ? "#ffffff" : "primary.main",
            color: isSelected ? "primary.main" : "primary.contrastText",
            fontSize: "0.72rem",
            fontWeight: 700,
          }}
        >
          {count}
        </Box>
      );
    }

    if (!isPast) {
      return (
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/events/new?date=${dayKey}`);
          }}
          aria-label={`Add event for ${format(day, "MMM d, yyyy")}`}
          sx={{
            width: 26,
            height: 26,
            borderRadius: "50%",
            bgcolor: "transparent",
            color: isMuted ? "text.disabled" : "text.primary",
            fontSize: "0.85rem",
            border: "1px solid rgba(0,0,0,0.06)",
            "&:hover": { bgcolor: "rgba(0,0,0,0.04)" },
          }}
        >
          +
        </IconButton>
      );
    }

    return null;
  };

  return (
    <Box sx={{ maxWidth: 520, mx: "auto", mt: 2, px: 1, position: "relative" }}>
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
            <Box>
              <Typography
                variant="h5"
                fontWeight={800}
                color="primary"
                sx={{ letterSpacing: 0.5 }}
              >
                Calendar
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                {format(selectedDate, "EEEE, MMM d, yyyy")}
              </Typography>
              {selectedMuhurtDescription ? (
                <Typography
                  color="error.main"
                  sx={{ mt: 0.75, fontWeight: 700 }}
                >
                  Muhurt: {selectedMuhurtDescription}
                </Typography>
              ) : null}
            </Box>
            <Chip
              color="primary"
              label={`${eventsForDay.length} event${eventsForDay.length === 1 ? "" : "s"}`}
              sx={{
                fontWeight: 700,
                fontSize: "0.95rem",
                px: 1.5,
                borderRadius: 2,
              }}
            />
          </Stack>
        </CardContent>
      </Card>

      <Card elevation={1} sx={{ mb: 2, borderRadius: 4, overflow: "hidden" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: 2,
            gap: 1,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconButton
              aria-label="Previous month"
              size="small"
              onClick={() => setCurrentMonth((m) => addMonths(m, -1))}
            >
              <ArrowLeft size={18} />
            </IconButton>
            <Typography variant="subtitle1" fontWeight={800}>
              {format(currentMonth, "MMMM yyyy")}
            </Typography>
            <IconButton
              aria-label="Next month"
              size="small"
              onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            >
              <ArrowRight size={18} />
            </IconButton>
          </Stack>
          <Button
            size="small"
            onClick={() => {
              setCurrentMonth(startOfMonth(today));
              setSelectedDate(today);
            }}
            sx={{ textTransform: "none" }}
          >
            Today
          </Button>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
            gap: 1,
            p: 2,
          }}
        >
          {weekDays.map((d) => (
            <Typography
              key={d}
              variant="caption"
              color="text.secondary"
              align="center"
              sx={{ fontWeight: 700 }}
            >
              {d}
            </Typography>
          ))}

          {days.map((day) => {
            const dayKey = format(day, "yyyy-MM-dd");
            const isMuted = !isSameMonth(day, currentMonth);
            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, today);
            const dayStart = new Date(day);
            dayStart.setHours(0, 0, 0, 0);
            const isPast = dayStart < todayStart;
            const count = eventCountByDate.get(dayKey) ?? 0;
            const muhurtDescription = muhurtByDate.get(dayKey);

            return (
              <Button
                key={dayKey}
                onClick={() => {
                  setSelectedDate(day);
                  if (!isSameMonth(day, currentMonth))
                    setCurrentMonth(startOfMonth(day));
                }}
                variant="text"
                color={isSelected ? "primary" : "inherit"}
                sx={{
                  minHeight: 92,
                  overflow: "visible",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "space-between",
                  px: 0,
                  py: 1.25,
                  borderRadius: 2,
                  color: isMuted ? "text.disabled" : "text.primary",
                  backgroundColor: isSelected
                    ? "rgba(59,130,246,0.12)"
                    : muhurtDescription
                      ? "rgba(244,63,94,0.08)"
                      : isToday
                        ? "rgba(15,23,42,0.04)"
                        : "transparent",
                  textTransform: "none",
                  border: isSelected
                    ? "1px solid rgba(59,130,246,0.25)"
                    : muhurtDescription
                      ? "1px solid rgba(244,63,94,0.25)"
                      : isToday
                        ? "1px solid rgba(15,23,42,0.08)"
                        : "1px solid transparent",
                }}
              >
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    display: "grid",
                    placeItems: "center",
                    borderRadius: "50%",
                    bgcolor: isSelected ? "primary.main" : "transparent",
                    color: isSelected
                      ? "primary.contrastText"
                      : muhurtDescription
                        ? "error.main"
                        : isMuted
                          ? "text.disabled"
                          : "text.primary",
                    fontWeight: 800,
                  }}
                >
                  {format(day, "d")}
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 0.5,
                    width: "100%",
                  }}
                >
                  {muhurtDescription ? (
                    count === 0 ? (
                      <Box
                        sx={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 0.5,
                        }}
                      >
                        <Typography
                          variant="caption"
                          align="center"
                          sx={{
                            color: "error.main",
                            fontWeight: 700,
                            lineHeight: 1.1,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: "100%",
                            wordBreak: "break-word",
                            textAlign: "center",
                          }}
                        >
                          {muhurtDescription}
                        </Typography>
                        {!isPast && (
                          <Box
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/events/new?date=${dayKey}`);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.stopPropagation();
                                navigate(`/events/new?date=${dayKey}`);
                              }
                            }}
                            aria-label={`Add event for ${format(day, "MMM d, yyyy")}`}
                            sx={{
                              width: 26,
                              height: 26,
                              borderRadius: "50%",
                              display: "grid",
                              placeItems: "center",
                              bgcolor: "transparent",
                              color: isMuted ? "text.disabled" : "text.primary",
                              fontSize: "0.85rem",
                              border: "1px solid rgba(0,0,0,0.06)",
                              zIndex: 1200,
                              position: "relative",
                              pointerEvents: "auto",
                              cursor: "pointer",
                              "&:hover": { bgcolor: "rgba(0,0,0,0.04)" },
                            }}
                          >
                            +
                          </Box>
                        )}
                      </Box>
                    ) : (
                      <Typography
                        variant="caption"
                        align="center"
                        sx={{
                          color: "error.main",
                          fontWeight: 700,
                          lineHeight: 1.1,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: "100%",
                          wordBreak: "break-word",
                          textAlign: "center",
                        }}
                      >
                        {muhurtDescription}
                      </Typography>
                    )
                  ) : count > 0 ? (
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        display: "grid",
                        placeItems: "center",
                        bgcolor: isSelected ? "#ffffff" : "primary.main",
                        color: isSelected
                          ? "primary.main"
                          : "primary.contrastText",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                      }}
                    >
                      {count}
                    </Box>
                  ) : !isPast ? (
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/events/new?date=${dayKey}`);
                      }}
                      aria-label={`Add event for ${format(day, "MMM d, yyyy")}`}
                      sx={{
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        bgcolor: "transparent",
                        color: isMuted ? "text.disabled" : "text.primary",
                        fontSize: "0.85rem",
                        border: "1px solid rgba(0,0,0,0.06)",
                        "&:hover": { bgcolor: "rgba(0,0,0,0.04)" },
                      }}
                    >
                      +
                    </IconButton>
                  ) : null}
                </Box>
              </Button>
            );
          })}
        </Box>
      </Card>

      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
        <Typography variant="h6" fontWeight={800} color="text.primary">
          Events on {format(selectedDate, "MMM d")}
        </Typography>
      </Box>

      {eventsForDay.length === 0 ? (
        <Card elevation={1} sx={{ borderRadius: 4, py: 4 }}>
          <CardContent>
            <Typography color="text.secondary" align="center">
              No events scheduled for this date.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {eventsForDay.map((event) => {
            const completed = isRecordCompleted(event);
            return (
              <EventCard
                key={event.id}
                event={event}
                mode={completed ? "completed" : "booked"}
                {...(completed
                  ? {
                      onClick: () => navigate(`/inventory/missing/${event.id}`),
                    }
                  : {
                      ...(isAdmin
                        ? { onEdit: () => navigate(`/events/${event.id}/edit`) }
                        : {}),
                      onCheckIn: () => navigate(`/events/${event.id}/check-in`),
                      onCheckOut: () =>
                        navigate(`/events/${event.id}/check-out`),
                    })}
              />
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
