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
import { EventCard, LoadingState } from "../components";
import { useAuth } from "../AuthContext";
import { useMuhurt } from "../MuhurtContext";
import apiFetch from "../utils/api";
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
  const [events, setEvents] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { muhurtDates } = useMuhurt();
  const { isAdmin } = useAuth();

  React.useEffect(() => {
    let mounted = true;
    setLoading(true);
    void apiFetch(`/api/events`, { method: "GET" })
      .then((res) => res.json())
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

  const selectedDateKey = format(selectedDate, "yyyy-MM-dd");
  const eventsForDay = sortRecordsByDateTime(
    events.filter((record) => record.eventDate === selectedDateKey),
  );
  const showDateLoading = loading && eventsForDay.length === 0;

  const days = getCalendarDays(currentMonth);
  const today = new Date();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const eventCountByDate = new Map<string, number>();
  events.forEach((record) => {
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
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.5,
              minWidth: 0,
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
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                textOverflow: "ellipsis",
                width: "100%",
                whiteSpace: "normal",
                overflowWrap: "anywhere",
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
        elevation={0}
        sx={{
          mb: 1.5,
          borderRadius: 4,
          background: "#f4f1ee",
          boxShadow: "0 10px 22px rgba(39,48,66,0.08)",
          border: "1px solid rgba(144, 130, 105, 0.08)",
        }}
      >
        <CardContent sx={{ py: 1.8, px: 2.1 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={2}
          >
            <Box>
              <Typography
                variant="h5"
                fontWeight={800}
                sx={{
                  color: "#c9931b",
                  letterSpacing: 0.2,
                  lineHeight: 1.1,
                  fontFamily: "'Sora', 'Manrope', sans-serif",
                }}
              >
                Calendar
              </Typography>
              <Typography
                color="text.secondary"
                sx={{
                  mt: 0.5,
                  fontSize: "1.05rem",
                  fontWeight: 500,
                  color: "#475467",
                }}
              >
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
              label={`${eventsForDay.length} event${eventsForDay.length === 1 ? "" : "s"}`}
              sx={{
                fontWeight: 800,
                fontSize: "0.98rem",
                px: 1.7,
                height: 38,
                borderRadius: 2.2,
                background: "linear-gradient(135deg, #d2a74d 0%, #c8941a 100%)",
                color: "#fff",
                boxShadow: "0 8px 18px rgba(201, 148, 26, 0.18)",
              }}
            />
          </Stack>
        </CardContent>
      </Card>

      <Box
        sx={{
          mb: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          px: 0.5,
          py: 0.2,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <IconButton
            aria-label="Previous month"
            size="small"
            onClick={() => setCurrentMonth((m) => addMonths(m, -1))}
            sx={{
              color: "#2b2d32",
              background: "transparent",
              borderRadius: "50%",
              width: 36,
              height: 36,
            }}
          >
            <ArrowLeft size={22} />
          </IconButton>
          <Typography
            variant="h5"
            fontWeight={800}
            sx={{
              color: "#1f2937",
              fontFamily: "'Sora', 'Manrope', sans-serif",
              letterSpacing: 0.04,
              fontSize: "2rem",
            }}
          >
            {format(currentMonth, "MMMM yyyy")}
          </Typography>
          <IconButton
            aria-label="Next month"
            size="small"
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            sx={{
              color: "#2b2d32",
              background: "transparent",
              borderRadius: "50%",
              width: 36,
              height: 36,
            }}
          >
            <ArrowRight size={22} />
          </IconButton>
        </Stack>
        <Button
          size="small"
          onClick={() => {
            setCurrentMonth(startOfMonth(today));
            setSelectedDate(today);
          }}
          sx={{
            textTransform: "none",
            color: "#1f2937",
            fontWeight: 700,
            fontSize: "0.96rem",
            minWidth: 0,
            px: 0.6,
          }}
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
            <Box
              key={dayKey}
              role="button"
              tabIndex={0}
              onClick={() => {
                setSelectedDate(day);
                if (!isSameMonth(day, currentMonth))
                  setCurrentMonth(startOfMonth(day));
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedDate(day);
                  if (!isSameMonth(day, currentMonth))
                    setCurrentMonth(startOfMonth(day));
                }
              }}
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
                  ? "primary.main"
                  : muhurtDescription
                    ? "rgba(244,63,94,0.08)"
                    : isToday
                      ? "rgba(37,99,235,0.04)"
                      : "transparent",
                textTransform: "none",
                border: isSelected
                  ? "1px solid rgba(212,160,23,0.9)"
                  : muhurtDescription
                    ? "1px solid rgba(244,63,94,0.25)"
                    : isToday
                      ? "1px solid rgba(37,99,235,0.45)"
                      : "1px solid transparent",
                cursor: "pointer",
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
                  boxShadow:
                    isToday && !isSelected
                      ? "inset 0 0 0 1.5px rgba(37,99,235,0.7)"
                      : "none",
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
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 0.5,
                        minWidth: 0,
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
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          width: "100%",
                          whiteSpace: "normal",
                          overflowWrap: "anywhere",
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
                    <Box
                      sx={{
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 0.5,
                        minWidth: 0,
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
                      {!isPast && (
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/events/new?date=${dayKey}`);
                          }}
                          aria-label={`Add event for ${format(day, "MMM d, yyyy")}`}
                          sx={{
                            width: 22,
                            height: 22,
                            borderRadius: "50%",
                            bgcolor: "transparent",
                            color: isMuted ? "text.disabled" : "text.primary",
                            fontSize: "0.8rem",
                            border: "1px solid rgba(0,0,0,0.06)",
                            "&:hover": { bgcolor: "rgba(0,0,0,0.04)" },
                          }}
                        >
                          +
                        </IconButton>
                      )}
                    </Box>
                  )
                ) : count > 0 ? (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 0.5,
                    }}
                  >
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
                    {!isPast && (
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/events/new?date=${dayKey}`);
                        }}
                        aria-label={`Add event for ${format(day, "MMM d, yyyy")}`}
                        sx={{
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          bgcolor: "transparent",
                          color: isMuted ? "text.disabled" : "text.primary",
                          fontSize: "0.8rem",
                          border: "1px solid rgba(0,0,0,0.06)",
                          "&:hover": { bgcolor: "rgba(0,0,0,0.04)" },
                        }}
                      >
                        +
                      </IconButton>
                    )}
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
            </Box>
          );
        })}
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1,
          gap: 1,
        }}
      >
        <Typography variant="h6" fontWeight={800} color="text.primary">
          Events on {format(selectedDate, "MMM d")}
        </Typography>
      </Box>

      {showDateLoading ? (
        <LoadingState message="Loading calendar events..." minHeight={120} />
      ) : eventsForDay.length === 0 ? (
        <Card elevation={1} sx={{ borderRadius: 4, py: 4 }}>
          <CardContent
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 1.5,
            }}
          >
            <Typography color="text.secondary" align="center">
              No events scheduled for this date.
            </Typography>
            {!selectedDate || selectedDate < todayStart ? null : (
              <IconButton
                size="small"
                aria-label={`Add event for ${format(selectedDate, "MMM d, yyyy")}`}
                onClick={() => navigate(`/events/new?date=${selectedDateKey}`)}
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  border: "1px solid rgba(0,0,0,0.08)",
                  bgcolor: "transparent",
                  color: "text.primary",
                  "&:hover": { bgcolor: "rgba(0,0,0,0.04)" },
                }}
              >
                +
              </IconButton>
            )}
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {eventsForDay.map((event, idx) => {
            const completed = isRecordCompleted(event);
            const eventId = event.id ?? event._id;
            return (
              <EventCard
                key={eventId ?? idx}
                event={event}
                mode={completed ? "completed" : "booked"}
                {...(completed
                  ? {
                      onClick: () => {
                        if (!eventId) return;
                        navigate(`/inventory/missing/${eventId}`);
                      },
                    }
                  : {
                      ...(isAdmin
                        ? {
                            onEdit: () => {
                              if (!eventId) return;
                              navigate(`/events/${eventId}/edit`);
                            },
                          }
                        : {}),
                      ...(event.eventSource === "Enquiry"
                        ? {
                            onConvert: () => {
                              if (!eventId) return;
                              navigate(
                                `/events/new?enquiryId=${encodeURIComponent(String(eventId))}&asEdit=1`,
                              );
                            },
                          }
                        : {
                            onCheckIn: () => {
                              if (!eventId) return;
                              navigate(`/events/${eventId}/check-in`);
                            },
                            onCheckOut: () => {
                              if (!eventId) return;
                              navigate(`/events/${eventId}/check-out`);
                            },
                          }),
                    })}
              />
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
