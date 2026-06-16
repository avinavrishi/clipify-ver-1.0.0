"use client";

import { Button, Card, CardContent, Typography, Box, Grid, Stack } from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import DashboardIcon from "@mui/icons-material/Dashboard";
import { useAuthModal } from "../../providers/AuthModalProvider";

export default function LandingPage() {
  const { openRegisterCreator, openRegisterBrand } = useAuthModal();

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto" }}>
      <Box
        sx={{
          textAlign: { xs: "center", md: "left" },
          mb: { xs: 6, md: 10 },
          pt: { xs: 4, md: 6 },
        }}
      >
        <Typography
          variant="h1"
          sx={{
            fontWeight: 700,
            lineHeight: 1.15,
            color: "text.primary",
            mb: 2,
            fontSize: { xs: "2.25rem", md: "3.25rem" },
            letterSpacing: "-0.03em",
          }}
        >
          Turn views into{" "}
          <Box component="span" sx={{ color: "primary.main" }}>
            revenue
          </Box>
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: "text.secondary",
            mb: 4,
            maxWidth: 480,
            mx: { xs: "auto", md: 0 },
            lineHeight: 1.6,
          }}
        >
          Performance-based campaigns for creators and brands.
        </Typography>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{ justifyContent: { xs: "center", md: "flex-start" } }}
        >
          <Button variant="contained" onClick={openRegisterCreator} size="large" sx={{ px: 3, py: 1.25 }}>
            Creator
          </Button>
          <Button variant="outlined" onClick={openRegisterBrand} size="large" sx={{ px: 3, py: 1.25 }}>
            Brand
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={3} sx={{ mb: 6 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: "100%", borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: "rgba(229, 9, 20, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", mb: 1.5 }}>
                <TrendingUpIcon sx={{ color: "primary.main", fontSize: 22 }} />
              </Box>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 0.75 }}>
                Performance-first
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                Pay per view. Transparent tracking.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: "100%", borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: "rgba(229, 9, 20, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", mb: 1.5 }}>
                <VerifiedUserIcon sx={{ color: "primary.main", fontSize: 22 }} />
              </Box>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 0.75 }}>
                Fair payouts
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                Clear budgets. No hidden fees.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: "100%", borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: "rgba(229, 9, 20, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", mb: 1.5 }}>
                <DashboardIcon sx={{ color: "primary.main", fontSize: 22 }} />
              </Box>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 0.75 }}>
                One dashboard
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                Campaigns, submissions, earnings.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
