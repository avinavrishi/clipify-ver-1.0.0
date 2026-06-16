"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useAuth } from "../../../../../hooks/useAuth";
import { useCampaign } from "../../../../../queries/campaigns";
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Link,
  Chip,
  Divider,
  CircularProgress,
} from "@mui/material";
import CampaignIcon from "@mui/icons-material/Campaign";
import { toDriveImageUrl } from "../../../../../lib/driveImage";
import { getIconUrl } from "../../../../../lib/assets";

export default function CampaignDetailPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const { accessToken } = useAuth();
  const { data } = useCampaign(accessToken, id);

  if (!data) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 400,
          gap: 2,
        }}
      >
        <CircularProgress sx={{ color: "primary.main" }} />
        <Typography variant="body1" color="text.secondary">
          Loading campaign…
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 4 }}>
      <Card
        sx={{
          mb: 4,
          overflow: "hidden",
          borderRadius: 0,
          border: "none",
          background: "transparent",
          boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
        }}
      >
        <Box sx={{ position: "relative" }}>
          {toDriveImageUrl(data.logo_drive_link) ? (
            <Box
              component="img"
              src={toDriveImageUrl(data.logo_drive_link) as string}
              alt={data.title}
              loading="lazy"
              referrerPolicy="no-referrer"
              sx={{ width: "100%", height: { xs: "50vh", sm: 360 }, minHeight: { xs: 280, sm: 360 }, objectFit: "cover", display: "block" }}
            />
          ) : (
            <Box
              sx={{
                width: "100%",
                height: { xs: "50vh", sm: 360 },
                minHeight: { xs: 280, sm: 360 },
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                  "linear-gradient(135deg, rgba(37, 99, 235, 0.22) 0%, rgba(37, 99, 235, 0.06) 100%)",
              }}
            >
              <CampaignIcon sx={{ fontSize: 64, color: "primary.main", opacity: 0.9 }} />
            </Box>
          )}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.15) 45%, rgba(0,0,0,0.75) 100%)",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              p: { xs: 2, sm: 3 },
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
              <Chip
                label={data.status.charAt(0).toUpperCase() + data.status.slice(1).toLowerCase()}
                color={data.status === "ACTIVE" ? "success" : "default"}
                sx={{
                  textTransform: "capitalize",
                  fontWeight: 800,
                  height: 30,
                  px: 1.5,
                  bgcolor: data.status === "ACTIVE" ? "primary.main" : "rgba(255,255,255,0.2)",
                  color: data.status === "ACTIVE" ? "primary.contrastText" : "#fff",
                }}
              />

              {(data.platforms ?? []).length > 0 && (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "flex-end" }}>
                  {(data.platforms ?? []).map((p) => {
                    const iconName = p.name.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
                    if (!iconName) return null;
                    return (
                      <Box
                        key={p.id}
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: 2,
                          bgcolor: "rgba(0,0,0,0.45)",
                          border: "1px solid rgba(255,255,255,0.12)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Box component="img" src={getIconUrl(iconName)} alt={p.name} sx={{ width: 16, height: 16 }} />
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>

            <Typography
              variant="h4"
              fontWeight={800}
              sx={{
                mb: 0,
                lineHeight: 1.15,
                color: "#fff",
                textShadow: "0 8px 24px rgba(0,0,0,0.55)",
                maxWidth: 780,
              }}
            >
              {data.title}
            </Typography>
          </Box>
        </Box>
      </Card>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card
            sx={{
              background:
                "linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(37, 99, 235, 0.02) 100%)",
              border: "1px solid rgba(37, 99, 235, 0.2)",
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                Description
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                {data.description || "No description provided."}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              borderRadius: 0,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(12px)",
              boxShadow: "0 12px 30px rgba(0,0,0,0.18)",
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2, fontSize: { xs: "1rem", sm: "1.125rem" } }}>
                Campaign Details
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: "block" }}>
                    Total budget
                  </Typography>
                  <Typography variant="h6" fontWeight={800} color="primary.main">
                    ${data.total_budget.toLocaleString()}
                  </Typography>
                </Box>

                <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.08)" }} />

                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: "block" }}>
                    Used budget
                  </Typography>
                  <Typography variant="body1" fontWeight={700}>
                    ${data.used_budget.toLocaleString()}
                  </Typography>
                </Box>

                <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.08)" }} />

                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: "block" }}>
                    Rate / 1M views
                  </Typography>
                  <Typography variant="body1" fontWeight={800} color="success.main">
                    ${data.rate_per_million_views}
                  </Typography>
                </Box>

                <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.08)" }} />

                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: "block" }}>
                    Dates
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                    {data.start_date} → {data.end_date}
                  </Typography>
                </Box>
              {data.max_submissions_per_account != null && (
                <Typography variant="body2" color="text.secondary">
                  Max submissions/account: {data.max_submissions_per_account}
                </Typography>
              )}
              {data.max_earnings_per_creator != null && (
                <Typography variant="body2" color="text.secondary">
                  Max earnings/creator: ${data.max_earnings_per_creator}
                </Typography>
              )}
              {data.max_earnings_per_post != null && (
                <Typography variant="body2" color="text.secondary">
                  Max earnings/post: ${data.max_earnings_per_post}
                </Typography>
              )}
              {data.guidelines_link && (
                <Typography variant="body2">
                  Guidelines:{" "}
                  <Link
                    href={data.guidelines_link}
                    target="_blank"
                    rel="noreferrer"
                    color="primary"
                  >
                    View
                  </Link>
                </Typography>
              )}
              {data.discord_link && (
                <Typography variant="body2">
                  Discord:{" "}
                  <Link
                    href={data.discord_link}
                    target="_blank"
                    rel="noreferrer"
                    color="primary"
                  >
                    Join
                  </Link>
                </Typography>
              )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
