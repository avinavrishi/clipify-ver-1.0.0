import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getApiClient } from "../lib/apiClient";
import {
  VerificationInitiateRequest,
  VerificationInitiateResponse,
  VerificationCompleteRequest,
  VerificationStatusResponse,
  VerificationStatus,
} from "../types/socialAccount";

export function useInitiateVerification(accessToken: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: VerificationInitiateRequest) => {
      const { data } = await getApiClient().post<VerificationInitiateResponse>(
        "/creator/social/accounts/verify/initiate",
        payload
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["verifications"] });
    },
  });
}

export function useCompleteVerification(accessToken: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: VerificationCompleteRequest) => {
      const { data } = await getApiClient().post<VerificationStatusResponse>(
        "/creator/social/accounts/verify/complete",
        payload
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["verifications"] });
      qc.invalidateQueries({ queryKey: ["social-accounts"] });
    },
  });
}

export function useVerificationStatus(accessToken: string | null, verificationId?: string) {
  return useQuery<VerificationStatusResponse>({
    queryKey: ["verifications", verificationId],
    enabled: !!accessToken && !!verificationId,
    queryFn: async () => {
      const { data } = await getApiClient().get<VerificationStatusResponse>(
        `/creator/social/accounts/verify/status/${verificationId}`
      );
      return data;
    },
    refetchInterval: (query) => {
      const data = query.state.data;
      const terminal = ["VERIFIED", "REJECTED", "EXPIRED", "FAILED", "ERROR"];
      if (data?.status && terminal.includes(data.status)) return false;
      // Poll every 5 seconds while status is pending (worker is verifying)
      return 5000;
    },
  });
}

export function useMyVerifications(
  accessToken: string | null,
  options?: {
    status_filter?: VerificationStatus;
  }
) {
  return useQuery<VerificationStatusResponse[]>({
    queryKey: ["verifications", "my", options],
    enabled: !!accessToken,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.status_filter) {
        params.append("status_filter", options.status_filter);
      }
      const queryString = params.toString();
      const url = `/creator/social/accounts/verify/my${queryString ? `?${queryString}` : ""}`;
      const { data } = await getApiClient().get<VerificationStatusResponse[]>(url);
      return data;
    },
  });
}
