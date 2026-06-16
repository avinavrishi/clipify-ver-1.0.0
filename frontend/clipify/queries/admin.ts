import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getApiClient } from "../lib/apiClient";
import { AdminBrand, AdminKpis, AdminUser } from "../types/admin";

export function useAdminUsers(accessToken: string | null) {
  return useQuery<AdminUser[]>({
    queryKey: ["admin", "users"],
    enabled: !!accessToken,
    queryFn: async () => {
      const { data } = await getApiClient().get<AdminUser[]>("/admin/users");
      return data;
    },
  });
}

export function useDeleteAdminUser(accessToken: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await getApiClient().delete(`/admin/users/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function useAdminBrands(accessToken: string | null) {
  return useQuery<AdminBrand[]>({
    queryKey: ["admin", "brands"],
    enabled: !!accessToken,
    queryFn: async () => {
      const { data } = await getApiClient().get<AdminBrand[]>("/admin/brands");
      return data;
    },
  });
}

export function useUpsertAdminBrand(accessToken: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<AdminBrand> & { user_id?: string }) => {
      const client = getApiClient();
      if (payload.id) {
        const { id, ...rest } = payload;
        const { data } = await client.patch<AdminBrand>(
          `/admin/brands/${id}`,
          rest
        );
        return data;
      }
      const { data } = await client.post<AdminBrand>("/admin/brands", payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "brands"] });
    },
  });
}

export function useAdminKpis(accessToken: string | null) {
  return useQuery<AdminKpis>({
    queryKey: ["admin", "kpis"],
    enabled: !!accessToken,
    queryFn: async () => {
      const { data } = await getApiClient().get<AdminKpis>("/admin/kpis");
      return data;
    },
  });
}

