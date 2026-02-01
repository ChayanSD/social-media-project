import HomeLayout from "../../../components/Layouts/HomeLayout";
import ProtectedLayout from "../../../components/Layouts/ProtectedLayout";

/**
 * Root layout - Protected route for authenticated users
 * Unauthenticated users are redirected to /explore
 */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedLayout 
      allowedRoles={["user", "admin"]} 
      fallbackRedirect="/explore"
      unauthenticatedRedirect="/explore"
    >
      <HomeLayout>{children}</HomeLayout>
    </ProtectedLayout>
  );
}
