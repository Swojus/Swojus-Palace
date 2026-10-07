import { createTheme } from "@mui/material/styles";

const getCssVar = (name: string, fallback: string) => {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
};

// Use CSS variables from :root for palette colors
const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: getCssVar("--brand", "#D4A017"),
      contrastText: "#ffffff",
    },
    secondary: {
      main: getCssVar("--teal", "#1F2937"),
    },
    error: {
      main: getCssVar("--danger", "#F15A24"),
    },
    warning: {
      main: getCssVar("--warning", "#D4A017"),
    },
    success: {
      main: getCssVar("--success", "#34d399"),
    },
    background: {
      default: getCssVar("--bg", "#F8FAFC"),
      paper: getCssVar("--surface", "#FFFFFF"),
    },
    text: {
      primary: getCssVar("--text", "#111827"),
      secondary: getCssVar("--muted", "#6B7280"),
    },
  },
  typography: {
    fontFamily: [
      "Manrope",
      "Sora",
      "Roboto",
      "Helvetica",
      "Arial",
      "sans-serif",
    ].join(","),
  },
});

export default theme;
