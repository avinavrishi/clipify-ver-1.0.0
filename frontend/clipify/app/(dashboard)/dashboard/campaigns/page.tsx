"use client";

import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Typography,
} from "@mui/material";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import { useAuth } from "../../../../hooks/useAuth";
import { useMyParticipations } from "../../../../queries/participations";
import { useCampaigns } from "../../../../queries/campaigns";
import type { Participation, ParticipationStatus } from "../../../../types/participation";
import type { Campaign } from "../../../../types/campaign";
import { ParticipatedCampaignCard } from "../../../../components/creator/ParticipatedCampaignCard";
import NextLink from "next/link";

export default function MyCampaignsPage() {
  const { accessToken } = useAuth();
  const [statusFilter, setStatusFilter] = useState<ParticipationStatus | "ALL">("ALL");
  const { data: participations, isLoading } = useMyParticipations(accessToken, {
    statusFilter: statusFilter === "ALL" ? undefined : statusFilter,
    limit: 100,
  });
  const { data: campaigns = [] } = useCampaigns(accessToken);

  const campaignById = useMemo(() => new Map<string, Campaign>(campaigns.map((c) => [c.id, c])), [campaigns]);

  return (
    <Box sx={{ width: "100%", minWidth: 0, maxWidth: 1400, mx: "auto", pb: 6 }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "flex-start" },
          justifyContent: "space-between",
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: "0.08em" }}>
            Your activity
          </Typography>
          <Typography variant="h4" fontWeight={800} letterSpacing="-0.03em" sx={{ mt: 0.5, lineHeight: 1.2 }}>
            Participated campaigns
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: 520 }}>
            Open a campaign to post or review briefs, or jump to submissions to track every link you&apos;ve sent.
          </Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 200, alignSelf: { xs: "stretch", sm: "center" } }}>
          <InputLabel>Your status</InputLabel>
          <Select
            label="Your status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ParticipationStatus | "ALL")}
            sx={{ borderRadius: 2 }}
          >
            <MenuItem value="ALL">All</MenuItem>
            <MenuItem value="APPLIED">Pending</MenuItem>
            <MenuItem value="APPROVED">Approved</MenuItem>
            <MenuItem value="REJECTED">Rejected</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {isLoading && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
            gap: 2,
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={340} sx={{ borderRadius: 3 }} />
          ))}
        </Box>
      )}

      {!isLoading && (!participations || participations.length === 0) && (
        <Paper
          elevation={0}
          sx={{
            py: { xs: 6, sm: 8 },
            px: 3,
            textAlign: "center",
            borderRadius: 4,
            border: "1px dashed",
            borderColor: "divider",
            bgcolor: (t) => (t.palette.mode === "dark" ? "action.hover" : "grey.50"),
          }}
        >
          <CampaignOutlinedIcon sx={{ fontSize: 56, color: "text.disabled", mb: 2 }} />
          <Typography variant="h6" fontWeight={800} gutterBottom>
            {statusFilter === "ALL" ? "No campaigns yet" : `No ${statusFilter.toLowerCase()} campaigns`}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: "auto" }}>
            {statusFilter === "ALL"
              ? "Explore open campaigns and apply or submit links to see them listed here."
              : "Try another filter to see your other participations."}
          </Typography>
          {statusFilter === "ALL" && (
            <Button
              component={NextLink}
              href="/dashboard/explore"
              variant="contained"
              size="large"
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}
            >
              Explore campaigns
            </Button>
          )}
        </Paper>
      )}

      {!isLoading && participations && participations.length > 0 && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
            gap: 2,
            minWidth: 0,
          }}
        >
          {participations.map((p: Participation) => (
            <ParticipatedCampaignCard key={p.id} participation={p} campaign={campaignById.get(p.campaign_id) ?? null} />
          ))}
        </Box>
      )}
    </Box>
  );
}
