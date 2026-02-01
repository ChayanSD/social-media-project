import React from "react";
import MarketPlaceLayout from "../../../../components/Layouts/MarketPlaceLayout";
import ProtectedLayout from "../../../../components/Layouts/ProtectedLayout";

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedLayout>
      <MarketPlaceLayout>{children}</MarketPlaceLayout>
    </ProtectedLayout>
  );
}
