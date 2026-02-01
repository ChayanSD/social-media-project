import React from "react";
import PublicLayout from "../../../components/Layouts/PublicLayout";

/**
 * Public Explore Layout - No authentication required
 */
export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return <PublicLayout>{children}</PublicLayout>;
}

