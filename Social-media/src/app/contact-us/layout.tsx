import React from "react";
import PublicLayout from "../../../components/Layouts/PublicLayout";

/**
 * Public Contact Us Layout - No authentication required
 */
export default function ContactUsLayout({ children }: { children: React.ReactNode }) {
  return <PublicLayout>{children}</PublicLayout>;
}

