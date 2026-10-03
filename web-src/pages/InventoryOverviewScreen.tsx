import { mockRecords } from "../../src/data/mock";
import apiFetch from "../utils/api";
import React from "react";
import { AlertCircle, MinusCircle, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  Typography,
  Stack,
  Box,
  Chip,
  Button,
} from "@mui/material";
import SearchFilter from "../components/SearchFilter";

export function InventoryOverviewScreen() {
  const navigate = useNavigate();
  const [events, setEvents] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    let mounted = true;
    setLoading(true);
    void apiFetch(`/api/events`, { method: "GET" })
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        const normalized = Array.isArray(data)
          ? data.map((e: any) => ({ ...(e as any), id: e.id || e._id }))
          : [];
        setEvents(normalized);
      })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const allItems = events.flatMap((record) => record.inventory ?? []);
  const totalMissing = allItems.reduce(
    (sum, item) => sum + Math.max(0, item.issuedQty - (item.returnedQty || 0)),
    0,
  );

  const missingByEvent = events
    .map((record) => {
      const missing = (record.inventory ?? [])
        .map((item) => ({
          name: item.name,
          qty: Math.max(0, item.issuedQty - (item.returnedQty || 0)),
        }))
        .filter((item) => item.qty > 0);
      const total = missing.reduce((sum, item) => sum + item.qty, 0);
      return {
        id: record.id,
        title: record.title,
        customer: record.customerName ?? record.name ?? "",
        venue: record.venue,
        date: record.eventDate ?? "",
        total,
        firstMissing: missing[0],
      };
    })
    .filter((record) => record.total > 0);

  const filteredEvents = missingByEvent.filter((event) => {
    const q = search.toLowerCase();
    return (
      event.title.toLowerCase().includes(q) ||
      event.customer.toLowerCase().includes(q) ||
      event.venue.toLowerCase().includes(q)
    );
  });

  const metricCards = [
    {
      label: "Events with missing items",
      value: `${missingByEvent.length}`,
    },
    {
      label: "Total missing units",
      value: `${totalMissing}`,
    },
  ];

  return (
    <Stack
      sx={{ maxWidth: 560, mx: "auto", mt: 1.75, px: 1.25, pb: 2.5 }}
      spacing={1.25}
    >
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid rgba(99, 102, 241, 0.12)",
          background:
            "linear-gradient(180deg, rgba(99,102,241,0.06), rgba(20,184,166,0.04), rgba(255,255,255,0.98))",
          boxShadow: "0 14px 36px rgba(39,48,66,0.08)",
        }}
      >
        <CardContent sx={{ px: 2, py: 1.75 }}>
          <Stack spacing={1.25}>
            <Box>
              <Typography
                variant="overline"
                sx={{
                  display: "block",
                  color: "primary.main",
                  letterSpacing: 1,
                  fontWeight: 800,
                }}
              >
                Inventory Overview
              </Typography>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))",
                gap: 1.25,
              }}
            >
              {metricCards.map((metric) => (
                <Box
                  key={metric.label}
                  sx={{
                    borderRadius: 2.5,
                    background: "rgba(255,255,255,0.88)",
                    border: "1px solid rgba(39,48,66,0.08)",
                    px: 1.25,
                    py: 1,
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      textTransform: "uppercase",
                      fontWeight: 700,
                      letterSpacing: 0.4,
                    }}
                  >
                    {metric.label}
                  </Typography>
                  <Typography
                    variant="h5"
                    fontWeight={900}
                    color="error.main"
                    sx={{ mt: 0.5 }}
                  >
                    {metric.value}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Box sx={{ px: 0.25 }}>
        <SearchFilter
          value={search}
          onChange={setSearch}
          placeholder="Search event, customer or venue"
          className="modern-search"
          sx={{ mb: 0 }}
        />
      </Box>

      <Stack spacing={1.25}>
        {filteredEvents.length === 0 ? (
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: "1px dashed rgba(39,48,66,0.12)",
              background: "rgba(255,255,255,0.9)",
            }}
          >
            <CardContent sx={{ py: 3.5 }}>
              <Typography color="text.secondary" align="center">
                No inventory events found.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          filteredEvents.map((event) => (
            <Card
              key={event.id}
              elevation={0}
              sx={{
                borderRadius: 2.5,
                cursor: "pointer",
                border: "1px solid rgba(39,48,66,0.08)",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.99), rgba(248,250,252,0.94))",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                "&:hover": {
                  transform: "translateY(-1px)",
                  boxShadow: "0 12px 26px rgba(39,48,66,0.1)",
                },
              }}
              onClick={() => navigate(`/inventory/missing/${event.id}`)}
            >
              <CardContent sx={{ px: 1.75, py: 1.5 }}>
                <Stack spacing={1.25}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    spacing={1.5}
                  >
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight={800}>
                        {event.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {event.customer}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {event.venue}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {event.date}
                      </Typography>
                    </Box>

                    <Chip
                      color="error"
                      label={`${event.total} missing`}
                      sx={{
                        fontWeight: 800,
                        borderRadius: 2,
                        px: 1,
                        py: 0.5,
                      }}
                    />
                  </Stack>

                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography variant="caption" color="text.secondary">
                      Tap to inspect full inventory details
                    </Typography>
                    <Button
                      variant="text"
                      endIcon={<ChevronRight size={18} />}
                      sx={{ fontWeight: 800, px: 0 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/inventory/missing/${event.id}`);
                      }}
                    >
                      View Details
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))
        )}
      </Stack>
    </Stack>
  );
}
