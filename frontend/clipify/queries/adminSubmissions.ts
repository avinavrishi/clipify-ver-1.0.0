import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getApiClient } from "../lib/apiClient";
import { Submission, SubmissionUpdateRequest } from "../types/submission";

export function useCampaignSubmissionsAdmin(
  accessToken: string | null,
  campaignId?: string
) {
  return useQuery<Submission[]>({
    queryKey: ["admin", "submissions", "campaign", campaignId],
    enabled: !!accessToken && !!campaignId,
    queryFn: async () => {
      const { data } = await getApiClient().get<Submission[]>(
        `/admin/campaigns/${campaignId}/submissions`
      );
      return data;
    },
  });
}

export function useUpdateSubmission(accessToken: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      submissionId,
      payload,
    }: {
      submissionId: string;
      payload: SubmissionUpdateRequest;
    }) => {
      const { data } = await getApiClient().patch<{
        id: string;
        status: string;
        message: string;
      }>(`/admin/submissions/${submissionId}`, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "submissions"] });
      qc.invalidateQueries({ queryKey: ["submissions"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
