import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Stack,
  Box,
  Avatar,
  Button,
} from "@mui/material";
import apiFetch from "../utils/api";

export function UsersScreen() {
  const [users, setUsers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    setLoading(true);
    void apiFetch("/api/users", { method: "GET" })
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        setUsers(Array.isArray(data) ? data : []);
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

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
            const roleLabel =
              u.roleId === 1
                ? "Admin"
                : u.roleId === 2
                  ? "Manager"
                  : u.role
                    ? String(u.role)
                    : "User";
            return (
              <Card key={u._id} elevation={0}>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
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
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>
                        {roleLabel}
                      </Typography>
                    </Box>
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
