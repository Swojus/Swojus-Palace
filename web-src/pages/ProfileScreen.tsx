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
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";

type ProfileScreenProps = {
  onLogout: () => void;
};

export function ProfileScreen({ onLogout }: ProfileScreenProps) {
  const { roleId, setRoleId, isAdmin } = useAuth();

  const handleRoleChange = (event: any) => {
    const val = Number(event.target.value as number);
    setRoleId(val);
  };

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
                Yuvraj Akhade
              </Typography>
              <FormControl size="small" sx={{ mt: 0.5, minWidth: 140 }}>
                <InputLabel id="role-select-label">Role</InputLabel>
                <Select
                  labelId="role-select-label"
                  value={roleId}
                  label="Role"
                  onChange={handleRoleChange}
                >
                  <MenuItem value={1}>Admin</MenuItem>
                  <MenuItem value={2}>Manager</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Stack>
          <Divider sx={{ my: 2 }} />
          <Stack spacing={1}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Mail size={18} />
              <Typography variant="body1">manager@example.com</Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Phone size={18} />
              <Typography variant="body1">+91 98765 43210</Typography>
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

      <Card elevation={1} sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Security
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Session status: Active
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Last login: Today
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
