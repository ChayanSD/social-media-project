import React from "react";
import PublicLayout from "../../../components/Layouts/PublicLayout";

/**
 * Public About Us Layout - No authentication required
 */
export default function AboutUsLayout({ children }: { children: React.ReactNode }) {
  return <PublicLayout>{children}</PublicLayout>;
}

