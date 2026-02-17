"use client";

/**
 * Custom hook for managing authentication state
 * Consolidates 64+ useState hooks into a single state machine pattern
 * Supports email, phone, and guest authentication flows
 */

import { useState, useCallback } from "react";

export type AuthStep =
  | "choice"
  | "signin"
  | "signup"
  | "forgot-password"
  | "profile"
  | "join-class";
export type SignInTab = "email" | "phone" | "username";
export type SignUpTab = "email" | "phone" | "guest" | "username";
export type PhoneOtpStep = "phone" | "verify";
export type ForgotPasswordStep = "email" | "otp" | "reset";
export type Gender = "male" | "female" | "";

export interface AuthState {
  // Main navigation
  readonly mainStep: AuthStep;
  readonly signinTab: SignInTab;
  readonly signupTab: SignUpTab;

  // Sign In - Email
  readonly signinEmailAddress: string;
  readonly signinEmailPassword: string;
  readonly signinEmailError: string | null;

  // Sign In - Phone
  readonly signinPhoneNumber: string;
  readonly signinPhonePassword: string;
  readonly signinPhoneError: string | null;

  // Sign Up - Email
  readonly signupEmailAddress: string;
  readonly signupEmailPassword: string;
  readonly signupEmailPasswordConfirm: string;
  readonly signupEmailError: string | null;
  readonly signupEmailOtpSent: boolean;

  // Sign Up - Email OTP
  readonly signupEmailOtp: string;
  readonly signupEmailOtpError: string | null;

  // Sign Up - Phone
  readonly signupPhoneNumber: string;
  readonly signupPhoneOtpStep: PhoneOtpStep;
  readonly signupPhoneOtp: string;
  readonly signupPhonePassword: string;
  readonly signupPhonePasswordConfirm: string;
  readonly signupPhoneOtpError: string | null;
  readonly signupPhoneError: string | null;

  // Sign Up - Guest
  readonly guestClassCode: string;
  readonly guestRollNumber: string;
  readonly guestPin: string;
  readonly guestError: string | null;

  // Sign Up - Username
  readonly signupUsername: string;
  readonly signupUsernamePassword: string;
  readonly signupUsernamePasswordConfirm: string;
  readonly signupUsernameError: string | null;
  readonly signupUsernameStep: "username" | "profile";

  // Sign In - Username
  readonly signinUsername: string;
  readonly signinUsernamePassword: string;
  readonly signinUsernameError: string | null;

  // Forgot Password
  readonly forgotPasswordEmail: string;
  readonly forgotPasswordOtp: string;
  readonly forgotPasswordNewPassword: string;
  readonly forgotPasswordNewPasswordConfirm: string;
  readonly forgotPasswordStep: ForgotPasswordStep;
  readonly forgotPasswordError: string | null;

  // Student Profile (collected after signup)
  readonly profileName: string;
  readonly profileGender: Gender;
  readonly profileRollNumber: string;
  readonly profilePhone: string;
  readonly profileSchoolName: string;
  readonly profileClassName: string;
  readonly profileVillage: string;
  readonly profileError: string | null;

  // Join Class
  readonly joinClassCode: string;
  readonly joinClassPin: string;
  readonly joinClassError: string | null;

  // Global loading state
  readonly isLoading: boolean;
}

export interface AuthActions {
  // Main navigation
  readonly setMainStep: (step: AuthStep) => void;
  readonly setSigninTab: (tab: SignInTab) => void;
  readonly setSignupTab: (tab: SignUpTab) => void;

  // Sign In - Email
  readonly setSigninEmailAddress: (value: string) => void;
  readonly setSigninEmailPassword: (value: string) => void;
  readonly setSigninEmailError: (error: string | null) => void;
  readonly resetSigninEmail: () => void;

  // Sign In - Phone
  readonly setSigninPhoneNumber: (value: string) => void;
  readonly setSigninPhonePassword: (value: string) => void;
  readonly setSigninPhoneError: (error: string | null) => void;
  readonly resetSigninPhone: () => void;

  // Sign Up - Email
  readonly setSignupEmailAddress: (value: string) => void;
  readonly setSignupEmailPassword: (value: string) => void;
  readonly setSignupEmailPasswordConfirm: (value: string) => void;
  readonly setSignupEmailError: (error: string | null) => void;
  readonly setSignupEmailOtpSent: (sent: boolean) => void;
  readonly resetSignupEmail: () => void;

