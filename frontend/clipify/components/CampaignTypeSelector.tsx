"use client";

import React from "react";
import { Box, FormHelperText, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import type { CampaignType } from "../types/campaign";

type Props = {
  value: CampaignType;
  onChange: (next: CampaignType) => void;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
};

/** Face (0) = apply → approve; Faceless (1) = submit link */
export function CampaignTypeSelector({ value, onChange, error, helperText, disabled }: Props) {
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
        Who is this campaign for?
      </Typography>
      <ToggleButtonGroup
        exclusive
        fullWidth
        value={value}
        disabled={disabled}
        onChange={(_, v: CampaignType | null) => v !== null && onChange(v)}
        aria-label="Campaign creator type"
        sx={{
          mb: 0.5,
          "& .MuiToggleButton-root": { py: 1.25, textTransform: "none", fontWeight: 600 },
        }}
      >
        <ToggleButton value={0} aria-label="Face creators">
          Face creators
        </ToggleButton>
        <ToggleButton value={1} aria-label="Faceless creators">
          Faceless creators
        </ToggleButton>
      </ToggleButtonGroup>
      <FormHelperText error={!!error} sx={{ mx: 0 }}>
        Face campaigns: creators apply and get approved before posting. Faceless campaigns: creators submit content links
        directly (no apply step).
      </FormHelperText>
      {helperText && (
        <FormHelperText error={!!error} sx={{ mx: 0 }}>
          {helperText}
        </FormHelperText>
      )}
    </Box>
  );
}
