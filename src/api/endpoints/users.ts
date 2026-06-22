import apiService from "../../services/api";

export const fetchUsers = (params?: Record<string, any>) =>
  apiService.get("/users", params);

// Check Username API (POST /users/check-username)
export interface CheckUsernameRequest {
  username: string;
  role: string;
}

export interface CheckUsernameResponse {
  success?: boolean;
  status?: "success" | string;
  message?: string | string[];
  error?: string;
}

export const checkUsername = (
  data: CheckUsernameRequest,
): Promise<CheckUsernameResponse | undefined> => {
  return apiService.post<CheckUsernameResponse>("/users/check-username", data);
};

// Profile API (GET users/profile) - user, selected_child, other_children
export interface ProfileHeightWeight {
  submitted_unit?: string;
  cm?: number;
  ft?: number;
  inches?: number;
  kg?: number;
  lb?: number;
  original?: { value: number; unit: string; inches?: number | null };
}

export interface ProfileUser {
  id: string;
  email: string;
  username: string;
  role: string;
  date_of_birth: string | null;
  age: number | null;
  first_name: string;
  last_name: string;
  gender: string | null;
  parent_id: string | null;
  selected_child_user_id: string | null;
  phone: string | null;
  bio: string | null;
  profile_image_url: string | null;
  profile_image_type: string | null;
  is_active: boolean;
  is_email_verified: boolean;
  is_onboarding_complete: boolean;
  created_at: string;
  updated_at: string;
  last_active: string | null;
  subscription: string;
  height?: ProfileHeightWeight | null;
  weight?: ProfileHeightWeight | null;
  mother_height?: (ProfileHeightWeight & { parent_type?: string }) | null;
  father_height?: (ProfileHeightWeight & { parent_type?: string }) | null;
  ethnicity?: string | null;
  sleep?: string | null;
  activity_level?: string | null;
  nutrition?: string | null;
  supplements?: string | null;
  onboarding_completed_at: string | null;
  deleted_at: string | null;
  suspend_reason: string | null;
  timezone?: {
    iana: string;
    label: string;
    utc_offset: string;
  } | null;
  is_update_height_enable?: boolean;
  height_update_message?: string | null;
  is_update_weight_enable?: boolean;
  weight_update_message?: string | null;
}

export interface ProfileChildUser extends ProfileUser {
  height?: {
    submitted_unit?: string;
    cm?: number;
    ft?: number;
    inches?: number;
    original?: ProfileHeightWeight["original"];
  } | null;
  weight?: {
    submitted_unit?: string;
    kg?: number;
    lb?: number;
    original?: ProfileHeightWeight["original"];
  } | null;
}

export interface GetProfileResponse {
  status: string;
  message: string;
  data?: {
    user: ProfileUser;
    selected_child: ProfileChildUser | null;
    other_children: ProfileChildUser[];
  };
}

export const getProfile = (): Promise<GetProfileResponse | undefined> => {
  return apiService.get<GetProfileResponse>("/users/profile");
};

// Home API (GET users/home)
export interface HomeCurrentHeight {
  cm?: number;
  ft?: number;
  inches?: number;
  last_measured_date?: string | null;
}

export interface HomeCurrentWeight {
  kg?: number;
  lb?: number;
  last_measured_date?: string | null;
}

export interface HomePercentile {
  percentile?: number;
  classification?: string;
  height_cm?: number;
  age_years?: number;
  gender?: string;
}

export interface HomePredictedHeight {
  cm?: number;
  ft?: number;
  inches?: number;
}

export interface GetHomeParams {
  child_id?: string;
}

export interface GetHomeResponse {
  status: string;
  message: string;
  data?: {
    current_height: HomeCurrentHeight | null;
    current_weight: HomeCurrentWeight | null;
    percentile: HomePercentile | null;
    predicted_height: HomePredictedHeight | null;
    streak: {
      current_streak_count?: number;
      best_streak?: number;
      completion_percentage?: number;
      message?: string;
    } | null;
    is_update_height_enable?: boolean;
    is_update_weight_enable?: boolean;
    height_update_message?: string | null;
    weight_update_message?: string | null;
    is_subscribed: boolean;
    is_truheight_subscriber?: boolean;
    is_trial_active?: boolean;
    trial_start_date?: string | null;
    trial_end_date?: string | null;
    is_walkthrough?: boolean;
  };
}

