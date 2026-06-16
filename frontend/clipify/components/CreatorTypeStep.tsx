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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { useSetCreatorType } from "../queries/profile";
import { useAuth } from "../hooks/useAuth";
import type { CreatorType } from "../types/profile";

const FaceCreatorFormSchema = z.object({
  name: z.string().optional(),
  category: z.string().optional(),
  reel_price: z.coerce.number().min(0).optional(),
  story_price: z.coerce.number().min(0).optional(),
  reel_story_price: z.coerce.number().min(0).optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  language: z.string().optional(),
});

type FaceCreatorFormValues = z.infer<typeof FaceCreatorFormSchema>;

export function CreatorTypeStep() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const setCreatorTypeMutation = useSetCreatorType(accessToken);
  const [error, setError] = useState<string | null>(null);
  const [showFaceForm, setShowFaceForm] = useState(false);

  const faceForm = useForm<FaceCreatorFormValues>({
    resolver: zodResolver(FaceCreatorFormSchema),
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

  const handleChoose = (type: CreatorType) => {
    setError(null);
    if (type === "FACELESS") {
      setCreatorTypeMutation.mutate(
        { creator_type: "FACELESS" },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
            queryClient.invalidateQueries({ queryKey: ["profile", "me", "creator-type"] });
          },
          onError: (err: unknown) => {
            const e = err as { response?: { data?: { detail?: string }; status?: number } };
            const msg = e.response?.data?.detail;
            if (e.response?.status === 400 && typeof msg === "string" && msg.includes("already set")) {
              queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
              return;
            }
            setError(typeof msg === "string" ? msg : "Failed to save.");
          },
        }
      );
    } else {
      setShowFaceForm(true);
    }
  };

  const handleFaceSubmit = (values: FaceCreatorFormValues) => {
    setError(null);
    setCreatorTypeMutation.mutate(
      {
        creator_type: "FACE",
        name: values.name || undefined,
        category: values.category || undefined,
        reel_price: values.reel_price,
        story_price: values.story_price,
        reel_story_price: values.reel_story_price,
        state: values.state || undefined,
        city: values.city || undefined,
        language: values.language || undefined,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
          queryClient.invalidateQueries({ queryKey: ["profile", "me", "creator-type"] });
        },
        onError: (err: unknown) => {
          const e = err as { response?: { data?: { detail?: string }; status?: number } };
          const msg = e.response?.data?.detail;
          if (e.response?.status === 400 && typeof msg === "string" && msg.includes("already set")) {
            queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
            return;
          }
          setError(typeof msg === "string" ? msg : "Failed to save.");
        },
      }
    );
  };

  const inputSx = { "& .MuiOutlinedInput-root": { borderRadius: 2 } };

  return (
    <>
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          py: { xs: 3, sm: 4 },
          px: 2,
        }}
      >
        <Card
          sx={{
            maxWidth: 440,
            width: "100%",
            borderRadius: 3,
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.04)",
            overflow: "hidden",
          }}
        >
          <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
            <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
              Are you a face or faceless creator?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              This helps us tailor your experience.
            </Typography>
            {error && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                {error}
              </Alert>
            )}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 2,
              }}
            >
              <Card
                component="button"
                type="button"
                onClick={() => handleChoose("FACE")}
                sx={{
                  cursor: "pointer",
                  borderRadius: 2,
                  border: "1px solid rgba(255,255,255,0.1)",
                  bgcolor: "rgba(255,255,255,0.04)",
                  textAlign: "center",
                  py: { xs: 2.5, sm: 3 },
                  px: 2,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    borderColor: "primary.main",
                    bgcolor: "rgba(155, 171, 44, 0.12)",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
                  },
                  "&:focus": { outline: "none" },
                }}
              >
                <Typography variant="subtitle1" fontWeight={600}>
                  Face creator
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                  You appear on camera
                </Typography>
              </Card>
              <Card
                component="button"
                type="button"
                onClick={() => handleChoose("FACELESS")}
                sx={{
                  cursor: "pointer",
                  borderRadius: 2,
                  border: "1px solid rgba(255,255,255,0.1)",
                  bgcolor: "rgba(255,255,255,0.04)",
                  textAlign: "center",
                  py: { xs: 2.5, sm: 3 },
                  px: 2,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    borderColor: "primary.main",
                    bgcolor: "rgba(155, 171, 44, 0.12)",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
                  },
                  "&:focus": { outline: "none" },
                }}
              >
                <Typography variant="subtitle1" fontWeight={600}>
                  Faceless creator
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                  You don&apos;t appear on camera
                </Typography>
              </Card>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Face creator details modal */}
      <Dialog
        open={showFaceForm}
        onClose={() => { setShowFaceForm(false); setError(null); }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 24px 48px rgba(0,0,0,0.4)",
            maxHeight: "90vh",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 0 }}>
          Face creator details
        </DialogTitle>
        <DialogContent sx={{ pt: 1.5 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Tell us a bit about yourself. You can update these later from your profile.
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}
          <Box
            component="form"
            id="face-creator-form"
            onSubmit={faceForm.handleSubmit(handleFaceSubmit)}
            sx={{ pt: 0 }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Name"
                  fullWidth
                  size="small"
                  {...faceForm.register("name")}
                  sx={inputSx}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Category"
                  fullWidth
                  size="small"
                  {...faceForm.register("category")}
                  sx={inputSx}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Reel price (USD)"
                  type="number"
                  fullWidth
                  size="small"
                  {...faceForm.register("reel_price")}
                  inputProps={{ min: 0, step: 0.01 }}
                  sx={inputSx}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Story price (USD)"
                  type="number"
                  fullWidth
                  size="small"
                  {...faceForm.register("story_price")}
                  inputProps={{ min: 0, step: 0.01 }}
                  sx={inputSx}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Reel + Story price (USD)"
                  type="number"
                  fullWidth
                  size="small"
                  {...faceForm.register("reel_story_price")}
                  inputProps={{ min: 0, step: 0.01 }}
                  sx={inputSx}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="State"
                  fullWidth
                  size="small"
                  {...faceForm.register("state")}
                  sx={inputSx}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="City"
                  fullWidth
                  size="small"
                  {...faceForm.register("city")}
                  sx={inputSx}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Language"
                  fullWidth
                  size="small"
                  {...faceForm.register("language")}
                  sx={inputSx}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 0, flexWrap: "wrap", gap: 1 }}>
          <Button
            type="button"
            variant="outlined"
            onClick={() => { setShowFaceForm(false); setError(null); }}
            sx={{ borderRadius: 2, textTransform: "none" }}
          >
            Back
          </Button>
          <Button
            type="submit"
            form="face-creator-form"
            variant="contained"
            disabled={setCreatorTypeMutation.isPending}
            sx={{ borderRadius: 2, fontWeight: 600, textTransform: "none", minWidth: 100 }}
          >
            {setCreatorTypeMutation.isPending ? "Saving…" : "Continue"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
