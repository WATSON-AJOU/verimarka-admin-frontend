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
  latest_job?: AdminJobSummary | null;
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
  latest_job?: AdminJobSummary | null;
};

export type AdminJobSummary = {
  job_id: string;
  job_type: "register" | "verify" | "watermark";
  status: "queued" | "running" | "success" | "failure";
  progress: number;
  progress_message?: string;
  updated_at: string;
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

export type AdminActionLog = {
  id: number;
  actor_email: string;
  action: string;
  target_type: string;
  target_id: string;
  reason: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  request_id?: string;
  ip_address?: string | null;
  created_at: string;
};

export type OperationSummary = {
  open_reports: number;
  pending_retention_requests: number;
  failed_jobs: number;
  running_jobs: number;
  moderation_cases_today: number;
  notifications_queued: number;
  latest_actions: AdminActionLog[];
  report_status_counts: Array<{ status: string; count: number }>;
};

export type ModerationCase = {
  id: number;
  content_public_id: string;
  file_name: string;
  actor_email: string;
  action: string;
  status: string;
  reason: string;
  previous_status: string;
  previous_decision: string;
  next_status: string;
  next_decision: string;
  created_at: string;
};

export type ReportCase = {
  id: number;
  reporter_email: string;
  assignee_email: string;
  content_public_id: string;
  file_name: string;
  report_type: string;
  status: string;
  title: string;
  description: string;
  evidence?: Record<string, unknown>;
  resolution: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
};

export type PolicyVersion = {
  id: number;
  policy_type: string;
  version: string;
  title: string;
  body: string;
  is_active: boolean;
  published_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type RetentionRequest = {
  id: number;
  requester_email: string;
  request_type: string;
  status: string;
  target_type: string;
  target_id: string;
  reason: string;
  decision_note: string;
  due_at: string | null;
  completed_at: string | null;
  created_at: string;
};

export type OperationNotification = {
  id: number;
  user: number;
  user_email: string;
  channel: string;
  status: string;
  title: string;
  message: string;
  related_type: string;
  related_id: string;
  created_at: string;
};

export type OperationJob = {
  job_id: string;
  owner_email: string;
  content_public_id: string;
  job_type: string;
  status: string;
  progress: number;
  progress_message: string;
  error_code: string;
  error_message: string;
  retryable: boolean;
  created_at: string;
  updated_at: string;
};
