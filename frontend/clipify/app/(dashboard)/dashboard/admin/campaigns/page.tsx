"use client";

import React, { useCallback, useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
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
  Skeleton,
  TextField,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useAuth } from "../../../../../hooks/useAuth";
import {
  useCampaigns,
  useCreateCampaign,
  useCampaignPlatforms,
  useUpdateCampaign,
  useDeleteCampaign,
} from "../../../../../queries/campaigns";
import { useAdminBrands } from "../../../../../queries/admin";
import { type Campaign, getCampaignType } from "../../../../../types/campaign";
import { CampaignTypeSelector } from "../../../../../components/CampaignTypeSelector";
import { AdminCampaignCard } from "../../../../../components/admin/AdminCampaignCard";
import {
  AdminCampaignFiltersBar,
  defaultFilters,
  type AdminCampaignFilters,
} from "../../../../../components/admin/AdminCampaignFiltersBar";

const AdminCreateCampaignSchema = z.object({
  brand_id: z.string().min(1, "Select a brand"),
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
});

const AdminEditCampaignSchema = AdminCreateCampaignSchema.omit({ brand_id: true }).extend({
  status: z.enum(["ACTIVE", "PAUSED", "COMPLETED"]),
});

type AdminCreateCampaignValues = z.infer<typeof AdminCreateCampaignSchema>;
type AdminEditCampaignValues = z.infer<typeof AdminEditCampaignSchema>;

const createFormDefaults: AdminCreateCampaignValues = {
  brand_id: "",
  campaign_type: 0,
  title: "",
  category: "",
  content_type: "VIDEO",
  description: "",
  total_budget: 1,
  rate_per_million_views: 1,
  max_submissions_per_account: undefined,
  max_earnings_per_creator: undefined,
  max_earnings_per_post: undefined,
  start_date: "",
  end_date: "",
  logo_drive_link: "",
  guidelines_link: "",
  discord_link: "",
  platform_ids: [],
};

function filterCampaigns(campaigns: Campaign[], filters: AdminCampaignFilters): Campaign[] {
  const q = filters.search.trim().toLowerCase();
  return campaigns.filter((c) => {
    if (q) {
      const inTitle = c.title.toLowerCase().includes(q);
      const inDesc = (c.description ?? "").toLowerCase().includes(q);
      if (!inTitle && !inDesc) return false;
    }
    if (filters.status !== "ALL" && c.status !== filters.status) return false;
    if (filters.category !== "ALL") {
      const cat = (c.category ?? "").trim();
      if (cat !== filters.category) return false;
    }
    if (filters.creatorTarget !== "ALL") {
      const t = getCampaignType(c) === 1 ? "FACELESS" : "FACE";
      if (t !== filters.creatorTarget) return false;
    }
    if (filters.dateFrom && c.end_date < filters.dateFrom) return false;
    if (filters.dateTo && c.start_date > filters.dateTo) return false;
    return true;
  });
}

