import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getApiClient } from "../lib/apiClient";
import { Submission, SubmissionCreateRequest, SubmitLinkRequest, SubmitLinkResponse } from "../types/submission";

export function useMySubmissions(
  accessToken: string | null,
  options?: {
    campaignId?: string;
    statusFilter?: "PENDING" | "APPROVED" | "REJECTED";
    skip?: number;
    limit?: number;
  }
) {
  return useQuery<Submission[]>({
    queryKey: ["submissions", "my", options],
    enabled: !!accessToken,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.campaignId) {
        params.append("campaign_id", options.campaignId);
      }
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
      const url = `/creator/submissions/my${queryString ? `?${queryString}` : ""}`;
      const { data } = await getApiClient().get<Submission[]>(url);
      return data;
    },
  });
}

export function useSubmission(accessToken: string | null, submissionId?: string) {
  return useQuery<Submission>({
    queryKey: ["submissions", submissionId],
    enabled: !!accessToken && !!submissionId,
    queryFn: async () => {
      const { data } = await getApiClient().get<Submission>(
        `/creator/submissions/${submissionId}`
      );
      return data;
    },
  });
}

export function useCampaignSubmissions(
  accessToken: string | null,
  campaignId?: string,
  options?: {
    skip?: number;
    limit?: number;
  }
) {
  return useQuery<Submission[]>({
    queryKey: ["submissions", "campaign", campaignId, options],
    enabled: !!accessToken && !!campaignId,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.skip !== undefined) {
        params.append("skip", options.skip.toString());
      }
      if (options?.limit !== undefined) {
        params.append("limit", options.limit.toString());
      }
      const queryString = params.toString();
      const url = `/creator/campaigns/${campaignId}/submissions${queryString ? `?${queryString}` : ""}`;
      const { data } = await getApiClient().get<Submission[]>(url);
      return data;
    },
  });
}

export function useSubmitContent(accessToken: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: SubmissionCreateRequest) => {
      const { data } = await getApiClient().post<Submission>("/creator/submissions", payload);
      return data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["submissions"] });
      qc.invalidateQueries({ queryKey: ["participations"] });
      qc.invalidateQueries({ queryKey: ["campaigns", variables.campaign_id] });
    },
  });
}

/** Faceless creators: POST /creator/submit-link */
export function useSubmitLink(accessToken: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: SubmitLinkRequest) => {
      const { data } = await getApiClient().post<SubmitLinkResponse>("/creator/submit-link", payload);
      return data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["submissions"] });
      qc.invalidateQueries({ queryKey: ["participations"] });
      qc.invalidateQueries({ queryKey: ["campaigns", variables.campaign_id] });
    },
  });
}
