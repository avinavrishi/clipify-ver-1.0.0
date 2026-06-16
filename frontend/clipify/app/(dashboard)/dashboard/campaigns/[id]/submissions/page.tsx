"use client";

import React, { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import NextLink from "next/link";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  type SelectChangeEvent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Link as MuiLink,
  Card,
  CardContent,
  Stack,
  Divider,
  useMediaQuery,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import { useTheme } from "@mui/material/styles";
import { useAuth } from "../../../../../../hooks/useAuth";
import { useCampaign } from "../../../../../../queries/campaigns";
import { useCampaignSubmissions } from "../../../../../../queries/submissions";
import { useMyParticipations } from "../../../../../../queries/participations";
import type { SocialPlatform, Submission, SubmissionStatus } from "../../../../../../types/submission";

function statusChipProps(status: SubmissionStatus): { color: "success" | "warning" | "error"; label: string } {
  if (status === "APPROVED") return { color: "success", label: "Approved" };
  if (status === "REJECTED") return { color: "error", label: "Rejected" };
  return { color: "warning", label: "Pending" };
}

function formatPlatform(p?: SocialPlatform | string | null): string {
  if (!p) return "—";
  return p.charAt(0) + p.slice(1).toLowerCase();
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

export default function CampaignSubmissionsPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params?.id as string | undefined;
  const { accessToken } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const { data: campaign, isLoading: campaignLoading } = useCampaign(accessToken, campaignId);
  const { data: submissions = [], isLoading: submissionsLoading } = useCampaignSubmissions(accessToken, campaignId, {
    limit: 500,
  });
  const { data: participations = [], isLoading: participationsLoading } = useMyParticipations(accessToken, {
    limit: 200,
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | "ALL">("ALL");
  const [platformFilter, setPlatformFilter] = useState<string>("ALL");

  const isParticipant = useMemo(
    () => participations.some((p) => p.campaign_id === campaignId),
    [participations, campaignId]
  );

  const platformOptions = useMemo(() => {
    const set = new Set<string>();
    submissions.forEach((s) => {
      if (s.social_platform) set.add(s.social_platform);
    });
    return Array.from(set).sort();
  }, [submissions]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return submissions.filter((s) => {
      if (statusFilter !== "ALL" && s.status !== statusFilter) return false;
      if (platformFilter !== "ALL" && (s.social_platform ?? "") !== platformFilter) return false;
      if (q) {
        const inUrl = s.content_url.toLowerCase().includes(q);
        const inPlat = (s.social_platform ?? "").toLowerCase().includes(q);
        const inUser = (s.social_account_username ?? "").toLowerCase().includes(q);
        if (!inUrl && !inPlat && !inUser) return false;
      }
      return true;
    });
  }, [submissions, search, statusFilter, platformFilter]);

  const loading = campaignLoading || submissionsLoading || participationsLoading;

  if (!campaignId) {
    return null;
  }

  if (!loading && !isParticipant) {
    return (
      <Box sx={{ maxWidth: 560, mx: "auto", py: 8, textAlign: "center" }}>
        <Typography variant="h6" fontWeight={800} gutterBottom>
          Not part of this campaign
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          You can only view submissions for campaigns you&apos;ve joined.
        </Typography>
        <Button component={NextLink} href="/dashboard/campaigns" variant="contained" sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}>
          Back to campaigns
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 6, maxWidth: 1200, mx: "auto" }}>
      <Button
        startIcon={<ArrowBackRoundedIcon />}
        onClick={() => router.push("/dashboard/campaigns")}
        sx={{ mb: 2, textTransform: "none", fontWeight: 600, color: "text.secondary" }}
      >
        Participated campaigns
      </Button>

      <Box sx={{ mb: 3 }}>
        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: "0.08em" }}>
          Submissions
        </Typography>
        <Typography variant="h4" fontWeight={800} letterSpacing="-0.03em" sx={{ mt: 0.5, lineHeight: 1.2 }}>
          {campaign?.title ?? "Campaign"}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: 640 }}>
          Track links you&apos;ve submitted, review status, and see performance for this campaign.
        </Typography>
      </Box>

      {/* Filters */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: (t) => (t.palette.mode === "dark" ? "action.hover" : "grey.50"),
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "2fr 1fr 1fr" },
            gap: 2,
            alignItems: "flex-start",
          }}
        >
          <TextField
            size="small"
            placeholder="Search link, platform, or username…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={{ color: "text.disabled" }} />
                </InputAdornment>
              ),
            }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          />
          <FormControl size="small" fullWidth sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}>
            <InputLabel id="sub-status">Status</InputLabel>
            <Select
              labelId="sub-status"
              label="Status"
              value={statusFilter}
              onChange={(e: SelectChangeEvent) => setStatusFilter(e.target.value as SubmissionStatus | "ALL")}
            >
              <MenuItem value="ALL">All</MenuItem>
              <MenuItem value="PENDING">Pending</MenuItem>
              <MenuItem value="APPROVED">Approved</MenuItem>
              <MenuItem value="REJECTED">Rejected</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" fullWidth sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}>
            <InputLabel id="sub-plat">Platform</InputLabel>
            <Select
              labelId="sub-plat"
              label="Platform"
              value={platformFilter}
              onChange={(e: SelectChangeEvent) => setPlatformFilter(e.target.value)}
            >
              <MenuItem value="ALL">All platforms</MenuItem>
              {platformOptions.map((p) => (
                <MenuItem key={p} value={p}>
                  {formatPlatform(p)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress sx={{ color: "primary.main" }} />
        </Box>
      )}

      {!loading && filtered.length === 0 && (
        <Paper
          elevation={0}
          sx={{
            py: 8,
            textAlign: "center",
            borderRadius: 3,
            border: "1px dashed",
            borderColor: "divider",
          }}
        >
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            No submissions yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: submissions.length === 0 ? 0 : 2 }}>
            {submissions.length === 0
              ? "Submit a content link from the campaign page to see it listed here."
              : "No rows match your filters. Try adjusting search or filters."}
          </Typography>
          {submissions.length > 0 && (
            <Button variant="outlined" onClick={() => { setSearch(""); setStatusFilter("ALL"); setPlatformFilter("ALL"); }} sx={{ mt: 2, borderRadius: 2, textTransform: "none" }}>
              Clear filters
            </Button>
          )}
        </Paper>
      )}

      {!loading && filtered.length > 0 && !isMobile && (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            overflow: "hidden",
          }}
        >
          <Table size="medium" sx={{ minWidth: 720 }}>
            <TableHead>
              <TableRow
                sx={{
                  bgcolor: (t) => (t.palette.mode === "dark" ? "rgba(255,255,255,0.04)" : "grey.100"),
                }}
              >
                <TableCell sx={{ fontWeight: 700 }}>Submitted link</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Platform / account</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  Views
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Submitted</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((row, index) => (
                <SubmissionTableRow key={row.id} row={row} stripe={index % 2 === 1} />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {!loading && filtered.length > 0 && isMobile && (
        <Stack spacing={1.5}>
          {filtered.map((row) => (
            <SubmissionMobileCard key={row.id} row={row} />
          ))}
        </Stack>
      )}
    </Box>
  );
}

