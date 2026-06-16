"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../hooks/useAuth";
import { Box, CircularProgress, Typography } from "@mui/material";

function parseHashParams(hash: string): Record<string, string> {
  const params: Record<string, string> = {};
  if (!hash || hash.charAt(0) !== "#") return params;
  const search = hash.slice(1);
  search.split("&").forEach((pair) => {
    const [key, value] = pair.split("=").map(decodeURIComponent);
    if (key && value !== undefined) params[key] = value;
  });
  return params;
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const { setTokens } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function tryProcessHash() {
      const hash = typeof window !== "undefined" ? window.location.hash : "";
      const params = parseHashParams(hash);
      const accessToken = params.access_token;
      const refreshToken = params.refresh_token ?? null;

      if (accessToken) {
        setTokens(accessToken, refreshToken);
        if (typeof window !== "undefined") {
          window.history.replaceState(null, "", window.location.pathname + window.location.search);
        }
        router.replace("/dashboard");
        return true;
      }
      return false;
    }

    if (tryProcessHash()) return;

    // Hash can be missing for a moment after hydration; re-check after a short delay before showing error
    const t = setTimeout(() => {
      if (!tryProcessHash()) {
        setError("No tokens received. Please try signing in again.");
      }
    }, 150);

    return () => clearTimeout(t);
  }, [router, setTokens]);

  if (error) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          p: 3,
        }}
      >
        <Typography color="error">{error}</Typography>
        <Typography
          component="button"
          variant="body2"
          sx={{ color: "primary.main", cursor: "pointer", border: "none", background: "none", textDecoration: "underline" }}
          onClick={() => router.replace("/auth?tab=login")}
        >
          Try again
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
      }}
    >
      <CircularProgress />
      <Typography variant="body2" color="text.secondary">
        Signing you in…
      </Typography>
    </Box>
  );
}
