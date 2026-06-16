"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Fade,
  IconButton,
  InputAdornment,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AxiosError } from "axios";
import { useLogin } from "../../queries/auth";
import {
  useRequestOtp,
  useVerifyOtp,
  useResendOtp,
  useCompleteRegistration,
} from "../../queries/register";
import { useAuth } from "../../hooks/useAuth";
import { createUnauthApiClient, API_BASE_URL } from "../../lib/apiClient";
import { ThemeSelect } from "../ThemeSelect";

const LoginSchema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(6, "Min 6 characters"),
});

const CreatorEmailSchema = z.object({
  email: z.string().email("Enter a valid email"),
});

const CreatorOtpSchema = z.object({
  otp: z.string().length(6, "Enter the 6-digit code"),
});

const CreatorCompleteSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const BrandRegisterSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  company_name: z.string().min(2, "Company name must be at least 2 characters"),
  industry: z.string().optional(),
  website: z.string().url("Enter a valid URL").optional().or(z.literal("")),
});

type LoginFormValues = z.infer<typeof LoginSchema>;
type CreatorEmailValues = z.infer<typeof CreatorEmailSchema>;
type CreatorOtpValues = z.infer<typeof CreatorOtpSchema>;
type CreatorCompleteValues = z.infer<typeof CreatorCompleteSchema>;
type BrandRegisterValues = z.infer<typeof BrandRegisterSchema>;

type CreatorRegisterStep = "email" | "otp" | "complete";

export type AuthPanel = "login" | "creator" | "brand";

function parseTab(raw: string | null): AuthPanel {
  if (raw === "creator" || raw === "brand") return raw;
  return "login";
}

function GoogleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
      <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function TwitterIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path fill="#1DA1F2" d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.999-7.496 13.999-13.986 0-.21 0-.423-.015-.634A9.936 9.936 0 0024 4.59z" />
    </svg>
  );
}

function LabeledField({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ width: "100%" }}>
      <Typography
        component="label"
        htmlFor={id}
        variant="body2"
        sx={{ display: "block", mb: 0.75, fontWeight: 600, color: "text.primary", letterSpacing: "0.02em" }}
      >
        {label}
      </Typography>
      {children}
    </Box>
  );
}

