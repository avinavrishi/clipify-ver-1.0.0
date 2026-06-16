"use client";

import React from "react";
import { Box, Container } from "@mui/material";
import { TopNav } from "../../components/TopNav";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
        backgroundImage:
          "radial-gradient(600px 300px at 15% 0%, rgba(229, 9, 20, 0.06), transparent 50%), radial-gradient(500px 250px at 85% 0%, rgba(229, 9, 20, 0.04), transparent 50%)",
      }}
    >
      <TopNav />
      <Container
        maxWidth={false}
        sx={{
          flex: 1,
          width: "100%",
          maxWidth: 1440,
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 3, sm: 4 },
        }}
      >
        {children}
      </Container>
    </Box>
  );
}
