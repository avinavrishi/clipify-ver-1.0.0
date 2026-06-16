import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getApiClient } from "../lib/apiClient";
import { Participation, ParticipationCreateRequest } from "../types/participation";

export function useMyParticipations(
  accessToken: string | null,
  options?: {
    statusFilter?: "APPLIED" | "APPROVED" | "REJECTED";
    skip?: number;
    limit?: number;
  }
) {
  return useQuery<Participation[]>({
    queryKey: ["participations", "my", options],
    enabled: !!accessToken,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.statusFilter) {
        params.append("status_filter", options.statusFilter);
      }
      if (options?.skip !== undefined) {
        params.append("skip", options.skip.toString());
      }
      if (options?.limit !== undefined) {
        params.append("limit", options.limit.toString());
      }
      const queryString = params.toString();
      const url = `/creator/participations/my${queryString ? `?${queryString}` : ""}`;
      const { data } = await getApiClient().get<Participation[]>(url);
      return data;
    },
  });
}

export function useParticipation(accessToken: string | null, participationId?: string) {
  return useQuery<Participation>({
    queryKey: ["participations", participationId],
    enabled: !!accessToken && !!participationId,
    queryFn: async () => {
      const { data } = await getApiClient().get<Participation>(
        `/creator/participations/${participationId}`
      );
      return data;
    },
  });
}

export function useApplyToCampaign(accessToken: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ParticipationCreateRequest) => {
      const { data } = await getApiClient().post<Participation>(
        "/creator/participations",
        payload
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["participations"] });
      qc.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}

export function useParticipationByCampaign(accessToken: string | null, campaignId?: string) {
  return useQuery<Participation | null>({
    queryKey: ["participations", "by-campaign", campaignId],
    enabled: !!accessToken && !!campaignId,
    queryFn: async () => {
      try {
        const { data } = await getApiClient().get<Participation[]>(
          `/creator/participations/my`
        );
        return data.find((p) => p.campaign_id === campaignId) || null;
      } catch {
        return null;
      }
    },
  });
}
