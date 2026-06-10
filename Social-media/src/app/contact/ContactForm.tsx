"use client";

import { useState } from "react";

interface Web3FormsResponse {
  success: boolean;
  message?: string;
}

const subjects = [
  "General Inquiry",
  "Account Issue",
  "Marketplace Question",
  "Category Request",
  "Report a Problem",
  "Other",
] as const;

export default function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage("");
    setErrorMessage("");

    const accessKey = process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY;

    if (!accessKey) {
      setErrorMessage(
        "The contact form is temporarily unavailable. Please try again later."
      );
      setIsSubmitting(false);
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.append("access_key", accessKey);
    formData.append("from_name", "Interdimensional Cafe Contact Form");

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData,
      });
      const result = (await response.json()) as Web3FormsResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.message ?? "Unable to send message");
      }

      form.reset();
      setSuccessMessage(
        "Thank you! Your message has been sent. We will respond within 48 hours."
      );
    } catch (error) {
      console.error("Web3Forms submission failed:", error);
      setErrorMessage(
        "We could not send your message. Please check your connection and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-6 rounded-[32px] border border-white/10 bg-white/[0.04] p-6 md:p-10"
    >
      <input type="checkbox" name="botcheck" className="hidden" tabIndex={-1} />

      <div>
        <label htmlFor="contact-name" className="mb-2 block font-medium">
          Name
        </label>
        <input
          id="contact-name"
          name="name"
          type="text"
          required
          autoComplete="name"
          className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition-colors placeholder:text-white/35 focus:border-[#8B5CF6]"
          placeholder="Your name"
        />
      </div>

      <div>
        <label htmlFor="contact-email" className="mb-2 block font-medium">
          Email
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition-colors placeholder:text-white/35 focus:border-[#8B5CF6]"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label htmlFor="contact-subject" className="mb-2 block font-medium">
          Subject
        </label>
        <select
          id="contact-subject"
          name="subject"
          required
          defaultValue=""
          className="w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-white outline-none transition-colors focus:border-[#8B5CF6]"
        >
          <option value="" disabled>
            Select a subject
          </option>
          {subjects.map((subject) => (
            <option key={subject} value={subject}>
              {subject}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="contact-message" className="mb-2 block font-medium">
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          minLength={20}
          rows={7}
          className="w-full resize-y rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition-colors placeholder:text-white/35 focus:border-[#8B5CF6]"
          placeholder="Tell us how we can help. Please enter at least 20 characters."
        />
      </div>

      {successMessage ? (
        <p role="status" className="rounded-xl bg-emerald-500/10 p-4 text-emerald-300">
          {successMessage}
        </p>
      ) : null}

      {errorMessage ? (
        <p role="alert" className="rounded-xl bg-red-500/10 p-4 text-red-300">
          {errorMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-fit rounded-xl bg-[#FF7826] px-7 py-3 font-semibold text-white transition-colors hover:bg-[#FF7826]/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}