  // Sign Up - Email OTP
  readonly setSignupEmailOtp: (value: string) => void;
  readonly setSignupEmailOtpError: (error: string | null) => void;

  // Sign Up - Phone
  readonly setSignupPhoneNumber: (value: string) => void;
  readonly setSignupPhoneOtp: (value: string) => void;
  readonly setSignupPhonePassword: (value: string) => void;
  readonly setSignupPhonePasswordConfirm: (value: string) => void;
  readonly setSignupPhoneOtpStep: (step: PhoneOtpStep) => void;
  readonly setSignupPhoneOtpError: (error: string | null) => void;
  readonly setSignupPhoneError: (error: string | null) => void;
  readonly resetSignupPhone: () => void;

  // Sign Up - Guest
  readonly setGuestClassCode: (value: string) => void;
  readonly setGuestRollNumber: (value: string) => void;
  readonly setGuestPin: (value: string) => void;
  readonly setGuestError: (error: string | null) => void;
  readonly resetGuest: () => void;

  // Sign Up - Username
  readonly setSignupUsername: (value: string) => void;
  readonly setSignupUsernamePassword: (value: string) => void;
  readonly setSignupUsernamePasswordConfirm: (value: string) => void;
  readonly setSignupUsernameError: (error: string | null) => void;
  readonly setSignupUsernameStep: (step: "username" | "profile") => void;
  readonly resetSignupUsername: () => void;

  // Sign In - Username
  readonly setSigninUsername: (value: string) => void;
  readonly setSigninUsernamePassword: (value: string) => void;
  readonly setSigninUsernameError: (error: string | null) => void;
  readonly resetSigninUsername: () => void;

  // Forgot Password
  readonly setForgotPasswordEmail: (value: string) => void;
  readonly setForgotPasswordOtp: (value: string) => void;
  readonly setForgotPasswordNewPassword: (value: string) => void;
  readonly setForgotPasswordNewPasswordConfirm: (value: string) => void;
  readonly setForgotPasswordStep: (step: "email" | "otp" | "reset") => void;
  readonly setForgotPasswordError: (error: string | null) => void;
  readonly resetForgotPassword: () => void;

  // Student Profile
  readonly setProfileName: (value: string) => void;
  readonly setProfileGender: (value: "male" | "female" | "") => void;
  readonly setProfileRollNumber: (value: string) => void;
  readonly setProfilePhone: (value: string) => void;
  readonly setProfileSchoolName: (value: string) => void;
  readonly setProfileClassName: (value: string) => void;
  readonly setProfileVillage: (value: string) => void;
  readonly setProfileError: (error: string | null) => void;
  readonly resetProfile: () => void;

  // Join Class
  readonly setJoinClassCode: (value: string) => void;
  readonly setJoinClassPin: (value: string) => void;
  readonly setJoinClassError: (error: string | null) => void;
  readonly resetJoinClass: () => void;

  // Global
  readonly setIsLoading: (loading: boolean) => void;
  readonly resetAll: () => void;
}

const initialState: AuthState = {
  mainStep: "choice",
  signinTab: "email",
  signupTab: "email",

  signinEmailAddress: "",
  signinEmailPassword: "",
  signinEmailError: null,

  signinPhoneNumber: "",
  signinPhonePassword: "",
  signinPhoneError: null,

  signupEmailAddress: "",
  signupEmailPassword: "",
  signupEmailPasswordConfirm: "",
  signupEmailError: null,
  signupEmailOtpSent: false,

  signupEmailOtp: "",
  signupEmailOtpError: null,

  signupPhoneNumber: "",
  signupPhoneOtpStep: "phone",
  signupPhoneOtp: "",
  signupPhonePassword: "",
  signupPhonePasswordConfirm: "",
  signupPhoneOtpError: null,
  signupPhoneError: null,

  guestClassCode: "",
  guestRollNumber: "",
  guestPin: "",
  guestError: null,

  // Sign Up - Username
  signupUsername: "",
  signupUsernamePassword: "",
  signupUsernamePasswordConfirm: "",
  signupUsernameError: null,
  signupUsernameStep: "username",

  // Sign In - Username
  signinUsername: "",
  signinUsernamePassword: "",
  signinUsernameError: null,

  forgotPasswordEmail: "",
  forgotPasswordOtp: "",
  forgotPasswordNewPassword: "",
  forgotPasswordNewPasswordConfirm: "",
  forgotPasswordStep: "email",
  forgotPasswordError: null,

  // Student Profile
  profileName: "",
  profileGender: "",
  profileRollNumber: "",
  profilePhone: "",
  profileSchoolName: "",
  profileClassName: "",
  profileVillage: "",
  profileError: null,

  // Join Class
  joinClassCode: "",
  joinClassPin: "",
  joinClassError: null,

  isLoading: false,
};

