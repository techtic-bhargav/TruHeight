import apiService from "../../services/api";

// Signup (POST /api/v1/users/signup)
export interface UserSignupRequest {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  password: string;
  confirm_password: string;
  terms_and_conditions_accepted: boolean;
  educational_use_only: boolean;
  device_token?: string;
  device_type?: string;
  device_id?: string;
}

export interface UserSignupResponse {
  success?: boolean;
  /** API returns status: "success" in body */
  status?: "success" | string;
  message?: string | string[];
  data?: { user?: Record<string, unknown>; data?: Record<string, unknown> };
  error?: string;
}

export const userSignup = (
  data: UserSignupRequest,
): Promise<UserSignupResponse | undefined> => {
  return apiService.post<UserSignupResponse>("/users/signup", data);
};

export interface UserRegisterRequest {
  first_name: string;
  last_name: string;
  family_name: string;
  email: string;
  password: string;
  fcm_token?: string;
}

export interface UserRegisterResponse {
  success: boolean;
  message: string | string[];
  data?: {
    user: {
      _id: string;
      email: string;
      first_name: string;
      last_name: string;
      family_id: string;
      email_verified: boolean;
      createdAt: string;
      updatedAt: string;
    };
    family: {
      id: string;
      family_name: string;
    };
  };
  error?: string;
  status?: number;
}

export const userRegister = (
  data: UserRegisterRequest,
): Promise<UserRegisterResponse | undefined> => {
  return apiService.post<UserRegisterResponse>("/auth/register", data);
};

export interface UserLoginRequest {
  email: string;
  password: string;
  device_token?: string;
  device_type?: string;
  device_id?: string;
}

export interface UserLoginUser {
  id?: string;
  email?: string;
  is_email_verified?: boolean;
  is_onboarding_complete?: boolean;
  [key: string]: unknown;
}

export interface UserLoginResponse {
  success?: boolean;
  status?: "success" | string;
  message?: string | string[];
  error?: string;
  data?: {
    token?: string;
    access_token?: string;
    user?: UserLoginUser;
    data?: { access_token?: string; user?: UserLoginUser };
  };
}
// Logout (POST /api/v1/users/logout)
export interface LogoutRequest {
  device_id: string;
}

export interface LogoutResponse {
  success?: boolean;
  status?: "success" | string;
  message?: string | string[];
  error?: string;
}

export const userLogout = (
  data: LogoutRequest,
): Promise<LogoutResponse | undefined> => {
  return apiService.post<LogoutResponse>("/users/logout", data);
};

export const userLogin = (
  data: UserLoginRequest,
): Promise<UserLoginResponse | undefined> => {
  return apiService.post<UserLoginResponse>("/users/login", data);
};

export interface ForgotPasswordRequest {
  email: string;
}
export interface ForgotPasswordResponse {
  success?: boolean;
  status?: "success" | string;
  message?: string | string[];
  error?: string;
}

export const forgotPassword = (
  data: ForgotPasswordRequest,
): Promise<ForgotPasswordResponse | undefined> => {
  return apiService.post<ForgotPasswordResponse>(
    "/users/forgot-password",
    data,
  );
};

export interface VerifyEmailCodeRequest {
  email: string;
  code: string;
}

export interface VerifyEmailCodeResponse {
  success: boolean;
  message: string | string[];
  error?: string;
  status?: number;
  data?: any;
}

export const verifyEmailCode = (
  data: VerifyEmailCodeRequest,
): Promise<VerifyEmailCodeResponse | undefined> => {
  return apiService.post<VerifyEmailCodeResponse>(
    "/auth/verify-password-reset-code",
    data,
  );
};

export interface ResendEmailVerificationRequest {
  email: string;
}

export interface ResendEmailVerificationResponse {
  success: boolean;
  message: string | string[];
  error?: string;
  status?: number;
}

export const resendEmailVerification = (
  data: ResendEmailVerificationRequest,
): Promise<ResendEmailVerificationResponse | undefined> => {
  return apiService.post<ResendEmailVerificationResponse>(
    "/auth/resend-email-verification",
    data,
  );
};

// Verify email OTP (POST /api/v1/users/verify-email-otp)
export interface VerifyEmailOtpRequest {
  email: string;
  otp: string;
}

export interface VerifyEmailOtpResponse {
  success?: boolean;
  status?: "success" | string;
  message?: string | string[];
  error?: string;
  data?: Record<string, unknown>;
}

