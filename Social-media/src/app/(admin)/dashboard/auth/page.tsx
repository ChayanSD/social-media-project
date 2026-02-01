"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { IoArrowBack } from "react-icons/io5";
import { 
  useLoginMutation,
  useSendPasswordResetOtpMutation,
  useVerifyPasswordResetOtpMutation,
  useResetPasswordMutation
} from "@/store/authApi";
import { storeAuthTokens, getRoleFromToken } from "@/lib/auth";
import { store } from "@/store/store";
import { baseApi } from "@/store/baseApi";
import { toast } from "sonner";

type LoginForm = {
  email: string;
  password: string;
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

export default function AdminLoginPage() {
  const router = useRouter();
  const [currentMode, setCurrentMode] = useState<'login' | 'reset-step1' | 'reset-step2' | 'reset-step3'>('login');
  const [resetEmail, setResetEmail] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const [login, { isLoading: isLoggingIn, error: loginError }] = useLoginMutation();
  const [sendPasswordResetOtp, { isLoading: isSendingOtp }] = useSendPasswordResetOtpMutation();
  const [verifyPasswordResetOtp, { isLoading: isVerifyingOtp }] = useVerifyPasswordResetOtpMutation();
  const [resetPassword, { isLoading: isResettingPassword }] = useResetPasswordMutation();

  const loginForm = useForm<LoginForm>();
  const resetStep1Form = useForm<ResetStep1Form>();
  const resetStep2Form = useForm<ResetStep2Form>();
  const resetStep3Form = useForm<ResetStep3Form>();

  const onLoginSubmit = async (data: LoginForm) => {
    setError("");
    setIsLoading(true);

    try {
      const response = await login({
        email_or_username: data.email.trim(),
        password: data.password,
      }).unwrap();

      console.log("Login response:", response);

      // Check if response has success flag
      if ((response as { success?: boolean }).success === false) {
        const errorMsg = (response as { error?: string; message?: string }).error || 
                         (response as { error?: string; message?: string }).message || 
                         "Login failed";
        setError(errorMsg);
        setIsLoading(false);
        toast.error("Login failed", { description: errorMsg });
        return;
      }

      const accessToken =
        response.tokens?.access ||
        (typeof response.token === "string" ? response.token : undefined);
      const refreshToken = response.tokens?.refresh;

      if (!accessToken) {
        console.error("No access token in response:", response);
        setError("Login failed: No access token received");
        setIsLoading(false);
        return;
      }

      // Get role from token or response
      const role =
        getRoleFromToken(accessToken) || response.user?.role || "user";

      // Check if user is admin
      if (role !== "admin") {
        setError("Access denied. Admin credentials required.");
        setIsLoading(false);
        return;
      }

      // Clear RTK Query cache before storing new tokens
      store.dispatch(baseApi.util.resetApiState());

      // Store tokens
      const persistSession = Boolean(data.rememberMe);
      storeAuthTokens({
        accessToken,
        refreshToken: typeof refreshToken === "string" ? refreshToken : undefined,
        persist: persistSession,
      });

      // Store user data
      if (typeof window !== "undefined" && response.user) {
        const primaryStorage = persistSession
          ? window.localStorage
          : window.sessionStorage;
        const secondaryStorage = persistSession
          ? window.sessionStorage
          : window.localStorage;

        primaryStorage.setItem("user", JSON.stringify(response.user));
        secondaryStorage.removeItem("user");
        primaryStorage.setItem("role", role);
        secondaryStorage.removeItem("role");
      }

      toast.success("Admin login successful");
      router.push("/dashboard");
    } catch (err: unknown) {
      console.error("Admin login failed:", err);
      console.error("Error type:", typeof err);
      console.error("Error stringified:", JSON.stringify(err, null, 2));
      
      // Handle different error formats from RTK Query
      let errorMessage = "Invalid admin credentials";
      
      if (err && typeof err === 'object') {
        // RTK Query error format: { data: {...}, status: number }
        const rtkError = err as { 
          data?: { 
            error?: string; 
            message?: string;
            details?: unknown;
            success?: boolean;
          };
          status?: number;
          error?: string;
          originalStatus?: number;
        };
        
        // Check data.error (most common - backend returns this)
        if (rtkError.data?.error) {
          errorMessage = rtkError.data.error;
        }
        // Check data.message
        else if (rtkError.data?.message) {
          errorMessage = rtkError.data.message;
        }
        // Check top-level error
        else if (rtkError.error && typeof rtkError.error === 'string') {
          errorMessage = rtkError.error;
        }
        // Check for validation errors in details
        else if (rtkError.data?.details && typeof rtkError.data.details === 'object') {
          const details = rtkError.data.details as Record<string, unknown>;
          const firstKey = Object.keys(details)[0];
          const firstError = details[firstKey];
          if (Array.isArray(firstError) && firstError.length > 0) {
            errorMessage = String(firstError[0]);
          } else if (typeof firstError === 'string') {
            errorMessage = firstError;
          } else if (Array.isArray(firstError)) {
            errorMessage = String(firstError[0]);
          }
        }
        // Handle HTTP status codes
        else if (rtkError.status === 401 || rtkError.originalStatus === 401) {
          errorMessage = "Invalid username or password";
        } else if (rtkError.status === 403 || rtkError.originalStatus === 403) {
          errorMessage = "Access denied. Please verify your account.";
        } else if (rtkError.status === 400 || rtkError.originalStatus === 400) {
          errorMessage = "Invalid request. Please check your input.";
        } else if (rtkError.status === 500 || rtkError.originalStatus === 500) {
          errorMessage = "Server error. Please try again later.";
        } else if (String(rtkError.status) === 'FETCH_ERROR' || String(rtkError.status) === 'PARSING_ERROR') {
          errorMessage = "Network error. Please check your connection.";
        }
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      setError(errorMessage);
      toast.error("Login failed", { description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const onResetStep1Submit = async (data: ResetStep1Form) => {
    try {
      await sendPasswordResetOtp({ email: data.email }).unwrap();
      setResetEmail(data.email);
      setCurrentMode('reset-step2');
      toast.success('OTP sent', {
        description: 'Please check your email for the verification code.',
      });
    } catch (error) {
      console.error("Failed to send OTP:", error);
      toast.error('Failed to send OTP. Please try again.');
    }
  };

  const onResetStep2Submit = async (data: ResetStep2Form) => {
    try {
      await verifyPasswordResetOtp({ email: resetEmail, code: data.otp }).unwrap();
      setResetOtp(data.otp);
      setCurrentMode('reset-step3');
      toast.success('OTP verified');
    } catch (error) {
      console.error("Failed to verify OTP:", error);
      toast.error('Invalid or expired OTP. Please try again.');
    }
  };

  const onResetStep3Submit = async (data: ResetStep3Form) => {
    if (data.newPassword !== data.confirmPassword) {
      resetStep3Form.setError("confirmPassword", {
        type: "manual",
        message: "Passwords do not match"
      });
      return;
    }

    try {
      await resetPassword({
        email: resetEmail,
        code: resetOtp,
        new_password: data.newPassword,
        confirm_password: data.confirmPassword,
      }).unwrap();
      
      toast.success('Password reset successfully', {
        description: 'You can now login with your new password.',
      });
      
      // Reset forms and go back to login
      setCurrentMode('login');
      resetStep1Form.reset();
      resetStep2Form.reset();
      resetStep3Form.reset();
      setResetEmail("");
      setResetOtp("");
    } catch (error) {
      console.error("Failed to reset password:", error);
      toast.error('Failed to reset password. Please try again.');
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#1F2149] text-white px-4">
      <div className="bg-[#1F2149] border-[2px] border-[#919191] rounded-2xl py-8 px-4 sm:px-10 max-w-2xl w-full text-white shadow-xl">
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
            <h1 className="text-center text-2xl mb-4">
              Admin Login
            </h1>
            <p className="text-center text-gray-300 mb-10">
              Please fill in your unique admin login details below
            </p>

            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6 flex flex-col">
              {/* Username/Email */}
              <div>
                <label className="block mb-2 text-sm">
                  Username or Email
                </label>
                <input
                  {...loginForm.register("email", {
                    required: "Username or Email is required",
                  })}
                  type="text"
                  className="w-full px-4 py-3 rounded-full bg-transparent border border-gray-400 text-white outline-none focus:ring-2 focus:ring-green-400"
                  placeholder="Enter your username or email"
                />
                {loginForm.formState.errors.email && (
                  <p className="text-red-400 text-xs mt-1">
                    {loginForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block mb-2 text-sm">
                  Password
                </label>
                <input
                  {...loginForm.register("password", { required: "Password is required" })}
                  type="password"
                  className="w-full px-4 py-3 rounded-full bg-transparent border border-gray-400 text-white outline-none focus:ring-2 focus:ring-green-400"
                  placeholder="Enter your password"
                />
                {loginForm.formState.errors.password && (
                  <p className="text-red-400 text-xs mt-1">
                    {loginForm.formState.errors.password.message}
                  </p>
                )}

                {/* Remember Me Checkbox */}
                <div className="flex items-center gap-2 mt-2">
                  
                </div>

                <div className=" m-3 flex justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...loginForm.register("rememberMe")}
                      className="accent-green-500"
                    />
                    <span className="text-sm text-[#299616]">Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setCurrentMode('reset-step1')}
                    className="text-red-400 text-xs hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>

              {/* ERROR MESSAGE */}
              {(error || loginError) && (
                <p className="text-red-400 text-center text-sm">
                  {error || "Invalid credentials. Please try again."}
                </p>
              )}

              {/* BUTTON */}
              <button
                type="submit"
                disabled={isLoading || isLoggingIn}
                className="max-w-[280px] w-full self-center bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white py-3 rounded-full font-medium transition-all"
              >
                {isLoading || isLoggingIn ? "Signing in..." : "Sign in"}
              </button>
            </form>
          </>
        )}

        {/* Password Reset Step 1 - Email Input */}
        {currentMode === 'reset-step1' && (
          <>
            <h1 className="text-center text-2xl mb-4">Reset your Password</h1>
            <p className="text-center text-gray-300 mb-10">
              Enter your email address and we&apos;ll send you a verification code to reset your password.
            </p>

            <form onSubmit={resetStep1Form.handleSubmit(onResetStep1Submit)} className="space-y-6 flex flex-col">
              <div>
                <label className="block mb-2 text-sm">
                  Email Address
                </label>
                <input
                  {...resetStep1Form.register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address"
                    }
                  })}
                  type="email"
                  className="w-full px-4 py-3 rounded-full bg-transparent border border-gray-400 text-white outline-none focus:ring-2 focus:ring-green-400"
                  placeholder="Enter your email address"
                />
                {resetStep1Form.formState.errors.email && (
                  <p className="text-red-400 text-xs mt-1">
                    {resetStep1Form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSendingOtp}
                className="max-w-[280px] w-full self-center bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white py-3 rounded-full font-medium transition-all"
              >
                {isSendingOtp ? "Sending..." : "Send OTP"}
              </button>
            </form>
          </>
        )}

        {/* Password Reset Step 2 - OTP Verification */}
        {currentMode === 'reset-step2' && (
          <>
            <h1 className="text-center text-2xl mb-4">Verify OTP</h1>
            <p className="text-center text-gray-300 mb-10">
              Enter the verification code sent to <span className="text-green-400">{resetEmail}</span>
            </p>

            <form onSubmit={resetStep2Form.handleSubmit(onResetStep2Submit)} className="space-y-6 flex flex-col">
              <div>
                <label className="block mb-2 text-sm">
                  Verification Code
                </label>
                <input
                  {...resetStep2Form.register("otp", {
                    required: "OTP is required",
                    pattern: {
                      value: /^\d{6}$/,
                      message: "OTP must be 6 digits"
                    }
                  })}
                  type="text"
                  maxLength={6}
                  className="w-full px-4 py-3 rounded-full bg-transparent border border-gray-400 text-white outline-none focus:ring-2 focus:ring-green-400 text-center tracking-widest text-lg"
                  placeholder="Enter 6-digit OTP"
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
                className="text-sm text-green-400 hover:underline text-center"
              >
                Resend OTP
              </button>

              <button
                type="submit"
                disabled={isVerifyingOtp}
                className="max-w-[280px] w-full self-center bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white py-3 rounded-full font-medium transition-all"
              >
                {isVerifyingOtp ? "Verifying..." : "Verify OTP"}
              </button>
            </form>
          </>
        )}

        {/* Password Reset Step 3 - New Password */}
        {currentMode === 'reset-step3' && (
          <>
            <h1 className="text-center text-2xl mb-4">Reset your Password</h1>
            <p className="text-center text-gray-300 mb-10">
              Enter your new password below.
            </p>

            <form onSubmit={resetStep3Form.handleSubmit(onResetStep3Submit)} className="space-y-6 flex flex-col">
              <div>
                <label className="block mb-2 text-sm">
                  New Password
                </label>
                <input
                  {...resetStep3Form.register("newPassword", {
                    required: "New password is required",
                    minLength: {
                      value: 8,
                      message: "Password must be at least 8 characters",
                    },
                  })}
                  type="password"
                  className="w-full px-4 py-3 rounded-full bg-transparent border border-gray-400 text-white outline-none focus:ring-2 focus:ring-green-400"
                  placeholder="Enter new password"
                />
                {resetStep3Form.formState.errors.newPassword && (
                  <p className="text-red-400 text-xs mt-1">
                    {resetStep3Form.formState.errors.newPassword.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block mb-2 text-sm">
                  Confirm Password
                </label>
                <input
                  {...resetStep3Form.register("confirmPassword", {
                    required: "Please confirm your password",
                  })}
                  type="password"
                  className="w-full px-4 py-3 rounded-full bg-transparent border border-gray-400 text-white outline-none focus:ring-2 focus:ring-green-400"
                  placeholder="Confirm new password"
                />
                {resetStep3Form.formState.errors.confirmPassword && (
                  <p className="text-red-400 text-xs mt-1">
                    {resetStep3Form.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <p className="text-sm text-gray-300 text-center">
                Resetting your password will log you out on all devices
              </p>

              <button
                type="submit"
                disabled={isResettingPassword}
                className="max-w-[280px] w-full self-center bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white py-3 rounded-full font-medium transition-all"
              >
                {isResettingPassword ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
