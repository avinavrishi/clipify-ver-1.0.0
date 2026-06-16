"use client";

import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Typography,
} from "@mui/material";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import ImageIcon from "@mui/icons-material/Image";
import CampaignIcon from "@mui/icons-material/Campaign";
import NextLink from "next/link";
import { useAuth } from "../../../../hooks/useAuth";
import { useCampaigns } from "../../../../queries/campaigns";
import { useMyParticipations } from "../../../../queries/participations";
import { useProfile } from "../../../../queries/profile";
import { type Campaign, getCampaignType } from "../../../../types/campaign";
import { toDriveImageUrl } from "../../../../lib/driveImage";
import { getIconUrl } from "../../../../lib/assets";

export default function ExplorePage() {
  const { accessToken, currentUser } = useAuth();
  const { data: campaigns, isLoading } = useCampaigns(accessToken);
  const { data: participations } = useMyParticipations(accessToken, { limit: 1000 });
  const { data: profile } = useProfile(accessToken);
  const [category, setCategory] = useState<string>("ALL");

  const participationMap = useMemo(() => {
    if (!participations) return new Map();
    return new Map(participations.map((p) => [p.campaign_id, p]));
  }, [participations]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    campaigns?.forEach((c) => {
      if (c.category?.trim()) set.add(c.category.trim());
    });
    return Array.from(set).sort();
  }, [campaigns]);

  const filtered =
    category === "ALL"
      ? campaigns ?? []
      : (campaigns ?? []).filter((c) => (c.category?.trim() ?? "") === category);

  return (
    <Box sx={{ width: "100%", minWidth: 0 }}>
      {/* Banner */}
      <Box
        sx={{
          mb: 4,
          borderRadius: 3,
          overflow: "hidden",
          position: "relative",
          minHeight: 200,
          background: "linear-gradient(135deg, rgba(0,0,0,0.85) 0%, rgba(20,20,20,0.95) 50%, rgba(0,0,0,0.9) 100%)",
          border: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: { xs: 3, sm: 4 },
          py: 4,
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse 80% 50% at 50% 50%, rgba(155, 171, 44, 0.12) 0%, transparent 70%)",
            pointerEvents: "none",
          },
        }}
      >
        <Box sx={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 640, width: "100%", minWidth: 0 }}>
          <Typography
            variant="h4"
            fontWeight={800}
            sx={{
              color: "#fff",
              mb: 1.5,
              lineHeight: 1.2,
              letterSpacing: "-0.02em",
              overflowWrap: "break-word",
              wordBreak: "break-word",
            }}
          >
            Turn short-form content into real earnings
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6, overflowWrap: "break-word", wordBreak: "break-word" }}>
            Pick a campaign below, create content and get paid per view. Brands set a budget and CPM—you get organic reach and earnings.
          </Typography>
        </Box>
      </Box>

      {/* Category filter buttons - left side after banner */}
      <Box sx={{ mb: 3, display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "flex-start" }}>
        <Button
          variant={category === "ALL" ? "contained" : "outlined"}
          size="small"
          onClick={() => setCategory("ALL")}
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
        >
          All
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={category === cat ? "contained" : "outlined"}
            size="small"
            onClick={() => setCategory(cat)}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
          >
            {cat}
          </Button>
        ))}
      </Box>

      {isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 320 }}>
          <CircularProgress sx={{ color: "primary.main" }} />
        </Box>
      )}

      {!isLoading && filtered.length === 0 && (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 320, color: "text.secondary" }}>
          <CampaignIcon sx={{ fontSize: 48, opacity: 0.4, mb: 1 }} />
          <Typography variant="body2">No campaigns</Typography>
        </Box>
      )}

      {!isLoading && filtered.length > 0 && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(3, 1fr)",
              lg: "repeat(4, 1fr)",
            },
            gap: 2,
            minWidth: 0,
          }}
        >
          {filtered.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              participation={currentUser?.role === "CREATOR" ? participationMap.get(campaign.id) : undefined}
              creatorType={currentUser?.role === "CREATOR" ? profile?.creator_type ?? null : null}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}

