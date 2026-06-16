export type SubmissionStatus = "PENDING" | "APPROVED" | "REJECTED";

export type SocialPlatform = "TIKTOK" | "INSTAGRAM" | "YOUTUBE" | "TWITTER" | "OTHER";

export interface Submission {
  id: string;
  campaign_id: string;
  creator_id: string;
  social_account_id: string;
  content_url: string;
  platform_content_id?: string | null;
  verified_views: number;
  calculated_earnings: number;
  status: SubmissionStatus;
  submitted_at: string;
  campaign_title?: string;
  social_account_username?: string;
  social_platform?: SocialPlatform;
}

export interface SubmissionCreateRequest {
  campaign_id: string;
  social_account_id: string;
  content_url: string;
  platform_content_id?: string;
}

export interface SubmissionUpdateRequest {
  status: "APPROVED" | "REJECTED";
  verified_views?: number;
  calculated_earnings?: number;
  reason?: string;
}

/** POST /creator/submit-link (faceless creators only) */
export interface SubmitLinkRequest {
  campaign_id: string;
  content_url: string;
  social_account_id: string;
  platform_content_id?: string;
}

export interface SubmitLinkResponse {
  participation_id: string;
  submission_id: string;
  message: string;
}
