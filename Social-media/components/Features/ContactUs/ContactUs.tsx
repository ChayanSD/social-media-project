"use client";
import React, { useState } from 'react';
import { useForm } from "react-hook-form";
import { FaPhone, FaEnvelope, FaTwitter, FaFacebook, FaInstagram, FaTelegramPlane } from "react-icons/fa";
import { FiMail } from "react-icons/fi";
import { useSubmitContactMutation } from "@/store/authApi";
import { toast } from "sonner";
import PageHeader from '../../Shared/PageHeader/PageHeader';

type Inputs = {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
}

export default function ContactUs() {
  const [submitContact, { isLoading: isSubmitting }] = useSubmitContactMutation();
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<Inputs>()

  const onSubmit = async (data: Inputs) => {
    try {
      await submitContact({
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        subject: data.subject,
        message: data.message,
      }).unwrap();
      
      toast.success("Thank you for contacting us! We'll get back to you soon.");
      setIsSubmitted(true);
      reset();
      
      // Reset success message after 5 seconds
      setTimeout(() => {
        setIsSubmitted(false);
      }, 5000);
    } catch (error) {
      console.error("Failed to submit contact:", error);
      toast.error("Failed to submit your message. Please try again.");
    }
  }

  return (
    <div className="max-w-[1220px] mx-auto px-4 py-8 text-white">
      <div className="p-4 sm:p-6 md:p-8">
        {/* Header Section */}
        <div className="mb-12">
          <PageHeader
            icon={<FiMail className="w-8 h-8 text-white" />}
            title="Get in Touch"
            description="Have a question in mind or any Feedback? Feel free to contact us using the form below or through our contact details."
          />
        </div>
        {/* Form Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-semibold mb-8 text-center">Send a Message</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8">
            {/* First Row - First Name and Last Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-300">First Name</label>
                <input
                  {...register("firstName", { required: true })}
                  className="w-full p-3 rounded-full bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all placeholder-gray-500"
                  placeholder="Enter your first name"
                />
                {errors.firstName && <span className="text-red-400 text-sm mt-1">This field is required</span>}
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-300">Last Name</label>
                <input
                  {...register("lastName", { required: true })}
                  className="w-full p-3 rounded-full bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all placeholder-gray-500"
                  placeholder="Enter your last name"
                />
                {errors.lastName && <span className="text-red-400 text-sm mt-1">This field is required</span>}
              </div>
            </div>

            {/* Second Row - Email and Subject */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-300">Email</label>
                <input
                  type="email"
                  {...register("email", {
                    required: true,
                    pattern: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i
                  })}
                  className="w-full p-3 rounded-full bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all placeholder-gray-500"
                  placeholder="Enter your email"
                />
                {errors.email && <span className="text-red-400 text-sm mt-1">Please enter a valid email</span>}
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-300">Subject</label>
                <input
                  {...register("subject", { required: true })}
                  className="w-full p-3 rounded-full bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all placeholder-gray-500"
                  placeholder="Enter subject"
                />
                {errors.subject && <span className="text-red-400 text-sm mt-1">This field is required</span>}
              </div>
            </div>

            {/* Third Row - Message */}
            <div className="w-full">
              <label className="block mb-2 text-sm font-medium text-gray-300">How can we help you today?</label>
              <textarea
                {...register("message", { required: true })}
                className="w-full p-4 rounded-3xl bg-white/5 border border-white/10 min-h-[220px] focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all placeholder-gray-500"
                placeholder="Enter your message"
              />
              {errors.message && <span className="text-red-400 text-sm mt-1">This field is required</span>}
            </div>

            {/* Submit Button - Centered */}
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={isSubmitting || isSubmitted}
                className={`px-8 py-3 rounded-full text-white font-medium transition-all hover:shadow-lg hover:shadow-purple-500/25 ${
                  isSubmitting || isSubmitted
                    ? "bg-purple-400 cursor-not-allowed"
                    : "bg-purple-600 hover:bg-purple-500"
                }`}
              >
                {isSubmitting ? "Sending..." : isSubmitted ? "Message Sent!" : "Send Message"}
              </button>
            </div>
          </form>
        </div>

        {/* Contact Links Section - Moved to bottom */}
        <div className="mt-16">
          <h2 className="text-2xl font-semibold mb-8 text-center">Contact Links</h2>
          <div className="max-w-4xl mx-auto ">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border border-white/10 rounded-2xl p-6">
              {/* Phone */}
              <div className="flex gap-4 p-6">
                <div>
                  <FaPhone className="text-xl" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">Phone</h3>
                  <p className="text-sm text-gray-300">+1 234 567 890</p>
                </div>
              </div>

              {/* Email */}
              <div className="flex gap-4 p-6">
                <div>
                  <FaEnvelope className="text-xl" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">Email</h3>
                  <p className="text-sm text-gray-300">contact@example.com</p>
                </div>
              </div>

              {/* Social */}
              <div className="flex gap-4 p-6">
                <div>
                  <FaTelegramPlane className="text-xl" />
                </div>
                <div>
                  <h3 className='font-medium mb-1'>Socials</h3>
                  <div className="flex gap-4">
                    <FaTwitter className="text-2xl hover:text-purple-400 cursor-pointer transition-colors" />
                    <FaFacebook className="text-2xl hover:text-purple-400 cursor-pointer transition-colors" />
                    <FaInstagram className="text-2xl hover:text-purple-400 cursor-pointer transition-colors" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
