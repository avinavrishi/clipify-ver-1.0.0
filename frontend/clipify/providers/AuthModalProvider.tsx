"use client";

import React, { createContext, useCallback, useContext, useMemo } from "react";
import { useRouter } from "next/navigation";

/** Legacy type — registration variant on /auth */
export type RegisterType = "creator" | "brand";

type AuthModalContextValue = {
  /** Navigate to /auth (login tab) */
  openLogin: () => void;
  /** Navigate to /auth (creator signup) */
  openRegisterCreator: () => void;
  /** Navigate to /auth (brand signup) */
  openRegisterBrand: () => void;
};

const AuthModalContext = createContext<AuthModalContextValue | undefined>(undefined);

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const openLogin = useCallback(() => {
    router.push("/auth?tab=login");
  }, [router]);

  const openRegisterCreator = useCallback(() => {
    router.push("/auth?tab=creator");
  }, [router]);

  const openRegisterBrand = useCallback(() => {
    router.push("/auth?tab=brand");
  }, [router]);

  const value = useMemo(
    () => ({
      openLogin,
      openRegisterCreator,
      openRegisterBrand,
    }),
    [openLogin, openRegisterCreator, openRegisterBrand]
  );

  return <AuthModalContext.Provider value={value}>{children}</AuthModalContext.Provider>;
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error("useAuthModal must be used within AuthModalProvider");
  return ctx;
}
