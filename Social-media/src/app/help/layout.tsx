import React from "react";
import PublicLayout from "../../../components/Layouts/PublicLayout";

/**
 * Public Help Layout - No authentication required
 */
export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return <PublicLayout>{children}</PublicLayout>;
}

