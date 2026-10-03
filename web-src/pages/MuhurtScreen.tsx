import React from "react";
import { useMuhurt } from "../MuhurtContext";
import { CalendarDays, Plus, Trash2 } from "lucide-react";
import apiFetch from "../utils/api";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fab,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useAuth } from "../AuthContext";

export function MuhurtScreen() {
  const { muhurtDates, todayMuhurtDates, addMuhurtDate, removeMuhurtDate } =
    useMuhurt();
  const formatDisplayDate = (value: string) => {
    if (!value) return "";

    const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      return `${day}/${month}/${year}`;
    }

    const parsedDate = new Date(value);
    if (!Number.isNaN(parsedDate.getTime())) {
      const day = String(parsedDate.getDate()).padStart(2, "0");
      const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
      const year = parsedDate.getFullYear();
      return `${day}/${month}/${year}`;
    }

    return value;
  };
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [draftDate, setDraftDate] = React.useState("");
  const [draftDescription, setDraftDescription] = React.useState("");
  const [deleteTarget, setDeleteTarget] = React.useState<null | {
    id: string;
    date: string;
    description: string;
  }>(null);
  const [blockedDeleteTarget, setBlockedDeleteTarget] = React.useState<null | {
    date: string;
    description: string;
  }>(null);
  const [bookedDates, setBookedDates] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    let mounted = true;
    void apiFetch(`/api/events`, { method: "GET" })
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        const nextBookedDates = new Set(
          (Array.isArray(data) ? data : [])
            .filter(
              (record) =>
                record.eventSource === "Booking" && Boolean(record.eventDate),
            )
            .map((record) => String(record.eventDate).slice(0, 10)),
        );
        setBookedDates(nextBookedDates);
      })
      .catch(() => setBookedDates(new Set()));

    return () => {
      mounted = false;
    };
  }, []);

  const { isAdmin } = useAuth();

  const isDuplicateDate = React.useMemo(
    () =>
      Boolean(draftDate && muhurtDates.some((item) => item.date === draftDate)),
    [draftDate, muhurtDates],
  );

  const resetDraft = () => {
    setDraftDate("");
    setDraftDescription("");
  };

  const handleOpenDialog = () => setIsDialogOpen(true);

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetDraft();
  };

  const handleDeleteClick = (item: {
    id: string;
    date: string;
    description: string;
  }) => {
    if (bookedDates.has(item.date)) {
      setBlockedDeleteTarget({
        date: item.date,
        description: item.description,
      });
      return;
    }

    setDeleteTarget(item);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) {
      return;
    }

    removeMuhurtDate(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteTarget(null);
  };

  const handleCloseBlockedDeleteDialog = () => {
    setBlockedDeleteTarget(null);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draftDate || !draftDescription.trim() || isDuplicateDate) {
      return;
    }

    addMuhurtDate({
      date: draftDate,
      description: draftDescription.trim(),
    });
    handleCloseDialog();
  };

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
              Muhurt Dates
            </Typography>
            <Chip
              icon={<CalendarDays size={18} />}
              color="primary"
              label={`${muhurtDates.length} Saved`}
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

      {todayMuhurtDates.length > 0 && (
        <Card
          elevation={3}
          sx={{
            mb: 1.5,
            borderRadius: 4,
            boxShadow: "0 4px 24px rgba(39,48,66,0.08)",
            background:
              "linear-gradient(135deg, rgba(114,102,240,0.12), rgba(28,200,200,0.14))",
          }}
        >
          <CardContent sx={{ py: 1.5, px: 2 }}>
            <Typography variant="subtitle1" fontWeight={800} color="primary">
              Today's Muhurt
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {todayMuhurtDates.map((item) => item.description).join(", ")}
            </Typography>
          </CardContent>
        </Card>
      )}

      {muhurtDates.length === 0 ? (
        <Card
          elevation={1}
          sx={{
            mb: 1.5,
            borderRadius: 4,
            boxShadow: "0 4px 24px rgba(39,48,66,0.08)",
          }}
        >
          <CardContent sx={{ py: 1.5, px: 2 }}>
            <Stack spacing={0.75} alignItems="center" textAlign="center">
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: "primary.main",
                  color: "#fff",
                }}
              >
                <CalendarDays size={20} />
              </Box>
              <Typography variant="subtitle1" fontWeight={800}>
                No Muhurt dates yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isAdmin
                  ? "Tap the + button to add your first Muhurt date."
                  : "Muhurt dates are managed by an admin."}
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={1.5} sx={{ mb: 2 }}>
          {muhurtDates.map((item) => (
            <Card
              key={item.id}
              elevation={1}
              sx={{ borderRadius: 4, overflow: "hidden" }}
            >
              <CardContent
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 2,
                  py: 1.5,
                  px: 2,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "primary.main",
                      color: "#fff",
                    }}
                  >
                    <CalendarDays size={20} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={800}>
                      {formatDisplayDate(item.date)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.description}
                    </Typography>
                  </Box>
                </Box>
                {isAdmin && (
                  <IconButton
                    aria-label={`Delete muhurt date ${item.date}`}
                    color="error"
                    onClick={() => handleDeleteClick(item)}
                  >
                    <Trash2 size={18} />
                  </IconButton>
                )}
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {isAdmin && (
        <Fab
          color="primary"
          aria-label="add muhurt"
          sx={{ position: "fixed", bottom: 150, right: 24, zIndex: 1000 }}
          onClick={handleOpenDialog}
        >
          <Plus />
        </Fab>
      )}

      <Dialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 4,
            boxShadow: "0 12px 32px rgba(39,48,66,0.14)",
          },
        }}
      >
        <DialogTitle
          sx={{
            px: 2,
            pt: 1.75,
            pb: 1,
          }}
        >
          <Stack spacing={0.75}>
            <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2 }}>
              Add Muhurt Date
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.25 }}
            >
              Add a date and a short description to save it.
            </Typography>
          </Stack>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ px: 2, pt: 1.5, pb: 1.5 }}>
            <Stack spacing={1.5}>
              <TextField
                label="Date"
                type="date"
                value={draftDate}
                onChange={(event) => setDraftDate(event.target.value)}
                required
                fullWidth
                error={isDuplicateDate}
                helperText={
                  isDuplicateDate ? "This Muhurt date already exists." : " "
                }
                InputLabelProps={{ shrink: true }}
                sx={{ mt: 0.5 }}
              />
              <TextField
                label="Description"
                value={draftDescription}
                onChange={(event) => setDraftDescription(event.target.value)}
                placeholder="Example: Akshaya Tritiya"
                required
                fullWidth
                multiline
                minRows={2}
                maxRows={4}
              />
            </Stack>
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
              onClick={handleCloseDialog}
              sx={{ px: 2.25, py: 0.8, borderRadius: 2, fontWeight: 700 }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isDuplicateDate}
              sx={{ px: 2.25, py: 0.8, borderRadius: 2, fontWeight: 700 }}
            >
              Add Muhurt
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={handleCloseDeleteDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 4,
            boxShadow: "0 12px 32px rgba(39,48,66,0.14)",
          },
        }}
      >
        <DialogTitle
          sx={{
            px: 2,
            pt: 1.75,
            pb: 1,
          }}
        >
          Delete Muhurt Date
        </DialogTitle>
        <DialogContent sx={{ px: 2, pt: 1, pb: 1.5 }}>
          <Typography variant="body1" color="text.secondary">
            Are you sure you want to delete this Muhurt date?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {deleteTarget ? formatDisplayDate(deleteTarget.date) : ""} —{" "}
            {deleteTarget?.description}
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
            onClick={handleCloseDeleteDialog}
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

      <Dialog
        open={Boolean(blockedDeleteTarget)}
        onClose={handleCloseBlockedDeleteDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: "0 12px 32px rgba(39,48,66,0.12)",
          },
        }}
      >
        <DialogTitle
          sx={{
            px: 2,
            pt: 1.75,
            pb: 0.5,
            fontWeight: 800,
          }}
        >
          Cannot delete Muhurt
        </DialogTitle>
        <DialogContent sx={{ px: 2, pt: 0.5, pb: 1.5 }}>
          <Typography variant="body1" color="text.secondary">
            Muhurt date{" "}
            <strong>
              {blockedDeleteTarget
                ? formatDisplayDate(blockedDeleteTarget.date)
                : ""}
            </strong>{" "}
            already booked.
          </Typography>
        </DialogContent>
        <DialogActions
          sx={{
            px: 2,
            pb: 2,
            pt: 0.5,
            justifyContent: "flex-end",
          }}
        >
          <Button
            variant="contained"
            color="primary"
            onClick={handleCloseBlockedDeleteDialog}
            sx={{ px: 2.25, py: 0.8, borderRadius: 2, fontWeight: 700 }}
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