export const getHome = (
  params?: GetHomeParams,
): Promise<GetHomeResponse | undefined> => {
  return apiService.get<GetHomeResponse>("/users/home", params ?? {});
};

// Walkthrough API (PUT users/walkthrough)
export interface UpdateWalkthroughRequest {
  is_walkthrough: boolean;
}

export interface UpdateWalkthroughResponse {
  status: string;
  message: string;
  data?: {
    is_walkthrough?: boolean;
    [key: string]: unknown;
  };
}

export const updateWalkthroughPreference = (
  data: UpdateWalkthroughRequest,
): Promise<UpdateWalkthroughResponse | undefined> => {
  return apiService.put<UpdateWalkthroughResponse>("/users/walkthrough", data);
};

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  device_id: string;
}
// Update Profile API (PUT users/profile)
export interface UpdateProfileHeightPayload {
  cm: number;
  ft: number;
  inches: number;
}

export interface UpdateProfileRequest {
  user_id?: string; // When role is parent, pass selected child's id to update child's profile
  first_name?: string;
  last_name?: string;
  profile_image_url?: string;
  profile_image_type?: string;
  username?: string;
  height?: UpdateProfileHeightPayload;
  weight?: { kg: number; lb: number };
  mother_height?: UpdateProfileHeightPayload;
  father_height?: UpdateProfileHeightPayload;
  ethnicity?: string;
  sleep?: string;
  activity_level?: string;
  nutrition?: string;
  supplements?: string;
}

export interface UpdateProfileResponse {
  status: string;
  message: string;
  data?: { user: ProfileUser };
}

export const updateProfile = (
  data: UpdateProfileRequest,
): Promise<UpdateProfileResponse | undefined> => {
  const { user_id, ...body } = data;
  const params = user_id ? { user_id } : undefined;
  return apiService.put<UpdateProfileResponse>(
    "/users/profile",
    body,
    undefined,
    params,
  );
};

// Account Settings API (PUT users/account-settings)
export interface AccountSettingsRequest {
  first_name: string;
  last_name: string;
  username: string;
}

export interface AccountSettingsResponse {
  status: string;
  message: string;
  data?: { user?: ProfileUser };
}

export const updateAccountSettings = (
  data: AccountSettingsRequest,
): Promise<AccountSettingsResponse | undefined> => {
  return apiService.put<AccountSettingsResponse>(
    "/users/account-settings",
    data,
  );
};

// Notification Settings API (PUT users/notification-settings)
export type NotificationSettingType =
  | "daily_habit_reminder"
  | "monthly_height_reminder"
  | "monthly_weight_reminder";

export interface NotificationSettingsNotification {
  type: NotificationSettingType;
  is_enable: boolean;
  notification_time?: string;
}

export interface NotificationSettingsUpdateNotification {
  type: NotificationSettingType;
  is_enable: boolean;
  notification_time: string;
}

export interface NotificationSettingsTimezone {
  iana: string;
  label: string;
  utc_offset: string;
}

export interface UpdateNotificationSettingsRequest {
  notifications: NotificationSettingsUpdateNotification[];
  timezone: NotificationSettingsTimezone;
}

export interface NotificationSettingsItem extends NotificationSettingsNotification {
  id?: string;
}

export interface NotificationSettingsData {
  id: string;
  user_id: string;
  notifications: NotificationSettingsItem[];
  timezone: NotificationSettingsTimezone;
  created_at: string;
  updated_at: string;
}

export interface UpdateNotificationSettingsResponse {
  status: string;
  message: string;
  data?: NotificationSettingsData;
}

/** GET /users/notification-settings - fetch current notification settings */
export interface GetNotificationSettingsResponse {
  status: string;
  message: string;
  data?: NotificationSettingsData;
}

export const getNotificationSettings = (): Promise<
  GetNotificationSettingsResponse | undefined
> => {
  return apiService.get<GetNotificationSettingsResponse>(
    "/users/notification-settings",
  );
};

export const updateNotificationSettings = (
  data: UpdateNotificationSettingsRequest,
): Promise<UpdateNotificationSettingsResponse | undefined> => {
  return apiService.put<UpdateNotificationSettingsResponse>(
    "/users/notification-settings",
    data,
  );
};