function SubmissionTableRow({ row, stripe }: { row: Submission; stripe: boolean }) {
  const st = statusChipProps(row.status);
  return (
    <TableRow
      hover
      sx={{
        "&:hover": { bgcolor: (t) => (t.palette.mode === "dark" ? "rgba(255,255,255,0.06)" : "action.hover") },
        bgcolor: stripe ? (theme) => (theme.palette.mode === "dark" ? "rgba(255,255,255,0.02)" : "grey.50") : undefined,
      }}
    >
      <TableCell sx={{ maxWidth: 280, verticalAlign: "middle" }}>
        <MuiLink
          href={row.content_url}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            fontWeight: 600,
            wordBreak: "break-all",
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
          }}
        >
          {row.content_url.length > 48 ? `${row.content_url.slice(0, 45)}…` : row.content_url}
          <OpenInNewRoundedIcon sx={{ fontSize: 16, flexShrink: 0 }} />
        </MuiLink>
      </TableCell>
      <TableCell>
        <Typography variant="body2" fontWeight={600}>
          {formatPlatform(row.social_platform)}
        </Typography>
        {row.social_account_username && (
          <Typography variant="caption" color="text.secondary">
            @{row.social_account_username}
          </Typography>
        )}
      </TableCell>
      <TableCell align="right">
        <Typography variant="body2" fontWeight={600}>
          {row.verified_views.toLocaleString()}
        </Typography>
        {row.status === "APPROVED" && row.calculated_earnings > 0 && (
          <Typography variant="caption" color="success.main" display="block">
            ${row.calculated_earnings.toFixed(2)}
          </Typography>
        )}
      </TableCell>
      <TableCell>
        <Chip size="small" label={st.label} color={st.color} sx={{ fontWeight: 700 }} />
      </TableCell>
      <TableCell>
        <Typography variant="body2" color="text.secondary">
          {formatDate(row.submitted_at)}
        </Typography>
      </TableCell>
    </TableRow>
  );
}

function SubmissionMobileCard({ row }: { row: Submission }) {
  const st = statusChipProps(row.status);
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1} sx={{ mb: 1.5 }}>
          <Chip size="small" label={st.label} color={st.color} sx={{ fontWeight: 700 }} />
          <Typography variant="caption" color="text.secondary">
            {formatDate(row.submitted_at)}
          </Typography>
        </Stack>
        <MuiLink
          href={row.content_url}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ fontWeight: 600, wordBreak: "break-all", display: "inline-flex", alignItems: "center", gap: 0.5, mb: 1.5 }}
        >
          {row.content_url}
          <OpenInNewRoundedIcon sx={{ fontSize: 16, flexShrink: 0 }} />
        </MuiLink>
        <Divider sx={{ my: 1.5 }} />
        <Typography variant="body2" color="text.secondary">
          {formatPlatform(row.social_platform)}
          {row.social_account_username ? ` · @${row.social_account_username}` : ""}
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }} fontWeight={700}>
          {row.verified_views.toLocaleString()} views
        </Typography>
        {row.status === "APPROVED" && row.calculated_earnings > 0 && (
          <Typography variant="body2" color="success.main" fontWeight={700}>
            ${row.calculated_earnings.toFixed(2)} earned
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
