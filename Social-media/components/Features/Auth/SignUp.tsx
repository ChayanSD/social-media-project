"use client";
import React, { useEffect, useState } from "react";
import bg from "../../../public/main-bg.jpg";
import { useForm } from "react-hook-form";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";
import { IoArrowBack } from "react-icons/io5";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useSendOtpMutation,
  useVerifyOtpMutation,
  useSetCredentialsMutation,
  useGetCategoriesQuery,
  useUpdateUserProfileMutation,
} from "@/store/authApi";
import { storeAuthTokens, getRoleFromToken } from "@/lib/auth";
import { store } from "@/store/store";
import { baseApi } from "@/store/baseApi";
import ErrorState from "../../Shared/ErrorState";

// Types for form data
type SignUpForm = {
  email: string;
  username: string;
  password: string;
  verificationCode: string;
  keepMeLoggedIn: boolean;
  rememberMe: boolean;
};

const SignUp = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [userEmail, setUserEmail] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [selectedInterests, setSelectedInterests] = useState<number[]>([]);
  const [sendOtp, { isLoading: isSendingOtp, error: otpError }] = useSendOtpMutation();
  const [verifyOtp, { isLoading: isVerifyingOtp, error: verifyOtpError }] = useVerifyOtpMutation();
  const [setCredentials, { isLoading: isSettingCredentials }] = useSetCredentialsMutation();
  const [updateUserProfile, { isLoading: isUpdatingProfile, error: updateProfileError }] = useUpdateUserProfileMutation();
  const {
    data: categoriesData,
    isLoading: isCategoriesLoading,
    isError: isCategoriesError,
    refetch: refetchCategories,
  } = useGetCategoriesQuery();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm<SignUpForm>();

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleCredentialStepSubmit = async (data: SignUpForm) => {
    if (!data.username || !data.password || !userEmail) {
      return;
    }

    // Clear any previous API errors
    clearErrors("username");
    clearErrors("password");

    try {
      // Call credentials API when form is submitted
      const credentialsResponse = await setCredentials({
        email: userEmail,
        username: data.username,
        password: data.password,
      }).unwrap();

      // Extract tokens from response
      const accessToken =
        credentialsResponse.tokens?.access ||
        credentialsResponse.token ||
        (typeof credentialsResponse.token === "string" ? credentialsResponse.token : undefined);
      const refreshToken = credentialsResponse.tokens?.refresh;
      const persistSession = Boolean(data.keepMeLoggedIn || data.rememberMe);

      if (!accessToken) {
        console.error("No token received from credentials API");
        return;
      }

      // Clear RTK Query cache before storing new tokens
      store.dispatch(baseApi.util.resetApiState());

      // Store tokens properly using the auth utility
      storeAuthTokens({
        accessToken,
        refreshToken: typeof refreshToken === "string" ? refreshToken : undefined,
        persist: persistSession,
      });

      // Get user role from token
      const role = getRoleFromToken(accessToken) || "user";

      // Store user info if available
      if (typeof window !== "undefined") {
        const primaryStorage = persistSession
          ? window.localStorage
          : window.sessionStorage;
        const secondaryStorage = persistSession
          ? window.sessionStorage
          : window.localStorage;

        const userData = credentialsResponse.user || {
          id: 0,
          email: userEmail,
          username: data.username,
          role: role,
        };

        primaryStorage.setItem("user", JSON.stringify(userData));
        secondaryStorage.removeItem("user");
        primaryStorage.setItem("role", role);
        secondaryStorage.removeItem("role");
      }

      // Move to step 4 (category selection)
      setCurrentStep(4);
    } catch (error: unknown) {
      console.error("Failed to set credentials:", error);
      
      // Handle field-specific validation errors
      const apiError = error as { data?: { username?: string[]; password?: string[]; email?: string[]; message?: string } };
      if (apiError?.data) {
        const errorData = apiError.data;
        
        // Handle username errors
        if (errorData.username && Array.isArray(errorData.username)) {
          setError("username", {
            type: "server",
            message: errorData.username[0] || "Username validation failed",
          });
        }
        
        // Handle password errors
        if (errorData.password && Array.isArray(errorData.password)) {
          setError("password", {
            type: "server",
            message: errorData.password[0] || "Password validation failed",
          });
        }
        
        // Handle other field errors (email, etc.)
        if (errorData.email && Array.isArray(errorData.email)) {
          // Email errors can be shown as a general error
          setError("root", {
            type: "server",
            message: errorData.email[0] || "Email validation failed",
          });
        }
        
        // Handle non-field errors
        if (errorData.message && !errorData.username && !errorData.password && !errorData.email) {
          setError("root", {
            type: "server",
            message: errorData.message || "Failed to create account. Please try again.",
          });
        }
      } else {
        // Fallback for unexpected error format
        setError("root", {
          type: "server",
          message: "Failed to create account. Please try again.",
        });
      }
    }
  };

  const handleSocialLogin = (provider: "google" | "apple") => {
    console.log(`Social login with ${provider}`);
  };

  const handleEmailSubmit = async (email: string) => {
    try {
      await sendOtp({ email }).unwrap();
      setUserEmail(email);
      setResendTimer(30);
      setCurrentStep(2);
    } catch (error) {
      console.error("Failed to send OTP:", error);
      // You can add error handling UI here if needed
    }
  };

  const handleVerificationSubmit = async (code: string) => {
    if (!userEmail) return;
    
    try {
      await verifyOtp({ email: userEmail, code }).unwrap();
      setCurrentStep(3);
    } catch (error) {
      console.error("Failed to verify OTP:", error);
      // You can add error handling UI here if needed
    }
  };

  const handleResendCode = async () => {
    if (userEmail) {
      try {
        await sendOtp({ email: userEmail }).unwrap();
        setResendTimer(30);
      } catch (error) {
        console.error("Failed to resend OTP:", error);
        // You can add error handling UI here if needed
      }
    }
  };

  const handleInterestToggle = (interestId: number) => {
    setSelectedInterests((prev) =>
      prev.includes(interestId)
        ? prev.filter((id) => id !== interestId)
        : [...prev, interestId]
    );
  };

  const handleFinalSubmit = async () => {
    if (selectedInterests.length === 0) {
      return;
    }

    try {
      // Update user profile with subcategories
      await updateUserProfile({
        subcategory_ids: selectedInterests,
      }).unwrap();

      // Get user role to determine redirect
      const storedRole = typeof window !== "undefined"
        ? (window.localStorage.getItem("role") || window.sessionStorage.getItem("role") || "user")
        : "user";

      // Redirect to home (or dashboard for admin) after successful signup
      // User is already logged in from the credentials step
      const redirectTarget = storedRole === "admin" ? "/dashboard" : "/";
      router.push(redirectTarget);
    } catch (error) {
      console.error("Failed to update profile:", error);
      // Even if profile update fails, user is logged in, so redirect to home
      const storedRole = typeof window !== "undefined"
        ? (window.localStorage.getItem("role") || window.sessionStorage.getItem("role") || "user")
        : "user";
      const redirectTarget = storedRole === "admin" ? "/dashboard" : "/";
      router.push(redirectTarget);
    }
  };

  const renderStep1 = () => (
    <div className="max-w-[348px] text-center text-white">
      <h2 className="text-[2rem] font-semibold mb-2">Sign Up</h2>
      <p className="text-sm mb-6">
        By continuing, you agree to our{" "}
        <span className="text-blue-300">User Agreement</span> and
        acknowledge that you understand the{" "}
        <span className="text-blue-300">Privacy Policy</span>.
      </p>

      <div className="space-y-4">
        {/* <button
          type="button"
          onClick={() => handleSocialLogin("google")}
          className="w-full cursor-pointer flex items-center justify-center gap-2 bg-gray-100 text-black py-3 rounded-full font-medium hover:bg-gray-200 transition"
        >
          <FcGoogle className="text-xl" /> Continue With Google
        </button> */}

        {/* <button
          type="button"
          onClick={() => handleSocialLogin("apple")}
          className="w-full cursor-pointer flex items-center justify-center gap-2 bg-gray-100 text-black py-3 rounded-full font-medium hover:bg-gray-200 transition"
        >
          <FaApple className="text-xl" /> Continue With Apple
        </button> */}
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          const email = formData.get("email") as string;
          if (email) handleEmailSubmit(email);
        }}>
          <input
            name="email"
            type="email"
            placeholder="Enter your email address"
            required
            className="w-full rounded-full border border-gray-300 bg-transparent px-4 py-3 text-sm placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            type="submit"
            disabled={isSendingOtp}
            className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white py-3 rounded-full font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSendingOtp ? "Sending..." : "Continue"}
          </button>
          {otpError && (
            <p className="text-red-400 text-xs mt-2 text-center">
              Failed to send OTP. Please try again.
            </p>
          )}
        </form>

        <div className="text-center mt-4">
          <Link href="/login" className="text-[#299616] hover:underline text-sm">
            Already have an account? Log in
          </Link>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="max-w-[348px] text-center text-white">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setCurrentStep(1)}
          className="text-white hover:text-gray-300"
        >
          <IoArrowBack className="text-xl" />
        </button>
        {/* <button className="text-white hover:text-gray-300 text-sm">
          Skip
        </button> */}
      </div>

      <h2 className="text-[2rem] font-semibold mb-2">Verify your email</h2>
      <p className="text-sm mb-2">
        enter the 6-digit code we sent to
      </p>
      <p className="text-sm mb-6 text-blue-300">
        {userEmail}
      </p>

      <form onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const code = formData.get("verificationCode") as string;
        if (code) handleVerificationSubmit(code);
      }}>
        <input
          name="verificationCode"
          type="text"
          placeholder="Verification code"
          maxLength={6}
          required
          className="w-full rounded-full border border-gray-300 bg-transparent px-4 py-3 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 text-center text-lg tracking-widest"
        />
        
        <div className="mt-4 text-sm">
          <p className="text-white mb-1">Didn&apos;t get an email?</p>
          {resendTimer > 0 ? (
            <p className="text-white">Resend in {resendTimer}</p>
          ) : (
            <button
              type="button"
              onClick={handleResendCode}
              disabled={isSendingOtp}
              className="text-blue-300 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSendingOtp ? "Sending..." : "Resend code"}
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={isVerifyingOtp}
          className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white py-3 rounded-full font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isVerifyingOtp ? "Verifying..." : "Continue"}
        </button>
        {verifyOtpError && (
          <p className="text-red-400 text-xs mt-2 text-center">
            Invalid verification code. Please try again.
          </p>
        )}
      </form>
    </div>
  );

  const renderStep3 = () => (
    <div className="max-w-[348px] text-center text-white">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setCurrentStep(2)}
          className="text-white hover:text-gray-300"
        >
          <IoArrowBack className="text-xl" />
        </button>
      </div>

      <h2 className="text-[2rem] font-semibold mb-2">Create your username and password</h2>
      <p className="text-sm mb-6">
        By continuing, you agree to our{" "}
        <span className="text-blue-300">User Agreement</span> and
        acknowledge that you understand the{" "}
        <span className="text-blue-300">Privacy Policy</span>.
      </p>

      <form onSubmit={handleSubmit(handleCredentialStepSubmit)} className="space-y-4">
        <div>
          <input
            {...register("username", {
              required: "Username is required",
              minLength: { value: 6, message: "Username must be at least 6 characters" }
            })}
            type="text"
            placeholder="Enter username (min. 6 characters)"
            className="w-full rounded-full border border-gray-300 bg-transparent px-4 py-3 text-sm placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          {errors.username && (
            <p className="text-red-400 text-xs mt-1">
              {errors.username.message}
            </p>
          )}
        </div>

        <div>
          <input
            {...register("password", {
              required: "Password is required",
              minLength: { value: 8, message: "Password must be at least 8 characters" }
            })}
            type="password"
            placeholder="Password"
            className="w-full rounded-full border border-gray-300 bg-transparent px-4 py-3 text-sm placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          {errors.password && (
            <p className="text-red-400 text-xs mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="flex justify-between items-center text-xs sm:text-sm">
          {/* <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...register("keepMeLoggedIn")}
              defaultChecked
              className="accent-green-500"
            />
            <span className="text-[#299616]">Keep me Log in</span>
          </label> */}

          {/* <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...register("rememberMe")}
              defaultChecked
              className="accent-green-500"
            />
            <span className="text-[#299616]">Remember me</span>
          </label> */}
        </div>

        <button
          type="submit"
          disabled={isSettingCredentials}
          className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white py-3 rounded-full font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isSettingCredentials ? "Creating account..." : "Continue"}
        </button>
        {errors.root && (
          <p className="text-red-400 text-xs mt-2 text-center">
            {errors.root.message}
          </p>
        )}
      </form>
    </div>
  );

  const renderStep4 = () => (
    <div className="max-w-[600px]  text-center text-white">
      <h2 className="text-[2rem] font-semibold mb-2">Interests</h2>
      <p className="text-sm mb-8">
        Pick things you&apos;d like to see in your home feed
      </p>

      <div className="space-y-8">
        {isCategoriesLoading ? (
          <p>Loading categories...</p>
        ) : isCategoriesError ? (
          <ErrorState
            message="Failed to load categories. Please try again later."
            onRetry={() => refetchCategories()}
          />
        ) : (
          categoriesData?.data?.map((category) => (
            <div key={category.id}>
              <h3 className="text-lg font-medium mb-4 text-left">{category.name}</h3>
              <div className="flex flex-wrap gap-3">
                {category.subcategories.map((subcategory) => (
                  <button
                    key={subcategory.id}
                    type="button"
                    onClick={() => handleInterestToggle(subcategory.id)}
                    className={`px-4 py-2 rounded-full text-sm border transition ${
                      selectedInterests.includes(subcategory.id)
                        ? "border-teal-400 bg-teal-400/20 text-teal-400"
                        : "border-gray-300 text-white hover:border-gray-200"
                    }`}
                  >
                    {subcategory.name}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <button
        onClick={handleFinalSubmit}
        disabled={
          selectedInterests.length === 0 ||
          isUpdatingProfile
        }
        className={`w-full mt-8 py-3 rounded-full font-semibold transition cursor-pointer ${
          selectedInterests.length > 0 && !isUpdatingProfile
            ? "bg-green-600 hover:bg-green-700 text-white"
            : "bg-gray-600 text-gray-400 cursor-not-allowed"
        }`}
      >
        {isUpdatingProfile
          ? "Saving preferences..."
          : selectedInterests.length > 0
            ? "Finish Sign Up"
            : "Select at least 1 interest"}
      </button>
      {updateProfileError && (
        <p className="text-red-400 text-xs mt-2 text-center">
          Failed to save your preferences. Please try again.
        </p>
      )}
    </div>
  );

  return (
    <div
      style={{
        backgroundImage: `url(${bg.src})`,
      }}
      className={`min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat px-4 ${currentStep === 4 ? 'py-10' : ''}`}
    >
      <div className="bg-[#06133FBF] max-w-[1220px] min-h-[80.18vh] mx-auto backdrop-blur-[17.5px] rounded-3xl p-8 sm:p-10 w-full flex items-center justify-center">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </div>
    </div>
  );
};

export default SignUp;