"use client";

import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  Divider,
  ListSubheader,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PaletteIcon from "@mui/icons-material/Palette";
import { useThemePreset } from "../providers/ThemeModeProvider";
import { THEME_PRESET_IDS, type ThemePresetId } from "../theme/presetIds";
import { PRESET_META } from "../theme/presetMetadata";

function ThemeSwatch({ accent, background }: { accent: string; background: string }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
      <Box
        sx={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          bgcolor: background,
          border: "1px solid",
          borderColor: "divider",
          boxShadow: "0 0 0 1px rgba(0,0,0,0.04) inset",
        }}
      />
      <Box
        sx={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          bgcolor: accent,
          border: "1px solid",
          borderColor: "divider",
        }}
      />
    </Box>
  );
}

export function ThemeSelect() {
  const { presetId, setPresetId } = useThemePreset();
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const open = Boolean(anchor);

  const { darkIds, lightIds } = useMemo(() => {
    const dark: ThemePresetId[] = [];
    const light: ThemePresetId[] = [];
    THEME_PRESET_IDS.forEach((id) => {
      if (PRESET_META[id].group === "dark") dark.push(id);
      else light.push(id);
    });
    return { darkIds: dark, lightIds: light };
  }, []);

  const currentLabel = PRESET_META[presetId].label;

  return (
    <>
      <Button
        id="theme-select-button"
        size="small"
        variant="outlined"
        onClick={(e) => setAnchor(e.currentTarget)}
        endIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />}
        startIcon={<PaletteIcon sx={{ fontSize: 18 }} />}
        aria-controls={open ? "theme-select-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        sx={{
          textTransform: "none",
          fontWeight: 600,
          borderRadius: 2,
          minWidth: 0,
          maxWidth: { xs: 160, sm: 220 },
          px: 1.25,
          borderColor: "divider",
          color: "text.primary",
          "&:hover": { borderColor: "text.secondary" },
        }}
      >
        <Typography variant="body2" noWrap component="span" sx={{ fontWeight: 600 }}>
          {currentLabel}
        </Typography>
      </Button>
      <Menu
        id="theme-select-menu"
        anchorEl={anchor}
        open={open}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 260,
            maxWidth: 320,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            boxShadow: (t) =>
              t.palette.mode === "dark"
                ? "0 12px 40px rgba(0,0,0,0.45)"
                : "0 12px 40px rgba(15,23,42,0.1)",
          },
        }}
        MenuListProps={{ dense: true, "aria-labelledby": "theme-select-button" }}
      >
        <ListSubheader
          disableSticky
          sx={{
            typography: "overline",
            fontWeight: 700,
            color: "text.secondary",
            lineHeight: 2.5,
            bgcolor: "transparent",
          }}
        >
          Dark themes
        </ListSubheader>
        {darkIds.map((id) => (
          <MenuItem
            key={id}
            selected={id === presetId}
            onClick={() => {
              setPresetId(id);
              setAnchor(null);
            }}
            sx={{ py: 1, gap: 1.5 }}
          >
            <ThemeSwatch accent={PRESET_META[id].accent} background={PRESET_META[id].background} />
            <Typography variant="body2" fontWeight={id === presetId ? 700 : 500}>
              {PRESET_META[id].label}
            </Typography>
          </MenuItem>
        ))}
        <Divider sx={{ my: 0.5 }} />
        <ListSubheader
          disableSticky
          sx={{
            typography: "overline",
            fontWeight: 700,
            color: "text.secondary",
            lineHeight: 2.5,
            bgcolor: "transparent",
          }}
        >
          Light themes
        </ListSubheader>
        {lightIds.map((id) => (
          <MenuItem
            key={id}
            selected={id === presetId}
            onClick={() => {
              setPresetId(id);
              setAnchor(null);
            }}
            sx={{ py: 1, gap: 1.5 }}
          >
            <ThemeSwatch accent={PRESET_META[id].accent} background={PRESET_META[id].background} />
            <Typography variant="body2" fontWeight={id === presetId ? 700 : 500}>
              {PRESET_META[id].label}
            </Typography>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
