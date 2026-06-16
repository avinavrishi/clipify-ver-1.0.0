"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import NextLink from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../../../../../../hooks/useAuth";
import { useCampaign, useCampaignPlatforms, useUpdateCampaign, useDeleteCampaign } from "../../../../../../queries/campaigns";
import { useAdminBrands } from "../../../../../../queries/admin";
import { toDriveImageUrl } from "../../../../../../lib/driveImage";
import { getCampaignType } from "../../../../../../types/campaign";
import { CampaignTypeSelector } from "../../../../../../components/CampaignTypeSelector";

const AdminEditCampaignSchema = z.object({
  campaign_type: z.union([z.literal(0), z.literal(1)]),
  title: z.string().min(2),
  category: z.string().optional(),
  content_type: z.enum(["VIDEO", "IMAGE"]),
  description: z.string().optional(),
  total_budget: z.coerce.number().positive(),
  rate_per_million_views: z.coerce.number().positive(),
  max_submissions_per_account: z.coerce.number().optional(),
  max_earnings_per_creator: z.coerce.number().optional(),
  max_earnings_per_post: z.coerce.number().optional(),
  start_date: z.string(),
  end_date: z.string(),
  logo_drive_link: z.string().url().optional().or(z.literal("")),
  guidelines_link: z.string().url().optional().or(z.literal("")),
  discord_link: z.string().url().optional().or(z.literal("")),
  platform_ids: z.array(z.string()).min(1, "Select at least one platform"),
  status: z.enum(["ACTIVE", "PAUSED", "COMPLETED"]),
});

type AdminEditCampaignValues = z.infer<typeof AdminEditCampaignSchema>;