export default function AdminCampaignsPage() {
  const { accessToken } = useAuth();
  const { data: campaigns = [], isLoading } = useCampaigns(accessToken);
  const { data: brands = [] } = useAdminBrands(accessToken);
  const { data: platforms = [] } = useCampaignPlatforms(accessToken);
  const createMutation = useCreateCampaign(accessToken);
  const [createSubmitError, setCreateSubmitError] = useState<string | null>(null);
  const [editSubmitError, setEditSubmitError] = useState<string | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [deleteCampaign, setDeleteCampaign] = useState<{ id: string; title: string } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [filters, setFilters] = useState<AdminCampaignFilters>(defaultFilters);

  const brandMap = useMemo(() => new Map(brands.map((b) => [b.id, b])), [brands]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    campaigns.forEach((c) => {
      const cat = c.category?.trim();
      if (cat) set.add(cat);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [campaigns]);

  const filteredCampaigns = useMemo(() => filterCampaigns(campaigns, filters), [campaigns, filters]);

  const createForm = useForm<AdminCreateCampaignValues>({
    resolver: zodResolver(AdminCreateCampaignSchema),
    defaultValues: createFormDefaults,
  });

  const editForm = useForm<AdminEditCampaignValues>({
    resolver: zodResolver(AdminEditCampaignSchema),
    defaultValues: { content_type: "VIDEO", platform_ids: [], status: "ACTIVE", campaign_type: 0 },
  });

  const selectedCreatePlatformIds = createForm.watch("platform_ids") ?? [];
  const selectedEditPlatformIds = editForm.watch("platform_ids") ?? [];
  const selectedBrandId = createForm.watch("brand_id");

  const updateMutation = useUpdateCampaign(accessToken, editingCampaign?.id ?? "");
  const deleteMutation = useDeleteCampaign(accessToken, deleteCampaign?.id ?? "");

  const openCreateModal = useCallback(() => {
    setCreateSubmitError(null);
    createForm.reset(createFormDefaults);
    setCreateOpen(true);
  }, [createForm]);

  const onCreateSubmit = (values: AdminCreateCampaignValues) => {
    setCreateSubmitError(null);
    createMutation.mutate(
      {
        ...values,
        brand_id: values.brand_id,
        logo_drive_link: values.logo_drive_link || undefined,
        guidelines_link: values.guidelines_link || undefined,
        discord_link: values.discord_link || undefined,
        platform_ids: values.platform_ids,
      },
      {
        onSuccess: () => {
          createForm.reset(createFormDefaults);
          setCreateOpen(false);
        },
        onError: (err: unknown) => {
          const e = err as { response?: { data?: { detail?: string } } };
          setCreateSubmitError(e.response?.data?.detail ?? "Failed to create campaign.");
        },
      }
    );
  };

  React.useEffect(() => {
    if (editingCampaign) {
      setEditSubmitError(null);
      editForm.reset({
        title: editingCampaign.title,
        campaign_type: getCampaignType(editingCampaign),
        category: editingCampaign.category ?? "",
        content_type: editingCampaign.content_type,
        description: editingCampaign.description ?? "",
        total_budget: editingCampaign.total_budget,
        rate_per_million_views: editingCampaign.rate_per_million_views,
        max_submissions_per_account: editingCampaign.max_submissions_per_account ?? undefined,
        max_earnings_per_creator: editingCampaign.max_earnings_per_creator ?? undefined,
        max_earnings_per_post: editingCampaign.max_earnings_per_post ?? undefined,
        start_date: editingCampaign.start_date,
        end_date: editingCampaign.end_date,
        logo_drive_link: editingCampaign.logo_drive_link ?? "",
        guidelines_link: editingCampaign.guidelines_link ?? "",
        discord_link: editingCampaign.discord_link ?? "",
        platform_ids: (editingCampaign.platforms ?? []).map((p) => p.id),
        status: editingCampaign.status,
      });
    }
  }, [editingCampaign, editForm]);

  const onEditSubmit = (values: AdminEditCampaignValues) => {
    if (!editingCampaign) return;
    setEditSubmitError(null);
    updateMutation.mutate(
      {
        ...values,
        logo_drive_link: values.logo_drive_link || undefined,
        guidelines_link: values.guidelines_link || undefined,
        discord_link: values.discord_link || undefined,
        platform_ids: values.platform_ids,
        status: values.status,
      },
      {
        onSuccess: () => {
          setEditingCampaign(null);
        },
        onError: (err: unknown) => {
          const e = err as { response?: { data?: { detail?: string } } };
          setEditSubmitError(e.response?.data?.detail ?? "Failed to update campaign.");
        },
      }
    );
  };

  const onConfirmDelete = () => {
    if (!deleteCampaign) return;
    deleteMutation.mutate(undefined, {
      onSuccess: () => setDeleteCampaign(null),
    });
  };

  const showEmptyLibrary = !isLoading && campaigns.length === 0;
  const showNoMatches = !isLoading && campaigns.length > 0 && filteredCampaigns.length === 0;

  return (
    <Box sx={{ pb: 6, maxWidth: 1600, mx: "auto" }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "flex-start" },
          justifyContent: "space-between",
          gap: 2,
          mb: 1,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            fontWeight={800}
            letterSpacing="-0.03em"
            sx={{ fontSize: { xs: "1.65rem", sm: "2rem" }, lineHeight: 1.2 }}
          >
            Campaigns
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, maxWidth: 520 }}>
            Manage brand campaigns, budgets, and targeting from one place.
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="large"
          startIcon={<AddRoundedIcon />}
          onClick={openCreateModal}
          sx={{
            alignSelf: { xs: "stretch", sm: "center" },
            py: 1.25,
            px: 2.5,
            borderRadius: 2,
            fontWeight: 700,
            textTransform: "none",
            boxShadow: (theme) =>
              theme.palette.mode === "dark"
                ? "0 4px 20px rgba(0,0,0,0.4)"
                : "0 4px 14px rgba(0,0,0,0.12)",
          }}
        >
          Create campaign
        </Button>
      </Box>

      {!showEmptyLibrary && (
        <AdminCampaignFiltersBar value={filters} onChange={setFilters} categories={categories} />
      )}

      {/* Results count */}
      {!isLoading && campaigns.length > 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Showing{" "}
          <Box component="span" fontWeight={700} color="text.primary">
            {filteredCampaigns.length}
          </Box>{" "}
          of {campaigns.length} campaigns
        </Typography>
      )}

      {/* Loading */}
      {isLoading && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)", lg: "repeat(4, 1fr)" },
            gap: 2,
          }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={380} sx={{ borderRadius: 3 }} />
          ))}
        </Box>
      )}

      {/* Empty — no campaigns at all */}
      {showEmptyLibrary && (
        <Box
          sx={{
            mt: 2,
            py: { xs: 6, sm: 8 },
            px: 3,
            textAlign: "center",
            borderRadius: 4,
            border: "1px dashed",
            borderColor: "divider",
            bgcolor: (theme) => (theme.palette.mode === "dark" ? "action.hover" : "grey.50"),
          }}
        >
          <CampaignOutlinedIcon sx={{ fontSize: 56, color: "text.disabled", mb: 2 }} />
          <Typography variant="h6" fontWeight={700} gutterBottom>
            No campaigns yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 360, mx: "auto" }}>
            Create your first campaign for a brand to appear here. You can set budget, platforms, and creator targeting.
          </Typography>
          <Button variant="contained" size="large" startIcon={<AddRoundedIcon />} onClick={openCreateModal} sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}>
            Create your first campaign
          </Button>
        </Box>
      )}

      {/* No filter matches */}
      {showNoMatches && (
        <Box
          sx={{
            py: 6,
            textAlign: "center",
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "action.hover",
          }}
        >
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            No campaigns match your filters
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Try adjusting search, status, category, or date range.
          </Typography>
          <Button variant="outlined" onClick={() => setFilters(defaultFilters)} sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}>
            Clear all filters
          </Button>
        </Box>
      )}

      {/* Card grid */}
      {!isLoading && filteredCampaigns.length > 0 && (
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
          }}
        >
          {filteredCampaigns.map((c) => (
            <AdminCampaignCard
              key={c.id}
              campaign={c}
              brandName={brandMap.get(c.brand_id)?.company_name ?? c.brand_id}
              detailHref={`/dashboard/admin/campaigns/${c.id}`}
              onEdit={setEditingCampaign}
              onDelete={(camp) => setDeleteCampaign({ id: camp.id, title: camp.title })}
            />
          ))}
        </Box>
      )}

      {/* Create campaign dialog */}
      <Dialog
        open={createOpen}
        onClose={() => {
          if (createMutation.isPending) return;
          setCreateOpen(false);
          setCreateSubmitError(null);
        }}
        maxWidth="md"
        fullWidth
        scroll="paper"
        PaperProps={{
          sx: {
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
          },
        }}
      >
        <DialogTitle sx={{ pb: 1, pt: 3, px: 3 }}>
          <Typography variant="h6" fontWeight={800} letterSpacing="-0.02em">
            New campaign
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 400 }}>
            Create on behalf of a brand. All required fields must be completed.
          </Typography>
        </DialogTitle>
        <DialogContent dividers sx={{ px: 3, py: 2 }}>
          <Box component="form" onSubmit={createForm.handleSubmit(onCreateSubmit)} id="admin-create-campaign-form">
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth error={!!createForm.formState.errors.brand_id} size="small">
                  <InputLabel>Brand</InputLabel>
                  <Select
                    label="Brand"
                    value={selectedBrandId ?? ""}
                    onChange={(e) => createForm.setValue("brand_id", e.target.value, { shouldValidate: true })}
                  >
                    <MenuItem value="">Select a brand</MenuItem>
                    {brands.map((b) => (
                      <MenuItem key={b.id} value={b.id}>
                        {b.company_name}
                        {b.industry ? ` (${b.industry})` : ""}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>{createForm.formState.errors.brand_id?.message}</FormHelperText>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <CampaignTypeSelector
                  value={createForm.watch("campaign_type") ?? 0}
                  onChange={(v) => createForm.setValue("campaign_type", v, { shouldValidate: true })}
                  error={!!createForm.formState.errors.campaign_type}
                  helperText={createForm.formState.errors.campaign_type?.message}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Platforms
                </Typography>
                <FormGroup row>
                  {platforms.map((p) => (
                    <FormControlLabel
                      key={p.id}
                      control={
                        <Checkbox
                          checked={selectedCreatePlatformIds.includes(p.id)}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...selectedCreatePlatformIds, p.id]
                              : selectedCreatePlatformIds.filter((id) => id !== p.id);
                            createForm.setValue("platform_ids", next, { shouldValidate: true });
                          }}
                        />
                      }
                      label={p.name}
                    />
                  ))}
                </FormGroup>
                {createForm.formState.errors.platform_ids && (
                  <FormHelperText error>{createForm.formState.errors.platform_ids.message}</FormHelperText>
                )}
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Title"
                  fullWidth
                  size="small"
                  {...createForm.register("title")}
                  error={!!createForm.formState.errors.title}
                  helperText={createForm.formState.errors.title?.message}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="Category" fullWidth size="small" {...createForm.register("category")} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="Content type" select fullWidth size="small" SelectProps={{ native: true }} {...createForm.register("content_type")}>
                  <option value="VIDEO">VIDEO</option>
                  <option value="IMAGE">IMAGE</option>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Total budget"
                  type="number"
                  fullWidth
                  size="small"
                  {...createForm.register("total_budget")}
                  error={!!createForm.formState.errors.total_budget}
                  helperText={createForm.formState.errors.total_budget?.message}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Rate per 1M views"
                  type="number"
                  fullWidth
                  size="small"
                  {...createForm.register("rate_per_million_views")}
                  error={!!createForm.formState.errors.rate_per_million_views}
                  helperText={createForm.formState.errors.rate_per_million_views?.message}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="Max submissions/account" type="number" fullWidth size="small" {...createForm.register("max_submissions_per_account")} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="Max earnings/creator" type="number" fullWidth size="small" {...createForm.register("max_earnings_per_creator")} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="Max earnings/post" type="number" fullWidth size="small" {...createForm.register("max_earnings_per_post")} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Start date"
                  type="date"
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  {...createForm.register("start_date")}
                  error={!!createForm.formState.errors.start_date}
                  helperText={createForm.formState.errors.start_date?.message}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="End date"
                  type="date"
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  {...createForm.register("end_date")}
                  error={!!createForm.formState.errors.end_date}
                  helperText={createForm.formState.errors.end_date?.message}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField label="Logo drive link" fullWidth size="small" {...createForm.register("logo_drive_link")} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField label="Guidelines link" fullWidth size="small" {...createForm.register("guidelines_link")} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField label="Discord link" fullWidth size="small" {...createForm.register("discord_link")} />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Description" fullWidth size="small" multiline minRows={3} {...createForm.register("description")} />
              </Grid>
              {createSubmitError && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="error">
                    {createSubmitError}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={() => setCreateOpen(false)} disabled={createMutation.isPending} sx={{ textTransform: "none", fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="admin-create-campaign-form"
            variant="contained"
            disabled={createMutation.isPending}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, px: 2.5 }}
          >
            {createMutation.isPending ? "Creating…" : "Create campaign"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit dialog */}
      <Dialog
        open={!!editingCampaign}
        onClose={() => {
          if (updateMutation.isPending) return;
          setEditingCampaign(null);
          setEditSubmitError(null);
        }}
        maxWidth="md"
        fullWidth
        scroll="paper"
        PaperProps={{
          sx: { borderRadius: 3, border: "1px solid", borderColor: "divider" },
        }}
      >
        <DialogTitle sx={{ pb: 1, pt: 3, px: 3 }}>
          <Typography variant="h6" fontWeight={800}>
            Edit campaign
          </Typography>
          {editingCampaign && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {editingCampaign.title}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent dividers sx={{ px: 3, py: 2 }}>
          <Box component="form" onSubmit={editForm.handleSubmit(onEditSubmit)} id="admin-edit-campaign-form">
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <CampaignTypeSelector
                  value={editForm.watch("campaign_type") ?? 0}
                  onChange={(v) => editForm.setValue("campaign_type", v, { shouldValidate: true })}
                  error={!!editForm.formState.errors.campaign_type}
                  helperText={editForm.formState.errors.campaign_type?.message}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Platforms
                </Typography>
                <FormGroup row>
                  {platforms.map((p) => (
                    <FormControlLabel
                      key={p.id}
                      control={
                        <Checkbox
                          checked={selectedEditPlatformIds.includes(p.id)}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...selectedEditPlatformIds, p.id]
                              : selectedEditPlatformIds.filter((id) => id !== p.id);
                            editForm.setValue("platform_ids", next, { shouldValidate: true });
                          }}
                        />
                      }
                      label={p.name}
                    />
                  ))}
                </FormGroup>
                {editForm.formState.errors.platform_ids && (
                  <FormHelperText error>{editForm.formState.errors.platform_ids.message}</FormHelperText>
                )}
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="Title" fullWidth size="small" {...editForm.register("title")} error={!!editForm.formState.errors.title} helperText={editForm.formState.errors.title?.message} />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    label="Status"
                    value={editForm.watch("status") ?? "ACTIVE"}
                    onChange={(e) => editForm.setValue("status", e.target.value as "ACTIVE" | "PAUSED" | "COMPLETED")}
                  >
                    <MenuItem value="ACTIVE">Active</MenuItem>
                    <MenuItem value="PAUSED">Paused</MenuItem>
                    <MenuItem value="COMPLETED">Completed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="Category" fullWidth size="small" {...editForm.register("category")} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="Content type" select fullWidth size="small" SelectProps={{ native: true }} {...editForm.register("content_type")}>
                  <option value="VIDEO">VIDEO</option>
                  <option value="IMAGE">IMAGE</option>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="Total budget" type="number" fullWidth size="small" {...editForm.register("total_budget")} error={!!editForm.formState.errors.total_budget} helperText={editForm.formState.errors.total_budget?.message} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="Rate per 1M views" type="number" fullWidth size="small" {...editForm.register("rate_per_million_views")} error={!!editForm.formState.errors.rate_per_million_views} helperText={editForm.formState.errors.rate_per_million_views?.message} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="Max submissions/account" type="number" fullWidth size="small" {...editForm.register("max_submissions_per_account")} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="Max earnings/creator" type="number" fullWidth size="small" {...editForm.register("max_earnings_per_creator")} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="Max earnings/post" type="number" fullWidth size="small" {...editForm.register("max_earnings_per_post")} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="Start date" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} {...editForm.register("start_date")} error={!!editForm.formState.errors.start_date} helperText={editForm.formState.errors.start_date?.message} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="End date" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} {...editForm.register("end_date")} error={!!editForm.formState.errors.end_date} helperText={editForm.formState.errors.end_date?.message} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField label="Logo drive link" fullWidth size="small" {...editForm.register("logo_drive_link")} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField label="Guidelines link" fullWidth size="small" {...editForm.register("guidelines_link")} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField label="Discord link" fullWidth size="small" {...editForm.register("discord_link")} />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Description" fullWidth size="small" multiline minRows={3} {...editForm.register("description")} />
              </Grid>
              {editSubmitError && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="error">
                    {editSubmitError}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setEditingCampaign(null)} disabled={updateMutation.isPending} sx={{ textTransform: "none", fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="admin-edit-campaign-form"
            variant="contained"
            disabled={updateMutation.isPending}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
          >
            {updateMutation.isPending ? "Saving…" : "Save changes"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog
        open={!!deleteCampaign}
        onClose={() => !deleteMutation.isPending && setDeleteCampaign(null)}
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Delete campaign</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            Are you sure you want to delete{" "}
            {deleteCampaign && (
              <Box component="span" fontWeight={700} color="text.primary">
                {deleteCampaign.title}
              </Box>
            )}
            ? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteCampaign(null)} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={onConfirmDelete} disabled={deleteMutation.isPending} sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}>
            {deleteMutation.isPending ? "Deleting…" : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
