"use client";

import React, { useState } from "react";
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
  Grid,
  Typography,
  Link,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import InstagramIcon from "@mui/icons-material/Instagram";
import YouTubeIcon from "@mui/icons-material/YouTube";
import { useAuth } from "../../../../../hooks/useAuth";
import {
  usePendingVerifications,
  useApproveVerification,
  useRejectVerification,
} from "../../../../../queries/adminVerifications";
import type { AdminVerification } from "../../../../../queries/adminVerifications";

export default function AdminVerificationsPage() {
  const { accessToken } = useAuth();
  const { data: verifications, isLoading } = usePendingVerifications(accessToken);
  const approveMutation = useApproveVerification(accessToken);
  const rejectMutation = useRejectVerification(accessToken);
  const [selectedVerification, setSelectedVerification] = useState<AdminVerification | null>(null);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);

  const handleApprove = (verification: AdminVerification) => {
    setSelectedVerification(verification);
    setAction("approve");
  };

  const handleReject = (verification: AdminVerification) => {
    setSelectedVerification(verification);
    setAction("reject");
  };

  const confirmAction = () => {
    if (!selectedVerification) return;

    if (action === "approve") {
      approveMutation.mutate(selectedVerification.verification_id, {
        onSuccess: () => {
          setSelectedVerification(null);
          setAction(null);
        },
      });
    } else if (action === "reject") {
      rejectMutation.mutate(selectedVerification.verification_id, {
        onSuccess: () => {
          setSelectedVerification(null);
          setAction(null);
        },
      });
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "INSTAGRAM":
        return <InstagramIcon />;
      case "YOUTUBE":
        return <YouTubeIcon />;
      default:
        return null;
    }
  };

  const getProfileUrl = (platform: string, username: string) => {
    switch (platform) {
      case "INSTAGRAM":
        return `https://www.instagram.com/${username}/`;
      case "YOUTUBE":
        return `https://www.youtube.com/@${username}`;
      default:
        return null;
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Review and approve/reject social account verification requests
        </Typography>
      </Box>

      {isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress sx={{ color: "primary.main" }} />
        </Box>
      )}

      {!isLoading && (!verifications || verifications.length === 0) && (
        <Card sx={{ border: "1px solid rgba(255, 255, 255, 0.08)", textAlign: "center", py: 6 }}>
          <CardContent>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
              No pending verifications
            </Typography>
            <Typography variant="body2" color="text.secondary">
              All verification requests have been processed
            </Typography>
          </CardContent>
        </Card>
      )}

      {!isLoading && verifications && verifications.length > 0 && (
        <Grid container spacing={2}>
          {verifications.map((verification) => {
            const profileUrl = getProfileUrl(verification.platform, verification.username);
            return (
              <Grid item xs={12} md={6} key={verification.id}>
                <Card sx={{ border: "1px solid rgba(255, 255, 255, 0.08)", height: "100%" }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 2 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        {getPlatformIcon(verification.platform)}
                        <Box>
                          <Typography variant="subtitle1" fontWeight={600}>
                            @{verification.username}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ textTransform: "capitalize" }}>
                            {verification.platform}
                          </Typography>
                        </Box>
                      </Box>
                      <Chip label="Pending" size="small" color="warning" sx={{ fontSize: "0.7rem", height: 20 }} />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Verification Code:
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{
                          fontFamily: "monospace",
                          letterSpacing: 2,
                          color: "primary.main",
                          fontWeight: 700,
                          mb: 2,
                        }}
                      >
                        {verification.verification_code}
                      </Typography>
                      <Alert severity="info" sx={{ borderRadius: 1.5, mb: 2 }}>
                        Check the profile bio for this code. It should be visible in the account's bio/description.
                      </Alert>
                    </Box>

                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                      {profileUrl && (
                        <Button
                          variant="outlined"
                          size="small"
                          href={profileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ flex: 1, minWidth: 120 }}
                        >
                          View Profile
                        </Button>
                      )}
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => handleApprove(verification)}
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                        sx={{ flex: 1, minWidth: 120 }}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        size="small"
                        startIcon={<CancelIcon />}
                        onClick={() => handleReject(verification)}
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                        sx={{ flex: 1, minWidth: 120 }}
                      >
                        Reject
                      </Button>
                    </Box>

                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
                      Completed: {new Date(verification.completed_at || verification.created_at).toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={!!selectedVerification && !!action} onClose={() => { setSelectedVerification(null); setAction(null); }} maxWidth="xs" fullWidth>
        <DialogTitle>
          {action === "approve" ? "Approve Verification?" : "Reject Verification?"}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {action === "approve" ? (
              <>
                Confirm that you have verified the code <strong>{selectedVerification?.verification_code}</strong> appears in{" "}
                <strong>@{selectedVerification?.username}</strong>'s profile bio. This will create the social account connection.
              </>
            ) : (
              <>
                Reject this verification request? The code was not found in the profile bio or the profile is invalid.
              </>
            )}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setSelectedVerification(null); setAction(null); }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={action === "approve" ? "success" : "error"}
            onClick={confirmAction}
            disabled={approveMutation.isPending || rejectMutation.isPending}
          >
            {approveMutation.isPending || rejectMutation.isPending
              ? "Processing..."
              : action === "approve"
              ? "Approve"
              : "Reject"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
