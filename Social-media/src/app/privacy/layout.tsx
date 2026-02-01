import React from "react";
import PublicLayout from "../../../components/Layouts/PublicLayout";

/**
 * Public Privacy Layout - No authentication required
 */
export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <PublicLayout>{children}</PublicLayout>;
}