export const verifyEmailOtp = (
  data: VerifyEmailOtpRequest,
): Promise<VerifyEmailOtpResponse | undefined> => {
  return apiService.post<VerifyEmailOtpResponse>(
    "/users/verify-email-otp",
    data,
  );
};

// Resend email OTP (POST /api/v1/users/resend-email-otp)
export interface ResendEmailOtpRequest {
  email: string;
}

export interface ResendEmailOtpResponse {
  success?: boolean;
  status?: "success" | string;
  message?: string | string[];
  error?: string;
  data?: Record<string, unknown>;
}

export const resendEmailOtp = (
  data: ResendEmailOtpRequest,
): Promise<ResendEmailOtpResponse | undefined> => {
  return apiService.post<ResendEmailOtpResponse>(
    "/users/resend-email-otp",
    data,
  );
};

// Verify forgot password OTP (POST /api/v1/users/verify-forgot-password-otp)
export interface VerifyForgotPasswordOtpRequest {
  email: string;
  otp: string;
}

export interface VerifyForgotPasswordOtpResponse {
  success?: boolean;
  status?: "success" | string;
  message?: string | string[];
  error?: string;
  data?: Record<string, unknown>;
}

export const verifyForgotPasswordOtp = (
  data: VerifyForgotPasswordOtpRequest,
): Promise<VerifyForgotPasswordOtpResponse | undefined> => {
  return apiService.post<VerifyForgotPasswordOtpResponse>(
    "/users/verify-forgot-password-otp",
    data,
  );
};

// Resend forgot password OTP (POST /api/v1/users/resend-forgot-password-otp)
export const resendForgotPasswordOtp = (
  data: ResendEmailOtpRequest,
): Promise<ResendEmailOtpResponse | undefined> => {
  return apiService.post<ResendEmailOtpResponse>(
    "/users/resend-forgot-password-otp",
    data,
  );
};

// Reset password (POST /api/v1/users/reset-password)
export interface ResetPasswordRequest {
  email: string;
  otp: string;
  new_password: string;
}

export interface ResetPasswordResponse {
  success?: boolean;
  status?: "success" | string;
  message?: string | string[];
  error?: string;
  data?: Record<string, unknown>;
}

export const resetPassword = (
  data: ResetPasswordRequest,
): Promise<ResetPasswordResponse | undefined> => {
  return apiService.post<ResetPasswordResponse>("/users/reset-password", data);
};

export const resendForgotPasswordEmailVerification = (
  data: ResendEmailVerificationRequest,
): Promise<ResendEmailVerificationResponse | undefined> => {
  return apiService.post<ResendEmailVerificationResponse>(
    "/auth/resend-password-reset-code",
    data,
  );
};

export interface ResetPasswordSimpleRequest {
  email: string;
  password: string;
}

export interface ResetPasswordSimpleResponse {
  success: boolean;
  message: string | string[];
  error?: string;
  status?: number;
}

export const resetPasswordSimple = (
  data: ResetPasswordSimpleRequest,
): Promise<ResetPasswordSimpleResponse | undefined> => {
  return apiService.post<ResetPasswordSimpleResponse>(
    "/auth/reset-password-simple",
    data,
  );
};

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string | string[];
  error?: string;
  data?: any;
  status?: number;
}

export const changePassword = (
  data: ChangePasswordRequest,
): Promise<ChangePasswordResponse | undefined> => {
  console.log("🚀 ~ changePassword ~ data:", data);
  return apiService.post<ChangePasswordResponse>("/auth/change-password", data);
};

// Verify Current Password API
export interface VerifyCurrentPasswordRequest {
  currentPassword: string;
}

export interface VerifyCurrentPasswordResponse {
  success: boolean;
  message: string | string[];
  data?: {
    isValid: boolean;
  };
  error?: string;
  status?: number;
}

export const verifyCurrentPassword = (
  data: VerifyCurrentPasswordRequest,
): Promise<VerifyCurrentPasswordResponse | undefined> => {
  console.log("🚀 ~ verifyCurrentPassword ~ data:", data);
  return apiService.post<VerifyCurrentPasswordResponse>(
    "/auth/verify-current-password",
    data,
  );
};

export interface QuestionnaireResponse {
  success: boolean;
  message: string | string[];
  error?: string;
  status?: number;
  data?: {
    questions?: {
      questionId: string;
      questionText: string;
      questionType: string;
      isRequired: boolean;
      order: number;
      category: string;
      description: string;
      options: {
        value: string;
        label: string;
        score: number;
      }[];
    }[];
  };
  questions?: {
    questionId: string;
    questionText: string;
    questionType: string;
    isRequired: boolean;
    order: number;
    category: string;
    description: string;
    options: {
      value: string;
      label: string;
      score: number;
    }[];
  }[];
}

