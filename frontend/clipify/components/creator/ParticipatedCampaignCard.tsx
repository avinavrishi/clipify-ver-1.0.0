"use client";

import React from "react";
import NextLink from "next/link";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import PaidOutlinedIcon from "@mui/icons-material/PaidOutlined";
import OutboundOutlinedIcon from "@mui/icons-material/OutboundOutlined";
import ListAltOutlinedIcon from "@mui/icons-material/ListAltOutlined";
import type { Participation } from "../../types/participation";
import type { Campaign } from "../../types/campaign";

function formatCampaignStatus(raw?: string | null): string {
  if (!raw) return "—";
  const s = raw.toUpperCase();
  if (s === "ACTIVE") return "Active";
  if (s === "PAUSED") return "Paused";
  if (s === "COMPLETED") return "Completed";
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

function campaignStatusColor(
  status?: string | null
): "success" | "warning" | "default" {
  const s = status?.toUpperCase();
  if (s === "ACTIVE") return "success";
  if (s === "PAUSED") return "warning";
  return "default";
}

function participationLabel(status: Participation["status"]): string {
  if (status === "APPROVED") return "Approved";
  if (status === "REJECTED") return "Rejected";
  return "Pending";
}

export type ParticipatedCampaignCardProps = {
  participation: Participation;
  /** Enriched from GET /campaigns when available */
  campaign?: Campaign | null;
};

export function ParticipatedCampaignCard({ participation, campaign }: ParticipatedCampaignCardProps) {
  const campaignId = participation.campaign_id;
  const exploreHref = `/dashboard/explore/${campaignId}`;
  const submissionsHref = `/dashboard/campaigns/${campaignId}/submissions`;

  const title = participation.campaign_title || campaign?.title || "Campaign";
  const description = (campaign?.description ?? "").trim();
  const shortDesc =
    description.length > 110 ? `${description.slice(0, 107)}…` : description || "No description available for this campaign yet.";

  const campaignStatus = campaign?.status ?? participation.campaign_status;
  const endDate = campaign?.end_date;
  const rate = participation.campaign_rate_per_million ?? campaign?.rate_per_million_views;

  const hasSubmissions = participation.total_submissions > 0;

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
            ? "0 1px 0 rgba(255,255,255,0.06) inset, 0 8px 28px rgba(0,0,0,0.35)"
            : "0 1px 2px rgba(0,0,0,0.04), 0 10px 28px rgba(0,0,0,0.07)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          borderColor: "primary.main",
          boxShadow: (theme) =>
            theme.palette.mode === "dark"
              ? "0 14px 40px rgba(0,0,0,0.45)"
              : "0 14px 36px rgba(0,0,0,0.1)",
        },
      }}
    >
      <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", p: 2.5, "&:last-child": { pb: 2 } }}>
        <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mb: 1.5 }}>
          <Chip
            size="small"
            label={formatCampaignStatus(campaignStatus)}
            color={campaignStatusColor(campaignStatus)}
            sx={{ fontWeight: 700, fontSize: "0.7rem" }}
          />
          <Chip
            size="small"
            variant="outlined"
            label={`You: ${participationLabel(participation.status)}`}
            sx={{ fontWeight: 600, fontSize: "0.7rem" }}
          />
          <Chip
            size="small"
            variant="outlined"
            color={hasSubmissions ? "primary" : "default"}
            label={hasSubmissions ? "Submitted" : "Not submitted"}
            sx={{ fontWeight: 600, fontSize: "0.7rem" }}
          />
        </Stack>

        <Typography variant="subtitle1" fontWeight={800} letterSpacing="-0.02em" sx={{ lineHeight: 1.35, mb: 1 }}>
          {title}
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
            mb: 2,
          }}
        >
          {shortDesc}
        </Typography>

        <Stack spacing={1.25} sx={{ mb: 2 }}>
          {endDate && (
            <Stack direction="row" spacing={1} alignItems="center">
              <EventAvailableOutlinedIcon sx={{ fontSize: 20, color: "text.secondary" }} />
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.2 }}>
                  Ends
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {endDate}
                </Typography>
              </Box>
            </Stack>
          )}
          {rate != null && (
            <Stack direction="row" spacing={1} alignItems="center">
              <PaidOutlinedIcon sx={{ fontSize: 20, color: "primary.main" }} />
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.2 }}>
                  Reward
                </Typography>
                <Typography variant="body2" fontWeight={700} color="primary.main">
                  ${rate.toLocaleString()} / 1M views
                </Typography>
              </Box>
            </Stack>
          )}
          {participation.status === "APPROVED" && participation.total_earned > 0 && (
            <Typography variant="body2" fontWeight={700} color="success.main">
              ${participation.total_earned.toFixed(2)} earned so far
            </Typography>
          )}
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ mt: "auto", pt: 1 }}>
          <Button
            component={NextLink}
            href={exploreHref}
            fullWidth
            variant="outlined"
            startIcon={<OutboundOutlinedIcon />}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 700,
              py: 1,
              borderColor: "divider",
              "&:hover": { borderColor: "primary.main", bgcolor: (t) => t.palette.action.hover },
            }}
          >
            View campaign
          </Button>
          <Button
            component={NextLink}
            href={submissionsHref}
            fullWidth
            variant="contained"
            startIcon={<ListAltOutlinedIcon />}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 700,
              py: 1,
              boxShadow: "none",
              "&:hover": { boxShadow: (t) => (t.palette.mode === "dark" ? "none" : "0 4px 14px rgba(0,0,0,0.12)") },
            }}
          >
            View submissions
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
