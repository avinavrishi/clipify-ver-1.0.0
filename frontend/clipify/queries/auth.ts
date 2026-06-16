import { useMutation, useQuery } from "@tanstack/react-query";
import { createUnauthApiClient, getApiClient } from "../lib/apiClient";
import { LoginRequest, LoginResponse, User } from "../types/auth";

export function useLogin() {
  return useMutation({
    mutationFn: async (payload: LoginRequest) => {
      const client = createUnauthApiClient();
      const { data } = await client.post<LoginResponse>("/auth/login", payload);
      return data;
    },
  });
}

export function useMe(accessToken: string | null) {
  return useQuery<User>({
    queryKey: ["auth", "me"],
    enabled: !!accessToken,
    queryFn: async () => {
      const { data } = await getApiClient().get<User>("/auth/me");
      return data;
    },
  });
}

