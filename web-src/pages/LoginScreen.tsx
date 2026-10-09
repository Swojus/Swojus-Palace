import React from "react";
import {
  ArrowLeft,
  Mail,
  Lock,
  Phone,
  User,
  ShieldCheck,
  Eye,
  EyeOff,
} from "lucide-react";
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
  IconButton,
} from "@mui/material";
import logo from "../assets/app-icon.png";
import { useAuth } from "../AuthContext";

type LoginScreenProps = {
  onLogin: () => void;
};

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loginError, setLoginError] = React.useState<string | null>(null);
  const [signUpError, setSignUpError] = React.useState<string | null>(null);
  const [signUpSuccess, setSignUpSuccess] = React.useState<string | null>(null);
  const [showSignUp, setShowSignUp] = React.useState(false);
  const [showLoginPassword, setShowLoginPassword] = React.useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
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
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/auth/register`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              name: signUpData.name,
              email: signUpData.email,
              phone: sanitizePhone(signUpData.phone),
              password: signUpData.password,
            }),
          },
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Registration failed");
        }
        setSignUpSuccess(
          "Account created successfully. Please wait for admin approval.",
        );
        setShowSignUp(false);
        setSignUpData({
          name: "",
          email: "",
          phone: "",
          password: "",
          confirmPassword: "",
        });
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
        bgcolor: "#e7e3de",
        px: 2,
      }}
    >
      <Card
        sx={{
          width: "100%",
          maxWidth: 440,
          borderRadius: 4,
          boxShadow: "0 12px 32px rgba(0, 0, 0, 0.08)",
          overflow: "hidden",
          bgcolor: "#f4f0ea",
          border: "1px solid rgba(145, 118, 77, 0.08)",
        }}
      >
        <Box
          sx={{
            py: 2.4,
            px: 3,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0.7,
            background: "transparent",
          }}
        >
          <Box
            component="img"
            src={logo}
            alt="App logo"
            sx={{ width: 190, height: 190, display: "block" }}
          />
        </Box>

        <CardContent sx={{ pt: 0.4, px: 3, pb: 3.2 }}>
          {!showSignUp ? (
            <Box component="form" onSubmit={handleLogin}>
              <Stack spacing={2}>
                {signUpSuccess ? (
                  <Typography
                    variant="body2"
                    color="success.main"
                    textAlign="center"
                  >
                    {signUpSuccess}
                  </Typography>
                ) : null}
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
                        <User size={18} color="#7a6658" />
                      </InputAdornment>
                    ),
                    sx: {
                      fontSize: "1.05rem",
                      color: "#2e2a26",
                      borderBottom: "1px solid rgba(100, 80, 60, 0.42)",
                      pb: 0.5,
                    },
                  }}
                  sx={{
                    "& .MuiInputLabel-root": {
                      color: "#5d5149",
                      fontSize: "1.05rem",
                      fontWeight: 500,
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                      color: "#ad7f1f",
                    },
                    "& .MuiInputBase-input::placeholder": {
                      color: "#8d8178",
                      opacity: 1,
                    },
                  }}
                />
                <TextField
                  label="Password"
                  type={showLoginPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock size={18} color="#7a6658" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={
                            showLoginPassword
                              ? "Hide password"
                              : "Show password"
                          }
                          onClick={() => setShowLoginPassword((prev) => !prev)}
                          edge="end"
                          sx={{ color: "#7a6658" }}
                        >
                          {showLoginPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                    sx: {
                      fontSize: "1.05rem",
                      color: "#2e2a26",
                      borderBottom: "1px solid rgba(100, 80, 60, 0.42)",
                      pb: 0.5,
                    },
                  }}
                  sx={{
                    "& .MuiInputLabel-root": {
                      color: "#5d5149",
                      fontSize: "1.05rem",
                      fontWeight: 500,
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                      color: "#ad7f1f",
                    },
                    "& .MuiInputBase-input::placeholder": {
                      color: "#8d8178",
                      opacity: 1,
                    },
                  }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  sx={{
                    py: 1.4,
                    fontWeight: 800,
                    borderRadius: 3,
                    background:
                      "linear-gradient(135deg, #be8d25 0%, #d7a63d 100%)",
                    color: "#fff",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    boxShadow: "0 8px 18px rgba(180, 130, 30, 0.18)",
                    fontSize: "1.05rem",
                  }}
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
                    onClick={() => {
                      setSignUpSuccess(null);
                      setShowSignUp(true);
                    }}
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
                            <User size={18} color="#7a6658" />
                          </InputAdornment>
                        ),
                        sx: {
                          fontSize: "1.05rem",
                          color: "#2e2a26",
                          borderBottom: "1px solid rgba(100, 80, 60, 0.42)",
                          pb: 0.5,
                        },
                      }}
                      sx={{
                        "& .MuiInputLabel-root": {
                          color: "#5d5149",
                          fontSize: "1.05rem",
                          fontWeight: 500,
                        },
                        "& .MuiInputLabel-root.Mui-focused": {
                          color: "#ad7f1f",
                        },
                        "& .MuiInputBase-input::placeholder": {
                          color: "#8d8178",
                          opacity: 1,
                        },
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
                            <Mail size={18} color="#7a6658" />
                          </InputAdornment>
                        ),
                        sx: {
                          fontSize: "1.05rem",
                          color: "#2e2a26",
                          borderBottom: "1px solid rgba(100, 80, 60, 0.42)",
                          pb: 0.5,
                        },
                      }}
                      sx={{
                        "& .MuiInputLabel-root": {
                          color: "#5d5149",
                          fontSize: "1.05rem",
                          fontWeight: 500,
                        },
                        "& .MuiInputLabel-root.Mui-focused": {
                          color: "#ad7f1f",
                        },
                        "& .MuiInputBase-input::placeholder": {
                          color: "#8d8178",
                          opacity: 1,
                        },
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
                            <Phone size={18} color="#7a6658" />
                          </InputAdornment>
                        ),
                        sx: {
                          fontSize: "1.05rem",
                          color: "#2e2a26",
                          borderBottom: "1px solid rgba(100, 80, 60, 0.42)",
                          pb: 0.5,
                        },
                      }}
                      sx={{
                        "& .MuiInputLabel-root": {
                          color: "#5d5149",
                          fontSize: "1.05rem",
                          fontWeight: 500,
                        },
                        "& .MuiInputLabel-root.Mui-focused": {
                          color: "#ad7f1f",
                        },
                        "& .MuiInputBase-input::placeholder": {
                          color: "#8d8178",
                          opacity: 1,
                        },
                      }}
                    />
                    <TextField
                      label="Password"
                      type={showSignUpPassword ? "text" : "password"}
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
                            <Lock size={18} color="#7a6658" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label={
                                showSignUpPassword
                                  ? "Hide password"
                                  : "Show password"
                              }
                              onClick={() =>
                                setShowSignUpPassword((prev) => !prev)
                              }
                              edge="end"
                              sx={{ color: "#7a6658" }}
                            >
                              {showSignUpPassword ? (
                                <EyeOff size={18} />
                              ) : (
                                <Eye size={18} />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                        sx: {
                          fontSize: "1.05rem",
                          color: "#2e2a26",
                          borderBottom: "1px solid rgba(100, 80, 60, 0.42)",
                          pb: 0.5,
                        },
                      }}
                      sx={{
                        "& .MuiInputLabel-root": {
                          color: "#5d5149",
                          fontSize: "1.05rem",
                          fontWeight: 500,
                        },
                        "& .MuiInputLabel-root.Mui-focused": {
                          color: "#ad7f1f",
                        },
                        "& .MuiInputBase-input::placeholder": {
                          color: "#8d8178",
                          opacity: 1,
                        },
                      }}
                    />
                    <TextField
                      label="Confirm Password"
                      type={showConfirmPassword ? "text" : "password"}
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
                            <Lock size={18} color="#7a6658" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label={
                                showConfirmPassword
                                  ? "Hide password"
                                  : "Show password"
                              }
                              onClick={() =>
                                setShowConfirmPassword((prev) => !prev)
                              }
                              edge="end"
                              sx={{ color: "#7a6658" }}
                            >
                              {showConfirmPassword ? (
                                <EyeOff size={18} />
                              ) : (
                                <Eye size={18} />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                        sx: {
                          fontSize: "1.05rem",
                          color: "#2e2a26",
                          borderBottom: "1px solid rgba(100, 80, 60, 0.42)",
                          pb: 0.5,
                        },
                      }}
                      sx={{
                        "& .MuiInputLabel-root": {
                          color: "#5d5149",
                          fontSize: "1.05rem",
                          fontWeight: 500,
                        },
                        "& .MuiInputLabel-root.Mui-focused": {
                          color: "#ad7f1f",
                        },
                        "& .MuiInputBase-input::placeholder": {
                          color: "#8d8178",
                          opacity: 1,
                        },
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
                      sx={{
                        py: 1.4,
                        fontWeight: 800,
                        borderRadius: 3,
                        background:
                          "linear-gradient(135deg, #be8d25 0%, #d7a63d 100%)",
                        color: "#fff",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        boxShadow: "0 8px 18px rgba(180, 130, 30, 0.18)",
                        fontSize: "1.02rem",
                      }}
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