export const getQuestionnaire = (): Promise<
  QuestionnaireResponse | undefined
> => {
  return apiService.get<QuestionnaireResponse>("/questionnaire");
};

// Submit Questionnaire Interfaces
export interface QuestionnaireAnswer {
  questionId: string;
  answer: string;
}

export interface SubmitQuestionnaireRequest {
  questionnaireId: string;
  answers: QuestionnaireAnswer[];
}

export interface SubmitQuestionnaireResponse {
  success: boolean;
  message: string | string[];
  error?: string;
  status?: number;
  data?: any;
}

export const submitQuestionnaire = (
  data: SubmitQuestionnaireRequest,
): Promise<SubmitQuestionnaireResponse | undefined> => {
  return apiService.post<SubmitQuestionnaireResponse>(
    "/questionnaire/submit",
    data,
  );
};

// Biometric Login Interfaces
export interface BiometricLoginRequest {
  device_id: string;
  biometric_token: string;
}

export interface BiometricLoginResponse {
  success: boolean;
  message: string | string[];
  error?: string;
  status?: number;
  data?: {
    data: {
      access_token: string;
      user?: any;
    };
  };
}

export const biometricLogin = (
  data: BiometricLoginRequest,
): Promise<BiometricLoginResponse | undefined> => {
  return apiService.post<BiometricLoginResponse>("/auth/faceid/login", data);
};

// Biometric Enable Interfaces
export interface BiometricEnableRequest {
  device_id: string;
  biometric_token: string;
  enabled: boolean;
}

export interface BiometricEnableResponse {
  success: boolean;
  message: string | string[];
  error?: string;
  status?: number;
  data?: any;
}

export const biometricEnable = (
  data: BiometricEnableRequest,
): Promise<BiometricEnableResponse | undefined> => {
  return apiService.post<BiometricEnableResponse>("/auth/faceid/enable", data);
};

export interface GoogleLoginRequest {
  oauthToken: string; // Google ID token from expo-auth-session
  deviceToken?: string; // FCM token for push notifications
}

export interface GoogleLoginResponse {
  success: boolean;
  message: string | string[];
  error?: string;
  status?: number;
  data?: {
    token: string; // App auth token
    user: any; // App user object (schema from your backend)
  };
}

export const userGoogleLogin = (
  data: GoogleLoginRequest,
): Promise<GoogleLoginResponse | undefined> => {
  return apiService.post<GoogleLoginResponse>("/auth/google/login", data);
};

export interface AppleLoginRequest {
  oauthToken: string; // Apple identity token
  deviceToken?: string; // FCM token for push notifications
}

export interface AppleLoginResponse {
  success: boolean;
  message: string | string[];
  error?: string;
  status?: number;
  data?: {
    access_token: string; // App auth token
    _id: string;
    email: string;
    email_verified: boolean;
    first_name: string;
    last_name: string;
    refresh_token: string;
    role_id: any;
    status: string;
    [key: string]: any;
  };
}

export const userAppleLogin = (
  data: AppleLoginRequest,
): Promise<AppleLoginResponse | undefined> => {
  return apiService.post<AppleLoginResponse>("/auth/apple/login", data);
};

export interface DeleteAccountRequest {
  password?: string;
  confirmDeletion?: boolean;
  reason?: string;
  otp?: string;
}

export interface DeleteAccountResponse {
  success: boolean;
  message: string | string[];
  error?: string;
  status?: number;
}

export const deleteAccount = (
  data: DeleteAccountRequest,
): Promise<DeleteAccountResponse | undefined> => {
  return apiService.delete<DeleteAccountResponse>("/auth/account/delete", data);
};

// Policies API
export interface Policy {
  policyId: string;
  title: string;
  content: string;
  lastUpdated: string;
}

export interface GetPoliciesResponse {
  success: boolean;
  status: number;
  message: string;
  data?: {
    policies: Policy[];
  };
  error?: string;
}

export const getPolicies = (): Promise<GetPoliciesResponse | undefined> => {
  console.log("🚀 ~ getPolicies ~ fetching policies");
  return apiService.get<GetPoliciesResponse>("/account/policies");
};

// Question Answers API
export interface QuestionAnswer {
  questionId: string;
  questionText: string;
  questionType: string;
  isRequired: boolean;
  order: number;
  category: string;
  description?: string;
  options: {
    value: string;
    label: string;
    emoji?: string;
    score?: number;
  }[];
}

