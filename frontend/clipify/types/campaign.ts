export type CampaignStatus = "ACTIVE" | "PAUSED" | "COMPLETED";

export type CampaignContentType = "VIDEO" | "IMAGE";

/** 0 = face creators (apply → approve); 1 = faceless (submit-link flow) */
export type CampaignType = 0 | 1;

export interface Platform {
  id: string;
  name: string;
}

export interface Campaign {
  id: string;
  brand_id: string;
  title: string;
  /** 0 face (apply flow), 1 faceless (submit link). Older APIs may omit — treat as 0. */
  campaign_type?: CampaignType;
  category?: string;
  content_type: CampaignContentType;
  description?: string;
  total_budget: number;
  used_budget: number;
  rate_per_million_views: number;
  max_submissions_per_account?: number;
  max_earnings_per_creator?: number;
  max_earnings_per_post?: number;
  start_date: string;
  end_date: string;
  status: CampaignStatus;
  logo_drive_link?: string;
  guidelines_link?: string;
  discord_link?: string;
  created_at: string;
  platforms?: Platform[];
  /** Number of participants (creators) in the campaign */
  participant_count?: number;
  /** Avatar URLs for participants (e.g. for display on cards/details) */
  participant_avatars?: string[];
}

export type CampaignCreatePayload = Omit<
  Campaign,
  "id" | "brand_id" | "used_budget" | "status" | "created_at" | "platforms" | "campaign_type"
> & {
  platform_ids: string[];
  brand_id?: string; // only when admin creates on behalf of a brand
  campaign_type: CampaignType;
};

export type CampaignUpdatePayload = Partial<CampaignCreatePayload> & {
  status?: CampaignStatus; // admin/brand can update status via PUT
};

/** Normalize API responses that omit `campaign_type` (legacy). */
export function getCampaignType(campaign: Pick<Campaign, "campaign_type">): CampaignType {
  const t = campaign.campaign_type;
  return t === 1 ? 1 : 0;
}

