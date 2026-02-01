import React from "react";
import PublicLayout from "../../../components/Layouts/PublicLayout";

/**
 * Public Help Support Layout - No authentication required
 */
export default function HelpSupportLayout({ children }: { children: React.ReactNode }) {
  return <PublicLayout>{children}</PublicLayout>;
}

