import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import apiFetch from "../utils/api";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  CircleDashed,
} from "lucide-react";
import {
  Card,
  CardContent,
  Typography,
  Stack,
  Box,
  IconButton,
  Chip,
} from "@mui/material";

export function MissingInventoryScreen() {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const [event, setEvent] = React.useState<any | null>(null);

  React.useEffect(() => {
    if (!eventId) {
      setEvent(null);
      return;
    }

    let mounted = true;
    void apiFetch(`/api/events/${eventId}`, { method: "GET" })
      .then((res) => {
        if (!res.ok) throw new Error("Event not found");
        return res.json();
      })
      .then((data) => {
        if (!mounted) return;
        setEvent(data || null);
      })
      .catch(() => {
        if (mounted) setEvent(null);
      });

    return () => {
      mounted = false;
    };
  }, [eventId]);

  if (!event) {
    return (
      <Box sx={{ maxWidth: 700, mx: "auto", mt: 4, px: 2 }}>
        <Card elevation={2} sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography color="error" variant="h6">
              Missing inventory record not found.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  const inventoryRows = (event.inventory ?? []).map((item) => {
    const missing = Math.max(0, item.issuedQty - item.returnedQty);

    if (item.issuedQty === 0) {
      return {
        ...item,
        missing,
        status: "not-issued" as const,
        statusLabel: "Not issued",
      };
    }

    if (missing > 0) {
      return {
        ...item,
        missing,
        status: "missing" as const,
        statusLabel: "Missing",
      };
    }

    return {
      ...item,
      missing,
      status: "checked" as const,
      statusLabel: "Checked",
    };
  });

  const totalMissing = inventoryRows.reduce(
    (sum, item) => sum + item.missing,
    0,
  );
  const notIssuedCount = inventoryRows.filter(
    (item) => item.status === "not-issued",
  ).length;
  const checkedCount = inventoryRows.filter(
    (item) => item.status === "checked",
  ).length;

  const statusMeta = {
    "not-issued": {
      label: "Not issued",
      icon: <CircleDashed size={15} />,
      tint: "rgba(39, 48, 66, 0.08)",
      border: "1px solid rgba(39, 48, 66, 0.14)",
      text: "text.primary",
    },
    checked: {
      label: "Checked",
      icon: <CheckCircle2 size={15} />,
      tint: "rgba(16, 185, 129, 0.12)",
      border: "1px solid rgba(16, 185, 129, 0.2)",
      text: "success.main",
    },
    missing: {
      label: "Missing",
      icon: <AlertCircle size={15} />,
      tint: "rgba(239, 68, 68, 0.14)",
      border: "1px solid rgba(239, 68, 68, 0.22)",
      text: "error.main",
    },
  };

  const summaryCards = [
    { label: "Total Qty", value: inventoryRows.length },
    { label: "Not issued Qty", value: notIssuedCount },
    { label: "Checked Qty", value: checkedCount },
    { label: "Missing Qty", value: totalMissing },
  ];

  return (
    <Box sx={{ maxWidth: 760, mx: "auto", mt: 1, px: 0.8, pb: 2.5 }}>
      <Card
        elevation={0}
        sx={{
          mb: 1,
          borderRadius: 3,
          border: "1px solid rgba(59, 130, 246, 0.18)",
          background:
            "linear-gradient(140deg, rgba(59,130,246,0.08), rgba(20,184,166,0.06), rgba(255,255,255,0.98))",
          boxShadow: "0 12px 30px rgba(39,48,66,0.08)",
        }}
      >
        <CardContent sx={{ px: 1.5, py: 1.2 }}>
          <Stack spacing={1}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <IconButton
                onClick={() => navigate(-1)}
                size="small"
                color="primary"
              >
                <ArrowLeft size={18} />
              </IconButton>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="overline"
                  color="primary.main"
                  fontWeight={800}
                  sx={{ fontSize: "0.66rem", lineHeight: 1.15 }}
                >
                  Inventory details
                </Typography>
                <Typography
                  variant="h6"
                  fontWeight={900}
                  color="text.primary"
                  sx={{ fontSize: "1.02rem", lineHeight: 1.2 }}
                >
                  Missing Items
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ lineHeight: 1.3, display: "block" }}
                >
                  {event.customerName ?? event.title}
                  {event.venue ? ` • ${event.venue}` : ""}
                </Typography>
              </Box>
              <Chip
                icon={<AlertCircle size={14} />}
                color="error"
                label={`${totalMissing} missing`}
                sx={{
                  height: 28,
                  borderRadius: 999,
                  fontWeight: 800,
                  fontSize: "0.78rem",
                  px: 1,
                }}
              />
            </Stack>

            <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap" }}>
              {summaryCards.map((metric) => (
                <Box
                  key={metric.label}
                  sx={{
                    flex: "1 1 120px",
                    minWidth: 112,
                    borderRadius: 2,
                    px: 0.9,
                    py: 0.75,
                    background: "rgba(255,255,255,0.92)",
                    border: "1px solid rgba(39,48,66,0.08)",
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      textTransform: "uppercase",
                      fontWeight: 700,
                      letterSpacing: 0.3,
                      fontSize: "0.62rem",
                    }}
                  >
                    {metric.label}
                  </Typography>
                  <Typography
                    variant="h6"
                    fontWeight={900}
                    color={
                      metric.label === "Missing" ? "error.main" : "text.primary"
                    }
                    sx={{ mt: 0.25, fontSize: "1rem", lineHeight: 1.1 }}
                  >
                    {metric.value}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Stack spacing={0.75}>
        {inventoryRows.map((item) => {
          const meta = statusMeta[item.status];

          return (
            <Card
              key={item.id}
              elevation={0}
              sx={{
                borderRadius: 2.5,
                border: "1px solid rgba(39,48,66,0.08)",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,1), rgba(248,250,252,0.94))",
                overflow: "hidden",
                position: "relative",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  inset: 0,
                  left: 0,
                  width: 4,
                  background:
                    item.status === "missing"
                      ? "linear-gradient(180deg, #ef4444, #f97316)"
                      : item.status === "checked"
                        ? "linear-gradient(180deg, #10b981, #14b8a6)"
                        : "linear-gradient(180deg, #94a3b8, #cbd5e1)",
                },
              }}
            >
              <CardContent sx={{ px: 1.25, py: 1 }}>
                <Stack spacing={0.85}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    spacing={1}
                  >
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        variant="subtitle2"
                        fontWeight={800}
                        sx={{ fontSize: "0.95rem", lineHeight: 1.2 }}
                      >
                        {item.name}
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack
                    direction="row"
                    spacing={0.75}
                    sx={{ flexWrap: "wrap" }}
                  >
                    {[
                      { label: "Issued Qty", value: item.issuedQty },
                      { label: "Returned Qty", value: item.returnedQty },
                      { label: "Missing Qty", value: item.missing },
                    ].map((metric) => (
                      <Box
                        key={metric.label}
                        sx={{
                          flex: "1 1 90px",
                          minWidth: 84,
                          borderRadius: 2,
                          px: 0.9,
                          py: 0.7,
                          background:
                            metric.label === "Missing Qty"
                              ? "rgba(239,68,68,0.08)"
                              : "rgba(39,48,66,0.04)",
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontSize: "0.64rem" }}
                        >
                          {metric.label}
                        </Typography>
                        <Typography
                          variant="subtitle2"
                          fontWeight={800}
                          color={
                            metric.label === "Missing"
                              ? "error.main"
                              : "text.primary"
                          }
                          sx={{ fontSize: "0.92rem" }}
                        >
                          {metric.value}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    </Box>
  );
}
