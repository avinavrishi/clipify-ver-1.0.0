"use client";

import React from "react";
import {
  Box,
  IconButton,
  Paper,
  Table,
  TableContainer,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useAuth } from "../../../../../hooks/useAuth";
import {
  useAdminUsers,
  useDeleteAdminUser,
} from "../../../../../queries/admin";

export default function AdminUsersPage() {
  const { accessToken } = useAuth();
  const { data } = useAdminUsers(accessToken);
  const deleteMutation = useDeleteAdminUser(accessToken);

  return (
    <Box sx={{ mb: 4 }}>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.role}</TableCell>
                <TableCell>{u.status}</TableCell>
                <TableCell>
                  {new Date(u.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => deleteMutation.mutate(u.id)}
                    aria-label="Delete user"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