export default function AdminCampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string | undefined;
  const { accessToken } = useAuth();
  const { data: campaign } = useCampaign(accessToken, id);
  const { data: brands = [] } = useAdminBrands(accessToken);
  const { data: platforms = [] } = useCampaignPlatforms(accessToken);
  const updateMutation = useUpdateCampaign(accessToken, id ?? "");
  const deleteMutation = useDeleteCampaign(accessToken, id ?? "");
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const brandMap = useMemo(() => new Map(brands.map((b) => [b.id, b])), [brands]);
  const brandName = campaign ? brandMap.get(campaign.brand_id)?.company_name ?? campaign.brand_id : "";

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AdminEditCampaignValues>({
    resolver: zodResolver(AdminEditCampaignSchema),
    defaultValues: { content_type: "VIDEO", platform_ids: [], status: "ACTIVE", campaign_type: 0 },
  });

  const selectedPlatformIds = watch("platform_ids") ?? [];

  useEffect(() => {
    if (campaign && editOpen) {
      reset({
        title: campaign.title,
        campaign_type: getCampaignType(campaign),
        category: campaign.category ?? "",
        content_type: campaign.content_type,
        description: campaign.description ?? "",
        total_budget: campaign.total_budget,
        rate_per_million_views: campaign.rate_per_million_views,
        max_submissions_per_account: campaign.max_submissions_per_account ?? undefined,
        max_earnings_per_creator: campaign.max_earnings_per_creator ?? undefined,
        max_earnings_per_post: campaign.max_earnings_per_post ?? undefined,
        start_date: campaign.start_date,
        end_date: campaign.end_date,
        logo_drive_link: campaign.logo_drive_link ?? "",
        guidelines_link: campaign.guidelines_link ?? "",
        discord_link: campaign.discord_link ?? "",
        platform_ids: (campaign.platforms ?? []).map((p) => p.id),
        status: campaign.status,
      });
    }
  }, [campaign, editOpen, reset]);

  const onEditSubmit = (values: AdminEditCampaignValues) => {
    updateMutation.mutate(
      {
        ...values,
        logo_drive_link: values.logo_drive_link || undefined,
        guidelines_link: values.guidelines_link || undefined,
        discord_link: values.discord_link || undefined,
        platform_ids: values.platform_ids,
        status: values.status,
      },
      { onSuccess: () => setEditOpen(false) }
    );
  };

  const onConfirmDelete = () => {
    deleteMutation.mutate(undefined, {
      onSuccess: () => {
        setDeleteOpen(false);
        router.replace("/dashboard/admin/campaigns");
      },
    });
  };

  if (!campaign) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
        <CircularProgress sx={{ color: "primary.main" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2, mb: 2 }}>
        <Button size="small" component={NextLink} href="/dashboard/admin/campaigns">
          ← Back to campaigns
        </Button>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button variant="contained" onClick={() => setEditOpen(true)} sx={{ backgroundColor: "primary.main", "&:hover": { backgroundColor: "primary.dark" } }}>
            Edit
          </Button>
          <Button variant="outlined" color="error" onClick={() => setDeleteOpen(true)}>
            Delete
          </Button>
        </Box>
      </Box>

      <Card sx={{ mb: 3, overflow: "hidden", borderRadius: 3, border: "1px solid rgba(255,255,255,0.08)" }}>
        <Box sx={{ position: "relative" }}>
          {toDriveImageUrl(campaign.logo_drive_link) ? (
            <Box
              component="img"
              src={toDriveImageUrl(campaign.logo_drive_link) as string}
              alt={campaign.title}
              loading="lazy"
              referrerPolicy="no-referrer"
              sx={{ width: "100%", height: { xs: 180, sm: 220 }, objectFit: "cover", display: "block" }}
            />
          ) : (
            <Box sx={{ width: "100%", height: { xs: 180, sm: 220 }, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "rgba(255,255,255,0.04)" }}>
              <Typography variant="h4" color="text.secondary">{campaign.title}</Typography>
            </Box>
          )}
          <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.15) 45%, rgba(0,0,0,0.75) 100%)" }} />
          <Box sx={{ position: "absolute", left: 16, bottom: 16, right: 16 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 1 }}>
              <Chip label={campaign.status} color={campaign.status === "ACTIVE" ? "success" : "default"} sx={{ textTransform: "capitalize" }} />
              <Chip
                label={getCampaignType(campaign) === 1 ? "Faceless creators" : "Face creators"}
                size="small"
                variant="outlined"
                sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.5)" }}
              />
              <Chip label={`Brand: ${brandName}`} size="small" variant="outlined" sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.5)" }} />
              {(campaign.platforms ?? []).map((p) => (
                <Chip key={p.id} label={p.name} size="small" variant="outlined" sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.5)" }} />
              ))}
            </Box>
            <Typography variant="h5" fontWeight={700} sx={{ color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}>
              {campaign.title}
            </Typography>
          </Box>
        </Box>
      </Card>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ border: "1px solid rgba(255,255,255,0.08)", mb: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>Description</Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                {campaign.description || "No description provided."}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ border: "1px solid rgba(255,255,255,0.08)" }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Campaign details</Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Brand</Typography>
                  <Typography variant="body2">{brandName}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Creator target</Typography>
                  <Typography variant="body2">{getCampaignType(campaign) === 1 ? "Faceless (submit link)" : "Face (apply → approve)"}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Platforms</Typography>
                  <Typography variant="body2">{(campaign.platforms ?? []).map((p) => p.name).join(", ") || "—"}</Typography>
                </Box>
                {campaign.participant_count != null && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Participants</Typography>
                    <Typography variant="body2">{campaign.participant_count} {campaign.participant_count === 1 ? "creator" : "creators"}</Typography>
                  </Box>
                )}
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Total budget</Typography>
                  <Typography variant="h6" color="primary.main">${campaign.total_budget.toLocaleString()}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Used budget</Typography>
                  <Typography variant="body1">${campaign.used_budget.toLocaleString()}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Rate / 1M views</Typography>
                  <Typography variant="body1" color="success.main">${campaign.rate_per_million_views}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">{campaign.start_date} → {campaign.end_date}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Edit dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit campaign</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit(onEditSubmit)} id="admin-detail-edit-form" sx={{ py: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <CampaignTypeSelector
                  value={watch("campaign_type") ?? 0}
                  onChange={(v) => setValue("campaign_type", v, { shouldValidate: true })}
                  error={!!errors.campaign_type}
                  helperText={errors.campaign_type?.message}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Platforms for this campaign</Typography>
                <FormGroup row>
                  {platforms.map((p) => (
                    <FormControlLabel
                      key={p.id}
                      control={
                        <Checkbox
                          checked={selectedPlatformIds.includes(p.id)}
                          onChange={(e) => {
                            const next = e.target.checked ? [...selectedPlatformIds, p.id] : selectedPlatformIds.filter((id) => id !== p.id);
                            setValue("platform_ids", next, { shouldValidate: true });
                          }}
                        />
                      }
                      label={p.name}
                    />
                  ))}
                </FormGroup>
                {errors.platform_ids && <FormHelperText error>{errors.platform_ids.message}</FormHelperText>}
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="Title" fullWidth size="small" {...register("title")} error={!!errors.title} helperText={errors.title?.message} />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select label="Status" value={watch("status") ?? "ACTIVE"} onChange={(e) => setValue("status", e.target.value as "ACTIVE" | "PAUSED" | "COMPLETED")}>
                    <MenuItem value="ACTIVE">ACTIVE</MenuItem>
                    <MenuItem value="PAUSED">PAUSED</MenuItem>
                    <MenuItem value="COMPLETED">COMPLETED</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="Category" fullWidth size="small" {...register("category")} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="Content type" select fullWidth size="small" SelectProps={{ native: true }} {...register("content_type")}>
                  <option value="VIDEO">VIDEO</option>
                  <option value="IMAGE">IMAGE</option>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="Total budget" type="number" fullWidth size="small" {...register("total_budget")} error={!!errors.total_budget} helperText={errors.total_budget?.message} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="Rate per 1M views" type="number" fullWidth size="small" {...register("rate_per_million_views")} error={!!errors.rate_per_million_views} helperText={errors.rate_per_million_views?.message} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="Max submissions/account" type="number" fullWidth size="small" {...register("max_submissions_per_account")} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="Max earnings/creator" type="number" fullWidth size="small" {...register("max_earnings_per_creator")} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="Max earnings/post" type="number" fullWidth size="small" {...register("max_earnings_per_post")} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="Start date" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} {...register("start_date")} error={!!errors.start_date} helperText={errors.start_date?.message} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="End date" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} {...register("end_date")} error={!!errors.end_date} helperText={errors.end_date?.message} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField label="Logo drive link" fullWidth size="small" {...register("logo_drive_link")} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField label="Guidelines link" fullWidth size="small" {...register("guidelines_link")} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField label="Discord link" fullWidth size="small" {...register("discord_link")} />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Description" fullWidth size="small" multiline minRows={3} {...register("description")} />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button type="submit" form="admin-detail-edit-form" variant="contained" disabled={updateMutation.isPending} sx={{ backgroundColor: "primary.main", "&:hover": { backgroundColor: "primary.dark" } }}>
            {updateMutation.isPending ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Delete campaign</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this campaign? <strong>{campaign.title}</strong></Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={onConfirmDelete} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? "Deleting…" : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
