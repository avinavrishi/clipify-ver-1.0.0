import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getApiClient } from "../lib/apiClient";
import {
  Profile,
  ProfileUpsertRequest,
  CreatorTypeResponse,
  CreatorTypePatchRequest,
  CreatorFaceDetailsPatchRequest,
} from "../types/profile";

export function useProfile(accessToken: string | null) {
  return useQuery<Profile>({
    queryKey: ["profile", "me"],
    enabled: !!accessToken,
    queryFn: async () => {
      const { data } = await getApiClient().get<Profile>("/profiles/me");
      return data;
    },
  });
}

export function useUpsertProfile(accessToken: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ProfileUpsertRequest) => {
      const client = getApiClient();
      try {
        const { data } = await client.post<Profile>("/profiles/me", payload);
        return data;
      } catch (err: unknown) {
        const ax = err as { response?: { status?: number } };
        if (ax?.response?.status === 409 || ax?.response?.status === 400) {
          const { data } = await client.patch<Profile>("/profiles/me", payload);
          return data;
        }
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
    }
  });
}

export function useSetUsername(accessToken: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { username: string }) => {
      const { data } = await getApiClient().patch<{ username: string; message: string }>(
        "/profiles/me/username",
        payload
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });
}

export function useCreatorType(accessToken: string | null) {
  return useQuery<CreatorTypeResponse>({
    queryKey: ["profile", "me", "creator-type"],
    enabled: !!accessToken,
    queryFn: async () => {
      const { data } = await getApiClient().get<CreatorTypeResponse>("/profiles/me/creator-type");
      return data;
    },
  });
}

export function useSetCreatorType(accessToken: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreatorTypePatchRequest) => {
      const { data } = await getApiClient().patch<CreatorTypeResponse>(
        "/profiles/me/creator-type",
        payload
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
      queryClient.invalidateQueries({ queryKey: ["profile", "me", "creator-type"] });
    },
  });
}

export function useUpdateCreatorFaceDetails(accessToken: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreatorFaceDetailsPatchRequest) => {
      const { data } = await getApiClient().patch<Profile>(
        "/profiles/me/creator-face-details",
        payload
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
      queryClient.invalidateQueries({ queryKey: ["profile", "me", "creator-type"] });
    },
  });
}

