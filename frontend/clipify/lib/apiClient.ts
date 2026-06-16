import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import type { RefreshResponse } from "../types/auth";

const baseURL =
  typeof window !== "undefined"
    ? `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/v1`
    : `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/v1`;

export const API_BASE_URL = baseURL;

export type AuthTokens = {
  accessToken: string | null;
  refreshToken: string | null;
};

type AuthRegistry = {
  getAuth: () => AuthTokens;
  setAuth: (tokens: AuthTokens) => void;
  onUnauthorized: () => void;
};

let authRegistry: AuthRegistry | null = null;

export function registerAuth(registry: AuthRegistry) {
  authRegistry = registry;
}

function getAuth(): AuthTokens {
  return authRegistry?.getAuth() ?? { accessToken: null, refreshToken: null };
}

function setAuth(tokens: AuthTokens) {
  authRegistry?.setAuth(tokens);
}

function onUnauthorized() {
  authRegistry?.onUnauthorized();
}

/** In-flight refresh promise so concurrent 401s share one refresh call */
let refreshPromise: Promise<AuthTokens> | null = null;

async function refreshTokens(): Promise<AuthTokens> {
  const { refreshToken } = getAuth();
  if (!refreshToken) {
    setAuth({ accessToken: null, refreshToken: null });
    onUnauthorized();
    throw new Error("No refresh token");
  }
  const client = axios.create({ baseURL });
  const { data } = await client.post<RefreshResponse>("/auth/refresh", {
    refresh_token: refreshToken,
  });
  const tokens: AuthTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  };
  setAuth(tokens);
  return tokens;
}

async function doRefresh(): Promise<AuthTokens> {
  if (!refreshPromise) {
    refreshPromise = refreshTokens().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

const apiClient = axios.create({ baseURL });

apiClient.interceptors.request.use((config) => {
  const { accessToken } = getAuth();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (err: AxiosError) => {
    const config = err.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    if (err.response?.status !== 401 || config._retry) {
      return Promise.reject(err);
    }
    const hadAuth = config.headers?.Authorization;
    if (!hadAuth) {
      return Promise.reject(err);
    }
    try {
      const tokens = await doRefresh();
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
      config._retry = true;
      return apiClient.request(config);
    } catch {
      setAuth({ accessToken: null, refreshToken: null });
      onUnauthorized();
      return Promise.reject(err);
    }
  }
);

export function getApiClient() {
  return apiClient;
}

/** For unauthenticated requests only (login, register). No token, no 401 retry. */
export function createUnauthApiClient() {
  return axios.create({
    baseURL,
  });
}
