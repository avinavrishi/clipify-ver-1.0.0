"use client";

import React from "react";
import {
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CampaignIcon from "@mui/icons-material/Campaign";
import ExploreIcon from "@mui/icons-material/Explore";
import PersonIcon from "@mui/icons-material/Person";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import BusinessIcon from "@mui/icons-material/Business";
import BarChartIcon from "@mui/icons-material/BarChart";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import LogoutIcon from "@mui/icons-material/Logout";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../hooks/useAuth";

export const SIDEBAR_WIDTH_EXPANDED = 260;
export const SIDEBAR_WIDTH_COLLAPSED = 72;

type NavItem = { href: string; label: string; icon: React.ReactNode };

function creatorNavItems(): NavItem[] {
  return [
    { href: "/dashboard/explore", label: "Explore", icon: <ExploreIcon /> },
    { href: "/dashboard/campaigns", label: "Campaigns", icon: <CampaignIcon /> },
    { href: "/dashboard/account", label: "Account", icon: <PersonIcon /> },
    { href: "/dashboard/wallet", label: "Wallet", icon: <AccountBalanceWalletIcon /> },
  ];
}

function brandNavItems(): NavItem[] {
  return [
    { href: "/dashboard", label: "Dashboard", icon: <DashboardIcon /> },
    { href: "/dashboard/brand/campaigns", label: "Campaigns", icon: <CampaignIcon /> },
    { href: "/dashboard/wallet", label: "Wallet", icon: <AccountBalanceWalletIcon /> },
  ];
}

function adminNavItems(): NavItem[] {
  return [
    { href: "/dashboard", label: "Dashboard", icon: <DashboardIcon /> },
    { href: "/dashboard/admin/users", label: "Users", icon: <PeopleIcon /> },
    { href: "/dashboard/admin/brands", label: "Brands", icon: <BusinessIcon /> },
    { href: "/dashboard/admin/campaigns", label: "Campaigns", icon: <CampaignIcon /> },
    { href: "/dashboard/admin/kpis", label: "KPIs", icon: <BarChartIcon /> },
    { href: "/dashboard/admin/verifications", label: "Verifications", icon: <VerifiedUserIcon /> },
    { href: "/dashboard/admin/participations", label: "Applications", icon: <AssignmentIndIcon /> },
    { href: "/dashboard/wallet", label: "Wallet", icon: <AccountBalanceWalletIcon /> },
  ];
}

function SidebarContent({
  collapsed,
  onCloseMobile,
  onToggleCollapse,
}: {
  collapsed: boolean;
  onCloseMobile?: () => void;
  onToggleCollapse?: () => void;
}) {
  const pathname = usePathname();
  const { currentUser, logout } = useAuth();
  const router = useRouter();

  const items =
    currentUser?.role === "CREATOR"
      ? creatorNavItems()
      : currentUser?.role === "BRAND"
        ? brandNavItems()
        : currentUser?.role === "ADMIN"
          ? adminNavItems()
          : [];

  const width = collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED;

  return (
    <Box
      sx={{
        width,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: (theme) => (theme.palette.mode === "dark" ? "#1a1a1a" : theme.palette.grey[100]),
        borderRight: (theme) => `1px solid ${theme.palette.divider}`,
        transition: "width 0.2s ease, background-color 0.25s ease, border-color 0.25s ease",
        overflow: "hidden",
      }}
    >
      {/* Header: logo + toggle (desktop) */}
      <Box
        sx={{
          py: 2,
          px: collapsed ? 1.5 : 2,
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          gap: 1,
          minHeight: 56,
        }}
      >
        {collapsed ? (
          <Tooltip title="Clipify" placement="right" arrow>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CampaignIcon sx={{ fontSize: 28, color: "primary.main" }} />
            </Box>
          </Tooltip>
        ) : (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
            <CampaignIcon sx={{ fontSize: 28, color: "primary.main", flexShrink: 0 }} />
            <Typography variant="h6" fontWeight={700} color="text.primary" noWrap>
              Clipify
            </Typography>
          </Box>
        )}
      </Box>

      <List sx={{ flex: 1, py: 2, px: collapsed ? 1 : 1.5 }}>
        {items.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
          const listItem = (
            <ListItemButton
              key={item.href}
              component={Link}
              href={item.href}
              selected={isActive}
              onClick={onCloseMobile}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                justifyContent: collapsed ? "center" : "flex-start",
                px: collapsed ? 1.5 : 2,
                minHeight: 44,
                "&.Mui-selected": {
                  bgcolor: (theme) => alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.15 : 0.12),
                  color: "primary.main",
                  "&:hover": {
                    bgcolor: (theme) => alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.22 : 0.18),
                  },
                  "& .MuiListItemIcon-root": { color: "primary.main" },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: collapsed ? 0 : 40,
                  color: isActive ? "primary.main" : "text.secondary",
                  justifyContent: "center",
                }}
              >
                {item.icon}
              </ListItemIcon>
              {!collapsed && (
                <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 500, fontSize: "0.9rem" }} />
              )}
            </ListItemButton>
          );
          return collapsed ? (
            <Tooltip key={item.href} title={item.label} placement="right" arrow>
              {listItem}
            </Tooltip>
          ) : (
            listItem
          );
        })}
      </List>

      {/* Footer: expand button when collapsed, notifications when expanded */}
      <Box
        sx={{
          p: collapsed ? 1.5 : 2,
          borderTop: (theme) => `1px solid ${theme.palette.divider}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Tooltip title="Logout" placement="right" arrow>
          <IconButton
            size="small"
            onClick={() => {
              logout();
              router.push("/");
            }}
            sx={{ color: "text.secondary" }}
          >
            <LogoutIcon />
          </IconButton>
        </Tooltip>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {collapsed && onToggleCollapse ? (
            <Tooltip title="Expand sidebar" placement="right" arrow>
              <IconButton size="small" onClick={onToggleCollapse} sx={{ color: "text.secondary" }}>
                <ChevronRightIcon />
              </IconButton>
            </Tooltip>
          ) : (
            onToggleCollapse && (
              <Tooltip title="Collapse sidebar" placement="right" arrow>
                <IconButton size="small" onClick={onToggleCollapse} sx={{ color: "text.secondary" }}>
                  <ChevronLeftIcon />
                </IconButton>
              </Tooltip>
            )
          )}
        </Box>
      </Box>
    </Box>
  );
}

export function Sidebar({
  open,
  onClose,
  collapsed,
  onToggleCollapse,
}: {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const width = collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED;

  return (
    <>
      {/* Fixed sidebar: visible from md up, does not scroll */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          position: "fixed",
          left: 0,
          top: 0,
          width,
          height: "100vh",
          flexShrink: 0,
          transition: "width 0.2s ease",
          zIndex: 1100,
        }}
      >
        <SidebarContent collapsed={collapsed} onToggleCollapse={onToggleCollapse} />
      </Box>
      {/* Mobile drawer: always expanded */}
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        anchor="left"
        sx={(theme) => ({
          display: { md: "none" },
          "& .MuiDrawer-paper": {
            width: SIDEBAR_WIDTH_EXPANDED,
            boxSizing: "border-box",
            top: 0,
            height: "100vh",
            borderRight: `1px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.mode === "dark" ? "#1a1a1a" : theme.palette.grey[100],
            transition: "background-color 0.25s ease, border-color 0.25s ease",
          },
        })}
      >
        <Box
          sx={(theme) => ({
            py: 1.5,
            px: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            borderBottom: `1px solid ${theme.palette.divider}`,
          })}
        >
          <IconButton size="small" onClick={onClose} sx={{ color: "text.secondary" }}>
            <ChevronLeftIcon />
          </IconButton>
        </Box>
        <SidebarContent collapsed={false} onCloseMobile={onClose} />
      </Drawer>
    </>
  );
}
