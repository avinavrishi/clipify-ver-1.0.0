import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getApiClient } from "../lib/apiClient";
import {
  SocialAccount,
  SocialAccountUpdateRequest,
  SocialPlatform,
} from "../types/socialAccount";

export function useMySocialAccounts(
  accessToken: string | null,
  options?: {
    platform?: SocialPlatform;
  }
) {
  return useQuery<SocialAccount[]>({
    queryKey: ["social-accounts", "my", options],
    enabled: !!accessToken,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.platform) {
        params.append("platform", options.platform);
      }
      const queryString = params.toString();
      const url = `/creator/social/accounts${queryString ? `?${queryString}` : ""}`;
      const { data } = await getApiClient().get<SocialAccount[]>(url);
      return data;
    },
  });
}

export function useSocialAccount(accessToken: string | null, accountId?: string) {
  return useQuery<SocialAccount>({
    queryKey: ["social-accounts", accountId],
    enabled: !!accessToken && !!accountId,
    queryFn: async () => {
      const { data } = await getApiClient().get<SocialAccount>(
        `/creator/social/accounts/${accountId}`
      );
      return data;
    },
  });
}

export function useUpdateSocialAccount(accessToken: string | null, accountId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: SocialAccountUpdateRequest) => {
      const { data } = await getApiClient().put<SocialAccount>(
        `/creator/social/accounts/${accountId}`,
        payload
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["social-accounts"] });
    },
  });
}

export function useDeleteSocialAccount(accessToken: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (accountId: string) => {
      await getApiClient().delete(`/creator/social/accounts/${accountId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["social-accounts"] });
    },
  });
}
