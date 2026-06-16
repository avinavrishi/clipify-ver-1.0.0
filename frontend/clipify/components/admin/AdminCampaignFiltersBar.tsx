"use client";

import React from "react";
import {
  Box,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";

export type AdminCampaignFilters = {
  search: string;
  status: "ALL" | "ACTIVE" | "PAUSED" | "COMPLETED";
  category: string;
  creatorTarget: "ALL" | "FACE" | "FACELESS";
  dateFrom: string;
  dateTo: string;
};

const defaultFilters: AdminCampaignFilters = {
  search: "",
  status: "ALL",
  category: "ALL",
  creatorTarget: "ALL",
  dateFrom: "",
  dateTo: "",
};

export type AdminCampaignFiltersBarProps = {
  value: AdminCampaignFilters;
  onChange: (next: AdminCampaignFilters) => void;
  categories: string[];
};

export function AdminCampaignFiltersBar({ value, onChange, categories }: AdminCampaignFiltersBarProps) {
  const patch = (partial: Partial<AdminCampaignFilters>) => onChange({ ...value, ...partial });

  const onStatus = (e: SelectChangeEvent) =>
    patch({ status: e.target.value as AdminCampaignFilters["status"] });
  const onCategory = (e: SelectChangeEvent) => patch({ category: e.target.value });
  const onTarget = (e: SelectChangeEvent) =>
    patch({ creatorTarget: e.target.value as AdminCampaignFilters["creatorTarget"] });

  const hasActiveFilters =
    value.search.trim() !== "" ||
    value.status !== "ALL" ||
    value.category !== "ALL" ||
    value.creatorTarget !== "ALL" ||
    value.dateFrom !== "" ||
    value.dateTo !== "";

  return (
    <Box
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 8,
        py: 2,
        mb: 1,
        mx: { xs: -1, sm: 0 },
        px: { xs: 1, sm: 0 },
        bgcolor: (theme) =>
          theme.palette.mode === "dark" ? "rgba(18,18,18,0.72)" : "rgba(255,255,255,0.72)",
        backdropFilter: "blur(14px)",
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          mb: 1.5,
          color: "text.secondary",
        }}
      >
        <FilterListRoundedIcon sx={{ fontSize: 20 }} />
        <Typography variant="subtitle2" fontWeight={700} letterSpacing="-0.01em">
          Filter & search
        </Typography>
        {hasActiveFilters && (
          <Typography variant="caption" color="primary.main" sx={{ ml: 0.5, fontWeight: 600 }}>
            Active
          </Typography>
        )}
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            md: "repeat(3, minmax(0, 1fr))",
            lg: "minmax(200px, 1.6fr) repeat(5, minmax(0, 1fr))",
          },
          gap: 1.5,
          alignItems: "flex-start",
        }}
      >
        <TextField
          size="small"
          placeholder="Search by name or description…"
          value={value.search}
          onChange={(e) => patch({ search: e.target.value })}
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon sx={{ color: "text.disabled", fontSize: 22 }} />
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": { borderRadius: 2 },
            gridColumn: { xs: "1 / -1", sm: "1 / -1", md: "1 / -1", lg: "auto" },
          }}
        />

        <FormControl size="small" fullWidth sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}>
          <InputLabel id="admin-camp-status">Status</InputLabel>
          <Select labelId="admin-camp-status" label="Status" value={value.status} onChange={onStatus}>
            <MenuItem value="ALL">All statuses</MenuItem>
            <MenuItem value="ACTIVE">Active</MenuItem>
            <MenuItem value="PAUSED">Paused</MenuItem>
            <MenuItem value="COMPLETED">Completed</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" fullWidth sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}>
          <InputLabel id="admin-camp-cat">Category</InputLabel>
          <Select labelId="admin-camp-cat" label="Category" value={value.category} onChange={onCategory}>
            <MenuItem value="ALL">All categories</MenuItem>
            {categories.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" fullWidth sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}>
          <InputLabel id="admin-camp-target">Creator target</InputLabel>
          <Select labelId="admin-camp-target" label="Creator target" value={value.creatorTarget} onChange={onTarget}>
            <MenuItem value="ALL">All types</MenuItem>
            <MenuItem value="FACE">Face creators</MenuItem>
            <MenuItem value="FACELESS">Faceless creators</MenuItem>
          </Select>
        </FormControl>

        <TextField
          size="small"
          label="Starts on or after"
          type="date"
          value={value.dateFrom}
          onChange={(e) => patch({ dateFrom: e.target.value })}
          fullWidth
          InputLabelProps={{ shrink: true }}
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
        />

        <TextField
          size="small"
          label="Ends on or before"
          type="date"
          value={value.dateTo}
          onChange={(e) => patch({ dateTo: e.target.value })}
          fullWidth
          InputLabelProps={{ shrink: true }}
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
        />
      </Box>
    </Box>
  );
}

export { defaultFilters };
