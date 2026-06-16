"use client";

import React, { Suspense } from "react";
import { Box, CircularProgress } from "@mui/material";
import { AuthPageView } from "../../../components/auth/AuthPageView";

function AuthPageFallback() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
      }}
    >
      <CircularProgress size={36} />
    </Box>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<AuthPageFallback />}>
      <AuthPageView />
    </Suspense>
  );
}
