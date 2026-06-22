// Shared validation utilities
// Keep these functions UI-agnostic and reusable across screens.

export type TranslationFn = (key: string) => string;

const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 20;
// Allow: Unicode letters (\p{L}), space (only), hyphen (-), straight apostrophe ('), curly apostrophe (')
// Reject: numbers, tab, symbols (@!#$%_*<>/\?=+,. etc.)
const NAME_REGEX = /^[\p{L} \-'\u2019]+$/u;

export const validateFirstName = (
  firstName: string,
  t?: TranslationFn,
): string | null => {
  const trimmed = firstName.trim();
  if (!trimmed) {
    return t?.("validation.firstNameRequired") ?? "First name is required";
  }
  if (trimmed.length < NAME_MIN_LENGTH || trimmed.length > NAME_MAX_LENGTH) {
    return (
      t?.("validation.firstNameLength") ??
      `First name must be ${NAME_MIN_LENGTH}-${NAME_MAX_LENGTH} characters`
    );
  }
  if (!NAME_REGEX.test(trimmed)) {
    return (
      t?.("validation.firstNameLettersOnly") ??
      "Only letters, spaces, hyphens and apostrophes are allowed"
    );
  }
  return null;
};

export const validateLastName = (
  lastName: string,
  t?: TranslationFn,
): string | null => {
  const trimmed = lastName.trim();
  if (!trimmed) {
    return t?.("validation.lastNameRequired") ?? "Last name is required";
  }
  if (trimmed.length < NAME_MIN_LENGTH || trimmed.length > NAME_MAX_LENGTH) {
    return (
      t?.("validation.lastNameLength") ??
      `Last name must be ${NAME_MIN_LENGTH}-${NAME_MAX_LENGTH} characters`
    );
  }
  if (!NAME_REGEX.test(trimmed)) {
    return (
      t?.("validation.lastNameLettersOnly") ??
      "Only letters, spaces, hyphens and apostrophes are allowed"
    );
  }
  return null;
};

export const validateEmail = (
  email: string,
  t?: TranslationFn,
): string | null => {
  if (!email || !email.trim()) {
    return t?.("validation.emailRequired") ?? "Email address is required";
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return (
      t?.("validation.enterValidEmailAddress") ??
      "Please enter a valid email address"
    );
  }

  return null;
};

const PHONE_MIN_DIGITS = 10;
const PHONE_MAX_DIGITS = 15;

export const validatePhoneNumber = (
  phone: string,
  t?: TranslationFn,
): string | null => {
  if (!phone || !phone.trim()) {
    return t?.("validation.phoneRequired") ?? "Phone number is required";
  }

  const digitsOnly = phone.replace(/\D/g, "");
  if (digitsOnly.length < PHONE_MIN_DIGITS) {
    return (
      t?.("validation.phoneMinLength") ??
      `Phone number must be at least ${PHONE_MIN_DIGITS} digits`
    );
  }
  if (digitsOnly.length > PHONE_MAX_DIGITS) {
    return (
      t?.("validation.phoneMaxLength") ??
      `Phone number must be at most ${PHONE_MAX_DIGITS} digits`
    );
  }

  return null;
};

export const validateUsername = (
  username: string,
  t?: TranslationFn,
): string | null => {
  if (!username || !username.trim()) {
    return t?.("validation.usernameRequired") ?? "Username is required";
  }

  const trimmed = username.trim();
  if (trimmed.length < 2) {
    return (
      t?.("validation.usernameMinLength") ??
      "Username must be at least 2 characters"
    );
  }
  if (trimmed.length > 30) {
    return (
      t?.("validation.usernameMaxLength") ??
      "Username must be at most 30 characters"
    );
  }
  if (!/^[a-zA-Z0-9]+$/.test(trimmed)) {
    return (
      t?.("validation.usernameAlphanumeric") ??
      "Username must contain only letters and numbers"
    );
  }

  return null;
};

export const validateStrongPassword = (
  password: string,
  t?: TranslationFn,
): string | null => {
  if (!password) {
    return t?.("validation.passwordRequired") ?? "Password is required";
  }

  if (password.length < 8 || password.length > 16) {
    return (
      t?.("validation.passwordLength") ?? "Password must be 8-16 characters"
    );
  }
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  if (!(hasUppercase && hasLowercase && hasNumber && hasSymbol)) {
    return (
      t?.("validation.passMustBe8CharLong") ??
      "Password must have uppercase, lowercase, number, and symbol"
    );
  }

  return null;
};

export const validateConfirmPassword = (
  password: string,
  confirmPassword: string,
  t?: TranslationFn,
): string | null => {
  if (!confirmPassword) {
    return (
      t?.("validation.confirmPasswordRequired") ??
      "Please confirm your password"
    );
  }
  if (password !== confirmPassword) {
    return t?.("validation.passwordsDoNotMatch") ?? "Passwords do not match";
  }
  return null;
};

export const validateOTP = (
  code: string,
  codeLength: number = 6,
  t?: TranslationFn,
): string | null => {
  const trimmed = (code ?? "").trim();
  if (!trimmed || trimmed.length !== codeLength || !/^\d+$/.test(trimmed)) {
    // Matches current VerifyEmailScreen message
    return (
      t?.("validation.enterValidOtp") ??
      `Please enter a valid ${codeLength}-digit code`
    );
  }
  return null;
};

export const validateSignInForm = (
  email: string,
  password: string,
  t?: TranslationFn,
): { isValid: boolean; errors: { email?: string; password?: string } } => {
  const errors: { email?: string; password?: string } = {};

  const emailError = validateEmail(email, t);
  if (emailError) errors.email = emailError;

  if (!password) {
    errors.password =
      t?.("validation.passwordRequired") ?? "Password is required";
  }

  return { isValid: Object.keys(errors).length === 0, errors };
};

export type CreateAccountErrors = {
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  acceptTerms?: string;
  confirmAge?: string;
  acknowledgeEducational?: string;
};

export const validateCreateAccountForm = (params: {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  confirmAge: boolean;
  acknowledgeEducational: boolean;
  t?: TranslationFn;
}): { isValid: boolean; errors: CreateAccountErrors } => {
  const {
    firstName,
    lastName,
    username,
    email,
    password,
    confirmPassword,
    acceptTerms,
    confirmAge,
    acknowledgeEducational,
    t,
  } = params;

  const errors: CreateAccountErrors = {};

  const firstNameError = validateFirstName(firstName, t);
  if (firstNameError) errors.firstName = firstNameError;

  const lastNameError = validateLastName(lastName, t);
  if (lastNameError) errors.lastName = lastNameError;

  const usernameError = validateUsername(username, t);
  if (usernameError) errors.username = usernameError;

  const emailError = validateEmail(email, t);
  if (emailError) errors.email = emailError;

  const passwordError = validateStrongPassword(password, t);
  if (passwordError) errors.password = passwordError;

  const confirmPasswordError = validateConfirmPassword(
    password,
    confirmPassword,
    t,
  );
  if (confirmPasswordError) errors.confirmPassword = confirmPasswordError;

  if (!acceptTerms)
    errors.acceptTerms =
      "You must accept the Terms of Service and Privacy Policy";
  if (!confirmAge)
    errors.confirmAge = "You must confirm that you are at least 18 years old";
  if (!acknowledgeEducational)
    errors.acknowledgeEducational =
      "You must acknowledge that this app is for educational use";

  return { isValid: Object.keys(errors).length === 0, errors };
};
