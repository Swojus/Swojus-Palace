import React from "react";
import { Card, CardContent, Typography } from "@mui/material";

type LoadingStateProps = {
  message?: string;
  minHeight?: number;
};

export function LoadingState({
  message = "Loading...",
  minHeight = 140,
}: LoadingStateProps) {
  return (
    <Card elevation={1} sx={{ borderRadius: 4 }}>
      <CardContent
        sx={{
          minHeight,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: 3,
        }}
      >
        <Typography color="text.secondary" align="center">
          {message}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default LoadingState;
