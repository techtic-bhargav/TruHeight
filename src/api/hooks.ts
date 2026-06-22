import { useState } from "react";
import {
  forgotPassword,
  ForgotPasswordRequest,
  getQuestionnaire,
  logout,
  LogoutRequest,
  resendEmailVerification,
  ResendEmailVerificationRequest,
  resendForgotPasswordEmailVerification,
  resetPasswordSimple,
  ResetPasswordSimpleRequest,
  submitQuestionnaire,
  SubmitQuestionnaireRequest,
  userLogin,
  UserLoginRequest,
  userRegister,
  UserRegisterRequest,
  verifyEmailCode,
  VerifyEmailCodeRequest
} from "./endpoints/auth";

export const useUserRegister = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userRegisterAPI = async (data: UserRegisterRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await userRegister(data);

      if (response?.success) {
        return response;
      } else {
        // Handle API error response
        let errorMessage = "Registration failed";

        if (response?.message) {
          if (Array.isArray(response.message)) {
            errorMessage = response.message.join(", ");
          } else {
            errorMessage = response.message;
          }
        } else if (response?.error) {
          errorMessage = response.error;
        }

        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      console.error("❌ Registration hook error:", err);

      let errorMessage = "Network error occurred";

      // Handle different types of backend errors
      if (err?.response?.data?.message) {
        if (Array.isArray(err.response.data.message)) {
          errorMessage = err.response.data.message.join(", ");
        } else {
          errorMessage = err.response.data.message;
        }
      } else if (err?.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err?.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    userRegisterAPI,
    isLoading,
    error,
  };
};

export const useUserLogin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userLoginAPI = async (data: UserLoginRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await userLogin(data);

      if (response?.success) {
        return response;
      } else {
        // Handle API error response
        let errorMessage = "Login failed";

        if (response?.message) {
          if (Array.isArray(response.message)) {
            errorMessage = response.message.join(", ");
          } else {
            errorMessage = response.message;
          }
        } else if (response?.error) {
          errorMessage = response.error;
        }

        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      console.error("❌ Login hook error:", err);

      let errorMessage = "Network error occurred";

      // Handle different types of backend errors
      if (err?.response?.data?.message) {
        if (Array.isArray(err.response.data.message)) {
          errorMessage = err.response.data.message.join(", ");
        } else {
          errorMessage = err.response.data.message;
        }
      } else if (err?.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err?.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logoutAPI = async (data: LogoutRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await logout(data);

      if (response?.success) {
        return response;
      } else {
        // Handle API error response
        let errorMessage = "Logout failed";

        if (response?.message) {
          if (Array.isArray(response.message)) {
            errorMessage = response.message.join(", ");
          } else {
            errorMessage = response.message;
          }
        } else if (response?.error) {
          errorMessage = response.error;
        }

        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      console.error("❌ Logout hook error:", err);

      let errorMessage = "Network error occurred";

      // Handle different types of backend errors
      if (err?.response?.data?.message) {
        if (Array.isArray(err.response.data.message)) {
          errorMessage = err.response.data.message.join(", ");
        } else {
          errorMessage = err.response.data.message;
        }
      } else if (err?.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err?.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    userLoginAPI,
    logoutAPI,
    isLoading,
    error,
  };
};

export const useForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const forgotPasswordAPI = async (data: ForgotPasswordRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await forgotPassword(data);

      if (response?.success) {
        return response;
      } else {
        // Handle API error response
        let errorMessage = "Login failed";

        if (response?.message) {
          if (Array.isArray(response.message)) {
            errorMessage = response.message.join(", ");
          } else {
            errorMessage = response.message;
          }
        } else if (response?.error) {
          errorMessage = response.error;
        }

        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      console.error("❌ Login hook error:", err);

      let errorMessage = "Network error occurred";

      // Handle different types of backend errors
      if (err?.response?.data?.message) {
        if (Array.isArray(err.response.data.message)) {
          errorMessage = err.response.data.message.join(", ");
        } else {
          errorMessage = err.response.data.message;
        }
      } else if (err?.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err?.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    forgotPasswordAPI,
    isLoading,
    error,
  };
};

export const useVerifyEmailCode = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verifyEmailCodeAPI = async (data: VerifyEmailCodeRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await verifyEmailCode(data);

      if (response?.success) {
        return response;
      } else {
        // Handle API error response
        let errorMessage = "Verification failed";

        if (response?.message) {
          if (Array.isArray(response.message)) {
            errorMessage = response.message.join(", ");
          } else {
            errorMessage = response.message;
          }
        } else if (response?.error) {
          errorMessage = response.error;
        }

        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      console.error("❌ Verify email code hook error:", err);

      let errorMessage = "Network error occurred";

      // Handle different types of backend errors
      if (err?.response?.data?.message) {
        if (Array.isArray(err.response.data.message)) {
          errorMessage = err.response.data.message.join(", ");
        } else {
          errorMessage = err.response.data.message;
        }
      } else if (err?.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err?.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    verifyEmailCodeAPI,
    isLoading,
    error,
  };
};

export const useResendEmailVerification = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resendEmailVerificationAPI = async (
    data: ResendEmailVerificationRequest
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await resendEmailVerification(data);
      console.log("🚀 ~ resendEmailVerificationAPI ~ response:", response);

      if (response?.success) {
        return response;
      } else {
        // Handle API error response
        let errorMessage = "Resend failed";

        if (response?.message) {
          if (Array.isArray(response.message)) {
            errorMessage = response.message.join(", ");
          } else {
            errorMessage = response.message;
          }
        } else if (response?.error) {
          errorMessage = response.error;
        }

        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      console.error("❌ Resend email verification hook error:", err);

      let errorMessage = "Network error occurred";

      // Handle different types of backend errors
      if (err?.response?.data?.message) {
        if (Array.isArray(err.response.data.message)) {
          errorMessage = err.response.data.message.join(", ");
        } else {
          errorMessage = err.response.data.message;
        }
      } else if (err?.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err?.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    resendEmailVerificationAPI,
    isLoading,
    error,
  };
};

export const useResendForgotPasswordEmailVerification = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resendForgotPasswordEmailVerificationAPI = async (
    data: ResendEmailVerificationRequest
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await resendForgotPasswordEmailVerification(data);
      console.log(
        "🚀 ~ resendForgotPasswordEmailVerificationAPI ~ response:",
        response
      );

      if (response?.success) {
        return response;
      } else {
        // Handle API error response
        let errorMessage = "Resend failed";

        if (response?.message) {
          if (Array.isArray(response.message)) {
            errorMessage = response.message.join(", ");
          } else {
            errorMessage = response.message;
          }
        } else if (response?.error) {
          errorMessage = response.error;
        }

        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      console.error("❌ Resend email verification hook error:", err);

      let errorMessage = "Network error occurred";

      // Handle different types of backend errors
      if (err?.response?.data?.message) {
        if (Array.isArray(err.response.data.message)) {
          errorMessage = err.response.data.message.join(", ");
        } else {
          errorMessage = err.response.data.message;
        }
      } else if (err?.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err?.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    resendForgotPasswordEmailVerificationAPI,
    isLoading,
    error,
  };
};

export const useResetPasswordSimple = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetPasswordSimpleAPI = async (data: ResetPasswordSimpleRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await resetPasswordSimple(data);

      if (response?.success) {
        return response;
      } else {
        // Handle API error response
        let errorMessage = "Password reset failed";

        if (response?.message) {
          if (Array.isArray(response.message)) {
            errorMessage = response.message.join(", ");
          } else {
            errorMessage = response.message;
          }
        } else if (response?.error) {
          errorMessage = response.error;
        }

        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      console.error("❌ Reset password simple hook error:", err);

      let errorMessage = "Network error occurred";

      // Handle different types of backend errors
      if (err?.response?.data?.message) {
        if (Array.isArray(err.response.data.message)) {
          errorMessage = err.response.data.message.join(", ");
        } else {
          errorMessage = err.response.data.message;
        }
      } else if (err?.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err?.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    resetPasswordSimpleAPI,
    isLoading,
    error,
  };
};

export const useGetQuestionnaire = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getQuestionnaireAPI = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getQuestionnaire();
      if (response?.success) {
        return response;
      } else {
        // Handle API error response
        let errorMessage = "Failed to fetch questionnaire";

        if (response?.message) {
          if (Array.isArray(response.message)) {
            errorMessage = response.message.join(", ");
          } else {
            errorMessage = response.message;
          }
        } else if (response?.error) {
          errorMessage = response.error;
        }

        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      console.error("❌ Get questionnaire hook error:", err);

      let errorMessage = "Network error occurred";

      // Handle different types of backend errors
      if (err?.response?.data?.message) {
        if (Array.isArray(err.response.data.message)) {
          errorMessage = err.response.data.message.join(", ");
        } else {
          errorMessage = err.response.data.message;
        }
      } else if (err?.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err?.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    getQuestionnaireAPI,
    isLoading,
    error,
  };
};

export const useSubmitQuestionnaire = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitQuestionnaireAPI = async (data: SubmitQuestionnaireRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await submitQuestionnaire(data);
      if (response?.success) {
        return response;
      } else {
        // Handle API error response
        let errorMessage = "Failed to submit questionnaire";

        if (response?.message) {
          if (Array.isArray(response.message)) {
            errorMessage = response.message.join(", ");
          } else {
            errorMessage = response.message;
          }
        } else if (response?.error) {
          errorMessage = response.error;
        }

        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      console.error("❌ Submit questionnaire hook error:", err);
      const errorMessage = err?.message || "Failed to submit questionnaire";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    submitQuestionnaireAPI,
    isLoading,
    error,
  };
};
