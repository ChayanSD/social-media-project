"use client";
import React, { useState } from "react";
import bg from "../../../public/main-bg.jpg";
import { useForm } from "react-hook-form";
import { FcGoogle } from "react-icons/fc";
import { IoArrowBack } from "react-icons/io5";
import Link from "next/link";
import { 
  useLoginMutation,
  useSendPasswordResetOtpMutation,
  useVerifyPasswordResetOtpMutation,
  useResetPasswordMutation
} from "@/store/authApi";
import { useRouter } from "next/navigation";
import { getRoleFromToken, storeAuthTokens } from "@/lib/auth";
import { toast } from "sonner";
import { store } from "@/store/store";
import { baseApi } from "@/store/baseApi";

type LoginForm = {
  email: string;
  password: string;
  keepMeLoggedIn: boolean;
  rememberMe: boolean;
};

type ResetStep1Form = {
  email: string;
};

type ResetStep2Form = {
  otp: string;
};

type ResetStep3Form = {
  newPassword: string;
  confirmPassword: string;
};

const Login = () => {
  const router = useRouter();
  const [currentMode, setCurrentMode] = useState<'login' | 'reset-step1' | 'reset-step2' | 'reset-step3'>('login');
  const [resetEmail, setResetEmail] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [login, { isLoading: isLoggingIn, error: loginError }] = useLoginMutation();
  const [sendPasswordResetOtp, { isLoading: isSendingOtp }] = useSendPasswordResetOtpMutation();
  const [verifyPasswordResetOtp, { isLoading: isVerifyingOtp }] = useVerifyPasswordResetOtpMutation();
  const [resetPassword, { isLoading: isResettingPassword }] = useResetPasswordMutation();

  const loginForm = useForm<LoginForm>();
  const resetStep1Form = useForm<ResetStep1Form>();
  const resetStep2Form = useForm<ResetStep2Form>();
  const resetStep3Form = useForm<ResetStep3Form>();

  const onLoginSubmit = async (data: LoginForm) => {
    try {
      const response = await login({
        email_or_username: data.email,
        password: data.password,
      }).unwrap();

      const accessToken =
        response.tokens?.access ||
        (typeof response.token === "string" ? response.token : undefined);
      const refreshToken = response.tokens?.refresh;
      const persistSession = Boolean(data.rememberMe);

      // Clear RTK Query cache before storing new tokens
      store.dispatch(baseApi.util.resetApiState());
      
      storeAuthTokens({
        accessToken,
        refreshToken: typeof refreshToken === "string" ? refreshToken : undefined,
        persist: persistSession,
      });
      const role =
        getRoleFromToken(accessToken || null) || response.user?.role || "user";

      if (typeof window !== "undefined") {
        const primaryStorage = persistSession
          ? window.localStorage
          : window.sessionStorage;
        const secondaryStorage = persistSession
          ? window.sessionStorage
          : window.localStorage;

        if (response.user) {
          primaryStorage.setItem("user", JSON.stringify(response.user));
          secondaryStorage.removeItem("user");
        } else {
          primaryStorage.removeItem("user");
          secondaryStorage.removeItem("user");
        }

        primaryStorage.setItem("role", role);
        secondaryStorage.removeItem("role");
      }

      const redirectTarget = role === "admin" ? "/dashboard" : "/";
      router.push(redirectTarget);
    } catch (error: unknown) {
      console.error("Login failed:", error);
      toast.error('Failed to login', {
        description: (error as { data?: { error?: string; message?: string } })?.data?.error || 
                          (error as { data?: { error?: string; message?: string } })?.data?.message || 
                          'An error occurred',
      });
      // Error handling UI is shown below the form
    }
  };

  const onResetStep1Submit = async (data: ResetStep1Form) => {
    try {
      const response = await sendPasswordResetOtp({
        email: data.email,
      }).unwrap();

      if (response.success) {
        setResetEmail(data.email);
        setCurrentMode('reset-step2');
        resetStep1Form.reset();
        toast.success('OTP sent', {
          description: 'Please check your email for the verification code.',
        });
      }
    } catch (error: unknown) {
      console.error("Failed to send OTP:", error);
      toast.error('Failed to send OTP', {
        description: (error as { data?: { error?: string; message?: string } })?.data?.error || 
                          (error as { data?: { error?: string; message?: string } })?.data?.message || 
                          'An error occurred',
      });
    }
  };

  const onResetStep2Submit = async (data: ResetStep2Form) => {
    try {
      const response = await verifyPasswordResetOtp({
        email: resetEmail,
        code: data.otp,
      }).unwrap();

      if (response.success) {
        setResetOtp(data.otp);
        setCurrentMode('reset-step3');
        resetStep2Form.reset();
        toast.success('OTP verified', {
          description: 'You can now reset your password.',
        });
      }
    } catch (error: unknown) {
      console.error("Failed to verify OTP:", error);
      toast.error('Invalid OTP', {
        description: (error as { data?: { error?: string; message?: string } })?.data?.error || 
                          (error as { data?: { error?: string; message?: string } })?.data?.message || 
                          'Please check your OTP and try again',
      });
    }
  };

  const onResetStep3Submit = async (data: ResetStep3Form) => {
    if (data.newPassword !== data.confirmPassword) {
      resetStep3Form.setError("confirmPassword", {
        type: "manual",
        message: "Passwords do not match",
      });
      return;
    }

    try {
      const response = await resetPassword({
        email: resetEmail,
        code: resetOtp,
        new_password: data.newPassword,
        confirm_password: data.confirmPassword,
      }).unwrap();

      if (response.success) {
        toast.success('Password reset successful', {
          description: 'You can now login with your new password.',
        });
        resetStep3Form.reset();
        setResetEmail("");
        setResetOtp("");
        setCurrentMode('login');
      }
    } catch (error: unknown) {
      console.error("Failed to reset password:", error);
      toast.error('Failed to reset password', {
        description: (error as { data?: { error?: string; message?: string } })?.data?.error || 
                          (error as { data?: { error?: string; message?: string } })?.data?.message || 
                          'An error occurred',
      });
    }
  };

  const goBack = () => {
    if (currentMode === 'reset-step3') {
      setCurrentMode('reset-step2');
      resetStep3Form.reset();
    } else if (currentMode === 'reset-step2') {
      setCurrentMode('reset-step1');
      resetStep2Form.reset();
      setResetOtp("");
    } else if (currentMode === 'reset-step1') {
      setCurrentMode('login');
      resetStep1Form.reset();
      setResetEmail("");
    }
  };

  return (
    <div
      style={{
        backgroundImage: `url(${bg.src})`,
      }}
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat px-4 "
    >
      <div className="bg-[#06133FBF] max-w-[1220px] min-h-[80.18vh] mx-auto backdrop-blur-[17.5px] rounded-3xl p-8 sm:p-10 w-full flex items-center justify-center">
        <div className=" max-w-[348px]  text-center text-white">
          {/* Back Button - only show when not in login mode */}
          {currentMode !== 'login' && (
            <div className="flex justify-start mb-6">
              <button
                onClick={goBack}
                className="text-white hover:text-gray-300 transition"
              >
                <IoArrowBack className="w-6 h-6" />
              </button>
            </div>
          )}

          {/* Login Mode */}
          {currentMode === 'login' && (
            <>
              <h2 className="text-[2rem] font-semibold mb-2">Log in</h2>
              <p className="text-sm mb-6">
                By continuing, you agree to our{" "}
                <span className="text-blue-300">User Agreement</span> and
                acknowledge that you understand the{" "}
                <span className="text-blue-300">Privacy Policy</span>.
              </p>

              <form
                noValidate
                onSubmit={(event) => {
                  event.preventDefault();
                  loginForm.handleSubmit(onLoginSubmit)(event);
                }}
                className="space-y-4"
              >
                <div>
                  <input
                    {...loginForm.register("email", {
                      required: "Email or Username is required",
                    })}
                    type="text"
                    placeholder="Email or User Name"
                    className="w-full rounded-full border border-gray-300 bg-transparent px-4 py-3 text-sm placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-red-400 text-xs mt-1">
                      {loginForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <input
                    {...loginForm.register("password", { required: "Password is required" })}
                    type="password"
                    placeholder="Password"
                    className="w-full rounded-full border border-gray-300 bg-transparent px-4 py-3 text-sm placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  {loginForm.formState.errors.password && (
                    <p className="text-red-400 text-xs mt-1">
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div className="flex justify-between items-center text-xs sm:text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...loginForm.register("rememberMe")}
                      className="accent-green-500"
                    />
                    <span className="text-[#299616]">Remember me</span>
                  </label>
                </div>

                {/* <div className="flex items-center my-4">
                  <div className="flex-grow border-t border-gray-400"></div>
                  <span className="px-2 text-gray-200 text-sm">Or</span>
                  <div className="flex-grow border-t border-gray-400"></div>
                </div> */}

                {/* <button
                  type="button"
                  className="w-full flex items-center justify-center gap-2 bg-gray-100 text-black py-3 rounded-full font-medium hover:bg-gray-200 transition"
                >
                  <FcGoogle className="text-xl" /> Continue With Google
                </button> */}

                {/* <button
                  type="button"
                  className="w-full flex items-center justify-center gap-2 bg-gray-100 text-black py-3 rounded-full font-medium hover:bg-gray-200 transition"
                >
                  <FaApple className="text-xl" /> Continue With Apple
                </button> */}

                <div className="flex justify-between text-xs sm:text-sm mt-3">
                  <button
                    type="button"
                    onClick={() => setCurrentMode('reset-step1')}
                    className="text-red-400 hover:underline"
                  >
                    Forgot Password?
                  </button>
                  <Link href="/sign-up" className="text-[#299616] hover:underline">
                    Sign Up
                  </Link>
                </div>

                <button
                  type="button"
                  onClick={() => loginForm.handleSubmit(onLoginSubmit)()}
                  disabled={isLoggingIn}
                  className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white py-3 rounded-full font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isLoggingIn ? "Logging in..." : "Log in"}
                </button>
                {loginError && (
                  <p className="text-red-400 text-xs mt-2 text-center">
                    Invalid email/username or password. Please try again.
                  </p>
                )}
              </form>
            </>
          )}

          {/* Password Reset Step 1 - Email Input */}
          {currentMode === 'reset-step1' && (
            <>
              <h2 className="text-[2rem] font-semibold mb-2">Reset your Password</h2>
              <p className="text-sm mb-6">
                Enter your email address and we&apos;ll send you a verification code to reset your password.
              </p>

              <form
                noValidate
                onSubmit={(event) => {
                  event.preventDefault();
                  resetStep1Form.handleSubmit(onResetStep1Submit)(event);
                }}
                className="space-y-4"
              >
                <div>
                  <input
                    {...resetStep1Form.register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address"
                      }
                    })}
                    type="email"
                    placeholder="Email address"
                    className="w-full rounded-full border border-gray-300 bg-transparent px-4 py-3 text-sm placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  {resetStep1Form.formState.errors.email && (
                    <p className="text-red-400 text-xs mt-1">
                      {resetStep1Form.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => resetStep1Form.handleSubmit(onResetStep1Submit)()}
                  disabled={isSendingOtp}
                  className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white py-3 rounded-full font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSendingOtp ? "Sending..." : "Send OTP"}
                </button>
              </form>

              <div className="flex justify-end text-xs sm:text-sm mt-6">
                <Link href="#" className="text-white hover:underline">
                  Need Help?
                </Link>
              </div>
            </>
          )}

          {/* Password Reset Step 2 - OTP Verification */}
          {currentMode === 'reset-step2' && (
            <>
              <h2 className="text-[2rem] font-semibold mb-2">Verify OTP</h2>
              <p className="text-sm mb-6">
                Enter the verification code sent to <span className="text-blue-300">{resetEmail}</span>
              </p>

              <form
                noValidate
                onSubmit={(event) => {
                  event.preventDefault();
                  resetStep2Form.handleSubmit(onResetStep2Submit)(event);
                }}
                className="space-y-4"
              >
                <div>
                  <input
                    {...resetStep2Form.register("otp", {
                      required: "OTP is required",
                      pattern: {
                        value: /^\d{6}$/,
                        message: "OTP must be 6 digits"
                      }
                    })}
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    className="w-full rounded-full border border-gray-300 bg-transparent px-4 py-3 text-lg placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 text-center tracking-widest"
                  />
                  {resetStep2Form.formState.errors.otp && (
                    <p className="text-red-400 text-xs mt-1">
                      {resetStep2Form.formState.errors.otp.message}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await sendPasswordResetOtp({ email: resetEmail }).unwrap();
                      toast.success('OTP resent', {
                        description: 'Please check your email for the new verification code.',
                      });
                    } catch {
                      toast.error('Failed to resend OTP');
                    }
                  }}
                  className="w-full text-sm text-blue-300 hover:underline"
                >
                  Resend OTP
                </button>

                <button
                  type="button"
                  onClick={() => resetStep2Form.handleSubmit(onResetStep2Submit)()}
                  disabled={isVerifyingOtp}
                  className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white py-3 rounded-full font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isVerifyingOtp ? "Verifying..." : "Verify OTP"}
                </button>
              </form>
            </>
          )}

          {/* Password Reset Step 3 - New Password */}
          {currentMode === 'reset-step3' && (
            <>
              <h2 className="text-[2rem] font-semibold mb-2">Reset your Password</h2>
              <p className="text-sm mb-6">
                Enter your new password below.
              </p>

              <form
                noValidate
                onSubmit={(event) => {
                  event.preventDefault();
                  resetStep3Form.handleSubmit(onResetStep3Submit)(event);
                }}
                className="space-y-4"
              >
                <div>
                  <input
                    {...resetStep3Form.register("newPassword", {
                      required: "New password is required",
                      minLength: {
                        value: 8,
                        message: "Password must be at least 8 characters",
                      },
                    })}
                    type="password"
                    placeholder="New Password"
                    className="w-full rounded-full border border-gray-300 bg-transparent px-4 py-3 text-sm placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  {resetStep3Form.formState.errors.newPassword && (
                    <p className="text-red-400 text-xs mt-1">
                      {resetStep3Form.formState.errors.newPassword.message}
                    </p>
                  )}
                </div>

                <div>
                  <input
                    {...resetStep3Form.register("confirmPassword", {
                      required: "Please confirm your password",
                    })}
                    type="password"
                    placeholder="Confirm Password"
                    className="w-full rounded-full border border-gray-300 bg-transparent px-4 py-3 text-sm placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  {resetStep3Form.formState.errors.confirmPassword && (
                    <p className="text-red-400 text-xs mt-1">
                      {resetStep3Form.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <p className="text-sm text-gray-300 mb-4">
                  Resetting your password will log you out on all devices
                </p>

                <button
                  type="button"
                  onClick={() => resetStep3Form.handleSubmit(onResetStep3Submit)()}
                  disabled={isResettingPassword}
                  className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white py-3 rounded-full font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResettingPassword ? "Resetting..." : "Reset Password"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
