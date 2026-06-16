import { User } from "./auth";
import { CampaignStatus } from "./campaign";

export interface AdminBrand {
  id: string;
  user_id: string;
  company_name: string;
  industry?: string;
  website?: string;
}

export interface AdminKpis {
  total_users: number;
  total_creators: number;
  total_brands: number;
  total_admins: number;
  total_campaigns: number;
  active_campaigns: number;
  paused_campaigns: number;
  completed_campaigns: number;
  total_payout_amount: number;
}

export type AdminUser = User;

