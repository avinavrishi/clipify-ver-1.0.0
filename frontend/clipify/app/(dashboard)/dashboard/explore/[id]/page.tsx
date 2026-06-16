"use client";

import React, { useState } from "react";
import NextLink from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "../../../../../hooks/useAuth";
import { useCampaign } from "../../../../../queries/campaigns";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  Link,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import CampaignIcon from "@mui/icons-material/Campaign";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import PersonIcon from "@mui/icons-material/Person";
import ArticleIcon from "@mui/icons-material/Article";
import LinearProgress from "@mui/material/LinearProgress";
import { toDriveImageUrl } from "../../../../../lib/driveImage";
import { getIconUrl } from "../../../../../lib/assets";
import { useProfile } from "../../../../../queries/profile";
import { useParticipationByCampaign, useApplyToCampaign } from "../../../../../queries/participations";
import { useMySocialAccounts } from "../../../../../queries/socialAccounts";
import { useCampaignSubmissions, useSubmitLink } from "../../../../../queries/submissions";
import { useCampaignSubmissionsAdmin, useUpdateSubmission } from "../../../../../queries/adminSubmissions";
import { SubmissionForm } from "../../../../../components/SubmissionForm";
import { useQueryClient } from "@tanstack/react-query";
import { getCampaignType } from "../../../../../types/campaign";

