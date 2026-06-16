"use client";

import React from "react";
import {
  AppBar,
  Box,
  IconButton,
  Toolbar,
  Tooltip,
  Button,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import CampaignIcon from "@mui/icons-material/Campaign";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import LoginIcon from "@mui/icons-material/Login";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import BusinessIcon from "@mui/icons-material/Business";
import MenuIcon from "@mui/icons-material/Menu";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../hooks/useAuth";
import { useAuthModal } from "../providers/AuthModalProvider";
import { ThemeSelect } from "./ThemeSelect";

export type TopNavProps = {
  showSidebarToggle?: boolean;
  onSidebarOpen?: () => void;
};

export const TopNav: React.FC<TopNavProps> = ({ showSidebarToggle, onSidebarOpen }) => {
  const { currentUser, logout } = useAuth();
  const router = useRouter();
  const { openLogin, openRegisterCreator, openRegisterBrand } = useAuthModal();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <AppBar position="static" elevation={0} color="inherit">
      <Toolbar
        sx={{
          maxWidth: 1440,
          width: "100%",
          margin: "0 auto",
          px: { xs: 1.5, sm: 2 },
          minHeight: { xs: 52, sm: 56 },
        }}
      >
        {showSidebarToggle && onSidebarOpen && (
          <IconButton
            size="medium"
            onClick={onSidebarOpen}
            sx={(theme) => ({
              color: "inherit",
              mr: 0.5,
              "&:hover": { bgcolor: alpha(theme.palette.text.primary, 0.06) },
            })}
          >
            <MenuIcon />
          </IconButton>
        )}

        <Tooltip title="Clipify" placement="bottom" arrow>
          <IconButton
            component={Link}
            href={currentUser?.role === "CREATOR" ? "/dashboard/explore" : "/dashboard"}
            size="medium"
            sx={(theme) => ({
              color: "inherit",
              "&:hover": { bgcolor: alpha(theme.palette.text.primary, 0.06) },
            })}
          >
            <CampaignIcon sx={{ fontSize: 28 }} />
          </IconButton>
        </Tooltip>

        <Box sx={{ flex: 1 }} />

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          {!currentUser && (
            <>
              <Tooltip title="Login" placement="bottom" arrow>
                <IconButton
                  onClick={openLogin}
                  size="medium"
                  sx={(theme) => ({
                    color: "text.secondary",
                    "&:hover": {
                      color: "primary.main",
                      bgcolor: alpha(theme.palette.error.main, theme.palette.mode === "dark" ? 0.08 : 0.06),
                    },
                  })}
                >
                  <LoginIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Join as Creator" placement="bottom" arrow>
                <Button
                  onClick={openRegisterCreator}
                  variant="outlined"
                  size="small"
                  sx={{
                    minWidth: "auto",
                    px: 1.5,
                    py: 0.75,
                    borderRadius: 2,
                    borderColor: "primary.main",
                    color: "primary.main",
                    "&:hover": {
                      borderColor: "primary.dark",
                      bgcolor: (theme) => alpha(theme.palette.text.primary, theme.palette.mode === "dark" ? 0.06 : 0.06),
                    },
                  }}
                >
                  <PersonAddIcon sx={{ fontSize: 18, mr: 0.5 }} /> Creator
                </Button>
              </Tooltip>
              <Tooltip title="Join as Brand" placement="bottom" arrow>
                <Button
                  onClick={openRegisterBrand}
                  variant="contained"
                  size="small"
                  sx={{
                    minWidth: "auto",
                    px: 1.5,
                    py: 0.75,
                    borderRadius: 2,
                    bgcolor: "primary.main",
                    "&:hover": { bgcolor: "primary.dark" },
                  }}
                >
                  <BusinessIcon sx={{ fontSize: 18, mr: 0.5 }} /> Brand
                </Button>
              </Tooltip>
            </>
          )}

          {currentUser && (
            <>
              <Tooltip title="Profile" placement="bottom" arrow>
                <IconButton
                  component={Link}
                  href="/dashboard/profile"
                  size="medium"
                  sx={(theme) => ({
                    color: "text.secondary",
                    "&:hover": {
                      color: "primary.main",
                      bgcolor: alpha(theme.palette.error.main, theme.palette.mode === "dark" ? 0.08 : 0.06),
                    },
                  })}
                >
                  <PersonIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Logout" placement="bottom" arrow>
                <IconButton
                  size="medium"
                  onClick={handleLogout}
                  sx={(theme) => ({
                    color: "text.secondary",
                    "&:hover": {
                      color: "error.main",
                      bgcolor: alpha(theme.palette.error.main, theme.palette.mode === "dark" ? 0.12 : 0.08),
                    },
                  })}
                >
                  <LogoutIcon />
                </IconButton>
              </Tooltip>
            </>
          )}
          <ThemeSelect />
        </Box>
      </Toolbar>
    </AppBar>
  );
};
