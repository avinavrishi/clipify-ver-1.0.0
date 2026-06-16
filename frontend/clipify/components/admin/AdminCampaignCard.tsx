"use client";

import React from "react";
import NextLink from "next/link";
import {
  Box,
  Card,
  CardActions,
  Chip,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import AttachMoneyOutlinedIcon from "@mui/icons-material/AttachMoneyOutlined";
import type { Campaign, CampaignStatus } from "../../types/campaign";
import { getCampaignType } from "../../types/campaign";
import { toDriveImageUrl } from "../../lib/driveImage";
import CampaignIcon from "@mui/icons-material/Campaign";

function statusChipColor(status: CampaignStatus): "success" | "warning" | "default" {
  if (status === "ACTIVE") return "success";
  if (status === "PAUSED") return "warning";
  return "default";
}

function formatStatusLabel(status: CampaignStatus): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export type AdminCampaignCardProps = {
  campaign: Campaign;
  brandName: string;
  detailHref: string;
  onEdit: (campaign: Campaign) => void;
  onDelete: (campaign: Campaign) => void;
};

export function AdminCampaignCard({
  campaign,
  brandName,
  detailHref,
  onEdit,
  onDelete,
}: AdminCampaignCardProps) {
  const imageUrl = toDriveImageUrl(campaign.logo_drive_link);
  const desc = (campaign.description ?? "").trim();
  const shortDesc = desc.length > 120 ? `${desc.slice(0, 117)}…` : desc || "No description yet.";
  const targetLabel = getCampaignType(campaign) === 1 ? "Faceless" : "Face";

  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        boxShadow: (theme) =>
          theme.palette.mode === "dark"
            ? "0 1px 0 rgba(255,255,255,0.06) inset, 0 8px 24px rgba(0,0,0,0.35)"
            : "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)",
        transition: "transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease",
        "&:hover": {
          transform: "translateY(-3px)",
          borderColor: "primary.main",
          boxShadow: (theme) =>
            theme.palette.mode === "dark"
              ? "0 1px 0 rgba(255,255,255,0.08) inset, 0 16px 40px rgba(0,0,0,0.45)"
              : "0 12px 32px rgba(0,0,0,0.1)",
        },
        "&:hover .admin-camp-thumb-img": {
          transform: "scale(1.04)",
        },
      }}
    >
      <Box
        component={NextLink}
        href={detailHref}
        sx={{
          textDecoration: "none",
          color: "inherit",
          display: "block",
          flex: 1,
          cursor: "pointer",
        }}
      >
        <Box
          sx={{
            position: "relative",
            height: 132,
            overflow: "hidden",
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
            bgcolor: "action.hover",
          }}
        >
          {imageUrl ? (
            <Box
              component="img"
              className="admin-camp-thumb-img"
              src={imageUrl}
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transition: "transform 0.35s ease",
              }}
            />
          ) : (
            <Box
              sx={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: (theme) =>
                  `linear-gradient(135deg, ${theme.palette.primary.dark}33 0%, ${theme.palette.primary.main}18 100%)`,
              }}
            >
              <CampaignIcon sx={{ fontSize: 48, color: "primary.main", opacity: 0.85 }} />
            </Box>
          )}
          <Stack
            direction="row"
            spacing={0.75}
            sx={{
              position: "absolute",
              top: 10,
              left: 10,
              flexWrap: "wrap",
              gap: 0.5,
              maxWidth: "calc(100% - 16px)",
            }}
          >
            <Chip
              size="small"
              label={formatStatusLabel(campaign.status)}
              color={statusChipColor(campaign.status)}
              sx={{ fontWeight: 700, fontSize: "0.7rem", height: 24 }}
            />
            <Chip
              size="small"
              variant="outlined"
              label={targetLabel}
              sx={{
                fontWeight: 600,
                fontSize: "0.7rem",
                height: 24,
                bgcolor: "rgba(0,0,0,0.45)",
                color: "#fff",
                borderColor: "rgba(255,255,255,0.35)",
                backdropFilter: "blur(6px)",
              }}
            />
          </Stack>
        </Box>

        <Box sx={{ p: 2.25, pt: 2 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontWeight: 600, letterSpacing: "0.02em", textTransform: "uppercase", fontSize: "0.65rem" }}
          >
            {brandName}
          </Typography>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 0.35, lineHeight: 1.35, mb: 1 }}>
            {campaign.title}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              lineHeight: 1.55,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              minHeight: 40,
            }}
          >
            {shortDesc}
          </Typography>

          <Stack direction="row" spacing={2} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <AttachMoneyOutlinedIcon sx={{ fontSize: 18, color: "primary.main", opacity: 0.9 }} />
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.2 }}>
                  Budget
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  ${campaign.total_budget.toLocaleString()}
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={0.75} alignItems="flex-start">
              <CalendarTodayOutlinedIcon sx={{ fontSize: 17, color: "text.secondary", mt: 0.15 }} />
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.2 }}>
                  Schedule
                </Typography>
                <Typography variant="body2" fontWeight={600} sx={{ fontSize: "0.8rem" }}>
                  {campaign.start_date} → {campaign.end_date}
                </Typography>
              </Box>
            </Stack>
          </Stack>

          {(campaign.platforms?.length ?? 0) > 0 && (
            <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 1.5 }}>
              {(campaign.platforms ?? []).slice(0, 4).map((p) => (
                <Chip key={p.id} label={p.name} size="small" variant="outlined" sx={{ height: 22, fontSize: "0.7rem" }} />
              ))}
              {(campaign.platforms?.length ?? 0) > 4 && (
                <Chip label={`+${(campaign.platforms?.length ?? 0) - 4}`} size="small" sx={{ height: 22, fontSize: "0.7rem" }} />
              )}
            </Stack>
          )}
        </Box>
      </Box>

      <Divider sx={{ opacity: 0.6 }} />
      <CardActions sx={{ px: 1.5, py: 1, justifyContent: "flex-end", gap: 0.25 }}>
        <Tooltip title="Details & metrics">
          <IconButton
            component={NextLink}
            href={detailHref}
            size="small"
            aria-label="View campaign details"
            sx={{ color: "text.secondary", "&:hover": { color: "primary.main" } }}
          >
            <InsightsOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Edit">
          <IconButton
            size="small"
            aria-label="Edit campaign"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEdit(campaign);
            }}
            sx={{ color: "text.secondary", "&:hover": { color: "primary.main" } }}
          >
            <EditOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton
            size="small"
            aria-label="Delete campaign"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(campaign);
            }}
            sx={{ color: "text.secondary", "&:hover": { color: "error.main" } }}
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
}