export interface QuestionAnswersResponse {
  success?: boolean;
  status?: "success" | string;
  message?: string | string[];
  error?: string;
  data?: {
    questions?: QuestionAnswer[];
  };
  questions?: QuestionAnswer[];
}

export const getQuestionAnswers = (
  questionType?: string,
): Promise<QuestionAnswersResponse | undefined> => {
  console.log(
    "🚀 ~ getQuestionAnswers ~ fetching question answers",
    questionType,
  );
  const params = questionType ? { question_type: questionType } : {};
  return apiService.get<QuestionAnswersResponse>(
    `/question-answers?question_type=${questionType}`,
  );
};

// Avatars API
export interface Avatar {
  id: string;
  url: string;
  name?: string;
}

export interface AvatarsResponse {
  success?: boolean;
  status?: "success" | string;
  message?: string | string[];
  error?: string;
  data?: {
    avatars?: Avatar[];
  };
  avatars?: Avatar[];
}

export const getAvatars = (): Promise<AvatarsResponse | undefined> => {
  console.log("🚀 ~ getAvatars ~ fetching avatars");
  return apiService.get<AvatarsResponse>("/avatars");
};

// Complete Onboarding API
export interface CompleteOnboardingRequest {
  username: string;
  role?: string;
  child_name?: string; // required if role is 'parent'
  child_last_name?: string; // required if role is 'parent'
  profile_image_url?: string;
  profile_image_type?: "avatar" | "custom";
  date_of_birth: string; // Format: YYYY-MM-DD
  gender: "male" | "female";
  height: {
    cm: number;
    ft: number;
    inches: number;
  };
  weight: {
    kg: number;
    lb: number;
  };
  mother_height: {
    cm: number;
    ft: number;
    inches: number;
  };
  father_height: {
    cm: number;
    ft: number;
    inches: number;
  };
  ethnicity:
    | "asian"
    | "black_african"
    | "hispanic_latino"
    | "white_caucasian"
    | "middle_eastern"
    | "mixed_multiple"
    | "prefer_not_to_say";
  sleep: "low_sleep" | "moderate_sleep" | "optimal_sleep" | "high_sleep";
  activity_level: "low_activity" | "moderate_activity" | "high_activity";
  nutrition:
    | "consistent_nutrition"
    | "sometimes_nutrition"
    | "inconsistent_nutrition";
  supplements: "yes_supplement" | "sometimes_supplement" | "no_supplement";
}

export interface CompleteOnboardingResponse {
  success?: boolean;
  status?: "success" | string;
  message?: string | string[];
  data?: any;
  error?: string;
}

export const completeOnboarding = (
  data: CompleteOnboardingRequest,
): Promise<CompleteOnboardingResponse | undefined> => {
  console.log("🚀 ~ completeOnboarding ~ submitting onboarding data", data);
  return apiService.post<CompleteOnboardingResponse>(
    "/users/complete-onboarding",
    data,
  );
};

// Add Child Onboarding API (POST users/add-child-onboarding) - same payload as complete-onboarding, parent only
export interface AddChildOnboardingRequest {
  role?: string;
  username: string;
  child_name: string;
  child_last_name: string;
  profile_image_url?: string;
  profile_image_type?: string;
  date_of_birth: string;
  gender: string;
  height: { cm: number; ft: number; inches: number };
  weight: { kg: number; lb: number };
  mother_height: { cm: number; ft: number; inches: number };
  father_height: { cm: number; ft: number; inches: number };
  ethnicity: string;
  sleep: string;
  activity_level: string;
  nutrition: string;
  supplements: string;
}

export interface AddChildOnboardingResponse {
  success?: boolean;
  status?: string;
  message?: string | string[];
  data?: any;
  error?: string;
}

export const addChildOnboarding = (
  data: AddChildOnboardingRequest,
): Promise<AddChildOnboardingResponse | undefined> => {
  return apiService.post<AddChildOnboardingResponse>(
    "/users/add-child-onboarding",
    data,
  );
};

// Upload Image API
export interface UploadImageResponse {
  success?: boolean;
  status?: "success" | string;
  message?: string | string[];
  data?: {
    url?: string;
    image_url?: string;
  };
  url?: string;
  image_url?: string;
  error?: string;
}

export const uploadImage = (
  formData: FormData,
): Promise<UploadImageResponse | undefined> => {
  console.log("🚀 ~ uploadImage ~ uploading image");
  return apiService.postFormData<UploadImageResponse>(
    "/users/upload-image",
    formData,
  );
};
