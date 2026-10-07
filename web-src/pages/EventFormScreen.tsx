import React from "react";
// import { RoomsDropdown } from "../components/RoomsDropdown";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  getDefaultInventory,
  mockRecords,
  saveMockRecord,
} from "../../src/data/mock";
import apiFetch from "../utils/api";
import { addStoredNotification } from "../../src/data/notificationLog";
import type { RecordItem } from "../../src/types";
import { CalendarDays, Save, X } from "lucide-react";
import PersonIcon from "@mui/icons-material/Person";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  TextField,
  Typography,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  Stack,
  Checkbox,
  FormControl,
  InputLabel,
  ListItemText,
  OutlinedInput,
  IconButton,
  Popover,
  Divider,
  Chip,
} from "@mui/material";
import { Grid } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { enIN } from "date-fns/locale";
import { PickersDay } from "@mui/x-date-pickers/PickersDay";
import { useMuhurt } from "../MuhurtContext";
import { useAuth } from "../AuthContext";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

export function EventFormScreen({ mode = "add" }: { mode?: "add" | "edit" }) {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const [searchParams] = useSearchParams();
  const enquiryId = searchParams.get("enquiryId");
  const dateParam = searchParams.get("date") || undefined;
  const asEditFlag = searchParams.get("asEdit");

  const [existingEvent, setExistingEvent] = React.useState<any | undefined>(
    undefined,
  );
  const [allEvents, setAllEvents] = React.useState<any[]>([]);

  React.useEffect(() => {
    let mounted = true;
    void apiFetch(`/api/events`, { method: "GET" })
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        setAllEvents(Array.isArray(data) ? data : []);
      })
      .catch(() => setAllEvents([]));

    if (mode === "edit" && eventId) {
      void apiFetch(`/api/events/${eventId}`, { method: "GET" })
        .then((r) => r.json())
        .then((data) => {
          if (!mounted) return;
          setExistingEvent(data);
        })
        .catch(() => {});
    }
    return () => {
      mounted = false;
    };
  }, [mode, eventId]);
  const enquiry = enquiryId
    ? allEvents.find(
        (record) =>
          (record.id ?? record._id) === enquiryId &&
          record.eventSource === "Enquiry",
      )
    : undefined;
  const sourceRecord = existingEvent ?? enquiry;
  // New form state for all fields in the screenshot
  const [formData, setFormData] = React.useState({
    title: sourceRecord?.title || "",
    customer: sourceRecord?.customerName || "",
    phone: sourceRecord?.phone || "",
    altPhone: sourceRecord?.altPhone || "",
    eventType: sourceRecord?.eventType || "",
    venue: sourceRecord?.venue || "",
    rooms: sourceRecord?.rooms || [],
    eventSource: existingEvent?.eventSource || "Booking",
    confirmed: (sourceRecord as any)?.confirmed || false,
    eventDate: sourceRecord?.eventDate || dateParam || "",
    eventTime: sourceRecord?.eventTime || "",
  });

  React.useEffect(() => {
    setFormData({
      title: sourceRecord?.title || "",
      customer: sourceRecord?.customerName || "",
      phone: sourceRecord?.phone || "",
      altPhone: sourceRecord?.altPhone || "",
      eventType: sourceRecord?.eventType || "",
      venue: sourceRecord?.venue || "",
      rooms: sourceRecord?.rooms || [],
      eventSource: (existingEvent && existingEvent.eventSource) || "Booking",
      confirmed: (sourceRecord as any)?.confirmed || false,
      eventDate:
        (existingEvent && existingEvent.eventDate) ||
        sourceRecord?.eventDate ||
        dateParam ||
        "",
      eventTime:
        (existingEvent && existingEvent.eventTime) ||
        sourceRecord?.eventTime ||
        "",
    });
  }, [sourceRecord, existingEvent, enquiry]);

  function sanitizePhoneInput(value: string) {
    return value.replace(/\D/g, "").slice(0, 10);
  }

  function updateField(field: string, value: any) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (hasBookingConflict) {
      return;
    }

    if (mode === "edit" && !existingEvent) {
      navigate(-1);
      return;
    }

    const inventory = existingEvent?.inventory?.length
      ? existingEvent.inventory
      : sourceRecord?.inventory?.length
        ? sourceRecord.inventory
        : getDefaultInventory();
    const targetId =
      existingEvent?.id ?? existingEvent?._id ?? enquiry?.id ?? enquiry?._id;
    const isConvertingEnquiry = Boolean(enquiry && !existingEvent);
    const isCreatingNewEvent = !existingEvent && !enquiry;

    const payload = {
      title: formData.title,
      customerName: formData.customer,
      phone: formData.phone,
      altPhone: formData.altPhone,
      venue: formData.venue,
      rooms: formData.rooms,
      eventDate: formData.eventDate,
      eventTime: formData.eventTime,
      eventType: formData.eventType,
      eventSource: formData.eventSource as RecordItem["eventSource"],
      inventory,
    };

    const requestId =
      existingEvent?._id || existingEvent?.id || enquiry?._id || enquiry?.id;
    const shouldUpdateExistingRecord = Boolean(
      mode === "edit" || (isConvertingEnquiry && requestId),
    );

    if (mode === "edit" && existingEvent) {
      void apiFetch(`/api/events/${existingEvent._id || existingEvent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then((r) => r.json())
        .then((savedRecord) => {
          addStoredNotification(
            "updated",
            savedRecord.customerName ?? savedRecord.title,
            savedRecord.eventDate,
          );
          navigate(-1);
        })
        .catch(() => {
          // fallback to local save
          saveMockRecord(payload as any, targetId);
          navigate(-1);
        });
      return;
    }

    if (isConvertingEnquiry && requestId) {
      void apiFetch(`/api/events/${requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then((r) => r.json())
        .then((savedRecord) => {
          addStoredNotification(
            "converted",
            savedRecord.customerName ?? savedRecord.title,
            savedRecord.eventDate,
          );
          navigate("/events", { replace: true });
        })
        .catch(() => {
          const savedRecord = saveMockRecord(payload as any, targetId);
          addStoredNotification(
            "converted",
            savedRecord.customerName ?? savedRecord.title,
            savedRecord.eventDate,
          );
          navigate("/events", { replace: true });
        });
      return;
    }

    // create new
    void apiFetch(`/api/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((r) => r.json())
      .then((savedRecord) => {
        const redirectPath =
          savedRecord.eventSource === "Enquiry" ? "/enquiries" : "/events";

        addStoredNotification(
          isCreatingNewEvent ? "created" : "converted",
          savedRecord.customerName ?? savedRecord.title,
          savedRecord.eventDate,
        );

        if (isConvertingEnquiry || isCreatingNewEvent || !existingEvent) {
          navigate(redirectPath, { replace: true });
        } else {
          navigate(-1);
        }
      })
      .catch(() => {
        // fallback to local
        const savedRecord = saveMockRecord(payload as any, targetId);
        const redirectPath =
          savedRecord.eventSource === "Enquiry" ? "/enquiries" : "/events";
        if (isCreatingNewEvent) {
          addStoredNotification(
            "created",
            savedRecord.customerName ?? savedRecord.title,
            savedRecord.eventDate,
          );
          navigate(redirectPath, { replace: true });
        } else {
          navigate(-1);
        }
      });
  }

  // Room group arrays for group-wise selection
  const phase1Rooms = [
    "Phase 1-101",
    "Phase 1-102",
    "Phase 1-103",
    "Phase 1-104",
    "Phase 1-105",
    "Phase 1-106",
    "Phase 1-107",
    "Phase 1-108",
    "Phase 1-109",
  ];
  const phase2Rooms = [
    "Phase 2-101",
    "Phase 2-102",
    "Phase 2-103",
    "Phase 2-104",
    "Phase 2-105",
    "Phase 2-106",
  ];
  const othersRooms = [
    "Others-101",
    "Others-102",
    "Others-103",
    "Others-104",
    "Others-105",
    "Others-106",
    "Others-107",
    "Others-108",
    "Others-109",
    "Others-110",
    "Others-201",
    "Others-202",
    "Others-203",
    "Others-204",
    "Others-205",
    "Others-206",
    "Others-207",
    "Others-208",
    "Others-209",
    "Others-210",
    "Others-301",
    "Others-302",
    "Others-303",
    "Others-304",
    "Others-305",
    "Others-306",
    "Others-307",
    "Others-308",
    "Others-309",
    "Others-310",
    "Others-401",
    "Others-402",
    "Others-403",
    "Others-404",
    "Others-405",
    "Others-406",
    "Others-407",
    "Others-408",
    "Others-409",
    "Others-410",
  ];
  const [roomsAnchorEl, setRoomsAnchorEl] = React.useState<null | HTMLElement>(
    null,
  );

  const { muhurtDates } = useMuhurt();
  const { isAdmin } = useAuth();

  React.useEffect(() => {
    if (mode === "edit" && !eventId) {
      navigate("/events", { replace: true });
      return;
    }

    if (mode === "edit" && !isAdmin) {
      navigate("/events", { replace: true });
    }
  }, [mode, isAdmin, eventId, navigate]);

  // Helper function to format date to YYYY-MM-DD without timezone issues
  const toLocalIsoDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Helper function to parse ISO date string to Date without timezone issues
  const parseLocalIsoDate = (dateString: string): Date | null => {
    if (!dateString) return null;
    const [year, month, day] = dateString.split("-");
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  };

  // Helper to check if a date is a muhurt date
  const isMuhurtDate = (date: Date) => {
    const iso = toLocalIsoDate(date);
    return muhurtDates.some((d) => d.date === iso);
  };

  // Helper to get Muhurt info for a date
  const getMuhurtInfo = (date: Date) => {
    const iso = toLocalIsoDate(date);
    return muhurtDates.find((d) => d.date === iso) || null;
  };

  const isFromEnquiry = Boolean(enquiry && !existingEvent && !asEditFlag);
  const conflictingBooking = allEvents.find(
    (record) =>
      record.eventSource === "Booking" &&
      record.eventDate === formData.eventDate &&
      (record.id ?? record._id) !== (existingEvent?.id ?? existingEvent?._id),
  );
  const hasBookingConflict =
    Boolean(formData.eventDate) && Boolean(conflictingBooking);

  const prefillFieldSx = isFromEnquiry
    ? {
        backgroundColor: "rgba(114,102,240,0.08)",
        borderRadius: 2,
        border: "1px solid rgba(114,102,240,0.6)",
        boxShadow: "0 0 0 1px rgba(114,102,240,0.12)",
      }
    : undefined;
  const scheduleAccentSx = isFromEnquiry
    ? {
        background:
          "linear-gradient(180deg, rgba(114,102,240,0.09), rgba(255,255,255,1))",
        borderRadius: 3,
        border: "1px solid rgba(114,102,240,0.55)",
        boxShadow: "0 0 0 1px rgba(114,102,240,0.1)",
        p: 2,
      }
    : undefined;

  const sectionLabelSx = {
    display: "inline-flex",
    alignItems: "center",
    px: 1.25,
    py: 0.55,
    borderRadius: 999,
    background: isFromEnquiry
      ? "linear-gradient(135deg, rgba(114,102,240,0.16), rgba(28,200,200,0.22))"
      : "rgba(39,48,66,0.06)",
    border: isFromEnquiry
      ? "1px solid rgba(114,102,240,0.45)"
      : "1px solid transparent",
  };

  const sectionBodySx = {
    mt: 1,
  };

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", my: 0 }}>
      <form onSubmit={handleSubmit} autoComplete="off">
        <Card
          sx={{
            mb: 3,
            border: isFromEnquiry
              ? "1.5px solid rgba(28,200,200,0.85)"
              : "1px solid transparent",
            boxShadow: isFromEnquiry
              ? "0 12px 32px rgba(28,200,200,0.16)"
              : "0 4px 20px rgba(39,48,66,0.08)",
            background: isFromEnquiry
              ? "linear-gradient(180deg, rgba(28,200,200,0.08), rgba(255,255,255,1))"
              : undefined,
          }}
        >
          <CardHeader
            sx={{
              background:
                "linear-gradient(135deg, var(--brand), var(--brand-deep))",
              color: "#fff",
              px: 3,
              py: 2.5,
            }}
            avatar={
              <Box
                sx={{
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.12))",
                  borderRadius: 2,
                  p: 1.25,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <PersonIcon sx={{ color: "#fff" }} />
              </Box>
            }
            title={
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                spacing={1}
                sx={{ flexWrap: "wrap", gap: 1 }}
              >
                <Typography
                  variant="h6"
                  sx={{ color: "#fff", fontWeight: 800 }}
                >
                  Basic Information
                </Typography>
                {isFromEnquiry && (
                  <Chip
                    label="Prefilled from enquiry"
                    size="small"
                    sx={{
                      fontWeight: 700,
                      background: "rgba(255,255,255,0.18)",
                      color: "#fff",
                      border: "1px solid rgba(255,255,255,0.24)",
                    }}
                  />
                )}
              </Stack>
            }
            subheader={
              isFromEnquiry
                ? "Convert enquiry into a confirmed event"
                : "Add event details and select rooms"
            }
            subheaderTypographyProps={{
              sx: { color: "rgba(255,255,255,0.86)", fontWeight: 500 },
            }}
          />
          <CardContent>
            <Stack spacing={2}>
              <Box
                sx={{
                  pt: 0.5,
                  borderTop: isFromEnquiry
                    ? "1px solid rgba(114,102,240,0.35)"
                    : "1px solid rgba(39,48,66,0.08)",
                }}
              >
                <Box sx={{ ...sectionBodySx, ...scheduleAccentSx }}>
                  <LocalizationProvider
                    dateAdapter={AdapterDateFns}
                    adapterLocale={enIN}
                  >
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                        gap: 1.5,
                      }}
                    >
                      <Box>
                        <DatePicker
                          label="Date"
                          format="dd/MM/yyyy"
                          value={parseLocalIsoDate(formData.eventDate)}
                          onChange={(date: Date | null) => {
                            if (date) {
                              updateField("eventDate", toLocalIsoDate(date));
                            } else {
                              updateField("eventDate", "");
                            }
                          }}
                          slots={{
                            day: (dayProps) => {
                              const isMuhurt = isMuhurtDate(dayProps.day);
                              return (
                                <PickersDay
                                  {...dayProps}
                                  sx={
                                    isMuhurt
                                      ? {
                                          backgroundColor: "#ff5252",
                                          color: "#fff",
                                          borderRadius: "50%",
                                          "&:hover": {
                                            backgroundColor: "#e53935",
                                          },
                                          border: "2px solid #fff",
                                        }
                                      : {}
                                  }
                                />
                              );
                            },
                          }}
                          slotProps={{
                            textField: {
                              variant: "outlined",
                              required: true,
                              fullWidth: true,
                              InputLabelProps: { shrink: true },
                              sx: prefillFieldSx,
                            },
                          }}
                        />
                        {formData.eventDate &&
                          isMuhurtDate(
                            parseLocalIsoDate(formData.eventDate) || new Date(),
                          ) && (
                            <Box
                              sx={{
                                mt: 1,
                                p: 1,
                                bgcolor: "#ffe5e5",
                                borderRadius: 1,
                                border: "1px solid #ff5252",
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{ color: "#d32f2f", fontWeight: 600 }}
                              >
                                ✓ Muhurt Date:{" "}
                                {
                                  getMuhurtInfo(
                                    parseLocalIsoDate(formData.eventDate) ||
                                      new Date(),
                                  )?.description
                                }
                              </Typography>
                            </Box>
                          )}
                        {hasBookingConflict && (
                          <Box
                            sx={{
                              mt: 1.25,
                              px: 1.5,
                              py: 1,
                              bgcolor: "rgba(244, 67, 54, 0.12)",
                              borderRadius: 2,
                              border: "1px solid rgba(244, 67, 54, 0.45)",
                              display: "flex",
                              alignItems: "flex-start",
                              gap: 1,
                              boxShadow: "0 6px 18px rgba(244, 67, 54, 0.12)",
                              animation:
                                "warningPulse 0.42s ease-out, fadeInUp 0.28s ease-out",
                              "@keyframes warningPulse": {
                                "0%": {
                                  transform: "scale(0.98)",
                                  boxShadow:
                                    "0 0 0 0 rgba(244, 67, 54, 0.24), 0 6px 18px rgba(244, 67, 54, 0.12)",
                                },
                                "70%": {
                                  transform: "scale(1.01)",
                                  boxShadow:
                                    "0 0 0 10px rgba(244, 67, 54, 0.08), 0 6px 18px rgba(244, 67, 54, 0.12)",
                                },
                                "100%": {
                                  transform: "scale(1)",
                                  boxShadow:
                                    "0 0 0 0 rgba(244, 67, 54, 0), 0 6px 18px rgba(244, 67, 54, 0.12)",
                                },
                              },
                              "@keyframes fadeInUp": {
                                "0%": {
                                  opacity: 0,
                                  transform: "translateY(4px)",
                                },
                                "100%": {
                                  opacity: 1,
                                  transform: "translateY(0)",
                                },
                              },
                            }}
                          >
                            <Box
                              sx={{
                                mt: 0.15,
                                width: 20,
                                height: 20,
                                borderRadius: "50%",
                                bgcolor: "error.main",
                                color: "#fff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "0.85rem",
                                fontWeight: 800,
                                flexShrink: 0,
                              }}
                            >
                              !
                            </Box>
                            <Typography
                              variant="body2"
                              sx={{
                                color: "error.main",
                                fontWeight: 800,
                                lineHeight: 1.5,
                              }}
                            >
                              A booking already exists for this date. Choose a
                              different date before creating another event.
                            </Typography>
                          </Box>
                        )}
                      </Box>
                      <Box>
                        <TextField
                          label="Time"
                          type="time"
                          value={formData.eventTime}
                          onChange={(e) =>
                            updateField("eventTime", e.target.value)
                          }
                          InputLabelProps={{ shrink: true }}
                          required
                          fullWidth
                          sx={prefillFieldSx}
                        />
                      </Box>
                    </Box>
                  </LocalizationProvider>
                </Box>
              </Box>
              <TextField
                label="Title *"
                placeholder="Event title"
                value={formData.title}
                onChange={(e) => updateField("title", e.target.value)}
                required
                fullWidth
                sx={prefillFieldSx}
              />
              <TextField
                label="Customer *"
                placeholder="Customer name"
                value={formData.customer}
                onChange={(e) => updateField("customer", e.target.value)}
                required
                fullWidth
                sx={prefillFieldSx}
              />
              <TextField
                label="Phone *"
                placeholder="9876543210"
                value={formData.phone}
                onChange={(e) =>
                  updateField("phone", sanitizePhoneInput(e.target.value))
                }
                required
                fullWidth
                inputProps={{
                  maxLength: 10,
                  inputMode: "numeric",
                  pattern: "[0-9]*",
                }}
                sx={prefillFieldSx}
              />
              <TextField
                label="Alternative Number"
                placeholder="9876543210"
                value={formData.altPhone}
                onChange={(e) =>
                  updateField("altPhone", sanitizePhoneInput(e.target.value))
                }
                fullWidth
                inputProps={{
                  maxLength: 10,
                  inputMode: "numeric",
                  pattern: "[0-9]*",
                }}
                sx={prefillFieldSx}
              />
              <TextField
                select
                label="Event Type *"
                value={formData.eventType}
                onChange={(e) => updateField("eventType", e.target.value)}
                required
                fullWidth
                sx={prefillFieldSx}
              >
                <MenuItem value="">Select event type...</MenuItem>
                <MenuItem value="Wedding">Wedding</MenuItem>
                <MenuItem value="Conference">Conference</MenuItem>
                <MenuItem value="Birthday">Birthday</MenuItem>
                <MenuItem value="Corporate">Corporate</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </TextField>
              <TextField
                select
                label="Venue *"
                value={formData.venue}
                onChange={(e) => updateField("venue", e.target.value)}
                required
                fullWidth
                sx={prefillFieldSx}
                // placeholder and SelectProps reverted
              >
                <MenuItem value="">Select venue...</MenuItem>
                <MenuItem value="Phase 1">Phase 1</MenuItem>
                <MenuItem value="Phase 2">Phase 2</MenuItem>
              </TextField>
              {/* Group-wise Multi-Select Dropdown for Rooms */}
              <FormControl fullWidth required sx={prefillFieldSx}>
                <InputLabel id="rooms-multiselect-label">Rooms *</InputLabel>
                <OutlinedInput
                  label="Rooms *"
                  value={formData.rooms}
                  readOnly
                  // placeholder reverted
                  endAdornment={
                    <IconButton
                      onClick={(e) => setRoomsAnchorEl(e.currentTarget)}
                      edge="end"
                      size="small"
                    >
                      <ExpandMoreIcon />
                    </IconButton>
                  }
                  onClick={(e) => setRoomsAnchorEl(e.currentTarget)}
                  sx={{
                    cursor: "pointer",
                    background: isFromEnquiry
                      ? "linear-gradient(180deg, rgba(114,102,240,0.09), rgba(255,255,255,0.98))"
                      : "#fafbff",
                  }}
                />
              </FormControl>
              <Popover
                open={Boolean(roomsAnchorEl)}
                anchorEl={roomsAnchorEl}
                onClose={() => setRoomsAnchorEl(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                transformOrigin={{ vertical: "top", horizontal: "left" }}
                PaperProps={{ style: { minWidth: 320, maxWidth: 400 } }}
              >
                <Box sx={{ p: 2 }}>
                  {/* Phase 1 group */}
                  <Box sx={{ mb: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <Checkbox
                        checked={phase1Rooms.every((r) =>
                          formData.rooms.includes(r),
                        )}
                        indeterminate={
                          phase1Rooms.some((r) => formData.rooms.includes(r)) &&
                          !phase1Rooms.every((r) => formData.rooms.includes(r))
                        }
                        onChange={(e) => {
                          const checked = e.target.checked;
                          updateField(
                            "rooms",
                            checked
                              ? Array.from(
                                  new Set([...formData.rooms, ...phase1Rooms]),
                                )
                              : formData.rooms.filter(
                                  (r: string) => !phase1Rooms.includes(r),
                                ),
                          );
                        }}
                        size="small"
                      />
                      <Typography sx={{ fontWeight: 600 }}>
                        Phase 1 (9)
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: 1,
                      }}
                    >
                      {phase1Rooms.map((room) => (
                        <Box
                          key={room}
                          sx={{ display: "flex", alignItems: "center" }}
                        >
                          <Checkbox
                            checked={formData.rooms.includes(room)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              updateField(
                                "rooms",
                                checked
                                  ? [...formData.rooms, room]
                                  : formData.rooms.filter(
                                      (r: string) => r !== room,
                                    ),
                              );
                            }}
                            size="small"
                          />
                          <ListItemText
                            primary={room.replace(/^[^-]+-/, "")}
                            sx={{ display: "inline" }}
                          />
                        </Box>
                      ))}
                    </Box>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  {/* Phase 2 group */}
                  <Box sx={{ mb: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <Checkbox
                        checked={phase2Rooms.every((r) =>
                          formData.rooms.includes(r),
                        )}
                        indeterminate={
                          phase2Rooms.some((r) => formData.rooms.includes(r)) &&
                          !phase2Rooms.every((r) => formData.rooms.includes(r))
                        }
                        onChange={(e) => {
                          const checked = e.target.checked;
                          updateField(
                            "rooms",
                            checked
                              ? Array.from(
                                  new Set([...formData.rooms, ...phase2Rooms]),
                                )
                              : formData.rooms.filter(
                                  (r: string) => !phase2Rooms.includes(r),
                                ),
                          );
                        }}
                        size="small"
                      />
                      <Typography sx={{ fontWeight: 600 }}>
                        Phase 2 (6)
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: 1,
                      }}
                    >
                      {phase2Rooms.map((room) => (
                        <Box
                          key={room}
                          sx={{ display: "flex", alignItems: "center" }}
                        >
                          <Checkbox
                            checked={formData.rooms.includes(room)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              updateField(
                                "rooms",
                                checked
                                  ? [...formData.rooms, room]
                                  : formData.rooms.filter(
                                      (r: string) => r !== room,
                                    ),
                              );
                            }}
                            size="small"
                          />
                          <ListItemText
                            primary={room.replace(/^[^-]+-/, "")}
                            sx={{ display: "inline" }}
                          />
                        </Box>
                      ))}
                    </Box>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  {/* Others group */}
                  <Box>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <Checkbox
                        checked={othersRooms.every((r) =>
                          formData.rooms.includes(r),
                        )}
                        indeterminate={
                          othersRooms.some((r) => formData.rooms.includes(r)) &&
                          !othersRooms.every((r) => formData.rooms.includes(r))
                        }
                        onChange={(e) => {
                          const checked = e.target.checked;
                          updateField(
                            "rooms",
                            checked
                              ? Array.from(
                                  new Set([...formData.rooms, ...othersRooms]),
                                )
                              : formData.rooms.filter(
                                  (r: string) => !othersRooms.includes(r),
                                ),
                          );
                        }}
                        size="small"
                      />
                      <Typography sx={{ fontWeight: 600 }}>
                        Others (40)
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(5, 1fr)",
                        gap: 1,
                        maxHeight: 180,
                        overflowY: "auto",
                      }}
                    >
                      {othersRooms.map((room) => (
                        <Box
                          key={room}
                          sx={{ display: "flex", alignItems: "center" }}
                        >
                          <Checkbox
                            checked={formData.rooms.includes(room)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              updateField(
                                "rooms",
                                checked
                                  ? [...formData.rooms, room]
                                  : formData.rooms.filter(
                                      (r: string) => r !== room,
                                    ),
                              );
                            }}
                            size="small"
                          />
                          <ListItemText
                            primary={room.replace(/^[^-]+-/, "")}
                            sx={{ display: "inline" }}
                          />
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Box>
              </Popover>
              <Box>
                <Box sx={sectionBodySx}>
                  <Box
                    sx={{
                      display: "flex",
                      width: "100%",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        width: "100%",
                        maxWidth: 380,
                        background: isFromEnquiry
                          ? "linear-gradient(180deg, rgba(114,102,240,0.09), rgba(28,200,200,0.08))"
                          : "#f0f4ff",
                        borderRadius: 999,
                        border: isFromEnquiry
                          ? "1px solid rgba(114,102,240,0.45)"
                          : "none",
                        boxShadow: isFromEnquiry
                          ? "0 0 0 1px rgba(114,102,240,0.12)"
                          : "0 2px 8px rgba(39,48,66,0.06)",
                        p: 0.5,
                      }}
                    >
                      {(["Enquiry", "Booking"] as const).map((option) => (
                        <Box
                          key={option}
                          onClick={() => updateField("eventSource", option)}
                          sx={{
                            flex: 1,
                            textAlign: "center",
                            py: 1,
                            cursor: "pointer",
                            borderRadius: 999,
                            transition: "all 0.2s",
                            fontWeight: 800,
                            fontSize: "1rem",
                            letterSpacing: 0.2,
                            color:
                              formData.eventSource === option
                                ? "#fff"
                                : "var(--text)",
                            background:
                              formData.eventSource === option
                                ? "linear-gradient(90deg, var(--brand), var(--brand-deep))"
                                : "rgba(18, 8, 8, 0.06)",
                            border:
                              formData.eventSource === option
                                ? "none"
                                : "1px solid rgba(18, 8, 8, 0.12)",
                            boxShadow:
                              formData.eventSource === option
                                ? "0 8px 24px rgba(212, 160, 59, 0.18)"
                                : "none",
                          }}
                        >
                          {option}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Box>
              </Box>
              <Stack
                direction="row"
                spacing={1.5}
                justifyContent="flex-end"
                sx={{
                  mt: 2,
                  pt: 1.5,
                  borderTop: isFromEnquiry
                    ? "1.5px solid rgba(114,102,240,0.35)"
                    : "1.5px solid rgba(39,48,66,0.12)",
                }}
              >
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<X size={16} />}
                  onClick={() => navigate(-1)}
                  sx={{ px: 2.25, py: 0.8 }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  type="submit"
                  startIcon={<Save size={16} />}
                  disabled={hasBookingConflict}
                  sx={{ px: 2.25, py: 0.8 }}
                >
                  {mode === "edit" ? "Update" : "Create"}
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </form>
    </Box>
  );
}
