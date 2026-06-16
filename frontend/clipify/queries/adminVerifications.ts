import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getApiClient } from "../lib/apiClient";
import { SocialAccount } from "../types/socialAccount";

export interface AdminVerification {
  id: string;
  verification_id: string;
  creator_id: string;
  platform: string;
  username: string;
  verification_code: string;
  status: string;
  expires_at: string;
  created_at: string;
  completed_at?: string | null;
}

export function usePendingVerifications(accessToken: string | null) {
  return useQuery<AdminVerification[]>({
    queryKey: ["admin", "verifications", "pending"],
    enabled: !!accessToken,
    queryFn: async () => {
      const { data } = await getApiClient().get<AdminVerification[]>(
        "/admin/social/verifications/pending"
      );
      return data;
    },
  });
}

export function useApproveVerification(accessToken: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (verificationId: string) => {
      const { data } = await getApiClient().post<SocialAccount>(
        `/admin/social/verifications/${verificationId}/approve`
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "verifications"] });
      qc.invalidateQueries({ queryKey: ["social-accounts"] });
    },
  });
}

export function useRejectVerification(accessToken: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (verificationId: string) => {
      await getApiClient().post(`/admin/social/verifications/${verificationId}/reject`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "verifications"] });
    },
  });
}
