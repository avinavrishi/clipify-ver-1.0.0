"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  TextField,
  Typography,
  Card,
  CardContent,
  Chip,
  InputAdornment,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PendingIcon from "@mui/icons-material/Pending";
import CancelIcon from "@mui/icons-material/Cancel";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import InstagramIcon from "@mui/icons-material/Instagram";
import YouTubeIcon from "@mui/icons-material/YouTube";
import { getIconUrl } from "../lib/assets";
import { useQueryClient } from "@tanstack/react-query";
import { useInitiateVerification, useCompleteVerification, useVerificationStatus } from "../queries/verifications";
import type { SocialPlatform, VerificationStatusResponse } from "../types/socialAccount";

const VerificationInitiateSchema = z.object({
  platform: z.enum(["INSTAGRAM", "YOUTUBE", "TIKTOK", "TWITTER", "OTHER"]),
  username: z.string().min(1, "Username is required"),
});

type VerificationInitiateFormValues = z.infer<typeof VerificationInitiateSchema>;

interface VerificationDialogProps {
  open: boolean;
  onClose: () => void;
  accessToken: string | null;
  /** When set, dialog opens directly on status step with this verification ID (e.g. after clicking Verify on a card). */
  startWithVerificationId?: string;
}

const PLATFORMS: { id: SocialPlatform; label: string; iconName: string }[] = [
  { id: "INSTAGRAM", label: "Instagram", iconName: "instagram" },
  { id: "YOUTUBE", label: "YouTube", iconName: "youtube" },
];

type VerificationStep =
  | "platform_select"
  | "initiate"
  | "code"
  | "complete"
  | "status";

