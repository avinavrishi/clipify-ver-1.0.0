"use client";

import React, { PropsWithChildren } from "react";
import {
  QueryClient,
  QueryClientProvider as RQProvider
} from "@tanstack/react-query";

const makeQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60,
        refetchOnWindowFocus: false
      }
    }
  });

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    return makeQueryClient();
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}

export function QueryClientProvider({ children }: PropsWithChildren) {
  const queryClient = getQueryClient();
  return <RQProvider client={queryClient}>{children}</RQProvider>;
}

