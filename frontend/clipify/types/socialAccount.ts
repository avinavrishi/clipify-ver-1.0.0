export type SocialPlatform = "TIKTOK" | "INSTAGRAM" | "YOUTUBE" | "TWITTER" | "OTHER";

export type VerificationStatus =
  | "CODE_ACTIVE"
  | "PENDING_VERIFICATION"
  | "VERIFIED"
  | "REJECTED"
  | "EXPIRED"
  | "FAILED"
  | "ERROR";

export interface SocialAccount {
  id: string;
  creator_id: string;
  platform: SocialPlatform;
  platform_user_id?: string | null;
  username: string;
  is_verified: boolean;
  created_at: string;
}

export interface SocialAccountUpdateRequest {
  username?: string;
  platform_user_id?: string;
}

export interface VerificationInitiateRequest {
  platform: SocialPlatform;
  username: string;
}

export interface VerificationInitiateResponse {
  verification_id: string;
  verification_code: string;
  platform: SocialPlatform;
  username: string;
  expires_at: string;
  message: string;
}

export interface VerificationCompleteRequest {
  verification_id: string;
}

export interface VerificationStatusResponse {
  id: string;
  verification_id: string;
  creator_id: string;
  platform: SocialPlatform;
  username: string;
  status: VerificationStatus;
  verification_code: string;
  expires_at: string;
  created_at: string;
  completed_at?: string | null;
  verified_at?: string | null;
  social_account_id?: string | null;
}
