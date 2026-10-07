import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Stack,
  Box,
  Avatar,
  Button,
  Chip,
} from "@mui/material";
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
          users.map((u) => {
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
            return (
              <Card key={u._id || u.id} elevation={0}>
                <CardContent>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    alignItems={{ xs: "flex-start", sm: "center" }}
                  >
                    <Avatar sx={{ bgcolor: "primary.main" }}>
                      {(u.name || u.email || "").charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography fontWeight={700}>{u.name || "—"}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {u.email}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {u.phone ?? ""}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>
                        {roleLabel}
                      </Typography>
                      {!isAdminUser && (
                        <Chip
                          label={approved ? "Approved" : "Pending"}
                          color={approved ? "success" : "warning"}
                          size="small"
                          variant={approved ? "filled" : "outlined"}
                        />
                      )}
                    </Stack>
                    {u.roleId !== 1 ? (
                      <Stack direction="row" spacing={1}>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          disabled={approved || busyId === (u._id || u.id)}
                          onClick={() => handleApproval(u._id || u.id, true)}
                        >
                          Approve
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          disabled={!approved || busyId === (u._id || u.id)}
                          onClick={() => handleApproval(u._id || u.id, false)}
                        >
                          Reject
                        </Button>
                      </Stack>
                    ) : null}
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
