"use client";

import React, { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../../../../../hooks/useAuth";
import {
  useAdminBrands,
  useUpsertAdminBrand,
} from "../../../../../queries/admin";
import { AdminBrand } from "../../../../../types/admin";

const BrandSchema = z.object({
  id: z.string().optional(),
  user_id: z.string().optional(),
  company_name: z.string().min(2, "At least 2 characters"),
  industry: z.string().optional(),
  website: z.string().url("Enter a valid URL").optional().or(z.literal("")),
});

type BrandFormValues = z.infer<typeof BrandSchema>;

export default function AdminBrandsPage() {
  const { accessToken } = useAuth();
  const { data } = useAdminBrands(accessToken);
  const upsertMutation = useUpsertAdminBrand(accessToken);

  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BrandFormValues>({
    resolver: zodResolver(BrandSchema),
  });

  const openForCreate = () => {
    reset({});
    setOpen(true);
  };

  const openForEdit = (brand: AdminBrand) => {
    reset({
      id: brand.id,
      company_name: brand.company_name,
      industry: brand.industry,
      website: brand.website ?? "",
    });
    setOpen(true);
  };

  const onSubmit = (values: BrandFormValues) => {
    const payload = {
      ...values,
      website: values.website || undefined,
    };
    upsertMutation.mutate(payload, {
      onSuccess: () => {
        setOpen(false);
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
          onClick={openForCreate}
          sx={{
            backgroundColor: "primary.main",
            "&:hover": { backgroundColor: "primary.dark" },
          }}
        >
          Create brand
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Company</TableCell>
              <TableCell>Industry</TableCell>
              <TableCell>Website</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.map((b) => (
              <TableRow key={b.id} hover>
                <TableCell>{b.company_name}</TableCell>
                <TableCell>{b.industry}</TableCell>
                <TableCell>{b.website}</TableCell>
                <TableCell align="right">
                  <Button size="small" onClick={() => openForEdit(b)}>
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Brand</DialogTitle>
        <DialogContent>
          <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}
          >
            <TextField
              label="Company name"
              fullWidth
              {...register("company_name")}
              error={!!errors.company_name}
              helperText={errors.company_name?.message}
            />
            <TextField
              label="Industry"
              fullWidth
              {...register("industry")}
              error={!!errors.industry}
              helperText={errors.industry?.message}
            />
            <TextField
              label="Website"
              fullWidth
              {...register("website")}
              error={!!errors.website}
              helperText={errors.website?.message}
            />
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 2 }}>
              <Button onClick={() => setOpen(false)}>Cancel</Button>
              <Button
                type="submit"
                variant="contained"
                disabled={upsertMutation.isPending}
                sx={{
                  backgroundColor: "primary.main",
                  "&:hover": { backgroundColor: "primary.dark" },
                }}
              >
                {upsertMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
