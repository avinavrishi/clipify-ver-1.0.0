"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";

export default function WalletPage() {
  return (
    <Box sx={{ maxWidth: 600, mx: "auto", textAlign: "center" }}>
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: 2,
          bgcolor: "rgba(167, 139, 250, 0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 2,
          mx: "auto",
        }}
      >
        <AccountBalanceWalletIcon sx={{ fontSize: 40, color: "primary.main" }} />
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
        View your balance, earnings, and payout history. This page will be available once the API is ready.
      </Typography>
    </Box>
  );
}
