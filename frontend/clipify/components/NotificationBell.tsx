"use client";

import React, { useState } from "react";
import {
  Badge,
  Box,
  Button,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Menu,
  Typography,
  CircularProgress,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import NotificationsIcon from "@mui/icons-material/Notifications";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import { useRouter } from "next/navigation";
import { useAuth } from "../hooks/useAuth";
import {
  useNotifications,
  useUnreadCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "../queries/notifications";
import type { Notification } from "../types/notification";

function getActionHref(n: Notification): string | null {
  const d = n.data as Record<string, unknown>;
  
  // Admin/Brand: Campaign participation pending notifications
  if (n.type === "CAMPAIGN_PARTICIPATION_PENDING" && d?.participation_id) {
    return "/dashboard/admin/participations";
  }
  
  // Creator: Campaign participation approved/rejected
  if (
    (n.type === "CAMPAIGN_PARTICIPATION_APPROVED" || n.type === "CAMPAIGN_PARTICIPATION_REJECTED") &&
    d?.campaign_id &&
    typeof d.campaign_id === "string"
  ) {
    return `/dashboard/explore/${d.campaign_id}`;
  }
  
  // Creator: Content approved/rejected → campaign submissions hub
  if (
    (n.type === "CONTENT_APPROVED" || n.type === "CONTENT_REJECTED") &&
    d?.campaign_id &&
    typeof d.campaign_id === "string"
  ) {
    return `/dashboard/campaigns/${d.campaign_id}/submissions`;
  }
  if ((n.type === "CONTENT_APPROVED" || n.type === "CONTENT_REJECTED") && d?.submission_id) {
    return "/dashboard/campaigns";
  }
  
  // Admin/Brand: Content submitted
  if (n.type === "CONTENT_SUBMITTED" && d?.campaign_id && typeof d.campaign_id === "string") {
    return `/dashboard/explore/${d.campaign_id}`;
  }
  
  // Campaign links
  if (d?.campaign_id && typeof d.campaign_id === "string") {
    return `/dashboard/explore/${d.campaign_id}`;
  }
  
  // Social account notifications
  if (n.type === "SOCIAL_ACCOUNT_APPROVED" || n.type === "SOCIAL_ACCOUNT_REJECTED") {
    return "/dashboard/account";
  }
  
  return null;
}

function formatTime(created_at: string): string {
  const d = new Date(created_at);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

export function NotificationBell() {
  const theme = useTheme();
  const { accessToken } = useAuth();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const { data: unreadData } = useUnreadCount(accessToken);
  const { data: notifications, isLoading } = useNotifications(accessToken, {
    limit: 20,
    unread_only: false,
  });
  const markRead = useMarkNotificationRead(accessToken);
  const markAllRead = useMarkAllNotificationsRead(accessToken);

  const unreadCount = unreadData?.unread_count ?? 0;

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (n: Notification) => {
    if (!n.is_read) {
      markRead.mutate(n.id);
    }
    const href = getActionHref(n);
    if (href) {
      router.push(href);
    }
    handleClose();
  };

  const handleMarkAllRead = () => {
    markAllRead.mutate();
    handleClose();
  };

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleOpen}
        sx={{
          color: "text.secondary",
          "&:hover": {
            backgroundColor: alpha(theme.palette.text.primary, theme.palette.mode === "dark" ? 0.06 : 0.08),
            color: "primary.main",
          },
        }}
        aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"}
      >
        <Badge badgeContent={unreadCount > 0 ? unreadCount : 0} color="error">
          {unreadCount > 0 ? (
            <NotificationsIcon />
          ) : (
            <NotificationsNoneIcon />
          )}
        </Badge>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: {
            mt: 1.5,
            minWidth: 360,
            maxWidth: 420,
            maxHeight: 400,
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: "background.paper",
            transition: "background-color 0.25s ease, border-color 0.25s ease",
          },
        }}
      >
        <Box
          sx={{
            px: 2,
            py: 1.5,
            borderBottom: `1px solid ${theme.palette.divider}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="subtitle1" fontWeight={600}>
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={handleMarkAllRead} disabled={markAllRead.isPending}>
              Mark all read
            </Button>
          )}
        </Box>
        <Box sx={{ maxHeight: 320, overflow: "auto" }}>
          {isLoading && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress size={24} />
            </Box>
          )}
          {!isLoading && (!notifications || notifications.length === 0) && (
            <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 3, textAlign: "center" }}>
              No notifications
            </Typography>
          )}
          {!isLoading && notifications && notifications.length > 0 && (
            <List disablePadding>
              {notifications.map((n) => (
                <ListItemButton
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  sx={{
                    py: 1.5,
                    px: 2,
                    bgcolor: n.is_read ? "transparent" : alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.12 : 0.08),
                    "&:hover": { bgcolor: alpha(theme.palette.text.primary, theme.palette.mode === "dark" ? 0.04 : 0.06) },
                  }}
                >
                  <ListItemText
                    primary={n.title}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
                          {n.message.length > 80 ? `${n.message.slice(0, 80)}…` : n.message}
                        </Typography>
                        <Typography component="span" variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                          {formatTime(n.created_at)}
                        </Typography>
                      </>
                    }
                    primaryTypographyProps={{ fontWeight: n.is_read ? 500 : 600, fontSize: "0.9rem" }}
                  />
                </ListItemButton>
              ))}
            </List>
          )}
        </Box>
      </Menu>
    </>
  );
}
