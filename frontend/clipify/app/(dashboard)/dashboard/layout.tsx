"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Box, CircularProgress } from "@mui/material";
import { TopNav } from "../../../components/TopNav";
import { Sidebar, SIDEBAR_WIDTH_COLLAPSED, SIDEBAR_WIDTH_EXPANDED } from "../../../components/Sidebar";
import { DashboardTopBar } from "../../../components/DashboardTopBar";
import { SetUsernameStep } from "../../../components/SetUsernameStep";
import { CreatorTypeStep } from "../../../components/CreatorTypeStep";
import { useAuth } from "../../../hooks/useAuth";
import { useProfile } from "../../../queries/profile";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { accessToken, currentUser, hydrated } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(
    accessToken && currentUser?.role === "CREATOR" ? accessToken : null
  );
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const isCreator = currentUser?.role === "CREATOR";
  const needsUsername = isCreator && (profile?.username == null || profile?.username === "");
  const needsCreatorType = isCreator && profile?.username != null && profile?.username !== "" && (profile?.creator_type == null || profile?.creator_type === undefined);
  const creatorOnboardingComplete = isCreator && profile?.username && profile?.creator_type != null;

  useEffect(() => {
    if (!hydrated) return;
    if (!accessToken) {
      router.replace("/login");
      return;
    }
    if (creatorOnboardingComplete && pathname === "/dashboard") {
      router.replace("/dashboard/explore");
    }
  }, [hydrated, accessToken, creatorOnboardingComplete, pathname, router]);

  const isCreatorRedirecting = creatorOnboardingComplete && pathname === "/dashboard";

  if (!hydrated || !accessToken || !currentUser) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          bgcolor: "background.default",
        }}
      >
        <TopNav />
        <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
          <CircularProgress sx={{ color: "primary.main" }} />
        </Box>
      </Box>
    );
  }

  if (isCreator && profileLoading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "background.default" }}>
        <TopNav />
        <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
          <CircularProgress sx={{ color: "primary.main" }} />
        </Box>
      </Box>
    );
  }

  if (needsUsername) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "background.default" }}>
        <TopNav />
        <SetUsernameStep />
      </Box>
    );
  }

  if (needsCreatorType) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "background.default" }}>
        <TopNav />
        <CreatorTypeStep />
      </Box>
    );
  }

  if (isCreatorRedirecting) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          bgcolor: "background.default",
        }}
      >
        <TopNav />
        <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
          <CircularProgress sx={{ color: "primary.main" }} />
        </Box>
      </Box>
    );
  }

  const sidebarWidth = sidebarCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
      />
      {/* Main area: fixed so it is strictly bounded by viewport (left to right), no overflow */}
      <Box
        sx={{
          position: "fixed",
          top: 0,
          right: 0,
          left: { xs: 0, md: sidebarWidth },
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          overflow: "auto",
          overflowX: "hidden",
          transition: "left 0.2s ease",
          zIndex: 1000,
        }}
      >
        <DashboardTopBar onMenuClick={() => setSidebarOpen(true)} />
        <Box
          component="main"
          sx={{
            flex: 1,
            width: "100%",
            minWidth: 0,
            px: { xs: 2, sm: 3 },
            py: { xs: 2, sm: 3 },
            boxSizing: "border-box",
          }}
        >
          <Box sx={{ maxWidth: 1400, width: "100%", margin: "0 auto", minWidth: 0 }}>
            {children}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