// Switch Child API (POST users/switch-child) - parent only
export interface SwitchChildRequest {
  child_user_id: string;
}

export interface SwitchChildResponse {
  status: string;
  message?: string;
  data?: {
    user?: ProfileUser;
    selected_child?: ProfileChildUser | null;
    other_children?: ProfileChildUser[];
    current_routine?: unknown;
    daily_routine?: unknown;
  };
}

export const switchChild = (
  data: SwitchChildRequest,
): Promise<SwitchChildResponse | undefined> => {
  return apiService.put<SwitchChildResponse>("/users/switch-child", data);
};

export interface ChangePasswordResponse {
  success?: boolean;
  status?: "success" | string;
  message?: string | string[];
  error?: string;
  data?: Record<string, unknown>;
}

export const changePassword = (
  data: ChangePasswordRequest,
): Promise<ChangePasswordResponse | undefined> => {
  return apiService.post<ChangePasswordResponse>(
    "/users/change-password",
    data,
  );
};

// Report Issue API
export interface ReportIssueRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string; // optional – omit when empty so backend does not validate
  message: string;
}

export interface ReportIssueResponse {
  success?: boolean;
  status?: "success" | string;
  message?: string | string[];
  error?: string;
  data?: Record<string, unknown>;
}

export const reportIssue = (
  data: ReportIssueRequest,
): Promise<ReportIssueResponse | undefined> => {
  return apiService.post<ReportIssueResponse>("/issues/report", data);
};

// Delete Account API
export interface DeleteAccountRequest {
  password?: string;
  reason?: string;
  [key: string]: unknown;
}

export interface DeleteAccountResponse {
  success?: boolean;
  status?: "success" | string;
  message?: string | string[];
  error?: string;
  data?: Record<string, unknown>;
}

export const deleteUserAccount = (
  data?: DeleteAccountRequest,
): Promise<DeleteAccountResponse | undefined> => {
  return apiService.delete<DeleteAccountResponse>(
    "/users/delete-account",
    data ?? {},
  );
};

// Get FAQs API
export interface GetFaqsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  include_inactive?: boolean;
}

