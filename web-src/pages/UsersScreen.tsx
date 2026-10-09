import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Stack,
  Box,
  Avatar,
  IconButton,
  Chip,
  Tooltip,
} from "@mui/material";
import { Check, X } from "lucide-react";
import apiFetch from "../utils/api";

export function UsersScreen() {
  const [users, setUsers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const loadUsers = React.useCallback(() => {
    let mounted = true;
    setLoading(true);
    void apiFetch("/api/users", { method: "GET" })
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        setUsers(Array.isArray(data) ? data : []);
      })
      .catch(() => setUsers([]))
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  React.useEffect(() => {
    return loadUsers();
  }, [loadUsers]);

  const handleApproval = async (userId: string, approved: boolean) => {
    setBusyId(userId);
    try {
      const res = await apiFetch(`/api/users/${userId}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved }),
      });
      if (!res.ok) {
        throw new Error("Unable to update approval status");
      }
      await loadUsers();
    } catch (error) {
      console.error(error);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", mt: 3, px: 2 }}>
      <Typography variant="h5" fontWeight={800} sx={{ mb: 2 }}>
        Registered Users
      </Typography>
      <Stack spacing={1.25}>
        {loading ? (
          <Typography>Loading...</Typography>
        ) : users.length === 0 ? (
          <Card elevation={0}>
            <CardContent>
              <Typography color="text.secondary">No users found.</Typography>
            </CardContent>
          </Card>
        ) : (
          [...users]
            .sort((a, b) => {
              const aIsAdmin = a.roleId === 1 ? 1 : 0;
              const bIsAdmin = b.roleId === 1 ? 1 : 0;
              return bIsAdmin - aIsAdmin;
            })
            .map((u) => {
              const isAdminUser = u.roleId === 1;
              const roleLabel = isAdminUser
                ? "Admin"
                : u.roleId === 2
                  ? "Manager"
                  : u.role
                    ? String(u.role)
                    : "User";
              const approved =
                isAdminUser || (u.isApproved !== false && u.approved !== false);
              const userId = u._id || u.id;
              const isBusy = busyId === userId;

              return (
                <Card
                  key={userId}
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: isAdminUser
                      ? "1px solid rgba(168, 85, 247, 0.35)"
                      : "1px solid rgba(15, 23, 42, 0.08)",
                    background: isAdminUser
                      ? "linear-gradient(135deg, rgba(250,245,255,0.98), rgba(239,246,255,0.94))"
                      : "linear-gradient(180deg, rgba(255,255,255,0.95), rgba(248,250,252,0.94))",
                    boxShadow: isAdminUser
                      ? "0 12px 30px rgba(168, 85, 247, 0.10)"
                      : "0 10px 26px rgba(15, 23, 42, 0.04)",
                    position: "relative",
                    overflow: "hidden",
                    "&::before": isAdminUser
                      ? {
                          content: '""',
                          position: "absolute",
                          inset: 0,
                          background:
                            "linear-gradient(90deg, rgba(168,85,247,0.16), transparent 40%)",
                          pointerEvents: "none",
                        }
                      : undefined,
                  }}
                >
                  <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={2}
                      alignItems={{ xs: "flex-start", sm: "center" }}
                    >
                      <Avatar
                        sx={{
                          width: 50,
                          height: 50,
                          fontSize: "1.4rem",
                          fontWeight: 800,
                          bgcolor: isAdminUser
                            ? "linear-gradient(135deg, #7c3aed, #a855f7)"
                            : approved
                              ? "success.main"
                              : "warning.main",
                          color: isAdminUser
                            ? "#fff"
                            : approved
                              ? "#fff"
                              : "#3f2d00",
                          background: isAdminUser
                            ? "linear-gradient(135deg, #7c3aed, #a855f7)"
                            : undefined,
                        }}
                      >
                        {(u.name || u.email || "").charAt(0).toUpperCase()}
                      </Avatar>

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          fontWeight={800}
                          sx={{ fontSize: "1.12rem" }}
                        >
                          {u.name || "—"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {u.email}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {u.phone || "—"}
                        </Typography>
                      </Box>

                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        flexWrap="wrap"
                      >
                        <Chip
                          label={roleLabel}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            bgcolor: isAdminUser
                              ? "rgba(124, 58, 237, 0.12)"
                              : "rgba(15, 23, 42, 0.06)",
                            color: isAdminUser ? "#6d28d9" : "text.primary",
                            border: isAdminUser
                              ? "1px solid rgba(124, 58, 237, 0.25)"
                              : "none",
                          }}
                        />
                        {!isAdminUser && (
                          <Chip
                            label={approved ? "Approved" : "Pending"}
                            color={approved ? "success" : "warning"}
                            variant={approved ? "filled" : "outlined"}
                            size="small"
                            sx={{ fontWeight: 700 }}
                          />
                        )}
                      </Stack>

                      {u.roleId !== 1 && (
                        <Stack direction="row" spacing={1} alignItems="center">
                          {!approved ? (
                            <Tooltip title="Approve user">
                              <span>
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handleApproval(userId, true)}
                                  disabled={isBusy}
                                  sx={{
                                    border: "1px solid rgba(34, 197, 94, 0.2)",
                                    backgroundColor: "rgba(34, 197, 94, 0.08)",
                                    width: 36,
                                    height: 36,
                                  }}
                                >
                                  <Check size={18} />
                                </IconButton>
                              </span>
                            </Tooltip>
                          ) : (
                            <Tooltip title="Reject user">
                              <span>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleApproval(userId, false)}
                                  disabled={isBusy}
                                  sx={{
                                    border: "1px solid rgba(239, 68, 68, 0.2)",
                                    backgroundColor: "rgba(239, 68, 68, 0.06)",
                                    width: 36,
                                    height: 36,
                                  }}
                                >
                                  <X size={18} />
                                </IconButton>
                              </span>
                            </Tooltip>
                          )}
                        </Stack>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              );
            })
        )}
      </Stack>
    </Box>
  );
}

export default UsersScreen;