export function VerificationDialog({ open, onClose, accessToken, startWithVerificationId }: VerificationDialogProps) {
  const [step, setStep] = useState<VerificationStep>("platform_select");
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform | null>(null);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState<string | null>(null);
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [iconLoadError, setIconLoadError] = useState<Record<string, boolean>>({});
  const hadPositiveTimeRef = useRef(false);

  const queryClient = useQueryClient();
  const initiateMutation = useInitiateVerification(accessToken);
  const completeMutation = useCompleteVerification(accessToken);
  const { data: statusData, isFetching: statusFetching } = useVerificationStatus(
    accessToken,
    step === "status" ? verificationId || undefined : undefined
  );

  const initiateForm = useForm<VerificationInitiateFormValues>({
    resolver: zodResolver(VerificationInitiateSchema),
    defaultValues: {
      platform: "INSTAGRAM",
      username: "",
    },
  });

  // When dialog opens with startWithVerificationId (e.g. Verify from Account tab), go straight to status step
  useEffect(() => {
    if (!open) return;
    if (startWithVerificationId) {
      setVerificationId(startWithVerificationId);
      setStep("status");
      setError(null);
      return;
    }
    setStep("platform_select");
  }, [open, startWithVerificationId]);

  // Countdown timer – only show "expired" when we had positive time and it counted down to 0
  useEffect(() => {
    if (!expiresAt || step !== "code") return;

    const updateTimer = () => {
      const now = new Date();
      const remaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
      setTimeRemaining(remaining);

      if (remaining > 0) {
        hadPositiveTimeRef.current = true;
      }
      // Only treat as expired when we previously had time left and it just hit 0
      if (remaining === 0 && hadPositiveTimeRef.current) {
        setError("Verification code has expired. Please start over.");
        setStep("initiate");
        setVerificationId(null);
        setVerificationCode(null);
        setVerificationMessage(null);
        setExpiresAt(null);
        hadPositiveTimeRef.current = false;
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, step]);

  // When verification succeeds, refresh the social accounts list so it shows the new account
  useEffect(() => {
    if (statusData?.status === "VERIFIED" && step === "status") {
      queryClient.invalidateQueries({ queryKey: ["social-accounts"] });
    }
  }, [statusData?.status, step, queryClient]);

  // When we get a terminal error status, show error and go back to initiate
  useEffect(() => {
    if (statusData && step === "status") {
      if (
        statusData.status === "REJECTED" ||
        statusData.status === "EXPIRED" ||
        statusData.status === "FAILED" ||
        statusData.status === "ERROR"
      ) {
        setError(
          statusData.status === "REJECTED"
            ? "Verification was rejected. Please check your bio and try again."
            : statusData.status === "EXPIRED"
              ? "Verification expired. Please start over."
              : statusData.status === "FAILED"
                ? "Verification failed. Please try again."
                : "Something went wrong. Please try again."
        );
        setStep("initiate");
      }
    }
  }, [statusData, step]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleInitiate = (values: VerificationInitiateFormValues) => {
    setError(null);
    const username = values.username.replace(/^@/, "").trim();
    initiateMutation.mutate(
      {
        platform: values.platform,
        username,
      },
      {
        onSuccess: (data) => {
          setVerificationId(data.verification_id);
          setVerificationCode(data.verification_code);
          setVerificationMessage(data.message ?? null);
          setExpiresAt(new Date(data.expires_at));
          hadPositiveTimeRef.current = false;
          setStep("code");
        },
        onError: (err: unknown) => {
          setError((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Failed to initiate verification");
        },
      }
    );
  };

  const handleComplete = () => {
    if (!verificationId) return;
    setError(null);
    completeMutation.mutate(
      { verification_id: verificationId },
      {
        onSuccess: () => {
          setStep("status");
          queryClient.invalidateQueries({ queryKey: ["verifications", verificationId] });
        },
        onError: (err: any) => {
          setError(err?.response?.data?.detail || "Failed to complete verification");
        },
      }
    );
  };

  const handleCopyCode = () => {
    if (verificationCode) {
      navigator.clipboard.writeText(verificationCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setStep("platform_select");
    setSelectedPlatform(null);
    setVerificationId(null);
    setVerificationCode(null);
    setVerificationMessage(null);
    setExpiresAt(null);
    setError(null);
    setCopied(false);
    setIconLoadError({});
    hadPositiveTimeRef.current = false;
    initiateForm.reset({ platform: "INSTAGRAM", username: "" });
    onClose();
  };

  const handleSelectPlatform = (platform: SocialPlatform) => {
    setSelectedPlatform(platform);
    initiateForm.setValue("platform", platform);
    setError(null);
    setStep("initiate");
  };

  const handleBackToPlatformSelect = () => {
    setStep("platform_select");
    setSelectedPlatform(null);
    setError(null);
    initiateForm.reset({ platform: "INSTAGRAM", username: "" });
  };

  const isVerificationPending = (status: string) =>
    ["PENDING", "CODE_ACTIVE", "PENDING_VERIFICATION"].includes(status);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return <CheckCircleIcon sx={{ color: "success.main" }} />;
      case "PENDING_VERIFICATION":
        return <PendingIcon sx={{ color: "warning.main" }} />;
      case "REJECTED":
      case "EXPIRED":
        return <CancelIcon sx={{ color: "error.main" }} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string): "success" | "warning" | "error" | "default" => {
    switch (status) {
      case "VERIFIED":
        return "success";
      case "PENDING_VERIFICATION":
      case "CODE_ACTIVE":
        return "warning";
      case "REJECTED":
      case "EXPIRED":
      case "FAILED":
      case "ERROR":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, bgcolor: "background.paper" } }}
      slotProps={{
        backdrop: {
          sx: {
            backdropFilter: "blur(12px)",
            backgroundColor: "rgba(0, 0, 0, 0.6)",
          },
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 600, pb: 0, pr: 6 }}>
        {step === "platform_select" && "Connect Your Account"}
        {step === "initiate" && selectedPlatform === "INSTAGRAM" && "Connect Instagram"}
        {step === "initiate" && selectedPlatform === "YOUTUBE" && "Connect YouTube"}
        {step === "initiate" && selectedPlatform === "TIKTOK" && "Connect TikTok"}
        {step === "code" && "Add Code to Your Bio"}
        {step === "status" && "Verification Status"}
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{ position: "absolute", right: 12, top: 12, color: "text.secondary" }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        {error && (
          <Typography variant="body2" sx={{ color: "error.main", mb: 2, px: 0.5 }} role="alert">
            {error}
          </Typography>
        )}

        {/* Platform selection */}
        {step === "platform_select" && (
          <Box sx={{ pt: 0.5 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              Select a platform to connect your social media account.
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              {PLATFORMS.map(({ id, label, iconName }) => (
                <Card
                  key={id}
                  onClick={() => handleSelectPlatform(id)}
                  sx={{
                    cursor: "pointer",
                    borderRadius: 2,
                    border: "1px solid rgba(255,255,255,0.08)",
                    bgcolor: "rgba(255,255,255,0.03)",
                    textAlign: "center",
                    py: 3,
                    px: 2,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      borderColor: "primary.main",
                      bgcolor: "rgba(155, 171, 44, 0.12)",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
                    },
                  }}
                >
                  <Box sx={{ mb: 1, display: "flex", justifyContent: "center" }}>
                    {iconLoadError[iconName] ? (
                      id === "INSTAGRAM" ? (
                        <InstagramIcon sx={{ fontSize: 40, color: "#E4405F" }} />
                      ) : (
                        <YouTubeIcon sx={{ fontSize: 40, color: "#FF0000" }} />
                      )
                    ) : (
                      <Box
                        component="img"
                        src={getIconUrl(iconName)}
                        alt={label}
                        onError={() => setIconLoadError((prev) => ({ ...prev, [iconName]: true }))}
                        sx={{ width: 40, height: 40, objectFit: "contain" }}
                      />
                    )}
                  </Box>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {label}
                  </Typography>
                </Card>
              ))}
            </Box>
          </Box>
        )}

        {/* Enter profile (Connect Instagram / YouTube / TikTok) */}
        {step === "initiate" && selectedPlatform && (
          <Box component="form" id="initiate-form" onSubmit={initiateForm.handleSubmit(handleInitiate)} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              Enter your account details to connect.
            </Typography>
            <TextField
              label={selectedPlatform === "INSTAGRAM" ? "Instagram Username" : selectedPlatform === "YOUTUBE" ? "YouTube Channel / Username" : "TikTok Username"}
              fullWidth
              size="medium"
              placeholder={selectedPlatform === "INSTAGRAM" ? "@ username" : "username or channel handle"}
              {...initiateForm.register("username")}
              error={!!initiateForm.formState.errors.username}
              helperText={
                initiateForm.formState.errors.username?.message ||
                (selectedPlatform === "INSTAGRAM" ? "Enter your username without the @ symbol." : "Enter your channel name or handle.")
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    {selectedPlatform === "INSTAGRAM" ? (
                      <InstagramIcon sx={{ color: "text.secondary", fontSize: 22 }} />
                    ) : selectedPlatform === "YOUTUBE" ? (
                      <YouTubeIcon sx={{ color: "text.secondary", fontSize: 22 }} />
                    ) : null}
                  </InputAdornment>
                ),
              }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
              <InfoOutlinedIcon sx={{ fontSize: 14, mt: 0.25 }} />
              Only your public bio is checked. We don&apos;t access your posts or DMs.
            </Typography>
          </Box>
        )}

        {/* Step: Show verification code and message from API */}
        {step === "code" && verificationCode && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            {expiresAt && (
              <Typography variant="body2" color="text.secondary">
                Time remaining: <strong>{formatTime(timeRemaining)}</strong>
              </Typography>
            )}
            <Card variant="outlined" sx={{ borderRadius: 2, borderColor: "rgba(255,255,255,0.08)", bgcolor: "rgba(255,255,255,0.02)" }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
                  Your verification code
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap", mb: 2 }}>
                  <Box
                    component="span"
                    sx={{
                      fontFamily: "monospace",
                      fontSize: "1.25rem",
                      fontWeight: 600,
                      letterSpacing: 2,
                      color: "primary.main",
                      bgcolor: "rgba(155, 171, 44, 0.15)",
                      px: 2,
                      py: 1,
                      borderRadius: 2,
                      border: "1px solid rgba(155, 171, 44, 0.35)",
                    }}
                  >
                    {verificationCode}
                  </Box>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={copied ? <CheckCircleIcon sx={{ color: "success.main" }} /> : <ContentCopyIcon />}
                    onClick={handleCopyCode}
                    sx={{ borderRadius: 2, minWidth: 100 }}
                  >
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </Box>
                <Typography variant="body2" color="text.primary" sx={{ mb: 1.5, fontWeight: 500 }}>
                  {verificationMessage ?? "Add this code to your profile bio (or YouTube description) within the time limit, then complete verification."}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Steps
                </Typography>
                <Box component="ol" sx={{ m: 0, pl: 2.5, "& li": { mb: 0.75 }, color: "text.secondary", fontSize: "0.875rem" }}>
                  <li>Copy the code above</li>
                  <li>Open your {selectedPlatform === "YOUTUBE" ? "channel" : "profile"} on {selectedPlatform === "INSTAGRAM" ? "Instagram" : selectedPlatform === "YOUTUBE" ? "YouTube" : "TikTok"}</li>
                  <li>Edit your {selectedPlatform === "YOUTUBE" ? "channel description" : "bio"} and paste the code</li>
                  <li>Save, then click <strong>Verify</strong> below</li>
                </Box>
              </CardContent>
            </Card>
            {expiresAt && (
              <LinearProgress
                variant="determinate"
                value={timeRemaining > 0 ? (timeRemaining / 600) * 100 : 0}
                sx={{ height: 6, borderRadius: 3 }}
              />
            )}
          </Box>
        )}

        {/* Status: Verifying loader (polling every 5s) or final result */}
        {step === "status" && (!statusData || isVerificationPending(statusData.status)) && (
          <Card variant="outlined" sx={{ borderRadius: 3, borderColor: "rgba(255,255,255,0.08)", bgcolor: "rgba(255,255,255,0.02)" }}>
            <CardContent sx={{ p: 4, textAlign: "center" }}>
              <CircularProgress size={48} sx={{ color: "primary.main", mb: 2, display: "block", mx: "auto" }} />
              <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                Verifying…
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 320, mx: "auto" }}>
                We&apos;re checking your profile. This usually takes a few moments. We&apos;ll check again automatically every few seconds.
              </Typography>
              {statusFetching && (
                <Typography variant="caption" color="text.secondary">
                  Checking status…
                </Typography>
              )}
            </CardContent>
          </Card>
        )}
        {step === "status" && statusData && statusData.status === "VERIFIED" && (
          <Card variant="outlined" sx={{ borderRadius: 3, borderColor: "rgba(229, 9, 20, 0.3)", bgcolor: "rgba(229, 9, 20, 0.06)" }}>
            <CardContent sx={{ p: 4, textAlign: "center" }}>
              <Box sx={{ width: 64, height: 64, borderRadius: "50%", bgcolor: "rgba(229, 9, 20, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2 }}>
                <CheckCircleIcon sx={{ fontSize: 40, color: "success.main" }} />
              </Box>
              <Typography variant="h5" fontWeight={800} sx={{ mb: 1 }}>
                Congratulations!
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 0.5 }}>
                Your account is connected.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You can use it for submissions right away.
              </Typography>
            </CardContent>
          </Card>
        )}
        {step === "status" && statusData && statusData.status !== "VERIFIED" && !isVerificationPending(statusData.status) && (
          <Card variant="outlined" sx={{ borderRadius: 3, borderColor: "rgba(255,255,255,0.08)", bgcolor: "rgba(255,255,255,0.02)" }}>
            <CardContent sx={{ p: 3, textAlign: "center" }}>
              <Box sx={{ mb: 2 }}>{getStatusIcon(statusData.status)}</Box>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                {statusData.status === "REJECTED" && "Verification rejected"}
                {statusData.status === "EXPIRED" && "Verification expired"}
                {statusData.status === "FAILED" && "Verification failed"}
                {statusData.status === "ERROR" && "Something went wrong"}
              </Typography>
              <Chip label={statusData.status.replace("_", " ")} color={getStatusColor(statusData.status)} sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                {statusData.status === "REJECTED" && "The code wasn't found in your bio. Check it's visible and try again."}
                {statusData.status === "EXPIRED" && "The code expired. Please start again."}
                {(statusData.status === "FAILED" || statusData.status === "ERROR") && "Please try again or contact support."}
              </Typography>
            </CardContent>
          </Card>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, pt: 0 }}>
        {step === "platform_select" && (
          <Button onClick={handleClose} sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
        )}
        {step === "initiate" && selectedPlatform && (
          <>
            <Button onClick={handleBackToPlatformSelect} sx={{ borderRadius: 2 }}>
              Back
            </Button>
            <Button type="submit" form="initiate-form" variant="contained" disabled={initiateMutation.isPending} sx={{ borderRadius: 2 }}>
              {initiateMutation.isPending ? (
                <>
                  <CircularProgress size={18} sx={{ mr: 1 }} /> Checking…
                </>
              ) : (
                "Connect Account"
              )}
            </Button>
          </>
        )}
        {step === "code" && (
          <>
            <Button onClick={handleClose} sx={{ borderRadius: 2 }}>Cancel</Button>
            <Button variant="contained" onClick={handleComplete} disabled={completeMutation.isPending} sx={{ borderRadius: 2 }}>
              {completeMutation.isPending ? (
                <>
                  <CircularProgress size={18} sx={{ mr: 1 }} /> Verifying…
                </>
              ) : (
                "Verify"
              )}
            </Button>
          </>
        )}
        {step === "status" && (
          <Button variant="contained" onClick={handleClose} sx={{ borderRadius: 2 }}>
            {statusData?.status === "VERIFIED" ? "Done" : "Close"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
