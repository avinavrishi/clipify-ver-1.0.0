export type NotificationType =
  | "SOCIAL_ACCOUNT_PENDING"
  | "SOCIAL_ACCOUNT_APPROVED"
  | "SOCIAL_ACCOUNT_REJECTED"
  | "CAMPAIGN_PARTICIPATION_PENDING"
  | "CAMPAIGN_PARTICIPATION_APPROVED"
  | "CAMPAIGN_PARTICIPATION_REJECTED"
  | "CONTENT_SUBMITTED"
  | "CONTENT_APPROVED"
  | "CONTENT_REJECTED"
  | "CAMPAIGN_CREATED"
  | "CAMPAIGN_UPDATED"
  | "PAYOUT_PROCESSED"
  | "EARNINGS_UPDATED";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
}

export interface UnreadCountResponse {
  unread_count: number;
}
