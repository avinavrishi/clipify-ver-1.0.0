import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { createUnauthApiClient } from "../lib/apiClient";
import { API_BASE_URL } from "../lib/apiClient";
import type { User } from "../types/auth";

export interface RequestOtpRequest {
  email: string;
}

export interface RequestOtpResponse {
  message: string;
  expires_in_minutes: number;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface VerifyOtpResponse {
  registration_token: string;
  expires_in: number;
}

export interface CompleteRegistrationRequest {
  password: string;
}

export function useRequestOtp() {
  return useMutation({
    mutationFn: async (payload: RequestOtpRequest) => {
      const client = createUnauthApiClient();
      const { data } = await client.post<RequestOtpResponse>("/auth/register/request-otp", payload);
      return data;
    },
  });
}

export function useVerifyOtp() {
  return useMutation({
    mutationFn: async (payload: VerifyOtpRequest) => {
      const client = createUnauthApiClient();
      const { data } = await client.post<VerifyOtpResponse>("/auth/register/verify-otp", payload);
      return data;
    },
  });
}

export function useResendOtp() {
  return useMutation({
    mutationFn: async (payload: { email: string }) => {
      const client = createUnauthApiClient();
      const { data } = await client.post<RequestOtpResponse>("/auth/register/resend-otp", payload);
      return data;
    },
  });
}

export function useCompleteRegistration(registrationToken: string | null) {
  return useMutation({
    mutationFn: async (payload: CompleteRegistrationRequest) => {
      const client = axios.create({
        baseURL: API_BASE_URL,
        headers: registrationToken
          ? { Authorization: `Bearer ${registrationToken}` }
          : {},
      });
      const { data } = await client.post<User>("/auth/register/complete", {
        password: payload.password,
      });
      return data;
    },
  });
}
