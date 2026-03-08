import PendingPostsTable from "@/components/admin/PendingPostsTable";

export const metadata = {
    title: "Pending Posts | Admin Dashboard",
    description: "Manage pending posts awaiting approval",
};

export default function PendingPostsPage() {
    return (
        <div className="w-full">
            <PendingPostsTable />
        </div>
    );
}
