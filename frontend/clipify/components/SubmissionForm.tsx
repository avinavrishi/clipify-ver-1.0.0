"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Link,
} from "@mui/material";
import NextLink from "next/link";
import { useSubmitContent } from "../queries/submissions";
import { useAuth } from "../hooks/useAuth";
import { useMySocialAccounts } from "../queries/socialAccounts";
import type { SocialAccount } from "../types/socialAccount";

const SubmissionSchema = z.object({
  social_account_id: z.string().min(1, "Please select a social account"),
  content_url: z.string().url("Enter a valid URL"),
  platform_content_id: z.string().optional(),
});

type SubmissionFormValues = z.infer<typeof SubmissionSchema>;

interface SubmissionFormProps {
  campaignId: string;
  onSuccess?: () => void;
}

export function SubmissionForm({ campaignId, onSuccess }: SubmissionFormProps) {
  const { accessToken } = useAuth();
  const { data: socialAccounts = [] } = useMySocialAccounts(accessToken);
  const submitMutation = useSubmitContent(accessToken);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SubmissionFormValues>({
    resolver: zodResolver(SubmissionSchema),
  });

  const onSubmit = (values: SubmissionFormValues) => {
    setError(null);
    submitMutation.mutate(
      {
        campaign_id: campaignId,
        social_account_id: values.social_account_id,
        content_url: values.content_url,
        platform_content_id: values.platform_content_id || undefined,
      },
      {
        onSuccess: () => {
          reset();
          onSuccess?.();
        },
        onError: (err: any) => {
          setError(err?.response?.data?.detail || "Failed to submit content");
        },
      }
    );
  };

  if (socialAccounts.length === 0) {
    return (
      <Card sx={{ border: "1px solid rgba(255, 255, 255, 0.08)" }}>
        <CardContent sx={{ p: 2.5 }}>
          <Alert severity="info" sx={{ borderRadius: 1.5, mb: 2 }}>
            You need to add a social account before submitting content.
          </Alert>
          <Button
            component={NextLink}
            href="/dashboard/account"
            variant="contained"
            sx={{ minWidth: 180 }}
          >
            Add Social Account
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ border: "1px solid rgba(255, 255, 255, 0.08)" }}>
      <CardContent sx={{ p: 2.5 }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
          Submit Content
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5 }}>
            {error}
          </Alert>
        )}
        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <FormControl fullWidth size="small" error={!!errors.social_account_id}>
            <InputLabel>Social Account</InputLabel>
            <Select
              label="Social Account"
              {...register("social_account_id")}
              defaultValue=""
            >
              {socialAccounts.map((account) => (
                <MenuItem key={account.id} value={account.id}>
                  @{account.username} ({account.platform})
                </MenuItem>
              ))}
            </Select>
            {errors.social_account_id && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                {errors.social_account_id.message}
              </Typography>
            )}
          </FormControl>
          <TextField
            label="Content URL"
            fullWidth
            size="small"
            placeholder="https://www.tiktok.com/@username/video/1234567890"
            {...register("content_url")}
            error={!!errors.content_url}
            helperText={errors.content_url?.message}
          />
          <TextField
            label="Platform Content ID (Optional)"
            fullWidth
            size="small"
            placeholder="1234567890"
            {...register("platform_content_id")}
            error={!!errors.platform_content_id}
            helperText={errors.platform_content_id?.message || "Platform-specific content ID if available"}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={submitMutation.isPending}
            sx={{ alignSelf: "flex-start", minWidth: 120 }}
          >
            {submitMutation.isPending ? "Submitting..." : "Submit"}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