export function AuthPageView() {
  const theme = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setTokens, currentUser } = useAuth();

  const tabParam = searchParams.get("tab");
  const panel = useMemo(() => parseTab(tabParam), [tabParam]);

  const setPanel = useCallback(
    (next: AuthPanel) => {
      const q = next === "login" ? "" : `?tab=${next}`;
      router.replace(`/auth${q}`, { scroll: false });
    },
    [router]
  );

  useEffect(() => {
    if (currentUser) router.replace("/dashboard");
  }, [currentUser, router]);

  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [redirectingAfterLogin, setRedirectingAfterLogin] = useState(false);
  const [creatorStep, setCreatorStep] = useState<CreatorRegisterStep>("email");
  const [registrationEmail, setRegistrationEmail] = useState("");
  const [registrationToken, setRegistrationToken] = useState<string | null>(null);
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(null);
  const [otpCountdown, setOtpCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (otpExpiresAt == null) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((otpExpiresAt - Date.now()) / 1000));
      setOtpCountdown(left);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [otpExpiresAt]);

  const loginMutation = useLogin();
  const requestOtpMutation = useRequestOtp();
  const verifyOtpMutation = useVerifyOtp();
  const resendOtpMutation = useResendOtp();
  const completeRegistrationMutation = useCompleteRegistration(registrationToken);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
  });

  const creatorEmailForm = useForm<CreatorEmailValues>({
    resolver: zodResolver(CreatorEmailSchema),
    defaultValues: { email: "" },
  });
  const creatorOtpForm = useForm<CreatorOtpValues>({
    resolver: zodResolver(CreatorOtpSchema),
    defaultValues: { otp: "" },
  });
  const creatorCompleteForm = useForm<CreatorCompleteValues>({
    resolver: zodResolver(CreatorCompleteSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const brandForm = useForm<BrandRegisterValues>({
    resolver: zodResolver(BrandRegisterSchema),
    defaultValues: { email: "", password: "", company_name: "", industry: "", website: "" },
  });

  useEffect(() => {
    setLoginError(null);
    setRegisterError(null);
    setCreatorStep("email");
    setRegistrationEmail("");
    setRegistrationToken(null);
    setOtpExpiresAt(null);
    setOtpCountdown(null);
    loginForm.reset();
    creatorEmailForm.reset();
    creatorOtpForm.reset();
    creatorCompleteForm.reset();
    brandForm.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset all forms when auth panel changes
  }, [panel]);

  const pillInputSx = useMemo(
    () => ({
      "& .MuiOutlinedInput-root": {
        borderRadius: 9999,
        minHeight: 52,
        backgroundColor: theme.palette.mode === "dark" ? "#2a2a2a" : alpha(theme.palette.grey[900], 0.06),
        transition: "box-shadow 0.2s ease, background-color 0.2s ease",
        "&:hover": { backgroundColor: theme.palette.mode === "dark" ? "#333333" : alpha(theme.palette.grey[900], 0.08) },
        "&.Mui-focused": {
          boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.45)}`,
          backgroundColor: theme.palette.mode === "dark" ? "#333333" : theme.palette.background.paper,
        },
      },
      "& .MuiOutlinedInput-input": {
        py: 1.5,
        px: 2,
        fontSize: "0.95rem",
      },
      "& .MuiFormHelperText-root": { mx: 1.5, mt: 0.75 },
    }),
    [theme]
  );

  const pillPrimaryBtn = {
    py: 1.75,
    borderRadius: 9999,
    fontWeight: 700,
    textTransform: "none" as const,
    fontSize: "1rem",
    boxShadow: "none",
  };

  const onLogin = (values: LoginFormValues) => {
    setLoginError(null);
    loginMutation.mutate(values, {
      onSuccess: (data) => {
        setTokens(data.access_token, data.refresh_token ?? null);
        setRedirectingAfterLogin(true);
        requestAnimationFrame(() => router.push("/dashboard"));
      },
      onError: (err) => {
        const e = err as AxiosError<{ detail?: string }>;
        const detail = e.response?.data?.detail;
        const msg =
          e.response?.status === 400 && typeof detail === "string" && detail.includes("Google sign-in")
            ? "This account uses Google sign-in. Please use Login with Google."
            : "Invalid credentials.";
        setLoginError(msg);
      },
    });
  };

  const loginWithGoogle = () => {
    window.location.href = `${API_BASE_URL}/auth/login/google`;
  };

  const onCreatorRequestOtp = (values: CreatorEmailValues) => {
    setRegisterError(null);
    requestOtpMutation.mutate(
      { email: values.email },
      {
        onSuccess: (data) => {
          setRegistrationEmail(values.email);
          setOtpExpiresAt(Date.now() + data.expires_in_minutes * 60 * 1000);
          setCreatorStep("otp");
          creatorOtpForm.reset({ otp: "" });
        },
        onError: (err) => {
          const e = err as AxiosError<{ detail?: string }>;
          const msg =
            e.response?.data?.detail ||
            (e.response?.status === 503
              ? "Failed to send OTP email. Check server SMTP configuration."
              : "Email already registered.");
          setRegisterError(typeof msg === "string" ? msg : "Request failed. Try again.");
        },
      }
    );
  };

  const onCreatorVerifyOtp = (values: CreatorOtpValues) => {
    setRegisterError(null);
    verifyOtpMutation.mutate(
      { email: registrationEmail, otp: values.otp },
      {
        onSuccess: (data) => {
          setRegistrationToken(data.registration_token);
          setCreatorStep("complete");
          creatorCompleteForm.reset({ password: "", confirmPassword: "" });
        },
        onError: (err) => {
          const e = err as AxiosError<{ detail?: string }>;
          const msg = e.response?.data?.detail ?? "Invalid OTP. Please try again.";
          setRegisterError(typeof msg === "string" ? msg : "Verification failed.");
        },
      }
    );
  };

  const onResendOtp = () => {
    setRegisterError(null);
    resendOtpMutation.mutate(
      { email: registrationEmail },
      {
        onSuccess: (data) => {
          setOtpExpiresAt(Date.now() + data.expires_in_minutes * 60 * 1000);
          creatorOtpForm.reset({ otp: "" });
        },
        onError: (err) => {
          const e = err as AxiosError<{ detail?: string }>;
          const msg =
            e.response?.data?.detail ||
            (e.response?.status === 503
              ? "Failed to send OTP email. Check server SMTP configuration."
              : "Email already registered.");
          setRegisterError(typeof msg === "string" ? msg : "Resend failed.");
        },
      }
    );
  };

  const onCreatorComplete = (values: CreatorCompleteValues) => {
    setRegisterError(null);
    completeRegistrationMutation.mutate(
      { password: values.password },
      {
        onSuccess: () => router.push("/auth?tab=login"),
        onError: (err) => {
          const e = err as AxiosError<{ detail?: string }>;
          const msg =
            e.response?.data?.detail ??
            (e.response?.status === 401
              ? "Invalid or expired registration token. Verify OTP again."
              : "Registration failed. Try again.");
          setRegisterError(typeof msg === "string" ? msg : "Complete failed.");
        },
      }
    );
  };

  const onBrandRegister = async (values: BrandRegisterValues) => {
    setRegisterError(null);
    try {
      const client = createUnauthApiClient();
      await client.post("/auth/register-brand", { ...values, website: values.website || undefined });
      router.push("/auth?tab=login");
    } catch {
      setRegisterError("Failed to register. Please try again.");
    }
  };

  const heading = panel === "login" ? "Welcome back!" : panel === "creator" ? "Create your account" : "Brand signup";
  const subheading =
    panel === "login"
      ? "Sign in to your account"
      : panel === "creator"
        ? "Join as a creator — verify email, then set a password."
        : "Register your company to launch campaigns.";

  return (
    <Box
      className="auth-stream-page"
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
        color: "text.primary",
        position: "relative",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: 16,
          left: 16,
          right: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 2,
        }}
      >
        <IconButton component={Link} href="/" aria-label="Back to home" size="small" sx={{ color: "text.secondary" }}>
          <ArrowBackIcon />
        </IconButton>
        <ThemeSelect />
      </Box>

      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          px: 2,
          py: { xs: 8, sm: 6 },
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 400, mx: "auto", textAlign: "center" }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 800,
              letterSpacing: "-0.04em",
              mb: 3,
              fontSize: { xs: "1.85rem", sm: "2.125rem" },
            }}
          >
            <Box component="span" sx={{ color: "text.primary" }}>
              CLIP
            </Box>
            <Box component="span" sx={{ color: "primary.main" }}>
              IFY
            </Box>
          </Typography>

          <Box sx={{ display: "flex", justifyContent: "center", gap: 0.5, mb: 3, flexWrap: "wrap" }}>
            {(["login", "creator", "brand"] as const).map((p) => (
              <Button
                key={p}
                onClick={() => setPanel(p)}
                variant="text"
                sx={{
                  textTransform: "none",
                  fontWeight: panel === p ? 700 : 500,
                  color: panel === p ? "primary.main" : "text.secondary",
                  minWidth: "auto",
                  px: 1.25,
                  borderRadius: 9999,
                }}
              >
                {p === "login" ? "Login" : p === "creator" ? "Creator" : "Brand"}
              </Button>
            ))}
          </Box>

          <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: "-0.02em", mb: 0.75 }}>
            {heading}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
            {subheading}
          </Typography>

          <Fade in timeout={280} key={`${panel}-${creatorStep}`}>
            <Box>
              {panel === "login" && (loginMutation.isPending || redirectingAfterLogin) && (
                <Box sx={{ py: 6 }}>
                  <CircularProgress size={44} sx={{ color: "primary.main", mb: 2 }} />
                  <Typography fontWeight={600}>{redirectingAfterLogin ? "Redirecting…" : "Signing in…"}</Typography>
                </Box>
              )}

              {panel === "login" && !loginMutation.isPending && !redirectingAfterLogin && (
                <>
                  {loginError && (
                    <Alert severity="error" sx={{ mb: 2, borderRadius: 2, textAlign: "left" }} role="alert">
                      {loginError}
                    </Alert>
                  )}
                  <Box component="form" onSubmit={loginForm.handleSubmit(onLogin)} sx={{ display: "flex", flexDirection: "column", gap: 2.5, textAlign: "left" }}>
                    <LabeledField id="login-email" label="Email">
                      <TextField
                        id="login-email"
                        fullWidth
                        hiddenLabel
                        autoComplete="email"
                        placeholder="Enter your email"
                        {...loginForm.register("email")}
                        error={!!loginForm.formState.errors.email}
                        helperText={loginForm.formState.errors.email?.message}
                        sx={pillInputSx}
                      />
                    </LabeledField>
                    <LabeledField id="login-password" label="Password">
                      <TextField
                        id="login-password"
                        fullWidth
                        hiddenLabel
                        autoComplete="current-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter password"
                        {...loginForm.register("password")}
                        error={!!loginForm.formState.errors.password}
                        helperText={loginForm.formState.errors.password?.message}
                        sx={pillInputSx}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end" sx={{ mr: 0.5 }}>
                              <IconButton
                                size="small"
                                edge="end"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                onClick={() => setShowPassword((v) => !v)}
                              >
                                {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </LabeledField>
                    <Box sx={{ textAlign: "right", mt: -1 }}>
                      <Typography
                        component="button"
                        type="button"
                        variant="body2"
                        sx={{ color: "primary.main", fontWeight: 600, border: "none", background: "none", cursor: "pointer" }}
                        onClick={() => {}}
                      >
                        Forgot Password
                      </Typography>
                    </Box>
                    <Button type="submit" variant="contained" color="primary" fullWidth disabled={loginMutation.isPending} sx={pillPrimaryBtn}>
                      Login
                    </Button>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, my: 3 }}>
                    <Box sx={{ flex: 1, height: 1, bgcolor: "divider" }} />
                    <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                      or login with
                    </Typography>
                    <Box sx={{ flex: 1, height: 1, bgcolor: "divider" }} />
                  </Box>

                  <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
                    <IconButton
                      onClick={loginWithGoogle}
                      aria-label="Continue with Google"
                      sx={{
                        width: 52,
                        height: 52,
                        bgcolor: theme.palette.mode === "dark" ? "#ffffff" : "#ffffff",
                        border: "1px solid",
                        borderColor: "divider",
                        "&:hover": { bgcolor: alpha("#fff", 0.92) },
                      }}
                    >
                      <GoogleIcon />
                    </IconButton>
                    <Tooltip title="Coming soon">
                      <span>
                        <IconButton
                          disabled
                          aria-label="Facebook (coming soon)"
                          sx={{
                            width: 52,
                            height: 52,
                            bgcolor: theme.palette.mode === "dark" ? alpha("#fff", 0.08) : alpha("#000", 0.04),
                            border: "1px solid",
                            borderColor: "divider",
                          }}
                        >
                          <FacebookIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Coming soon">
                      <span>
                        <IconButton
                          disabled
                          aria-label="Twitter (coming soon)"
                          sx={{
                            width: 52,
                            height: 52,
                            bgcolor: theme.palette.mode === "dark" ? alpha("#fff", 0.08) : alpha("#000", 0.04),
                            border: "1px solid",
                            borderColor: "divider",
                          }}
                        >
                          <TwitterIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>
                </>
              )}

              {panel === "creator" && (
                <Box sx={{ textAlign: "left" }}>
                  {registerError && (
                    <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} role="alert">
                      {registerError}
                    </Alert>
                  )}
                  {creatorStep === "email" && (
                    <Box component="form" onSubmit={creatorEmailForm.handleSubmit(onCreatorRequestOtp)} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                      <LabeledField id="cr-email" label="Email">
                        <TextField
                          id="cr-email"
                          type="email"
                          fullWidth
                          hiddenLabel
                          autoComplete="email"
                          placeholder="Enter your email"
                          {...creatorEmailForm.register("email")}
                          error={!!creatorEmailForm.formState.errors.email}
                          helperText={creatorEmailForm.formState.errors.email?.message}
                          sx={pillInputSx}
                        />
                      </LabeledField>
                      <Button type="submit" variant="contained" fullWidth disabled={requestOtpMutation.isPending} sx={pillPrimaryBtn}>
                        {requestOtpMutation.isPending ? "Sending…" : "Send verification code"}
                      </Button>
                    </Box>
                  )}
                  {creatorStep === "otp" && (
                    <Box component="form" onSubmit={creatorOtpForm.handleSubmit(onCreatorVerifyOtp)} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                      <Typography variant="body2" color="text.secondary">
                        Code sent to <strong>{registrationEmail}</strong>
                      </Typography>
                      <LabeledField id="cr-otp" label="Verification code">
                        <TextField
                          id="cr-otp"
                          fullWidth
                          hiddenLabel
                          placeholder="000000"
                          inputProps={{ maxLength: 6, inputMode: "numeric" }}
                          {...creatorOtpForm.register("otp")}
                          error={!!creatorOtpForm.formState.errors.otp}
                          helperText={creatorOtpForm.formState.errors.otp?.message}
                          sx={pillInputSx}
                        />
                      </LabeledField>
                      {otpCountdown != null && otpCountdown > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          Expires in {Math.floor(otpCountdown / 60)}:{String(otpCountdown % 60).padStart(2, "0")}
                        </Typography>
                      )}
                      <Button type="button" variant="text" disabled={resendOtpMutation.isPending || (otpCountdown != null && otpCountdown > 0)} onClick={onResendOtp} sx={{ color: "primary.main", fontWeight: 600, textTransform: "none", alignSelf: "flex-start" }}>
                        Resend code
                      </Button>
                      <Button type="submit" variant="contained" fullWidth disabled={verifyOtpMutation.isPending} sx={pillPrimaryBtn}>
                        {verifyOtpMutation.isPending ? "Verifying…" : "Verify"}
                      </Button>
                    </Box>
                  )}
                  {creatorStep === "complete" && (
                    <Box component="form" onSubmit={creatorCompleteForm.handleSubmit(onCreatorComplete)} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                      <LabeledField id="cr-pw" label="Password">
                        <TextField
                          id="cr-pw"
                          type="password"
                          fullWidth
                          hiddenLabel
                          autoComplete="new-password"
                          placeholder="Create password"
                          {...creatorCompleteForm.register("password")}
                          error={!!creatorCompleteForm.formState.errors.password}
                          helperText={creatorCompleteForm.formState.errors.password?.message}
                          sx={pillInputSx}
                        />
                      </LabeledField>
                      <LabeledField id="cr-pw2" label="Confirm password">
                        <TextField
                          id="cr-pw2"
                          type="password"
                          fullWidth
                          hiddenLabel
                          autoComplete="new-password"
                          placeholder="Confirm password"
                          {...creatorCompleteForm.register("confirmPassword")}
                          error={!!creatorCompleteForm.formState.errors.confirmPassword}
                          helperText={creatorCompleteForm.formState.errors.confirmPassword?.message}
                          sx={pillInputSx}
                        />
                      </LabeledField>
                      <Button type="submit" variant="contained" fullWidth disabled={completeRegistrationMutation.isPending} sx={pillPrimaryBtn}>
                        {completeRegistrationMutation.isPending ? "Creating…" : "Create account"}
                      </Button>
                    </Box>
                  )}
                  <Typography variant="body2" sx={{ mt: 2, textAlign: "center", color: "primary.main", fontWeight: 600, cursor: "pointer" }} onClick={() => setPanel("login")}>
                    Already have an account? Login
                  </Typography>
                </Box>
              )}

              {panel === "brand" && (
                <Box component="form" onSubmit={brandForm.handleSubmit(onBrandRegister)} sx={{ display: "flex", flexDirection: "column", gap: 2.5, textAlign: "left" }}>
                  {registerError && (
                    <Alert severity="error" sx={{ borderRadius: 2 }} role="alert">
                      {registerError}
                    </Alert>
                  )}
                  <LabeledField id="br-email" label="Work email">
                    <TextField
                      id="br-email"
                      type="email"
                      fullWidth
                      hiddenLabel
                      autoComplete="email"
                      placeholder="you@company.com"
                      {...brandForm.register("email")}
                      error={!!brandForm.formState.errors.email}
                      helperText={brandForm.formState.errors.email?.message}
                      sx={pillInputSx}
                    />
                  </LabeledField>
                  <LabeledField id="br-pw" label="Password">
                    <TextField
                      id="br-pw"
                      type="password"
                      fullWidth
                      hiddenLabel
                      autoComplete="new-password"
                      placeholder="Password"
                      {...brandForm.register("password")}
                      error={!!brandForm.formState.errors.password}
                      helperText={brandForm.formState.errors.password?.message}
                      sx={pillInputSx}
                    />
                  </LabeledField>
                  <LabeledField id="br-co" label="Company name">
                    <TextField
                      id="br-co"
                      fullWidth
                      hiddenLabel
                      placeholder="Company name"
                      {...brandForm.register("company_name")}
                      error={!!brandForm.formState.errors.company_name}
                      helperText={brandForm.formState.errors.company_name?.message}
                      sx={pillInputSx}
                    />
                  </LabeledField>
                  <LabeledField id="br-ind" label="Industry (optional)">
                    <TextField id="br-ind" fullWidth hiddenLabel placeholder="Industry" {...brandForm.register("industry")} sx={pillInputSx} />
                  </LabeledField>
                  <LabeledField id="br-web" label="Website (optional)">
                    <TextField
                      id="br-web"
                      fullWidth
                      hiddenLabel
                      placeholder="https://"
                      {...brandForm.register("website")}
                      error={!!brandForm.formState.errors.website}
                      helperText={brandForm.formState.errors.website?.message}
                      sx={pillInputSx}
                    />
                  </LabeledField>
                  <Button type="submit" variant="contained" fullWidth disabled={brandForm.formState.isSubmitting} sx={pillPrimaryBtn}>
                    {brandForm.formState.isSubmitting ? "Creating…" : "Create account"}
                  </Button>
                  <Typography variant="body2" sx={{ textAlign: "center", color: "primary.main", fontWeight: 600, cursor: "pointer" }} onClick={() => setPanel("login")}>
                    Already have an account? Login
                  </Typography>
                </Box>
              )}
            </Box>
          </Fade>

          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 4, lineHeight: 1.5 }}>
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
