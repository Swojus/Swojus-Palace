import React from "react";
import {
  Building2,
  LogOut,
  Mail,
  Phone,
  ShieldCheck,
  UserCircle2,
} from "lucide-react";
import {
  Card,
  CardContent,
  Typography,
  Stack,
  Avatar,
  Button,
  Chip,
  Box,
  Divider,
} from "@mui/material";
import { useAuth } from "../AuthContext";

type ProfileScreenProps = {
  onLogout: () => void;
};

export function ProfileScreen({ onLogout }: ProfileScreenProps) {
  const { user } = useAuth();

  return (
    <Box sx={{ maxWidth: 500, mx: "auto", mt: 4, px: 2 }}>
      <Card elevation={2} sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center" mb={2}>
            <Avatar sx={{ width: 56, height: 56, bgcolor: "primary.main" }}>
              <UserCircle2 size={40} />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                {user?.name ?? user?.email ?? "User"}
              </Typography>
              <Chip
                icon={<ShieldCheck size={18} style={{ marginLeft: 4 }} />}
                label={user?.roleId === 1 ? "Admin" : "Manager"}
                color={user?.roleId === 1 ? "success" : "default"}
                size="small"
                sx={{ mt: 0.5, fontWeight: 500 }}
              />
            </Box>
          </Stack>
          <Divider sx={{ my: 2 }} />
          <Stack spacing={1}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Mail size={18} />
              <Typography variant="body1">{user?.email ?? ""}</Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Phone size={18} />
              <Typography variant="body1">
                {(() => {
                  const p = user?.phone ?? "";
                  if (!p) return "";
                  const digits = p.replace(/\D/g, "");
                  if (digits.length === 10)
                    return digits.replace(/(\d{5})(\d{5})/, "$1 $2");
                  return digits || p;
                })()}
              </Typography>
            </Stack>
          </Stack>
          <Button
            variant="contained"
            color="error"
            startIcon={<LogOut size={18} />}
            onClick={onLogout}
            sx={{ mt: 3, fontWeight: 600 }}
            fullWidth
          >
            Logout
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