function CampaignCard({
  campaign,
  participation,
  creatorType,
}: {
  campaign: Campaign;
  participation?: { status: string };
  creatorType?: "FACE" | "FACELESS" | null;
}) {
  const imageUrl = toDriveImageUrl(campaign.logo_drive_link);
  const normalizePlatformIconName = (name: string) => name.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  const ct = getCampaignType(campaign);
  const ctaHint =
    creatorType == null
      ? null
      : creatorType === "FACE" && ct === 0
        ? "Apply to join"
        : creatorType === "FACELESS" && ct === 1
          ? "Submit your link"
          : creatorType === "FACE" && ct === 1
            ? "Faceless campaign — not a match"
            : "Face campaign — not a match";

  return (
    <NextLink
      href={`/dashboard/explore/${campaign.id}`}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <Card
        sx={{
          position: "relative",
          height: 280,
          overflow: "hidden",
          cursor: "pointer",
          borderRadius: 2,
          border: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.35)",
          transition: "transform 0.35s ease, box-shadow 0.35s ease",
          "&:hover": {
            transform: "scale(1.03)",
            boxShadow: "0 16px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(155, 171, 44, 0.2)",
          },
        }}
      >
        {/* Full-bleed image */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            "& .campaign-img": {
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              transition: "transform 0.4s ease",
            },
            "&:hover .campaign-img": {
              transform: "scale(1.08)",
            },
          }}
        >
          {imageUrl ? (
            <Box
              component="img"
              className="campaign-img"
              src={imageUrl}
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ) : (
            <Box
              sx={{
                width: "100%",
                height: "100%",
                background: "linear-gradient(135deg, rgba(155, 171, 44, 0.2) 0%, rgba(122, 138, 31, 0.4) 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CampaignIcon sx={{ fontSize: 48, color: "primary.main", opacity: 0.9 }} />
            </Box>
          )}
          {/* Gradient overlay for readability */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(180deg, rgba(0,0,0,0.25) 0%, transparent 35%, rgba(0,0,0,0.85) 100%)",
            }}
          />
        </Box>

        {/* Details on top of image */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            p: 1.5,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Chip
            label={campaign.status}
            size="small"
            sx={{
              textTransform: "capitalize",
              fontWeight: 600,
              height: 22,
              fontSize: "0.7rem",
              bgcolor: campaign.status === "ACTIVE" ? "primary.main" : "rgba(255,255,255,0.2)",
              color: campaign.status === "ACTIVE" ? "primary.contrastText" : "#fff",
              border: "none",
              borderRadius: 2,
            }}
          />
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, justifyContent: "flex-end" }}>
            {(campaign.platforms ?? []).map((p) => {
              const iconName = normalizePlatformIconName(p.name);
              if (!iconName) return null;
              return (
                <Box
                  key={p.id}
                  sx={{
                    width: 34,
                    height: 22,
                    borderRadius: 2,
                    bgcolor: "rgba(0,0,0,0.55)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backdropFilter: "blur(6px)",
                  }}
                >
                  <Box
                    component="img"
                    src={getIconUrl(iconName)}
                    alt={p.name}
                    sx={{ width: 16, height: 16 }}
                  />
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* Title and metrics at bottom overlay */}
        <Box
          sx={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            p: 2,
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          <Typography
            variant="subtitle1"
            fontWeight={700}
            sx={{
              color: "#fff",
              lineHeight: 1.25,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textShadow: "0 2px 8px rgba(0,0,0,0.6)",
            }}
          >
            {campaign.title}
          </Typography>
          {campaign.category && (
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.92)", fontWeight: 700, opacity: 0.95 }}>
              {campaign.category}
            </Typography>
          )}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 0.5 }}>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.9)", display: "flex", alignItems: "center", gap: 0.5 }}>
              <Box component="span" sx={{ opacity: 0.8 }}>Budget</Box>
              <strong>${campaign.total_budget.toLocaleString()}</strong>
            </Typography>
            {(campaign.participant_count != null && campaign.participant_count > 0) && (
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.85)", opacity: 0.9 }}>
                {campaign.participant_count} {campaign.participant_count === 1 ? "creator" : "creators"}
              </Typography>
            )}
            <Typography variant="caption" fontWeight={700} sx={{ color: "primary.main" }}>
              ${campaign.rate_per_million_views}/1M
            </Typography>
          </Box>
          {ctaHint && (
            <Typography
              variant="caption"
              sx={{
                color: ctaHint.includes("not a match") ? "warning.light" : "rgba(255,255,255,0.85)",
                fontWeight: 600,
                mt: 0.5,
                display: "block",
              }}
            >
              {ctaHint}
            </Typography>
          )}
        </Box>

        {participation && (
          <Box sx={{ position: "absolute", top: 40, right: 12 }}>
            <Chip
              label={participation.status}
              size="small"
              sx={{
                textTransform: "capitalize",
                fontSize: "0.65rem",
                height: 20,
                bgcolor:
                  participation.status === "APPROVED"
                    ? "rgba(34, 197, 94, 0.9)"
                    : participation.status === "REJECTED"
                    ? "rgba(239, 68, 68, 0.9)"
                    : "rgba(255,255,255,0.25)",
                color: "#fff",
                border: "none",
                borderRadius: 2,
              }}
            />
          </Box>
        )}
      </Card>
    </NextLink>
  );
}
