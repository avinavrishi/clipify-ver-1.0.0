"use client";

import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import { useAuth } from "../../../../../hooks/useAuth";
import {
  usePendingParticipations,
  useUpdateParticipation,
} from "../../../../../queries/adminParticipations";
import type { AdminParticipation } from "../../../../../types/participation";
import NextLink from "next/link";
import Link from "@mui/material/Link";

export default function AdminParticipationsPage() {
  const { accessToken } = useAuth();
  const { data: participations, isLoading } = usePendingParticipations(accessToken, {
    limit: 100,
  });
  const updateMutation = useUpdateParticipation(accessToken);
  const [selectedParticipation, setSelectedParticipation] = useState<AdminParticipation | null>(null);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleApprove = (participation: AdminParticipation) => {
    setSelectedParticipation(participation);
    setAction("approve");
    setRejectionReason("");
  };

  const handleReject = (participation: AdminParticipation) => {
    setSelectedParticipation(participation);
    setAction("reject");
    setRejectionReason("");
  };

  const confirmAction = () => {
    if (!selectedParticipation) return;

    updateMutation.mutate(
      {
        participationId: selectedParticipation.participation_id,
        payload: {
          status: action === "approve" ? "APPROVED" : "REJECTED",
          reason: action === "reject" && rejectionReason ? rejectionReason : undefined,
        },
      },
      {
        onSuccess: () => {
          setSelectedParticipation(null);
          setAction(null);
          setRejectionReason("");
        },
      }
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Review and approve or reject campaign participation applications
        </Typography>
      </Box>

      {isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress sx={{ color: "primary.main" }} />
        </Box>
      )}

      {!isLoading && (!participations || participations.length === 0) && (
        <Card sx={{ border: "1px solid rgba(255, 255, 255, 0.08)", textAlign: "center", py: 6 }}>
          <CardContent>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
              No pending applications
            </Typography>
            <Typography variant="body2" color="text.secondary">
              All participation requests have been processed
            </Typography>
          </CardContent>
        </Card>
      )}

      {!isLoading && participations && participations.length > 0 && (
        <TableContainer component={Card} sx={{ border: "1px solid rgba(255, 255, 255, 0.08)" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Creator</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Campaign</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Applied</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {participations.map((participation) => (
                <TableRow key={participation.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {participation.creator_display_name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Link
                      component={NextLink}
                      href={`/dashboard/explore/${participation.campaign_id}`}
                      sx={{
                        color: "primary.main",
                        textDecoration: "none",
                        fontWeight: 500,
                        "&:hover": { textDecoration: "underline" },
                      }}
                    >
                      {participation.campaign_title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(participation.joined_at)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={participation.status}
                      size="small"
                      color={participation.status === "APPROVED" ? "success" : participation.status === "REJECTED" ? "error" : "warning"}
                      sx={{ textTransform: "capitalize" }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => handleApprove(participation)}
                        disabled={updateMutation.isPending}
                        sx={{ minWidth: 100 }}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        size="small"
                        startIcon={<CancelIcon />}
                        onClick={() => handleReject(participation)}
                        disabled={updateMutation.isPending}
                        sx={{ minWidth: 100 }}
                      >
                        Reject
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Confirmation Dialog */}
      <Dialog
        open={!!selectedParticipation && !!action}
        onClose={() => {
          setSelectedParticipation(null);
          setAction(null);
          setRejectionReason("");
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {action === "approve" ? "Approve Application?" : "Reject Application?"}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {action === "approve" ? (
              <>
                Approve <strong>{selectedParticipation?.creator_display_name}</strong>'s application for campaign{" "}
                <strong>"{selectedParticipation?.campaign_title}"</strong>? They will be able to submit content for this campaign.
              </>
            ) : (
              <>
                Reject <strong>{selectedParticipation?.creator_display_name}</strong>'s application for campaign{" "}
                <strong>"{selectedParticipation?.campaign_title}"</strong>?
              </>
            )}
          </Typography>
          {action === "reject" && (
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Rejection Reason (Optional)"
              placeholder="Provide a reason for rejection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              sx={{ mt: 2 }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setSelectedParticipation(null);
              setAction(null);
              setRejectionReason("");
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color={action === "approve" ? "success" : "error"}
            onClick={confirmAction}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? "Processing..." : action === "approve" ? "Approve" : "Reject"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