export interface FaqItem {
  _id: string;
  question: string;
  answer?: string;
  status?: string;
  order?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface GetFaqsResponse {
  status?: string;
  message?: string;
  data?: {
    items?: FaqItem[];
    faqs?: FaqItem[];
    pagination?: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
    total?: number;
    page?: number;
    limit?: number;
    [key: string]: unknown;
  };
}

export const getFaqs = (
  params?: GetFaqsParams,
): Promise<GetFaqsResponse | undefined> => {
  return apiService.get<GetFaqsResponse>("/faqs", params ?? {});
};

// Leaderboard API: child/teen = GET users/leaderboard/child/teen, parent = GET users/leaderboard/parent
export interface LeaderboardUser {
  rank: number;
  user_id: string;
  username: string;
  profile_image_url: string | null;
  current_streak_count: number;
  completion_percentage: number;
  is_current_user: boolean;
}

export interface GetLeaderboardParams {
  page?: number;
  limit?: number;
}

export interface GetLeaderboardResponse {
  status: string;
  message: string;
  data?: {
    top_users: LeaderboardUser[];
    current_user: LeaderboardUser | null;
  };
}

/** Child/Teen leaderboard: GET /users/leaderboard/child/teen */
export const getLeaderboardChildTeen = (
  params?: GetLeaderboardParams,
): Promise<GetLeaderboardResponse | undefined> => {
  return apiService.get<GetLeaderboardResponse>(
    "/users/leaderboard/child/teen",
    params ?? { page: 1, limit: 100 },
  );
};

/** Parent leaderboard: GET /users/leaderboard/parent */
export const getLeaderboardParent = (
  params?: GetLeaderboardParams,
): Promise<GetLeaderboardResponse | undefined> => {
  return apiService.get<GetLeaderboardResponse>(
    "/users/leaderboard/parent",
    params ?? { page: 1, limit: 100 },
  );
};

/** Leaderboard activity track (parent only): POST /users/leaderboard-activity/track */
export const trackLeaderboardActivity = (): Promise<
  { status?: string } | undefined
> => {
  return apiService.post("/users/leaderboard-activity/track", {});
};

// Daily Routines API (GET users/daily-routines)
export interface DailyRoutineTaskCompletion {
  task_id: string;
  title: string;
  description: string;
  routine_label?: string;
  is_completed: boolean;
  completed_at: string | null;
}

export interface DailyRoutineItem {
  id: string;
  user_id: string;
  routine_id: string;
  date: string;
  task_completions: DailyRoutineTaskCompletion[];
  status: boolean;
  total_tasks: number;
  completed_tasks: number;
  created_at: string;
  updated_at: string;
}

export interface GetDailyRoutinesParams {
  days?: number;
  child_id?: string;
}

export interface GetDailyRoutinesResponse {
  status: string;
  message: string;
  data?: {
    routines: DailyRoutineItem[];
    days: number;
    user_id: string;
  };
}

export const getDailyRoutines = (
  params?: GetDailyRoutinesParams,
): Promise<GetDailyRoutinesResponse | undefined> => {
  return apiService.get<GetDailyRoutinesResponse>(
    "/users/daily-routines",
    params ?? { days: 30 },
  );
};

// Streak API (GET users/streak)
export interface GetStreakParams {
  child_id?: string;
}

export interface GetStreakResponse {
  status: string;
  message: string;
  data?: {
    current_streak_count: number;
    best_streak: number;
    completion_percentage: number;
    message: string;
  };
}

export const getStreak = (
  params?: GetStreakParams,
): Promise<GetStreakResponse | undefined> => {
  return apiService.get<GetStreakResponse>("/users/streak", params);
};

// CDC Height Comparison API (GET users/cdc-height-comparison)
export interface CdcHeightComparisonDataPoint {
  age_months: number;
  height: {
    cm: number | null;
    ft: number | null;
    inches: number | null;
  };
}

export interface GetCdcHeightComparisonParams {
  child_id?: string;
  unit?: "cm" | "inches";
}

export interface GetCdcHeightComparisonResponse {
  status: string;
  message: string;
  data?: {
    gender: string;
    percentile_5: CdcHeightComparisonDataPoint[];
    percentile_50: CdcHeightComparisonDataPoint[];
    percentile_95: CdcHeightComparisonDataPoint[];
    user_growth: CdcHeightComparisonDataPoint[];
  };
}

// Monthly Height Chart API (GET users/monthly-height-chart)
export interface MonthlyHeightChartHeight {
  cm: number | null;
  ft: number | null;
  inches: number | null;
}

export interface MonthlyHeightChartUpdate {
  recorded_at: string;
  height: MonthlyHeightChartHeight;
}

export interface GetMonthlyHeightChartParams {
  child_id?: string;
  unit?: "cm" | "inches";
}

export interface GetMonthlyHeightChartResponse {
  status: string;
  message: string;
  data?: {
    user_id: string;
    updates: MonthlyHeightChartUpdate[];
  };
}

export const getMonthlyHeightChart = (
  params?: GetMonthlyHeightChartParams,
): Promise<GetMonthlyHeightChartResponse | undefined> => {
  return apiService.get<GetMonthlyHeightChartResponse>(
    "/users/monthly-height-chart",
    params ?? {},
  );
};

export const getCdcHeightComparison = (
  params?: GetCdcHeightComparisonParams,
): Promise<GetCdcHeightComparisonResponse | undefined> => {
  return apiService.get<GetCdcHeightComparisonResponse>(
    "/users/cdc-height-comparison",
    params ?? { unit: "cm" },
  );
};

// Mark all notifications as read API (POST users/notifications/read-all)
export interface ReadAllNotificationsResponse {
  status: string;
  message: string;
  data?: {
    updated: number;
  };
}

export const readAllNotifications = (): Promise<
  ReadAllNotificationsResponse | undefined
> => {
  return apiService.post<ReadAllNotificationsResponse>(
    "/users/notifications/read-all",
    {},
  );
};

// Mark a single notification as read API (POST users/notifications/{notification_id}/read)
export interface ReadNotificationResponse {
  status: string;
  message: string;
  data?: {
    notification?: UserNotificationItem;
  };
}

export const readNotification = (
  notificationId: string,
): Promise<ReadNotificationResponse | undefined> => {
  return apiService.post<ReadNotificationResponse>(
    `/users/notifications/${notificationId}/read`,
    {},
  );
};

// User Notifications API (GET users/notifications)
export interface UserNotificationItem {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  data?: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
}

export interface GetUserNotificationsParams {
  only_unread?: boolean;
  page?: number;
  perpage?: number;
  limit?: number;
  skip?: number;
}

export interface GetUserNotificationsResponse {
  status: string;
  message: string;
  data?: {
    notifications: UserNotificationItem[];
    total: number;
    page: number;
    perpage: number;
    skip: number;
    limit: number;
    unread_count: number;
  };
}

export const getUserNotifications = (
  params?: GetUserNotificationsParams,
): Promise<GetUserNotificationsResponse | undefined> => {
  return apiService.get<GetUserNotificationsResponse>(
    "/users/notifications",
    params ?? { only_unread: false },
  );
};

// Earned Badges API (GET users/earned-badges)
export interface EarnedBadgeItem {
  badge_code: string;
  name: string;
  description: string;
  icon: string;
  type: string;
  audience: string;
  is_active: boolean;
  social_media_note?: string;
  is_earned: boolean;
  is_redeemed: boolean;
  earned_at: string | null;
  redeemed_at: string | null;
  month_year: string | null;
  child_id?: string | null;
}

export interface GetEarnedBadgesResponse {
  status: string;
  message: string;
  data?: EarnedBadgeItem[];
}

export interface GetEarnedBadgesParams {
  type?: "monthly" | "lifetime";
  child_id?: string;
}

export const getEarnedBadges = (
  params?: GetEarnedBadgesParams,
): Promise<GetEarnedBadgesResponse | undefined> => {
  // Default to lifetime badges when no type is provided
  const query: GetEarnedBadgesParams = params ?? { type: "lifetime" };
  return apiService.get<GetEarnedBadgesResponse>("/users/earned-badges", query);
};

// Recent Earned Badges API (GET users/recent-earned-badges)
export interface GetRecentEarnedBadgesParams {
  child_id?: string;
}

export interface GetRecentEarnedBadgesResponse {
  status: string;
  message: string;
  data?: EarnedBadgeItem[];
}

export const getRecentEarnedBadges = (
  params?: GetRecentEarnedBadgesParams,
): Promise<GetRecentEarnedBadgesResponse | undefined> => {
  return apiService.get<GetRecentEarnedBadgesResponse>(
    "/users/recent-earned-badges",
    params ?? {},
  );
};

// Redeem Earned Badge API (POST users/earned-badges/{badge_code}/redeem)
export interface RedeemBadgeResponse {
  status: string;
  message: string;
  data?: {
    badge_code: string;
    is_redeemed: boolean;
    month_year?: string | null;
  };
}

export interface RedeemBadgeParams {
  month_year?: string;
  child_id?: string;
}

export const redeemBadge = (
  badge_code: string,
  params?: RedeemBadgeParams,
): Promise<RedeemBadgeResponse | undefined> => {
  return apiService.post<RedeemBadgeResponse>(
    `/users/earned-badges/${badge_code}/redeem`,
    {},
    undefined,
    params,
  );
};

// Update Daily Routine Task (PATCH users/daily-routines/{routine_id})
export interface UpdateDailyRoutineTaskRequest {
  task_id: string;
  is_completed: boolean;
  date: string;
  child_id?: string;
}

export interface UpdateDailyRoutineTaskCompletionItem {
  task_id: string;
  is_completed: boolean;
  completed_at: string | null;
}

export interface UpdateDailyRoutineTaskResponseData {
  id: string;
  user_id: string;
  routine_id: string;
  date: string;
  task_completions: UpdateDailyRoutineTaskCompletionItem[];
  status: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpdateDailyRoutineTaskResponse {
  status: string;
  message: string;
  data?: UpdateDailyRoutineTaskResponseData;
}

export const updateDailyRoutineTask = (
  routineId: string,
  body: UpdateDailyRoutineTaskRequest,
): Promise<UpdateDailyRoutineTaskResponse | undefined> => {
  return apiService.patch<UpdateDailyRoutineTaskResponse>(
    `/users/daily-routines/${routineId}`,
    body,
  );
};
