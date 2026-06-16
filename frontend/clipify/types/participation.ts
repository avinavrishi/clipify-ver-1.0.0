export type ParticipationStatus = "APPLIED" | "APPROVED" | "REJECTED";

export interface Participation {
  id: string;
  campaign_id: string;
  creator_id: string;
  status: ParticipationStatus;
  total_submissions: number;
  total_earned: number;
  joined_at: string;
  campaign_title?: string;
  campaign_status?: string;
  campaign_budget?: number;
  campaign_rate_per_million?: number;
}

export interface ParticipationCreateRequest {
  campaign_id: string;
}

export interface ParticipationUpdateRequest {
  status: "APPROVED" | "REJECTED";
  reason?: string;
}

export interface AdminParticipation {
  id: string;
  participation_id: string;
  campaign_id: string;
  campaign_title: string;
  creator_id: string;
  creator_display_name: string;
  status: ParticipationStatus;
  total_submissions: number;
  total_earned: number;
  joined_at: string;
}
