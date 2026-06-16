"use client";

import React from "react";
import {
  Card,
  CardContent,
  Grid,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";
import {
  Bar,
  BarChart,
  Legend,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
} from "recharts";
import PersonIcon from "@mui/icons-material/Person";
import BusinessIcon from "@mui/icons-material/Business";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import { useAuth } from "../../../hooks/useAuth";
import { useAdminKpis } from "../../../queries/admin";

const CHART_PALETTE = ["#a78bfa", "#c4b5fd", "#8b5cf6", "#7c3aed"];
const BAR_COLORS = ["#a78bfa", "#8b5cf6", "#7c3aed"];

function AdminDashboardContent() {
  const { accessToken } = useAuth();
  const { data, isLoading } = useAdminKpis(accessToken);

  if (isLoading || !data) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress sx={{ color: "primary.main" }} />
      </Box>
    );
  }

  const userRoleData = [
    { name: "Creators", value: data.total_creators },
    { name: "Brands", value: data.total_brands },
    { name: "Admins", value: data.total_admins },
  ];

  const campaignStatusData = [
    { name: "Active", value: data.active_campaigns },
    { name: "Paused", value: data.paused_campaigns },
    { name: "Completed", value: data.completed_campaigns },
  ];

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ border: "1px solid rgba(255,255,255,0.06)" }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" color="text.secondary">Total users</Typography>
              <Typography variant="h5" fontWeight={600}>{data.total_users}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ border: "1px solid rgba(255,255,255,0.06)" }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" color="text.secondary">Total campaigns</Typography>
              <Typography variant="h5" fontWeight={600}>{data.total_campaigns}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ border: "1px solid rgba(255,255,255,0.06)" }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" color="text.secondary">Active campaigns</Typography>
              <Typography variant="h5" fontWeight={600}>{data.active_campaigns}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ border: "1px solid rgba(255,255,255,0.06)" }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" color="text.secondary">Total payouts</Typography>
              <Typography variant="h5" fontWeight={600}>${data.total_payout_amount.toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card sx={{ border: "1px solid rgba(255,255,255,0.06)" }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>User roles</Typography>
              <Box sx={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={userRoleData} dataKey="value" nameKey="name" outerRadius={72} label>
                      {userRoleData.map((_, i) => (
                        <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ border: "1px solid rgba(255,255,255,0.06)" }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Campaign status</Typography>
              <Box sx={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={campaignStatusData}>
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" name="Campaigns">
                      {campaignStatusData.map((_, i) => (
                        <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

function DefaultDashboardContent() {
  const { currentUser } = useAuth();
  const name = currentUser?.email?.split("@")[0] ?? "User";

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: "100%", border: "1px solid rgba(255,255,255,0.06)" }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: "rgba(167, 139, 250, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", mb: 1.5 }}>
                <PersonIcon sx={{ color: "primary.main", fontSize: 18 }} />
              </Box>
              <Typography variant="subtitle1" fontWeight={600}>Creators</Typography>
              <Typography variant="body2" color="text.secondary">Explore campaigns, submit content.</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: "100%", border: "1px solid rgba(255,255,255,0.06)" }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: "rgba(167, 139, 250, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", mb: 1.5 }}>
                <BusinessIcon sx={{ color: "primary.main", fontSize: 18 }} />
              </Box>
              <Typography variant="subtitle1" fontWeight={600}>Brands</Typography>
              <Typography variant="body2" color="text.secondary">Campaigns and submissions.</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: "100%", border: "1px solid rgba(255,255,255,0.06)" }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: "rgba(167, 139, 250, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", mb: 1.5 }}>
                <AdminPanelSettingsIcon sx={{ color: "primary.main", fontSize: 18 }} />
              </Box>
              <Typography variant="subtitle1" fontWeight={600}>Admins</Typography>
              <Typography variant="body2" color="text.secondary">Users, brands, KPIs.</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default function DashboardHome() {
  const { currentUser } = useAuth();

  if (currentUser?.role === "ADMIN") {
    return <AdminDashboardContent />;
  }

  return <DefaultDashboardContent />;
}
