"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import {
  Alert,
  Avatar,
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
  TextField,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import EmailIcon from "@mui/icons-material/Email";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import PendingIcon from "@mui/icons-material/Pending";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useAuth } from "../../../../hooks/useAuth";
import { useProfile, useUpsertProfile, useUpdateCreatorFaceDetails } from "../../../../queries/profile";

const ProfileSchema = z.object({
  display_name: z.string().min(2, "At least 2 characters"),
  bio: z.string().optional(),
  profile_picture_url: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  country: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof ProfileSchema>;

const FaceCreatorDetailsSchema = z.object({
  name: z.string().optional(),
  category: z.string().optional(),
  reel_price: z.coerce.number().min(0).optional(),
  story_price: z.coerce.number().min(0).optional(),
  reel_story_price: z.coerce.number().min(0).optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  language: z.string().optional(),
});

type FaceCreatorDetailsFormValues = z.infer<typeof FaceCreatorDetailsSchema>;

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(value);
}

function CreatorProfileView() {
  const { accessToken, currentUser } = useAuth();
  const { data, isLoading, isError } = useProfile(accessToken);
  const upsertMutation = useUpsertProfile(accessToken);
  const updateFaceDetailsMutation = useUpdateCreatorFaceDetails(accessToken);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [faceDetailsDialogOpen, setFaceDetailsDialogOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(ProfileSchema),
  });

  const faceDetailsForm = useForm<FaceCreatorDetailsFormValues>({
    resolver: zodResolver(FaceCreatorDetailsSchema),
    defaultValues: {
      name: "",
      category: "",
      reel_price: undefined,
      story_price: undefined,
      reel_story_price: undefined,
      state: "",
      city: "",
      language: "",
    },
  });

  useEffect(() => {
    if (data) {
      reset({
        display_name: data.display_name,
        bio: data.bio ?? "",
        profile_picture_url: data.profile_picture_url ?? "",
        country: data.country ?? "",
      });
    }
  }, [data, reset]);

  useEffect(() => {
    const details = data?.creator_face_details;
    if (details && faceDetailsDialogOpen) {
      faceDetailsForm.reset({
        name: details.name ?? "",
        category: details.category ?? "",
        reel_price: details.reel_price ?? undefined,
        story_price: details.story_price ?? undefined,
        reel_story_price: details.reel_story_price ?? undefined,
        state: details.state ?? "",
        city: details.city ?? "",
        language: details.language ?? "",
      });
    }
  }, [data?.creator_face_details, faceDetailsDialogOpen, faceDetailsForm]);

  const onSubmit = (values: ProfileFormValues) => {
    upsertMutation.mutate(
      { ...values, profile_picture_url: values.profile_picture_url || undefined },
      { onSuccess: () => setEditDialogOpen(false) }
    );
  };

  const onFaceDetailsSubmit = (values: FaceCreatorDetailsFormValues) => {
    updateFaceDetailsMutation.mutate(
      {
        name: values.name || undefined,
        category: values.category || undefined,
        reel_price: values.reel_price,
        story_price: values.story_price,
        reel_story_price: values.reel_story_price,
        state: values.state || undefined,
        city: values.city || undefined,
        language: values.language || undefined,
      },
      { onSuccess: () => setFaceDetailsDialogOpen(false) }
    );
  };

  if (isLoading || !data) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress sx={{ color: "primary.main" }} />
      </Box>
    );
  }

  const walletBalance = data.wallet_balance ?? 0;
  const totalEarnings = data.total_earnings ?? 0;
  const verificationStatus = data.verification_status ?? "PENDING";
  const isVerified = verificationStatus === "VERIFIED";

  return (
    <Box sx={{ width: "100%", maxWidth: 900, mx: "auto" }}>
      {isError && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          Failed to load profile. You can still edit and save.
        </Alert>
      )}

      {/* Hero: gradient header + avatar + name + verification + edit */}
      <Box
        sx={{
          position: "relative",
          borderRadius: 4,
          overflow: "hidden",
          mb: 3,
          background: "linear-gradient(145deg, rgba(0,0,0,0.5) 0%, rgba(20,22,28,0.95) 50%, rgba(0,0,0,0.6) 100%)",
          border: "1px solid rgba(255,255,255,0.06)",
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(229, 9, 20, 0.08) 0%, transparent 60%)",
            pointerEvents: "none",
          },
        }}
      >
        <Box sx={{ position: "relative", zIndex: 1, pt: 4, pb: 3, px: 3 }}>
          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 3 }}>
            <Box
              sx={{
                position: "relative",
                flexShrink: 0,
              }}
            >
              <Box
                sx={{
                  width: 100,
                  height: 100,
                  borderRadius: "50%",
                  p: "4px",
                  background: "linear-gradient(135deg, #E50914 0%, #F40612 100%)",
                  boxShadow: "0 0 32px rgba(229, 9, 20, 0.25)",
                }}
              >
                <Avatar
                  src={data.profile_picture_url ?? undefined}
                  alt={data.display_name}
                  sx={{
                    width: "100%",
                    height: "100%",
                    border: "3px solid",
                    borderColor: "background.paper",
                    bgcolor: "action.hover",
                  }}
                />
              </Box>
            </Box>
            <Box sx={{ flex: 1, minWidth: 0, pb: 0.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1.5, mb: 0.5 }}>
                <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ letterSpacing: "-0.02em" }}>
                  {data.display_name}
                </Typography>
                <Chip
                  size="small"
                  icon={isVerified ? <VerifiedUserIcon sx={{ fontSize: 16 }} /> : <PendingIcon sx={{ fontSize: 16 }} />}
                  label={verificationStatus}
                  color={isVerified ? "success" : "default"}
                  sx={{
                    textTransform: "capitalize",
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    height: 24,
                  }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, opacity: 0.95 }}>
                Your creator dashboard — track earnings and grow your presence.
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<EditIcon sx={{ fontSize: 18 }} />}
                onClick={() => setEditDialogOpen(true)}
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600,
                  borderColor: "rgba(255,255,255,0.2)",
                  color: "text.primary",
                  "&:hover": {
                    borderColor: "primary.main",
                    bgcolor: "rgba(229, 9, 20, 0.08)",
                  },
                }}
              >
                Edit Profile
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Wallet & Total Earnings — prominent, motivating */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <Card
            variant="outlined"
            sx={{
              borderRadius: 3,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "linear-gradient(160deg, rgba(229, 9, 20, 0.06) 0%, rgba(0,0,0,0.2) 100%)",
              height: "100%",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 12px 32px rgba(0,0,0,0.25), 0 0 0 1px rgba(229, 9, 20, 0.1)",
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box
                    sx={{
                      width: 52,
                      height: 52,
                      borderRadius: 2.5,
                      bgcolor: "rgba(229, 9, 20, 0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <AccountBalanceWalletIcon sx={{ fontSize: 28, color: "primary.main" }} />
                  </Box>
                  <Box>
                    <Typography variant="overline" sx={{ color: "text.secondary", fontWeight: 600, letterSpacing: 0.5 }}>
                      Wallet balance
                    </Typography>
                    <Typography variant="h4" fontWeight={800} color="primary.main" sx={{ lineHeight: 1.2, mt: 0.25 }}>
                      {formatCurrency(walletBalance)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                      Available to withdraw
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Card
            variant="outlined"
            sx={{
              borderRadius: 3,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "linear-gradient(160deg, rgba(229, 9, 20, 0.06) 0%, rgba(0,0,0,0.2) 100%)",
              height: "100%",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 12px 32px rgba(0,0,0,0.25), 0 0 0 1px rgba(229, 9, 20, 0.1)",
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box
                    sx={{
                      width: 52,
                      height: 52,
                      borderRadius: 2.5,
                      bgcolor: "rgba(229, 9, 20, 0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <TrendingUpIcon sx={{ fontSize: 28, color: "primary.main" }} />
                  </Box>
                  <Box>
                    <Typography variant="overline" sx={{ color: "text.secondary", fontWeight: 600, letterSpacing: 0.5 }}>
                      Total earnings
                    </Typography>
                    <Typography variant="h4" fontWeight={800} color="primary.main" sx={{ lineHeight: 1.2, mt: 0.25 }}>
                      {formatCurrency(totalEarnings)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                      All-time from your content
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Creator type & face creator details (creators only) */}
      {data.creator_type === "FACELESS" && (
        <Card variant="outlined" sx={{ borderRadius: 3, borderColor: "rgba(255,255,255,0.06)", bgcolor: "rgba(255,255,255,0.02)", mb: 3 }}>
          <CardContent sx={{ p: 2 }}>
            <Chip label="Faceless creator" size="small" sx={{ fontWeight: 600 }} />
          </CardContent>
        </Card>
      )}
      {data.creator_type === "FACE" && (
        <Card variant="outlined" sx={{ borderRadius: 3, borderColor: "rgba(255,255,255,0.06)", bgcolor: "rgba(255,255,255,0.02)", mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2, mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 0.5 }}>
                Face creator details
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<EditIcon sx={{ fontSize: 18 }} />}
                onClick={() => setFaceDetailsDialogOpen(true)}
                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
              >
                Update face creator details
              </Button>
            </Box>
            <Grid container spacing={2}>
              {data.creator_face_details?.name != null && data.creator_face_details.name !== "" && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Name</Typography>
                  <Typography variant="body2" display="block">{data.creator_face_details.name}</Typography>
                </Grid>
              )}
              {data.creator_face_details?.category != null && data.creator_face_details.category !== "" && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Category</Typography>
                  <Typography variant="body2" display="block">{data.creator_face_details.category}</Typography>
                </Grid>
              )}
              {data.creator_face_details?.reel_price != null && (
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Reel price</Typography>
                  <Typography variant="body2" display="block">{formatCurrency(data.creator_face_details.reel_price)}</Typography>
                </Grid>
              )}
              {data.creator_face_details?.story_price != null && (
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Story price</Typography>
                  <Typography variant="body2" display="block">{formatCurrency(data.creator_face_details.story_price)}</Typography>
                </Grid>
              )}
              {data.creator_face_details?.reel_story_price != null && (
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Reel + Story price</Typography>
                  <Typography variant="body2" display="block">{formatCurrency(data.creator_face_details.reel_story_price)}</Typography>
                </Grid>
              )}
              {data.creator_face_details?.state != null && data.creator_face_details.state !== "" && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>State</Typography>
                  <Typography variant="body2" display="block">{data.creator_face_details.state}</Typography>
                </Grid>
              )}
              {data.creator_face_details?.city != null && data.creator_face_details.city !== "" && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>City</Typography>
                  <Typography variant="body2" display="block">{data.creator_face_details.city}</Typography>
                </Grid>
              )}
              {data.creator_face_details?.language != null && data.creator_face_details.language !== "" && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Language</Typography>
                  <Typography variant="body2" display="block">{data.creator_face_details.language}</Typography>
                </Grid>
              )}
              {(!data.creator_face_details || Object.values(data.creator_face_details).every((v) => v == null || v === "")) && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">No details added yet. Click &quot;Update face creator details&quot; to add.</Typography>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* About + CTA row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Card
            variant="outlined"
            sx={{
              borderRadius: 3,
              borderColor: "rgba(255,255,255,0.06)",
              bgcolor: "rgba(255,255,255,0.02)",
              height: "100%",
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600, letterSpacing: 0.5 }}>
                About you
              </Typography>
              {data.email && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                  <EmailIcon sx={{ fontSize: 20, color: "text.secondary" }} />
                  <Typography variant="body2" color="text.primary">
                    {data.email}
                  </Typography>
                </Box>
              )}
              {data.bio ? (
                <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.7, mb: data.country ? 1.5 : 0 }}>
                  {data.bio}
                </Typography>
              ) : (
                !data.email && (
                  <Typography variant="body2" color="text.secondary">
                    Add a bio in Edit Profile to tell others about yourself.
                  </Typography>
                )
              )}
              {data.country && (
                <Typography variant="body2" color="text.secondary">
                  {data.country}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card
            variant="outlined"
            sx={{
              borderRadius: 3,
              borderColor: "rgba(255,255,255,0.08)",
              bgcolor: "rgba(229, 9, 20, 0.04)",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 140,
            }}
          >
            <CardContent sx={{ p: 2.5, textAlign: "center", width: "100%" }}>
              <AutoAwesomeIcon sx={{ fontSize: 32, color: "primary.main", mb: 1, opacity: 0.9 }} />
              <Typography variant="subtitle2" color="text.primary" sx={{ fontWeight: 600, mb: 1.5 }}>
                Keep creating
              </Typography>
              <Button
                component={Link}
                href="/dashboard/campaigns"
                variant="contained"
                endIcon={<ArrowForwardIcon />}
                fullWidth
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 700,
                  py: 1.25,
                  boxShadow: "0 4px 14px rgba(229, 9, 20, 0.35)",
                }}
              >
                View my campaigns
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>


      {/* Edit face creator details dialog */}
      <Dialog
        open={faceDetailsDialogOpen}
        onClose={() => setFaceDetailsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, border: "1px solid rgba(255,255,255,0.08)" } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 0 }}>Update face creator details</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box
            component="form"
            id="face-details-form"
            onSubmit={faceDetailsForm.handleSubmit(onFaceDetailsSubmit)}
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            <TextField label="Name" fullWidth size="small" {...faceDetailsForm.register("name")} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
            <TextField label="Category" fullWidth size="small" {...faceDetailsForm.register("category")} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
            <TextField label="Reel price (USD)" type="number" fullWidth size="small" {...faceDetailsForm.register("reel_price")} inputProps={{ min: 0, step: 0.01 }} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
            <TextField label="Story price (USD)" type="number" fullWidth size="small" {...faceDetailsForm.register("story_price")} inputProps={{ min: 0, step: 0.01 }} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
            <TextField label="Reel + Story price (USD)" type="number" fullWidth size="small" {...faceDetailsForm.register("reel_story_price")} inputProps={{ min: 0, step: 0.01 }} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
            <TextField label="State" fullWidth size="small" {...faceDetailsForm.register("state")} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
            <TextField label="City" fullWidth size="small" {...faceDetailsForm.register("city")} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
            <TextField label="Language" fullWidth size="small" {...faceDetailsForm.register("language")} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 0 }}>
          <Button onClick={() => setFaceDetailsDialogOpen(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button type="submit" form="face-details-form" variant="contained" disabled={updateFaceDetailsMutation.isPending} sx={{ borderRadius: 2, fontWeight: 600 }}>
            {updateFaceDetailsMutation.isPending ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, border: "1px solid rgba(255,255,255,0.08)" } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 0 }}>Edit Profile</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {upsertMutation.isSuccess && (
            <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
              Saved successfully
            </Alert>
          )}
          <Box
            component="form"
            id="edit-profile-form"
            onSubmit={handleSubmit(onSubmit)}
            sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
          >
            <TextField
              label="Display name"
              fullWidth
              size="small"
              {...register("display_name")}
              error={!!errors.display_name}
              helperText={errors.display_name?.message}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />
            <TextField
              label="Country"
              fullWidth
              size="small"
              {...register("country")}
              error={!!errors.country}
              helperText={errors.country?.message}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />
            <TextField
              label="Profile picture URL"
              fullWidth
              size="small"
              {...register("profile_picture_url")}
              error={!!errors.profile_picture_url}
              helperText={errors.profile_picture_url?.message}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />
            <TextField
              label="Bio"
              fullWidth
              multiline
              minRows={3}
              size="small"
              {...register("bio")}
              error={!!errors.bio}
              helperText={errors.bio?.message}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 0 }}>
          <Button onClick={() => setEditDialogOpen(false)} sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="edit-profile-form"
            variant="contained"
            disabled={upsertMutation.isPending}
            sx={{ borderRadius: 2, fontWeight: 600 }}
          >
            {upsertMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function DefaultProfileView() {
  const { accessToken } = useAuth();
  const { data, isLoading, isError } = useProfile(accessToken);
  const upsertMutation = useUpsertProfile(accessToken);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(ProfileSchema),
  });

  useEffect(() => {
    if (data) {
      reset({
        display_name: data.display_name,
        bio: data.bio ?? "",
        profile_picture_url: data.profile_picture_url ?? "",
        country: data.country ?? "",
      });
    }
  }, [data, reset]);

  const onSubmit = (values: ProfileFormValues) => {
    upsertMutation.mutate({ ...values, profile_picture_url: values.profile_picture_url || undefined });
  };

  return (
    <Box sx={{ maxWidth: 720, mx: "auto" }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Update your display name and public profile.
      </Typography>
      {isError && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          Failed to load profile. You can still save a new one.
        </Alert>
      )}
      <Card variant="outlined" sx={{ borderRadius: 3, borderColor: "rgba(255,255,255,0.06)", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
        <CardContent sx={{ p: 3 }}>
          <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
          >
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Display name"
                  fullWidth
                  size="small"
                  {...register("display_name")}
                  error={!!errors.display_name}
                  helperText={errors.display_name?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Country"
                  fullWidth
                  size="small"
                  {...register("country")}
                  error={!!errors.country}
                  helperText={errors.country?.message}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Profile picture URL"
                  fullWidth
                  size="small"
                  {...register("profile_picture_url")}
                  error={!!errors.profile_picture_url}
                  helperText={errors.profile_picture_url?.message}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Bio"
                  fullWidth
                  multiline
                  minRows={3}
                  size="small"
                  {...register("bio")}
                  error={!!errors.bio}
                  helperText={errors.bio?.message}
                />
              </Grid>
            </Grid>
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 1 }}>
              {upsertMutation.isSuccess && (
                <Typography variant="body2" color="success.main" sx={{ alignSelf: "center", fontWeight: 500 }}>
                  Saved successfully
                </Typography>
              )}
              <Button
                type="submit"
                variant="contained"
                disabled={upsertMutation.isPending}
                sx={{ px: 3, py: 0.875, fontSize: "0.875rem", fontWeight: 600, minWidth: 100 }}
              >
                {upsertMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
      {isLoading && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 2 }}>
          <CircularProgress size={16} sx={{ color: "text.secondary" }} />
          <Typography variant="body2" color="text.secondary">
            Loading profile...
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default function ProfilePage() {
  const { currentUser } = useAuth();

  return currentUser?.role === "CREATOR" ? <CreatorProfileView /> : <DefaultProfileView />;
}
