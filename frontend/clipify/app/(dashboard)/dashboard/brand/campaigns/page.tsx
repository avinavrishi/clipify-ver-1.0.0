"use client";

import React, { useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useAuth } from "../../../../../hooks/useAuth";
import { useCampaigns, useCreateCampaign, useCampaignPlatforms } from "../../../../../queries/campaigns";
import { CampaignsTable } from "../../../../../components/CampaignsTable";
import { CampaignTypeSelector } from "../../../../../components/CampaignTypeSelector";

const CampaignFormSchema = z.object({
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

type CampaignFormValues = z.infer<typeof CampaignFormSchema>;

export default function BrandCampaignsPage() {
  const { accessToken } = useAuth();
  const { data } = useCampaigns(accessToken);
  const { data: platforms = [] } = useCampaignPlatforms(accessToken);
  const createMutation = useCreateCampaign(accessToken);
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CampaignFormValues>({
    resolver: zodResolver(CampaignFormSchema),
    defaultValues: {
      content_type: "VIDEO",
      platform_ids: [],
      campaign_type: 0,
    },
  });

  const selectedPlatformIds = watch("platform_ids") ?? [];

  const onSubmit = (values: CampaignFormValues) => {
    const payload = {
      ...values,
      logo_drive_link: values.logo_drive_link || undefined,
      guidelines_link: values.guidelines_link || undefined,
      discord_link: values.discord_link || undefined,
      platform_ids: values.platform_ids,
    };
    createMutation.mutate(payload, {
      onSuccess: () => {
        setOpen(false);
        reset({ content_type: "VIDEO", platform_ids: [], campaign_type: 0 });
      },
    });
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          flexWrap: "wrap",
          gap: 2,
          mb: 2,
        }}
      >
        <Button
          variant="contained"
          onClick={() => setOpen(true)}
          sx={{
            backgroundColor: "primary.main",
            "&:hover": { backgroundColor: "primary.dark" },
          }}
        >
          Create campaign
        </Button>
      </Box>
      <CampaignsTable
        campaigns={data ?? []}
        baseHref="/dashboard/brand/campaigns"
      />
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create campaign</DialogTitle>
        <DialogContent>
          <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            sx={{ py: 2 }}
          >
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
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Platforms for this campaign
                </Typography>
                <FormGroup row>
                  {platforms.map((p) => (
                    <FormControlLabel
                      key={p.id}
                      control={
                        <Checkbox
                          checked={selectedPlatformIds.includes(p.id)}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...selectedPlatformIds, p.id]
                              : selectedPlatformIds.filter((id) => id !== p.id);
                            setValue("platform_ids", next, { shouldValidate: true });
                          }}
                        />
                      }
                      label={p.name}
                    />
                  ))}
                </FormGroup>
                {errors.platform_ids && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, display: "block" }}>
                    {errors.platform_ids.message}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Title"
                  fullWidth
                  {...register("title")}
                  error={!!errors.title}
                  helperText={errors.title?.message}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Category"
                  fullWidth
                  {...register("category")}
                  error={!!errors.category}
                  helperText={errors.category?.message}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Content type (VIDEO/IMAGE)"
                  fullWidth
                  {...register("content_type")}
                  error={!!errors.content_type}
                  helperText={errors.content_type?.message}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Total budget"
                  type="number"
                  fullWidth
                  {...register("total_budget")}
                  error={!!errors.total_budget}
                  helperText={errors.total_budget?.message}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Rate per 1M views"
                  type="number"
                  fullWidth
                  {...register("rate_per_million_views")}
                  error={!!errors.rate_per_million_views}
                  helperText={errors.rate_per_million_views?.message}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Max submissions/account"
                  type="number"
                  fullWidth
                  {...register("max_submissions_per_account")}
                  error={!!errors.max_submissions_per_account}
                  helperText={errors.max_submissions_per_account?.message}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Max earnings/creator"
                  type="number"
                  fullWidth
                  {...register("max_earnings_per_creator")}
                  error={!!errors.max_earnings_per_creator}
                  helperText={errors.max_earnings_per_creator?.message}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Max earnings/post"
                  type="number"
                  fullWidth
                  {...register("max_earnings_per_post")}
                  error={!!errors.max_earnings_per_post}
                  helperText={errors.max_earnings_per_post?.message}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Start date"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  {...register("start_date")}
                  error={!!errors.start_date}
                  helperText={errors.start_date?.message}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="End date"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  {...register("end_date")}
                  error={!!errors.end_date}
                  helperText={errors.end_date?.message}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Logo drive link"
                  fullWidth
                  {...register("logo_drive_link")}
                  error={!!errors.logo_drive_link}
                  helperText={errors.logo_drive_link?.message}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Guidelines link"
                  fullWidth
                  {...register("guidelines_link")}
                  error={!!errors.guidelines_link}
                  helperText={errors.guidelines_link?.message}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Discord link"
                  fullWidth
                  {...register("discord_link")}
                  error={!!errors.discord_link}
                  helperText={errors.discord_link?.message}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Description"
                  fullWidth
                  multiline
                  minRows={3}
                  {...register("description")}
                  error={!!errors.description}
                  helperText={errors.description?.message}
                />
              </Grid>
            </Grid>
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, pt: 2 }}>
              <Button onClick={() => setOpen(false)}>Cancel</Button>
              <Button
                type="submit"
                variant="contained"
                disabled={createMutation.isPending}
                sx={{
                  backgroundColor: "primary.main",
                  "&:hover": { backgroundColor: "primary.dark" },
                }}
              >
                {createMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}

