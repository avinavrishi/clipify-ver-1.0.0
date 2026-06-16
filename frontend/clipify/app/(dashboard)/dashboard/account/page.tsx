"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Tabs,
  Tab,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import InstagramIcon from "@mui/icons-material/Instagram";
import YouTubeIcon from "@mui/icons-material/YouTube";
import PendingIcon from "@mui/icons-material/Pending";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import { useAuth } from "../../../../hooks/useAuth";
import {
  useMySocialAccounts,
  useUpdateSocialAccount,
  useDeleteSocialAccount,
} from "../../../../queries/socialAccounts";
import { useMyVerifications, useCompleteVerification } from "../../../../queries/verifications";
import { VerificationDialog } from "../../../../components/VerificationDialog";
import type { SocialPlatform, SocialAccount, VerificationStatus } from "../../../../types/socialAccount";

const SocialAccountUpdateSchema = z.object({
  username: z.string().min(1, "Username is required"),
  platform_user_id: z.string().optional(),
});

type SocialAccountUpdateFormValues = z.infer<typeof SocialAccountUpdateSchema>;

export default function AccountPage() {
  const { accessToken } = useAuth();
  const { data: accounts, isLoading: accountsLoading, refetch: refetchAccounts } = useMySocialAccounts(accessToken);
  const { data: verifications, isLoading: verificationsLoading, refetch: refetchVerifications } = useMyVerifications(accessToken);
  const deleteMutation = useDeleteSocialAccount(accessToken);
  const completeVerificationMutation = useCompleteVerification(accessToken);

  useEffect(() => {
    if (accessToken) {
      refetchAccounts();
      refetchVerifications();
    }
  }, [accessToken, refetchAccounts, refetchVerifications]);
  const [editingAccount, setEditingAccount] = useState<SocialAccount | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openVerificationDialog, setOpenVerificationDialog] = useState(false);
  const [verificationIdForDialog, setVerificationIdForDialog] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SocialAccountUpdateFormValues>({
    resolver: zodResolver(SocialAccountUpdateSchema),
    defaultValues: {
      username: "",
      platform_user_id: "",
    },
  });

  const updateMutation = useUpdateSocialAccount(accessToken, editingAccount?.id || "");

  const handleOpenEdit = (account: SocialAccount) => {
    reset({
      username: account.username,
      platform_user_id: account.platform_user_id || "",
    });
    setEditingAccount(account);
    setError(null);
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setEditingAccount(null);
    setError(null);
    reset();
  };

  const onSubmit = (values: SocialAccountUpdateFormValues) => {
    if (!editingAccount) return;
    setError(null);
    const payload = {
      username: values.username,
      platform_user_id: values.platform_user_id || undefined,
    };

    updateMutation.mutate(payload, {
      onSuccess: () => {
        handleCloseEditDialog();
      },
      onError: (err: any) => {
        setError(err?.response?.data?.detail || "Failed to update account");
      },
    });
  };

  const handleDelete = (accountId: string) => {
    deleteMutation.mutate(accountId, {
      onSuccess: () => {
        setDeleteConfirm(null);
      },
    });
  };

  const getPlatformIcon = (platform: SocialPlatform) => {
    switch (platform) {
      case "INSTAGRAM":
        return <InstagramIcon />;
      case "YOUTUBE":
        return <YouTubeIcon />;
      default:
        return null;
    }
  };

  const getStatusIcon = (status: VerificationStatus) => {
    switch (status) {
      case "VERIFIED":
        return <CheckCircleIcon sx={{ fontSize: 16, color: "success.main" }} />;
      case "PENDING_VERIFICATION":
      case "CODE_ACTIVE":
        return <PendingIcon sx={{ fontSize: 16, color: "warning.main" }} />;
      case "REJECTED":
      case "EXPIRED":
      case "FAILED":
      case "ERROR":
        return <CancelIcon sx={{ fontSize: 16, color: "error.main" }} />;
      default:
        return undefined;
    }
  };

  const getStatusColor = (status: VerificationStatus): "success" | "warning" | "error" | "default" => {
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

  const activeVerifications = verifications?.filter((v) => v.status === "CODE_ACTIVE") || [];

  const handleVerifyFromCard = (verificationId: string) => {
    setError(null);
    setVerifyingId(verificationId);
    completeVerificationMutation.mutate(
      { verification_id: verificationId },
      {
        onSuccess: () => {
          setVerificationIdForDialog(verificationId);
          setOpenVerificationDialog(true);
        },
        onSettled: () => setVerifyingId(null),
        onError: (err: any) => setError(err?.response?.data?.detail || "Verification failed"),
      }
    );
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Connect and manage your social media accounts for content submissions
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenVerificationDialog(true)}
          sx={{ minWidth: 140 }}
        >
          Connect Account
        </Button>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3, borderRadius: 1.5 }}>
          {error}
        </Alert>
      )}

      <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
        <Tab label={`Connected (${accounts?.length || 0})`} />
        <Tab label={`Verifications (${activeVerifications.length})`} />
      </Tabs>

      {/* Connected Accounts Tab */}
      {tabValue === 0 && (
        <>
          {accountsLoading && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress sx={{ color: "primary.main" }} />
            </Box>
          )}

          {!accountsLoading && (!accounts || accounts.length === 0) && (
            <Card sx={{ border: "1px solid rgba(255, 255, 255, 0.08)", textAlign: "center", py: 6 }}>
              <CardContent>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                  No social accounts connected
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Click the “Connect Account” button above to add your first account
                </Typography>
              </CardContent>
            </Card>
          )}

          {!accountsLoading && accounts && accounts.length > 0 && (
            <Grid container spacing={2}>
              {accounts.map((account) => (
                <Grid item xs={12} sm={6} md={4} key={account.id}>
                  <Card sx={{ border: "1px solid rgba(255, 255, 255, 0.08)", height: "100%" }}>
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 1.5 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          {getPlatformIcon(account.platform)}
                          <Box>
                            <Typography variant="subtitle1" fontWeight={600}>
                              @{account.username}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ textTransform: "capitalize" }}>
                              {account.platform}
                            </Typography>
                          </Box>
                        </Box>
                        {account.is_verified && (
                          <Chip label="Verified" size="small" color="success" sx={{ fontSize: "0.7rem", height: 20 }} />
                        )}
                      </Box>
                      <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenEdit(account)}
                          sx={{
                            color: "text.secondary",
                            "&:hover": { color: "primary.main", backgroundColor: "rgba(229, 9, 20, 0.08)" },
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => setDeleteConfirm(account.id)}
                          sx={{
                            color: "text.secondary",
                            "&:hover": { color: "error.main", backgroundColor: "rgba(239, 68, 68, 0.08)" },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      {/* Verifications Tab */}
      {tabValue === 1 && (
        <>
          {verificationsLoading && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress sx={{ color: "primary.main" }} />
            </Box>
          )}

          {!verificationsLoading && activeVerifications.length === 0 && (
            <Card sx={{ border: "1px solid rgba(255, 255, 255, 0.08)", textAlign: "center", py: 6 }}>
              <CardContent>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                  No verifications awaiting action
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Verifications where you still need to add the code to your bio will appear here
                </Typography>
              </CardContent>
            </Card>
          )}

          {!verificationsLoading && activeVerifications.length > 0 && (
            <Grid container spacing={2}>
              {activeVerifications.map((verification) => (
                <Grid item xs={12} sm={6} md={4} key={verification.id}>
                  <Card sx={{ border: "1px solid rgba(255, 255, 255, 0.08)", height: "100%" }}>
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 1.5 }}>
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
                        {getStatusIcon(verification.status) && (
                          <Chip
                            icon={getStatusIcon(verification.status)}
                            label={verification.status.replace("_", " ")}
                            size="small"
                            color={getStatusColor(verification.status)}
                            sx={{ fontSize: "0.7rem", height: 20 }}
                          />
                        )}
                        {!getStatusIcon(verification.status) && (
                          <Chip
                            label={verification.status.replace("_", " ")}
                            size="small"
                            color={getStatusColor(verification.status)}
                            sx={{ fontSize: "0.7rem", height: 20 }}
                          />
                        )}
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace", display: "block", mb: 1 }}>
                        Code: {verification.verification_code}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: verification.status === "CODE_ACTIVE" ? 1.5 : 0 }}>
                        {verification.status === "CODE_ACTIVE" && "Add this code to your profile bio, then click Verify below."}
                        {verification.status === "PENDING_VERIFICATION" && "Submitted for verification."}
                        {verification.status === "VERIFIED" && "Account connected"}
                        {verification.status === "REJECTED" && "Verification rejected"}
                        {verification.status === "EXPIRED" && "Code expired"}
                      </Typography>
                      {verification.status === "CODE_ACTIVE" && (
                        <Button
                          variant="contained"
                          size="small"
                          fullWidth
                          disabled={verifyingId === verification.verification_id && completeVerificationMutation.isPending}
                          onClick={() => handleVerifyFromCard(verification.verification_id)}
                          sx={{ mt: 1, borderRadius: 2 }}
                        >
                          {verifyingId === verification.verification_id && completeVerificationMutation.isPending ? (
                            <>
                              <CircularProgress size={16} sx={{ mr: 1 }} /> Verifying…
                            </>
                          ) : (
                            "Verify"
                          )}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      {/* Edit Dialog */}
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Social Account</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5 }}>
              {error}
            </Alert>
          )}
          <Box component="form" id="edit-account-form" onSubmit={handleSubmit(onSubmit)} sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <TextField
              label="Username"
              fullWidth
              size="small"
              placeholder="username (without @)"
              {...register("username")}
              error={!!errors.username}
              helperText={errors.username?.message}
            />
            <TextField
              label="Platform User ID (Optional)"
              fullWidth
              size="small"
              placeholder="Platform-specific user ID"
              {...register("platform_user_id")}
              error={!!errors.platform_user_id}
              helperText={errors.platform_user_id?.message || "Optional: Platform-specific user ID"}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button
            type="submit"
            form="edit-account-form"
            variant="contained"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? "Updating..." : "Update"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Social Account?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to remove this social account? You won't be able to use it for new submissions.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Verification Dialog (Connect account flow or status loader when Verify clicked from card) */}
      <VerificationDialog
        open={openVerificationDialog}
        onClose={() => {
          setOpenVerificationDialog(false);
          setVerificationIdForDialog(null);
        }}
        accessToken={accessToken}
        startWithVerificationId={verificationIdForDialog ?? undefined}
      />
    </Box>
  );
}