export default function ExploreCampaignDetailPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const { accessToken, currentUser } = useAuth();
  const queryClient = useQueryClient();
  const { data: campaign } = useCampaign(accessToken, id);
  const { data: profile } = useProfile(accessToken);
  const { data: participation } = useParticipationByCampaign(accessToken, id);
  const { data: submissions } = useCampaignSubmissions(accessToken, id);
  const { data: adminSubmissions } = useCampaignSubmissionsAdmin(accessToken, id);
  const { data: socialAccounts } = useMySocialAccounts(accessToken);
  const applyMutation = useApplyToCampaign(accessToken);
  const submitLinkMutation = useSubmitLink(accessToken);
  const updateSubmissionMutation = useUpdateSubmission(accessToken);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [submitLinkOpen, setSubmitLinkOpen] = useState(false);
  const [submitLinkContentUrl, setSubmitLinkContentUrl] = useState("");
  const [submitLinkSocialAccountId, setSubmitLinkSocialAccountId] = useState("");
  const [submitLinkError, setSubmitLinkError] = useState<string | null>(null);
  const [submitLinkSuccessMessage, setSubmitLinkSuccessMessage] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);
  const [submissionAction, setSubmissionAction] = useState<"approve" | "reject" | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [verifiedViews, setVerifiedViews] = useState("");
  const [calculatedEarnings, setCalculatedEarnings] = useState("");

  const isCreator = currentUser?.role === "CREATOR";
  const creatorType = profile?.creator_type ?? null;
  const hasApplied = !!participation;
  const isApproved = participation?.status === "APPROVED";
  const submissionCount = submissions?.length ?? 0;

  const handleApply = () => {
    if (!id) return;
    setApplyError(null);
    applyMutation.mutate(
      { campaign_id: id },
      {
        onError: (error: any) => {
          const detail = error?.response?.data?.detail ?? "Failed to apply to campaign";
          setApplyError(typeof detail === "string" ? detail : JSON.stringify(detail));
          if (error?.response?.status === 400 && typeof detail === "string" && /already applied/i.test(detail)) {
            queryClient.invalidateQueries({ queryKey: ["participations"] });
          }
        },
      }
    );
  };

  const openSubmitLinkModal = () => {
    setSubmitLinkError(null);
    setSubmitLinkContentUrl("");
    setSubmitLinkSocialAccountId("");
    setSubmitLinkOpen(true);
  };

  const closeSubmitLinkModal = () => {
    setSubmitLinkOpen(false);
    setSubmitLinkError(null);
  };

  const handleSubmitLink = () => {
    if (!id || !submitLinkContentUrl.trim() || !submitLinkSocialAccountId) return;
    setSubmitLinkError(null);
    submitLinkMutation.mutate(
      {
        campaign_id: id,
        content_url: submitLinkContentUrl.trim(),
        social_account_id: submitLinkSocialAccountId,
      },
      {
        onSuccess: (data) => {
          setSubmitLinkSuccessMessage(data.message ?? "Link submitted. Your submission is under review.");
          closeSubmitLinkModal();
        },
        onError: (error: any) => {
          const detail = error?.response?.data?.detail;
          setSubmitLinkError(typeof detail === "string" ? detail : detail?.message ?? "Failed to submit link");
        },
      }
    );
  };

  const isAdmin = currentUser?.role === "ADMIN";
  const isBrand = currentUser?.role === "BRAND";
  const canManageSubmissions = isAdmin || isBrand;
  
  const normalizePlatformIconName = (name: string) => name.trim().toLowerCase().replace(/[^a-z0-9]/g, "");

  // Use admin submissions for admins/brands, creator submissions for creators
  const displaySubmissions = canManageSubmissions ? adminSubmissions : submissions;

  if (!campaign) {
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

  const campaignType = getCampaignType(campaign);
  const isFaceCampaign = campaignType === 0;
  const isFacelessCampaign = campaignType === 1;

  return (
    <Box sx={{ mb: 4, width: "100%", maxWidth: 960, mx: "auto" }}>
      <Card sx={{ mb: 3, overflow: "hidden", borderRadius: 0, border: "none", boxShadow: "0 12px 30px rgba(0,0,0,0.25)" }}>
        <Box sx={{ position: "relative" }}>
          {toDriveImageUrl(campaign.logo_drive_link) ? (
            <Box
              component="img"
              src={toDriveImageUrl(campaign.logo_drive_link) as string}
              alt={campaign.title}
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
                bgcolor: "rgba(255,255,255,0.04)",
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
                "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.78) 100%)",
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
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 2,
              }}
            >
              <Chip
                label={campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1).toLowerCase()}
                color={campaign.status === "ACTIVE" ? "success" : "default"}
                sx={{
                  textTransform: "capitalize",
                  fontWeight: 800,
                  height: 30,
                  px: 1.5,
                  bgcolor: campaign.status === "ACTIVE" ? "primary.main" : "rgba(255,255,255,0.2)",
                  color: campaign.status === "ACTIVE" ? "primary.contrastText" : "#fff",
                }}
              />

              {(campaign.platforms ?? []).length > 0 && (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "flex-end" }}>
                  {(campaign.platforms ?? []).map((p) => {
                    const iconName = normalizePlatformIconName(p.name);
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
              {campaign.title}
            </Typography>
          </Box>
        </Box>
      </Card>

      {isCreator && (
        <Box sx={{ mb: 3 }}>
          {submitLinkSuccessMessage && (
            <Alert severity="success" sx={{ mb: 2, borderRadius: 1.5 }} onClose={() => setSubmitLinkSuccessMessage(null)}>
              {submitLinkSuccessMessage}
            </Alert>
          )}
          {!creatorType && (
            <Card sx={{ border: "1px solid rgba(255, 255, 255, 0.08)", mb: 2 }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                  Complete your profile to participate
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Choose whether you&apos;re a face or faceless creator to participate in campaigns.
                </Typography>
                <Button component={NextLink} href="/dashboard/profile" variant="contained">
                  Complete profile
                </Button>
              </CardContent>
            </Card>
          )}
          {creatorType && (
            <>
              {creatorType === "FACE" && !isFaceCampaign && (
                <Alert severity="warning" sx={{ mb: 2, borderRadius: 1.5 }}>
                  This campaign is for faceless creators only. Use Submit Link instead.
                </Alert>
              )}
              {creatorType === "FACELESS" && !isFacelessCampaign && (
                <Alert severity="warning" sx={{ mb: 2, borderRadius: 1.5 }}>
                  This campaign is for face creators only. Use Apply to Campaign instead.
                </Alert>
              )}

              {creatorType === "FACE" && isFaceCampaign && (
                <>
                  {applyError && (
                    <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5 }}>
                      {applyError}
                    </Alert>
                  )}
                  {hasApplied ? (
                    <Card sx={{ border: "1px solid rgba(255, 255, 255, 0.08)", mb: 2 }}>
                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <CheckCircleIcon sx={{ color: participation!.status === "APPROVED" ? "success.main" : "text.secondary" }} />
                            <Box>
                              <Typography variant="subtitle1" fontWeight={600}>
                                Participation Status: {participation!.status}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {participation!.status === "APPROVED"
                                  ? "You can now submit content for this campaign"
                                  : participation!.status === "APPLIED"
                                  ? "Your application is pending approval"
                                  : "Your application was rejected"}
                              </Typography>
                            </Box>
                          </Box>
                          {participation!.status === "APPROVED" && (
                            <Chip
                              label={`${participation!.total_submissions} submissions • $${participation!.total_earned.toFixed(2)} earned`}
                              color="success"
                              size="small"
                            />
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card sx={{ border: "1px solid rgba(255, 255, 255, 0.08)", mb: 2 }}>
                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
                          <Box>
                            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 0.5 }}>
                              Ready to participate?
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Apply to this campaign to start submitting content
                            </Typography>
                          </Box>
                          <Button
                            variant="contained"
                            onClick={handleApply}
                            disabled={applyMutation.isPending || campaign.status !== "ACTIVE"}
                            sx={{ minWidth: 120 }}
                          >
                            {applyMutation.isPending ? "Applying..." : "Apply to Campaign"}
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}

              {creatorType === "FACELESS" && isFacelessCampaign && (
                <>
                  {hasApplied && (
                    <Card sx={{ border: "1px solid rgba(255, 255, 255, 0.08)", mb: 2 }}>
                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <CheckCircleIcon sx={{ color: participation!.status === "APPROVED" ? "success.main" : "text.secondary" }} />
                            <Box>
                              <Typography variant="subtitle1" fontWeight={600}>
                                Participation Status: {participation!.status}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {participation!.status === "APPROVED"
                                  ? "Your submissions for this campaign"
                                  : participation!.status === "APPLIED"
                                  ? "Your submission is under review"
                                  : "Your participation status"}
                              </Typography>
                            </Box>
                          </Box>
                          {participation!.status === "APPROVED" && (
                            <Chip
                              label={`${participation!.total_submissions} submissions • $${participation!.total_earned.toFixed(2)} earned`}
                              color="success"
                              size="small"
                            />
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  )}
                  <Card sx={{ border: "1px solid rgba(255, 255, 255, 0.08)", mb: 2 }}>
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
                        <Box>
                          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 0.5 }}>
                            {hasApplied ? "Add another link" : "Submit your content link"}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {hasApplied
                              ? "Submit another content URL for this campaign"
                              : "Submit a link to your content (e.g. reel, video) to participate"}
                          </Typography>
                        </Box>
                        <Button
                          variant="contained"
                          onClick={openSubmitLinkModal}
                          disabled={campaign.status !== "ACTIVE"}
                          sx={{ minWidth: 120 }}
                        >
                          Submit Link
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </>
              )}
            </>
          )}
        </Box>
      )}

      {isCreator && creatorType === "FACE" && isFaceCampaign && isApproved && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            Submit Content
          </Typography>
          <SubmissionForm
            campaignId={id!}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ["submissions"] });
              queryClient.invalidateQueries({ queryKey: ["participations"] });
            }}
          />
        </Box>
      )}

      {(
        canManageSubmissions ||
        (isCreator && creatorType === "FACE" && isFaceCampaign && isApproved) ||
        (isCreator && creatorType === "FACELESS" && isFacelessCampaign && (hasApplied || submissionCount > 0))
      ) &&
        displaySubmissions &&
        displaySubmissions.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 1.5 }}>
            {canManageSubmissions ? `Submissions (${displaySubmissions.length})` : `Your Submissions (${displaySubmissions.length})`}
          </Typography>
          <Grid container spacing={2}>
            {displaySubmissions.map((submission) => (
              <Grid item xs={12} sm={6} key={submission.id}>
                <Card sx={{ border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                      <Chip
                        label={submission.status}
                        size="small"
                        color={submission.status === "APPROVED" ? "success" : submission.status === "REJECTED" ? "error" : "default"}
                        sx={{ textTransform: "capitalize" }}
                      />
                      {submission.status === "APPROVED" && (
                        <Typography variant="body2" fontWeight={600} color="success.main">
                          ${submission.calculated_earnings.toFixed(2)}
                        </Typography>
                      )}
                    </Box>
                    {canManageSubmissions && submission.social_account_username && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                        @{submission.social_account_username} ({submission.social_platform})
                      </Typography>
                    )}
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1, wordBreak: "break-all" }}>
                      {submission.content_url}
                    </Typography>
                    {submission.status === "APPROVED" && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                        {submission.verified_views.toLocaleString()} views
                      </Typography>
                    )}
                    {canManageSubmissions && submission.status === "PENDING" && (
                      <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          startIcon={<CheckCircleIcon />}
                          onClick={() => {
                            setSelectedSubmission(submission.id);
                            setSubmissionAction("approve");
                            setVerifiedViews("");
                            setCalculatedEarnings("");
                            setRejectionReason("");
                          }}
                          disabled={updateSubmissionMutation.isPending}
                          sx={{ flex: 1 }}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="contained"
                          color="error"
                          size="small"
                          startIcon={<CancelIcon />}
                          onClick={() => {
                            setSelectedSubmission(submission.id);
                            setSubmissionAction("reject");
                            setRejectionReason("");
                            setVerifiedViews("");
                            setCalculatedEarnings("");
                          }}
                          disabled={updateSubmissionMutation.isPending}
                          sx={{ flex: 1 }}
                        >
                          Reject
                        </Button>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Participants (when available) */}
      {(campaign.participant_count != null && campaign.participant_count > 0) && (
        <Card
          sx={{
            bgcolor: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 0,
            mb: 3,
            boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
            backdropFilter: "blur(12px)",
          }}
        >
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, mb: 1.5, display: "block" }}>
              Participants
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
              {(campaign.participant_avatars ?? []).slice(0, 12).map((url, i) => (
                <Box
                  key={i}
                  component="img"
                  src={url}
                  alt=""
                  sx={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,0.1)" }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              ))}
              <Typography variant="body2" color="text.secondary">
                {campaign.participant_count} {campaign.participant_count === 1 ? "creator" : "creators"} in this campaign
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Rate per million views */}
      <Typography variant="subtitle1" fontWeight={700} color="text.secondary" sx={{ mb: 1.5, letterSpacing: 0.5 }}>
        Rate per million views
      </Typography>
      <Card
        sx={{
          bgcolor: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 0,
          mb: 3,
          boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
          backdropFilter: "blur(12px)",
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: "rgba(229, 9, 20, 0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <TrendingUpIcon sx={{ color: "primary.main", fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="overline" sx={{ color: "text.secondary", fontWeight: 600 }}>CPM (per 1M views)</Typography>
              <Typography variant="h4" fontWeight={800} color="primary.main">${campaign.rate_per_million_views.toLocaleString()}</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Budget used – separate section, before Overall Campaign */}
      <Typography variant="subtitle1" fontWeight={700} color="text.secondary" sx={{ mb: 1.5, letterSpacing: 0.5 }}>
        Budget used
      </Typography>
      <Card
        sx={{
          bgcolor: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 0,
          mb: 3,
          overflow: "hidden",
          boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
          backdropFilter: "blur(12px)",
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2, mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: "rgba(229, 9, 20, 0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <AccountBalanceWalletIcon sx={{ color: "primary.main", fontSize: 26 }} />
              </Box>
              <Box>
                <Typography variant="overline" sx={{ color: "text.secondary", fontWeight: 600 }}>Spent</Typography>
                <Typography variant="h4" fontWeight={800} color="primary.main">${campaign.used_budget.toLocaleString()}</Typography>
              </Box>
            </Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>All-time</Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={campaign.total_budget > 0 ? Math.min(100, (campaign.used_budget / campaign.total_budget) * 100) : 0}
            sx={{ height: 10, borderRadius: 2, bgcolor: "rgba(255,255,255,0.1)", "& .MuiLinearProgress-bar": { borderRadius: 2, bgcolor: "primary.main" } }}
          />
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1.5 }}>
            <Typography variant="body2" color="text.secondary">Spent: ${campaign.used_budget.toLocaleString()}</Typography>
            <Typography variant="body2" color="text.secondary">Total: ${campaign.total_budget.toLocaleString()}</Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Overall Campaign – only Max Submissions/Account, Max Earnings/Creator, Max Earnings/Post */}
      <Typography variant="subtitle1" fontWeight={700} color="text.secondary" sx={{ mb: 1.5, letterSpacing: 0.5 }}>
        Overall Campaign
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {campaign.max_submissions_per_account != null && (
          <Grid item xs={12} sm={6} md={4}>
            <Card
              sx={{
                bgcolor: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 0,
                height: "100%",
                transition: "box-shadow 0.2s ease",
                backdropFilter: "blur(12px)",
                boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
                "&:hover": { boxShadow: "0 8px 24px rgba(0,0,0,0.2)" },
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                  <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: "rgba(155, 171, 44, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ArticleIcon sx={{ color: "primary.main", fontSize: 22 }} />
                  </Box>
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>Max Submissions / Account</Typography>
                </Box>
                <Typography variant="h6" fontWeight={700} color="text.primary">{campaign.max_submissions_per_account}</Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
        {campaign.max_earnings_per_creator != null && (
          <Grid item xs={12} sm={6} md={4}>
            <Card
              sx={{
                bgcolor: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 0,
                height: "100%",
                transition: "box-shadow 0.2s ease",
                backdropFilter: "blur(12px)",
                boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
                "&:hover": { boxShadow: "0 8px 24px rgba(0,0,0,0.2)" },
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                  <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: "rgba(155, 171, 44, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <PersonIcon sx={{ color: "primary.main", fontSize: 22 }} />
                  </Box>
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>Max Earnings / Creator</Typography>
                </Box>
                <Typography variant="h6" fontWeight={700} color="primary.main">${campaign.max_earnings_per_creator.toLocaleString()}</Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
        {campaign.max_earnings_per_post != null && (
          <Grid item xs={12} sm={6} md={4}>
            <Card
              sx={{
                bgcolor: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 0,
                height: "100%",
                transition: "box-shadow 0.2s ease",
                backdropFilter: "blur(12px)",
                boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
                "&:hover": { boxShadow: "0 8px 24px rgba(0,0,0,0.2)" },
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                  <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: "rgba(155, 171, 44, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ArticleIcon sx={{ color: "primary.main", fontSize: 22 }} />
                  </Box>
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>Max Earnings / Post</Typography>
                </Box>
                <Typography variant="h6" fontWeight={700} color="primary.main">${campaign.max_earnings_per_post.toLocaleString()}</Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
        {(campaign.platforms ?? []).length > 0 && (
          <Grid item xs={12} sm={6} md={4}>
            <Card
              sx={{
                bgcolor: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 0,
                height: "100%",
                transition: "box-shadow 0.2s ease",
                backdropFilter: "blur(12px)",
                boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
                "&:hover": { boxShadow: "0 8px 24px rgba(0,0,0,0.2)" },
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ mb: 1.5, display: "block" }}>
                  Accepted platform
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center" }}>
                  {(campaign.platforms ?? []).map((p) => {
                    const iconName = normalizePlatformIconName(p.name);
                    return (
                      <Box key={p.id} sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                        {iconName ? (
                          <Box
                            component="img"
                            src={getIconUrl(iconName)}
                            alt=""
                            sx={{ width: 20, height: 20 }}
                          />
                        ) : null}
                        <Typography variant="body2" fontWeight={600}>{p.name}</Typography>
                      </Box>
                    );
                  })}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Campaign Description */}
      <Card
        sx={{
          bgcolor: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 0,
          mb: 3,
          boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
          backdropFilter: "blur(12px)",
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
            <InfoIcon sx={{ color: "primary.main", fontSize: 22 }} />
            <Typography variant="h6" fontWeight={600} color="text.primary">
              Description
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
            {campaign.description || "No description provided."}
          </Typography>
        </CardContent>
      </Card>

      {/* Resources */}
      <Card
        sx={{
          bgcolor: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 0,
          maxWidth: 420,
          boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
          backdropFilter: "blur(12px)",
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="subtitle1" fontWeight={700} color="text.secondary" sx={{ mb: 2, letterSpacing: 0.5 }}>Resources</Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {campaign.guidelines_link && (
              <Link href={campaign.guidelines_link} target="_blank" rel="noreferrer" sx={{ color: "primary.main", textDecoration: "none", fontWeight: 500, "&:hover": { textDecoration: "underline" } }}>
                View Guidelines →
              </Link>
            )}
            {campaign.discord_link && (
              <Link href={campaign.discord_link} target="_blank" rel="noreferrer" sx={{ color: "primary.main", textDecoration: "none", fontWeight: 500, "&:hover": { textDecoration: "underline" } }}>
                Join Discord →
              </Link>
            )}
            {!campaign.guidelines_link && !campaign.discord_link && (
              <Typography variant="body2" color="text.secondary">No links added.</Typography>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Submit Link (faceless) Dialog */}
      <Dialog open={submitLinkOpen} onClose={closeSubmitLinkModal} maxWidth="sm" fullWidth>
        <DialogTitle>Submit Link</DialogTitle>
        <DialogContent>
          {submitLinkError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSubmitLinkError(null)}>
              {submitLinkError}
            </Alert>
          )}
          <TextField
            fullWidth
            label="Content URL"
            required
            value={submitLinkContentUrl}
            onChange={(e) => setSubmitLinkContentUrl(e.target.value)}
            placeholder="https://..."
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth required sx={{ mb: 2 }}>
            <InputLabel id="submit-link-account-label">Social account</InputLabel>
            <Select
              labelId="submit-link-account-label"
              value={submitLinkSocialAccountId}
              label="Social account"
              onChange={(e) => setSubmitLinkSocialAccountId(e.target.value)}
            >
              {(socialAccounts ?? []).map((acc) => (
                <MenuItem key={acc.id} value={acc.id}>
                  {acc.platform} @{acc.username}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeSubmitLinkModal}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmitLink}
            disabled={submitLinkMutation.isPending || !submitLinkContentUrl.trim() || !submitLinkSocialAccountId}
          >
            {submitLinkMutation.isPending ? "Submitting..." : "Submit"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Submission Approval/Rejection Dialog */}
      <Dialog
        open={!!selectedSubmission && !!submissionAction}
        onClose={() => {
          setSelectedSubmission(null);
          setSubmissionAction(null);
          setRejectionReason("");
          setVerifiedViews("");
          setCalculatedEarnings("");
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {submissionAction === "approve" ? "Approve Submission?" : "Reject Submission?"}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {submissionAction === "approve" ? (
              <>
                Approve this content submission? You can optionally set verified views and calculated earnings.
              </>
            ) : (
              <>
                Reject this content submission? Provide a reason (optional).
              </>
            )}
          </Typography>
          {submissionAction === "approve" && (
            <>
              <TextField
                fullWidth
                label="Verified Views (Optional)"
                type="number"
                value={verifiedViews}
                onChange={(e) => setVerifiedViews(e.target.value)}
                sx={{ mb: 2 }}
                placeholder="e.g., 50000"
              />
              <TextField
                fullWidth
                label="Calculated Earnings (Optional)"
                type="number"
                value={calculatedEarnings}
                onChange={(e) => setCalculatedEarnings(e.target.value)}
                placeholder="e.g., 25.00"
              />
            </>
          )}
          {submissionAction === "reject" && (
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Rejection Reason (Optional)"
              placeholder="Provide a reason for rejection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setSelectedSubmission(null);
              setSubmissionAction(null);
              setRejectionReason("");
              setVerifiedViews("");
              setCalculatedEarnings("");
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color={submissionAction === "approve" ? "success" : "error"}
            onClick={() => {
              if (!selectedSubmission) return;
              updateSubmissionMutation.mutate(
                {
                  submissionId: selectedSubmission,
                  payload: {
                    status: submissionAction === "approve" ? "APPROVED" : "REJECTED",
                    verified_views: submissionAction === "approve" && verifiedViews ? Number(verifiedViews) : undefined,
                    calculated_earnings: submissionAction === "approve" && calculatedEarnings ? Number(calculatedEarnings) : undefined,
                    reason: submissionAction === "reject" && rejectionReason ? rejectionReason : undefined,
                  },
                },
                {
                  onSuccess: () => {
                    setSelectedSubmission(null);
                    setSubmissionAction(null);
                    setRejectionReason("");
                    setVerifiedViews("");
                    setCalculatedEarnings("");
                  },
                }
              );
            }}
            disabled={updateSubmissionMutation.isPending}
          >
            {updateSubmissionMutation.isPending ? "Processing..." : submissionAction === "approve" ? "Approve" : "Reject"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
