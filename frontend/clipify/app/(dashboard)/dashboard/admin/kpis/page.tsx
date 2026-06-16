"use client";

import React from "react";
import { Card, CardContent, Grid, Typography, Box } from "@mui/material";
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
import { useAuth } from "../../../../../hooks/useAuth";
import { useAdminKpis } from "../../../../../queries/admin";

const BLUE_PALETTE = ["#2563eb", "#3b82f6", "#60a5fa", "#93c5fd"];
const BAR_COLORS = ["#2563eb", "#1e40af", "#1e3a8a"];

export default function AdminKpisPage() {
  const { accessToken } = useAuth();
  const { data } = useAdminKpis(accessToken);

  if (!data) {
    return (
      <Typography variant="body1" color="text.secondary">
        Loading KPIs...
      </Typography>
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
    <Box sx={{ mb: 4 }}>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Total users
              </Typography>
              <Typography variant="h5" fontWeight={600}>
                {data.total_users}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Total campaigns
              </Typography>
              <Typography variant="h5" fontWeight={600}>
                {data.total_campaigns}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Active campaigns
              </Typography>
              <Typography variant="h5" fontWeight={600}>
                {data.active_campaigns}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Total payouts
              </Typography>
              <Typography variant="h5" fontWeight={600}>
                ${data.total_payout_amount.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                User roles
              </Typography>
              <Box sx={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={userRoleData}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={80}
                      label
                    >
                      {userRoleData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={BLUE_PALETTE[index % BLUE_PALETTE.length]}
                        />
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
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                Campaign status
              </Typography>
              <Box sx={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={campaignStatusData}>
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" name="Campaigns">
                      {campaignStatusData.map((_, index) => (
                        <Cell
                          key={`bar-${index}`}
                          fill={BAR_COLORS[index % BAR_COLORS.length]}
                        />
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
