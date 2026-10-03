import React from "react";
import { ArrowLeft, Mail, Lock, Phone, User, ShieldCheck } from "lucide-react";
import {
  Card,
  CardContent,
  Typography,
  Stack,
  Box,
  TextField,
  Button,
  InputAdornment,
  Link,
} from "@mui/material";
import logo from "../assets/logo.svg";
import { useAuth } from "../AuthContext";

type LoginScreenProps = {
  onLogin: () => void;
};

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loginError, setLoginError] = React.useState<string | null>(null);
  const [signUpError, setSignUpError] = React.useState<string | null>(null);
  const [showSignUp, setShowSignUp] = React.useState(false);
  const [signUpData, setSignUpData] = React.useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const isEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const isPhone = (value: string) => {
    const digits = value.replace(/\D/g, "");
    return /^\d{10}$/.test(digits);
  };

  const sanitizePhone = (value: string) =>
    value.replace(/\D/g, "").slice(0, 10);

  const { login } = useAuth();

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email || !password) {
      setLoginError("Please enter your email or phone and password.");
      return;
    }

    if (!isEmail(email) && !isPhone(email)) {
      setLoginError("Enter a valid email address or phone number.");
      return;
    }

    setLoginError(null);
    try {
      await login(email, password);
      onLogin();
    } catch (e: any) {
      setLoginError(e.message || "Login failed");
    }
  };

  const handleSignUp = (event: React.FormEvent) => {
    event.preventDefault();

    if (
      !signUpData.name ||
      !signUpData.email ||
      !signUpData.phone ||
      !signUpData.password ||
      !signUpData.confirmPassword
    ) {
      setSignUpError("Please fill in all required fields.");
      return;
    }

    if (!isEmail(signUpData.email)) {
      setSignUpError("Enter a valid email address.");
      return;
    }

    if (!isPhone(signUpData.phone)) {
      setSignUpError("Phone number must be exactly 10 digits.");
      return;
    }

    if (signUpData.password !== signUpData.confirmPassword) {
      setSignUpError("Passwords do not match.");
      return;
    }

    setSignUpError(null);
    (async () => {
      try {
        const res = await fetch(`/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: signUpData.name,
            email: signUpData.email,
            phone: sanitizePhone(signUpData.phone),
            password: signUpData.password,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Registration failed");
        }
        // auto-login using existing login flow
        await login(signUpData.email, signUpData.password);
        onLogin();
      } catch (e: any) {
        setSignUpError(e.message || "Registration failed");
      }
    })();
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        px: 2,
      }}
    >
      <Card
        sx={{
          width: "100%",
          maxWidth: 440,
          borderRadius: 4,
          boxShadow: "0 20px 80px rgba(0, 0, 0, 0.35)",
          overflow: "hidden",
          bgcolor: "background.paper",
        }}
      >
        <Box
          sx={{
            py: 4,
            px: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1.5,
            background:
              "linear-gradient(180deg, rgba(212,160,59,0.14) 0%, rgba(240,198,107,0.08) 100%)",
          }}
        >
          <Box
            component="img"
            src={logo}
            alt="App logo"
            sx={{ width: 96, height: 96, mb: 0.75 }}
          />
          <Typography
            variant="h5"
            fontWeight={800}
            textAlign="center"
            sx={{ color: "text.primary" }}
          >
            {showSignUp ? "Create Account" : "Welcome"}
          </Typography>
        </Box>

        <CardContent sx={{ pt: 2.5, px: 4, pb: 4 }}>
          {!showSignUp ? (
            <Box component="form" onSubmit={handleLogin}>
              <Stack spacing={2}>
                <TextField
                  label="Email or Phone"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com or 9876543210"
                  required
                  fullWidth
                  error={Boolean(loginError)}
                  helperText={loginError ?? " "}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <User size={18} />
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock size={18} />
                      </InputAdornment>
                    ),
                  }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  sx={{ py: 1.3, fontWeight: 700, borderRadius: 3 }}
                >
                  Sign In
                </Button>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  textAlign="center"
                >
                  Don&apos;t have an account?{" "}
                  <Link
                    component="button"
                    type="button"
                    variant="body2"
                    sx={{ fontWeight: 700 }}
                    onClick={() => setShowSignUp(true)}
                  >
                    Sign Up
                  </Link>
                </Typography>
              </Stack>
            </Box>
          ) : (
            <Box>
              <Box component="form" onSubmit={handleSignUp}>
                <Stack spacing={2}>
                  {signUpError ? (
                    <Typography
                      variant="body2"
                      color="error"
                      textAlign="center"
                    >
                      {signUpError}
                    </Typography>
                  ) : null}
                  <Stack spacing={2}>
                    <TextField
                      label="Full Name"
                      type="text"
                      value={signUpData.name}
                      onChange={(e) =>
                        setSignUpData({ ...signUpData, name: e.target.value })
                      }
                      placeholder="Enter your full name"
                      required
                      fullWidth
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <User size={18} />
                          </InputAdornment>
                        ),
                      }}
                    />
                    <TextField
                      label="Email"
                      type="email"
                      value={signUpData.email}
                      onChange={(e) =>
                        setSignUpData({ ...signUpData, email: e.target.value })
                      }
                      placeholder="you@example.com"
                      required
                      fullWidth
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Mail size={18} />
                          </InputAdornment>
                        ),
                      }}
                    />
                    <TextField
                      label="Phone"
                      type="tel"
                      value={signUpData.phone}
                      onChange={(e) =>
                        setSignUpData({
                          ...signUpData,
                          phone: sanitizePhone(e.target.value),
                        })
                      }
                      placeholder="9876543210"
                      required
                      fullWidth
                      inputProps={{
                        maxLength: 10,
                        inputMode: "numeric",
                        pattern: "[0-9]*",
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Phone size={18} />
                          </InputAdornment>
                        ),
                      }}
                    />
                    <TextField
                      label="Password"
                      type="password"
                      value={signUpData.password}
                      onChange={(e) =>
                        setSignUpData({
                          ...signUpData,
                          password: e.target.value,
                        })
                      }
                      placeholder="Create a strong password"
                      required
                      fullWidth
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Lock size={18} />
                          </InputAdornment>
                        ),
                      }}
                    />
                    <TextField
                      label="Confirm Password"
                      type="password"
                      value={signUpData.confirmPassword}
                      onChange={(e) =>
                        setSignUpData({
                          ...signUpData,
                          confirmPassword: e.target.value,
                        })
                      }
                      placeholder="Confirm your password"
                      required
                      fullWidth
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Lock size={18} />
                          </InputAdornment>
                        ),
                      }}
                    />
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <ShieldCheck size={16} />
                      <Typography variant="caption" color="text.secondary">
                        We&apos;ll keep your information safe and secure.
                      </Typography>
                    </Stack>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      fullWidth
                      sx={{ py: 1.3, fontWeight: 700, borderRadius: 3 }}
                    >
                      Create Account
                    </Button>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      textAlign="center"
                    >
                      Already have an account?{" "}
                      <Link
                        component="button"
                        type="button"
                        variant="body2"
                        sx={{ fontWeight: 700 }}
                        onClick={() => setShowSignUp(false)}
                      >
                        Sign In
                      </Link>
                    </Typography>
                  </Stack>
                </Stack>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
