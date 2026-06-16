"use client";

import React from "react";
import { AppBar, Box, Toolbar, Button, IconButton, Tooltip, Typography, Avatar } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import PersonIcon from "@mui/icons-material/Person";
import LoginIcon from "@mui/icons-material/Login";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import BusinessIcon from "@mui/icons-material/Business";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../hooks/useAuth";
import { useAuthModal } from "../providers/AuthModalProvider";
import { NotificationBell } from "./NotificationBell";
import { ThemeSelect } from "./ThemeSelect";

function Breadcrumbs() {
  const pathname = usePathname();
  if (!pathname?.startsWith("/dashboard")) return null;
  const segments = pathname.replace(/^\/dashboard\/?/, "").split("/").filter(Boolean);
  if (segments.length === 0) return <Typography variant="body2" color="text.secondary">Home</Typography>;
  const items = ["Home", ...segments.map((s) => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, " "))];
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap" }}>
      {items.map((label, i) => (
        <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          {i > 0 && <NavigateNextIcon sx={{ fontSize: 16, color: "text.secondary", opacity: 0.7 }} />}
          <Typography variant="body2" color={i === items.length - 1 ? "text.primary" : "text.secondary"} fontWeight={i === items.length - 1 ? 600 : 400}>
            {label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

export function DashboardTopBar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { currentUser } = useAuth();
  const { openLogin, openRegisterCreator, openRegisterBrand } = useAuthModal();

  return (
    <AppBar position="static" elevation={0} sx={{ bgcolor: "background.paper", borderBottom: "1px solid", borderColor: "divider", minWidth: 0 }}>
      <Toolbar sx={{ minHeight: { xs: 52, sm: 56 }, px: { xs: 2, sm: 3 }, gap: 2, minWidth: 0 }}>
        {onMenuClick && (
          <IconButton size="medium" onClick={onMenuClick} sx={{ display: { md: "none" }, color: "text.secondary", mr: 0.5 }} aria-label="Open menu">
            <MenuIcon />
          </IconButton>
        )}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Breadcrumbs />
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {!currentUser && (
            <>
              <Button variant="outlined" size="small" onClick={openLogin} startIcon={<LoginIcon />} sx={{ borderRadius: 2 }}>
                Login
              </Button>
              <Button variant="contained" size="small" onClick={openRegisterCreator} startIcon={<PersonAddIcon />} sx={{ borderRadius: 2 }}>
                Creator
              </Button>
              <Button variant="contained" size="small" onClick={openRegisterBrand} startIcon={<BusinessIcon />} sx={{ borderRadius: 2 }}>
                Brand
              </Button>
              <ThemeSelect />
            </>
          )}
          {currentUser && (
            <>
              <Tooltip title="Profile">
                <IconButton component={Link} href="/dashboard/profile" size="small" sx={{ color: "text.secondary" }}>
                  <Avatar sx={{ width: 28, height: 28, bgcolor: "primary.main", color: "primary.contrastText", fontSize: "0.875rem" }}>
                    {currentUser.email?.[0]?.toUpperCase() ?? "?"}
                  </Avatar>
                </IconButton>
              </Tooltip>
              <NotificationBell />
              <ThemeSelect />
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
