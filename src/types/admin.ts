export type AdminUser = {
  id: number;
  username: string;
  nickname: string;
  display_name: string;
  email: string;
  last_login_at: string | null;
  is_staff: boolean;
  is_superuser: boolean;
};

export type AuthTokens = {
  access: string;
};

export const LIST_PAGE_SIZE = 15;

export type PaginatedResponse<T> = {
  results: T[];
  page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
};

export type DashboardData = {
  total_users: number;
  verified_users: number;
  vote_eligible_users: number;
  total_images: number;
  images_uploaded_today: number;
  active_votes: number;
  closing_votes_today: number;
  pending_jobs: number;
  recent_feed: Array<{
    date: string;
    email: string;
    title: string;
    result: string;
    preview_url?: string | null;
    detail_path?: string;
  }>;
};

export type AdminUserListItem = {
  id: number;
  email: string;
  nickname: string;
  role: string;
  verification: string;
  nft_count: number | null;
  joined_at: string;
  last_login: string;
  status: string;
};

export type RecentActivity = {
  title: string;
  result: string;
  date: string;
  preview_url?: string | null;
  image_public_id?: string | null;
  detail_path?: string;
  detail_label?: string;
  meta?: string;
};

export type AdminUserDetail = AdminUserListItem & {
  recent_ip: string;
  sms_verification: string;
  email_verification: string;
  wallet_address: string;
  wallet_method: string;
  wallet_linked_at: string;
  vote_permission: string;
  activity_page: number;
  activity_page_size: number;
  activity_total_count: number;
  activity_total_pages: number;
  recent_activities: RecentActivity[];
};

export type AdminImageListItem = {
  public_id: string;
  content_type: "image" | "document";
  file_name: string;
  uploader_email: string;
  uploaded_at: string;
  decision: string;
  vote_status: string;
  preview_url: string | null;
};

export type AdminImageDetail = {
  public_id: string;
  content_type: "image" | "document";
  file_name: string;
  uploader_email: string;
  uploaded_at: string;
  decision: string;
  preview_url: string | null;
  watermark_preview_url: string | null;
  comparison_preview_url?: string | null;
  comparison_label?: string;
  comparison_file_name?: string;
  comparison_public_id?: string;
  embedding_similarity: number | null;
  phash_similarity: number | null;
  threshold_result: number | null;
  linked_vote?: {
    vote_id?: string;
    status?: string;
    yes_rate?: number;
    no_rate?: number;
    deadline?: string;
  };
  blockchain?: {
    token_id?: string | number;
    tx_hash?: string;
    block_number?: string | number;
    minted_at?: string;
    decision?: string;
  };
};

export type AdminVoteListItem = {
  public_id: string;
  content_type: "image" | "document";
  vote_id: string;
  file_name: string;
  uploader_email: string;
  status: string;
  start_date: string;
  end_date: string;
  yes_rate: number;
  no_rate: number;
  participant_count: number;
  decision: string;
  preview_url: string | null;
};

export type VoteParticipant = {
  user_id: number;
  email: string;
  wallet: string;
  choice: string;
  nft_count: number | null;
  voted_at: string;
};

export type AdminVoteDetail = AdminVoteListItem & {
  image_id: string;
  original_preview_url?: string | null;
  comparison_preview_url?: string | null;
  comparison_label?: string;
  comparison_file_name?: string;
  comparison_public_id?: string;
  embedding_similarity?: number | null;
  threshold_result?: number | null;
  voter_records: VoteParticipant[];
};
