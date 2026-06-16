import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getApiClient } from "../lib/apiClient";
import type { Notification, UnreadCountResponse } from "../types/notification";
import type { NotificationType } from "../types/notification";

export function useNotifications(
  accessToken: string | null,
  options?: {
    skip?: number;
    limit?: number;
    unread_only?: boolean;
    type_filter?: NotificationType;
  }
) {
  return useQuery<Notification[]>({
    queryKey: ["notifications", options],
    enabled: !!accessToken,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.skip != null) params.append("skip", String(options.skip));
      if (options?.limit != null) params.append("limit", String(options.limit));
      if (options?.unread_only != null) params.append("unread_only", String(options.unread_only));
      if (options?.type_filter) params.append("type_filter", options.type_filter);
      const queryString = params.toString();
      const url = `/notifications${queryString ? `?${queryString}` : ""}`;
      const { data } = await getApiClient().get<Notification[]>(url);
      return data;
    },
  });
}

export function useUnreadCount(accessToken: string | null) {
  return useQuery<UnreadCountResponse>({
    queryKey: ["notifications", "unread-count"],
    enabled: !!accessToken,
    queryFn: async () => {
      const { data } = await getApiClient().get<UnreadCountResponse>("/notifications/unread-count");
      return data;
    },
    refetchInterval: 30000, // poll every 30 seconds
  });
}

export function useNotification(accessToken: string | null, notificationId?: string) {
  return useQuery<Notification>({
    queryKey: ["notifications", notificationId],
    enabled: !!accessToken && !!notificationId,
    queryFn: async () => {
      const { data } = await getApiClient().get<Notification>(
        `/notifications/${notificationId}`
      );
      return data;
    },
  });
}

export function useMarkNotificationRead(accessToken: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId: string) => {
      await getApiClient().post(`/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead(accessToken: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await getApiClient().post("/notifications/mark-all-read");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useDeleteNotification(accessToken: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId: string) => {
      await getApiClient().delete(`/notifications/${notificationId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
