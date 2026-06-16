/** Face creator details returned with GET /profiles/me when creator_type === "FACE" */
export interface CreatorFaceDetails {
  name?: string | null;
  category?: string | null;
  reel_price?: number | null;
  story_price?: number | null;
  reel_story_price?: number | null;
  state?: string | null;
  city?: string | null;
  language?: string | null;
}

export interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  bio?: string | null;
  profile_picture_url?: string | null;
  country?: string | null;
  created_at: string;
  updated_at: string;
  // Creator / me API payload
  wallet_balance?: number;
  total_earnings?: number;
  verification_status?: string;
  email?: string;
  /** Creator: set during onboarding (GET /profiles/me) */
  username?: string | null;
  creator_type?: CreatorType | null;
  creator_face_details?: CreatorFaceDetails | null;
}

export interface ProfileUpsertRequest {
  display_name: string;
  bio?: string;
  profile_picture_url?: string;
  country?: string;
}

export type CreatorType = "FACE" | "FACELESS";

export interface CreatorTypeResponse {
  creator_type: CreatorType | null;
  name?: string | null;
  category?: string | null;
  reel_price?: number | null;
  story_price?: number | null;
  reel_story_price?: number | null;
  state?: string | null;
  city?: string | null;
  language?: string | null;
}

export interface CreatorTypePatchRequest {
  creator_type: "FACE" | "FACELESS";
  name?: string;
  category?: string;
  reel_price?: number;
  story_price?: number;
  reel_story_price?: number;
  state?: string;
  city?: string;
  language?: string;
}

/** PATCH /profiles/me/creator-face-details – all fields optional */
export interface CreatorFaceDetailsPatchRequest {
  name?: string;
  category?: string;
  reel_price?: number;
  story_price?: number;
  reel_story_price?: number;
  state?: string;
  city?: string;
  language?: string;
}

