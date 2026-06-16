import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getApiClient } from "../lib/apiClient";
import { AdminParticipation, ParticipationUpdateRequest } from "../types/participation";

export function usePendingParticipations(
  accessToken: string | null,
  options?: {
    skip?: number;
    limit?: number;
  }
) {
  return useQuery<AdminParticipation[]>({
    queryKey: ["admin", "participations", "pending", options],
    enabled: !!accessToken,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.skip !== undefined) {
        params.append("skip", String(options.skip));
      }
      if (options?.limit !== undefined) {
        params.append("limit", String(options.limit));
      }
      const queryString = params.toString();
      const url = `/admin/participations/pending${queryString ? `?${queryString}` : ""}`;
      const { data } = await getApiClient().get<AdminParticipation[]>(url);
      return data;
    },
  });
}

export function useCampaignParticipations(
  accessToken: string | null,
  campaignId?: string
) {
  return useQuery<AdminParticipation[]>({
    queryKey: ["admin", "participations", "campaign", campaignId],
    enabled: !!accessToken && !!campaignId,
    queryFn: async () => {
      const { data } = await getApiClient().get<AdminParticipation[]>(
        `/admin/campaigns/${campaignId}/participations`
      );
      return data;
    },
  });
}

export function useUpdateParticipation(accessToken: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      participationId,
      payload,
    }: {
      participationId: string;
      payload: ParticipationUpdateRequest;
    }) => {
      const { data } = await getApiClient().patch<{
        id: string;
        status: string;
        message: string;
      }>(`/admin/participations/${participationId}`, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "participations"] });
      qc.invalidateQueries({ queryKey: ["participations"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