/**
 * Return type for useAuthState hook
 */
export type UseAuthStateReturn = { state: AuthState; actions: AuthActions };

/**
 * Custom hook for authentication state management
 * Replaces 64+ useState hooks with a single state machine
 * @returns { state, actions } - Current auth state and action creators
 */
export function useAuthState(): UseAuthStateReturn {
  const [state, setState] = useState<AuthState>(initialState);

  // Main navigation setters
  const setMainStep = useCallback((step: AuthStep) => {
    setState((prev) => ({ ...prev, mainStep: step }));
  }, []);

  const setSigninTab = useCallback((tab: SignInTab) => {
    setState((prev) => ({ ...prev, signinTab: tab }));
  }, []);

  const setSignupTab = useCallback((tab: SignUpTab) => {
    setState((prev) => ({ ...prev, signupTab: tab }));
  }, []);

  // Sign In - Email
  const setSigninEmailAddress = useCallback((value: string) => {
    setState((prev) => ({ ...prev, signinEmailAddress: value }));
  }, []);

  const setSigninEmailPassword = useCallback((value: string) => {
    setState((prev) => ({ ...prev, signinEmailPassword: value }));
  }, []);

  const setSigninEmailError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, signinEmailError: error }));
  }, []);

  const resetSigninEmail = useCallback(() => {
    setState((prev) => ({
      ...prev,
      signinEmailAddress: "",
      signinEmailPassword: "",
      signinEmailError: null,
    }));
  }, []);

  // Sign In - Phone
  const setSigninPhoneNumber = useCallback((value: string) => {
    setState((prev) => ({ ...prev, signinPhoneNumber: value }));
  }, []);

  const setSigninPhonePassword = useCallback((value: string) => {
    setState((prev) => ({ ...prev, signinPhonePassword: value }));
  }, []);

  const setSigninPhoneError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, signinPhoneError: error }));
  }, []);

  const resetSigninPhone = useCallback(() => {
    setState((prev) => ({
      ...prev,
      signinPhoneNumber: "",
      signinPhonePassword: "",
      signinPhoneError: null,
    }));
  }, []);

  // Sign Up - Email
  const setSignupEmailAddress = useCallback((value: string) => {
    setState((prev) => ({ ...prev, signupEmailAddress: value }));
  }, []);

  const setSignupEmailPassword = useCallback((value: string) => {
    setState((prev) => ({ ...prev, signupEmailPassword: value }));
  }, []);

  const setSignupEmailPasswordConfirm = useCallback((value: string) => {
    setState((prev) => ({ ...prev, signupEmailPasswordConfirm: value }));
  }, []);

  const setSignupEmailError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, signupEmailError: error }));
  }, []);

  const setSignupEmailOtpSent = useCallback((sent: boolean) => {
    setState((prev) => ({ ...prev, signupEmailOtpSent: sent }));
  }, []);

  const resetSignupEmail = useCallback(() => {
    setState((prev) => ({
      ...prev,
      signupEmailAddress: "",
      signupEmailPassword: "",
      signupEmailPasswordConfirm: "",
      signupEmailError: null,
      signupEmailOtpSent: false,
    }));
  }, []);

  // Sign Up - Email OTP
  const setSignupEmailOtp = useCallback((value: string) => {
    setState((prev) => ({ ...prev, signupEmailOtp: value }));
  }, []);

  const setSignupEmailOtpError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, signupEmailOtpError: error }));
  }, []);

  // Sign Up - Phone
  const setSignupPhoneNumber = useCallback((value: string) => {
    setState((prev) => ({ ...prev, signupPhoneNumber: value }));
  }, []);

  const setSignupPhoneOtp = useCallback((value: string) => {
    setState((prev) => ({ ...prev, signupPhoneOtp: value }));
  }, []);

  const setSignupPhonePassword = useCallback((value: string) => {
    setState((prev) => ({ ...prev, signupPhonePassword: value }));
  }, []);

  const setSignupPhonePasswordConfirm = useCallback((value: string) => {
    setState((prev) => ({ ...prev, signupPhonePasswordConfirm: value }));
  }, []);

  const setSignupPhoneOtpStep = useCallback((step: PhoneOtpStep) => {
    setState((prev) => ({ ...prev, signupPhoneOtpStep: step }));
  }, []);

  const setSignupPhoneOtpError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, signupPhoneOtpError: error }));
  }, []);

  const setSignupPhoneError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, signupPhoneError: error }));
  }, []);

  const resetSignupPhone = useCallback(() => {
    setState((prev) => ({
      ...prev,
      signupPhoneNumber: "",
      signupPhoneOtpStep: "phone",
      signupPhoneOtp: "",
      signupPhonePassword: "",
      signupPhonePasswordConfirm: "",
      signupPhoneOtpError: null,
      signupPhoneError: null,
    }));
  }, []);

  // Sign Up - Guest
  const setGuestClassCode = useCallback((value: string) => {
    setState((prev) => ({ ...prev, guestClassCode: value }));
  }, []);

  const setGuestRollNumber = useCallback((value: string) => {
    setState((prev) => ({ ...prev, guestRollNumber: value }));
  }, []);

  const setGuestPin = useCallback((value: string) => {
    setState((prev) => ({ ...prev, guestPin: value }));
  }, []);

  const setGuestError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, guestError: error }));
  }, []);

  const resetGuest = useCallback(() => {
    setState((prev) => ({
      ...prev,
      guestClassCode: "",
      guestRollNumber: "",
      guestPin: "",
      guestError: null,
    }));
  }, []);

  // Sign Up - Username
  const setSignupUsername = useCallback((value: string) => {
    setState((prev) => ({ ...prev, signupUsername: value }));
  }, []);

  const setSignupUsernamePassword = useCallback((value: string) => {
    setState((prev) => ({ ...prev, signupUsernamePassword: value }));
  }, []);

  const setSignupUsernamePasswordConfirm = useCallback((value: string) => {
    setState((prev) => ({ ...prev, signupUsernamePasswordConfirm: value }));
  }, []);

  const setSignupUsernameError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, signupUsernameError: error }));
  }, []);

  const setSignupUsernameStep = useCallback((step: "username" | "profile") => {
    setState((prev) => ({ ...prev, signupUsernameStep: step }));
  }, []);

  const resetSignupUsername = useCallback(() => {
    setState((prev) => ({
      ...prev,
      signupUsername: "",
      signupUsernamePassword: "",
      signupUsernamePasswordConfirm: "",
      signupUsernameError: null,
      signupUsernameStep: "username",
    }));
  }, []);

  // Sign In - Username
  const setSigninUsername = useCallback((value: string) => {
    setState((prev) => ({ ...prev, signinUsername: value }));
  }, []);

  const setSigninUsernamePassword = useCallback((value: string) => {
    setState((prev) => ({ ...prev, signinUsernamePassword: value }));
  }, []);

  const setSigninUsernameError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, signinUsernameError: error }));
  }, []);

  const resetSigninUsername = useCallback(() => {
    setState((prev) => ({
      ...prev,
      signinUsername: "",
      signinUsernamePassword: "",
      signinUsernameError: null,
    }));
  }, []);

  // Forgot Password
  const setForgotPasswordEmail = useCallback((value: string) => {
    setState((prev) => ({ ...prev, forgotPasswordEmail: value }));
  }, []);

  const setForgotPasswordOtp = useCallback((value: string) => {
    setState((prev) => ({ ...prev, forgotPasswordOtp: value }));
  }, []);

  const setForgotPasswordNewPassword = useCallback((value: string) => {
    setState((prev) => ({ ...prev, forgotPasswordNewPassword: value }));
  }, []);

  const setForgotPasswordNewPasswordConfirm = useCallback((value: string) => {
    setState((prev) => ({ ...prev, forgotPasswordNewPasswordConfirm: value }));
  }, []);

  const setForgotPasswordStep = useCallback(
    (step: "email" | "otp" | "reset") => {
      setState((prev) => ({ ...prev, forgotPasswordStep: step }));
    },
    [],
  );

  const setForgotPasswordError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, forgotPasswordError: error }));
  }, []);

  const resetForgotPassword = useCallback(() => {
    setState((prev) => ({
      ...prev,
      forgotPasswordEmail: "",
      forgotPasswordOtp: "",
      forgotPasswordNewPassword: "",
      forgotPasswordNewPasswordConfirm: "",
      forgotPasswordStep: "email",
      forgotPasswordError: null,
    }));
  }, []);

  // Student Profile
  const setProfileName = useCallback((value: string) => {
    setState((prev) => ({ ...prev, profileName: value }));
  }, []);

  const setProfileGender = useCallback((value: "male" | "female" | "") => {
    setState((prev) => ({ ...prev, profileGender: value }));
  }, []);

  const setProfileRollNumber = useCallback((value: string) => {
    setState((prev) => ({ ...prev, profileRollNumber: value }));
  }, []);

  const setProfilePhone = useCallback((value: string) => {
    setState((prev) => ({ ...prev, profilePhone: value }));
  }, []);

  const setProfileSchoolName = useCallback((value: string) => {
    setState((prev) => ({ ...prev, profileSchoolName: value }));
  }, []);

  const setProfileClassName = useCallback((value: string) => {
    setState((prev) => ({ ...prev, profileClassName: value }));
  }, []);

  const setProfileVillage = useCallback((value: string) => {
    setState((prev) => ({ ...prev, profileVillage: value }));
  }, []);

  const setProfileError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, profileError: error }));
  }, []);

  const resetProfile = useCallback(() => {
    setState((prev) => ({
      ...prev,
      profileName: "",
      profileGender: "",
      profileRollNumber: "",
      profilePhone: "",
      profileSchoolName: "",
      profileClassName: "",
      profileVillage: "",
      profileError: null,
    }));
  }, []);

  // Join Class
  const setJoinClassCode = useCallback((value: string) => {
    setState((prev) => ({ ...prev, joinClassCode: value }));
  }, []);

  const setJoinClassPin = useCallback((value: string) => {
    setState((prev) => ({ ...prev, joinClassPin: value }));
  }, []);

  const setJoinClassError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, joinClassError: error }));
  }, []);

  const resetJoinClass = useCallback(() => {
    setState((prev) => ({
      ...prev,
      joinClassCode: "",
      joinClassPin: "",
      joinClassError: null,
    }));
  }, []);

  // Global
  const setIsLoading = useCallback((loading: boolean) => {
    setState((prev) => ({ ...prev, isLoading: loading }));
  }, []);

  const resetAll = useCallback(() => {
    setState(initialState);
  }, []);

  const actions: AuthActions = {
    setMainStep,
    setSigninTab,
    setSignupTab,
    setSigninEmailAddress,
    setSigninEmailPassword,
    setSigninEmailError,
    resetSigninEmail,
    setSigninPhoneNumber,
    setSigninPhonePassword,
    setSigninPhoneError,
    resetSigninPhone,
    setSignupEmailAddress,
    setSignupEmailPassword,
    setSignupEmailPasswordConfirm,
    setSignupEmailError,
    setSignupEmailOtpSent,
    resetSignupEmail,
    setSignupEmailOtp,
    setSignupEmailOtpError,
    setSignupPhoneNumber,
    setSignupPhoneOtp,
    setSignupPhonePassword,
    setSignupPhonePasswordConfirm,
    setSignupPhoneOtpStep,
    setSignupPhoneOtpError,
    setSignupPhoneError,
    resetSignupPhone,
    setGuestClassCode,
    setGuestRollNumber,
    setGuestPin,
    setGuestError,
    resetGuest,
    setSignupUsername,
    setSignupUsernamePassword,
    setSignupUsernamePasswordConfirm,
    setSignupUsernameError,
    setSignupUsernameStep,
    resetSignupUsername,
    setSigninUsername,
    setSigninUsernamePassword,
    setSigninUsernameError,
    resetSigninUsername,
    setForgotPasswordEmail,
    setForgotPasswordOtp,
    setForgotPasswordNewPassword,
    setForgotPasswordNewPasswordConfirm,
    setForgotPasswordStep,
    setForgotPasswordError,
    resetForgotPassword,
    setProfileName,
    setProfileGender,
    setProfileRollNumber,
    setProfilePhone,
    setProfileSchoolName,
    setProfileClassName,
    setProfileVillage,
    setProfileError,
    resetProfile,
    setJoinClassCode,
    setJoinClassPin,
    setJoinClassError,
    resetJoinClass,
    setIsLoading,
    resetAll,
  };

  return { state, actions };
}
