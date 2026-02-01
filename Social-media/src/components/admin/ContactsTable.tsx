"use client";
import { useMemo, useState } from "react";
import { useGetContactsQuery, useMarkContactReadMutation, useDeleteContactMutation, ContactResponse } from "@/store/authApi";
import { CustomTable, Column } from "@/components/admin/CustomTable";
import { toast } from "sonner";
import { CheckCircle, Mail, MailOpen } from "lucide-react";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function ContactsTable() {
  const { data, isLoading, isError, refetch } = useGetContactsQuery();
  const [markContactRead] = useMarkContactReadMutation();
  const [deleteContact] = useDeleteContactMutation();
  const [selectedContact, setSelectedContact] = useState<ContactResponse | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<{
    id: number | string;
    name: string;
  } | null>(null);

  const contacts = useMemo(() => {
    if (!data) return [];
    return data.data ?? data.results?.data ?? [];
  }, [data]);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      const day = date.getDate();
      const month = date.toLocaleDateString("en-GB", { month: "short" });
      const year = date.getFullYear();
      
      return `${day} ${month} ${year}`;
    } catch {
      return "N/A";
    }
  };

  const handleMarkAsRead = async (contactId: number | string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await markContactRead({ contactId }).unwrap();
      toast.success("Contact marked as read");
      refetch();
    } catch (error) {
      console.error("Failed to mark contact as read:", error);
      toast.error("Failed to mark contact as read");
    }
  };

  const handleRowClick = (contact: ContactResponse) => {
    setSelectedContact(contact);
    setIsDetailsModalOpen(true);
    
    // Auto-mark as read when viewing
    if (!contact.is_read && contact.id) {
      markContactRead({ contactId: contact.id }).unwrap().catch(() => {
        // Silently fail if marking as read fails
      });
    }
  };

  const handleDeleteClick = (contact: ContactResponse, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!contact.id) return;
    const contactName = `${contact.first_name} ${contact.last_name}`;
    setContactToDelete({ id: contact.id, name: contactName });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!contactToDelete) return;

    try {
      await deleteContact({ contactId: contactToDelete.id }).unwrap();
      toast.success("Contact deleted successfully!");
      setDeleteDialogOpen(false);
      setContactToDelete(null);
      refetch();
    } catch (error: unknown) {
      const errorMessage =
        (error as { data?: { error?: string; message?: string } })?.data?.error ||
        (error as { data?: { error?: string; message?: string } })?.data?.message ||
        "Failed to delete contact";
      toast.error("Failed to delete contact", { description: errorMessage });
    }
  };

  type ContactRow = ContactResponse;

  const columns: Column<ContactRow>[] = [
    {
      header: "SL",
      accessor: (_, index) => index + 1,
      className: "w-16 text-center",
    },
    {
      header: "Name",
      accessor: (row) => (
        <div className="flex items-center gap-2">
          {row.is_read ? (
            <MailOpen className="w-4 h-4 text-gray-400" />
          ) : (
            <Mail className="w-4 h-4 text-blue-400" />
          )}
          <span className={row.is_read ? "text-gray-400" : "text-white font-medium"}>
            {row.first_name} {row.last_name}
          </span>
        </div>
      ),
    },
    {
      header: "Email",
      accessor: (row) => (
        <a
          href={`mailto:${row.email}`}
          className="text-blue-400 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {row.email}
        </a>
      ),
    },
    {
      header: "Subject",
      accessor: (row) => (
        <span className={row.is_read ? "text-gray-400" : "text-white"}>
          {row.subject}
        </span>
      ),
    },
    {
      header: "Message",
      accessor: (row) => (
        <span className={`line-clamp-2 ${row.is_read ? "text-gray-400" : "text-white"}`}>
          {row.message}
        </span>
      ),
      className: "max-w-xs",
    },
    {
      header: "Date",
      accessor: (row) => (
        <span className={row.is_read ? "text-gray-400" : "text-white"}>
          {formatDate(row.created_at)}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: (row) => (
        <div className="flex items-center gap-2">
          {row.is_read ? (
            <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400">
              Read
            </span>
          ) : (
            <span className="px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400">
              Unread
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Actions",
      accessor: (row) => (
        <div className="flex items-center justify-center space-x-3">
          {!row.is_read && row.id && (
            <button
              onClick={(e) => handleMarkAsRead(row.id!, e)}
              className="p-2 cursor-pointer rounded-lg bg-white/10 hover:bg-white/20 transition"
              title="Mark as read"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={(e) => handleDeleteClick(row, e)}
            className="p-2 cursor-pointer rounded-lg bg-white/10 hover:bg-white/20 transition"
            title="Delete contact"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
            </svg>
          </button>
        </div>
      ),
      className: "text-center",
    },
  ];

  return (
    <div className="w-full">
      <CustomTable
        columns={columns}
        data={contacts}
        title="All Contacts"
        description="View and manage all contact messages and inquiries"
        isLoading={isLoading}
        isError={isError}
        errorMessage="Failed to load contacts. Please try again later"
        emptyMessage="No contact submissions found"
        onRowClick={handleRowClick}
        rowClassName={(row) => (row.is_read ? "opacity-60" : "")}
      />

      {/* Contact Details Modal */}
      {isDetailsModalOpen && selectedContact && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setIsDetailsModalOpen(false)}
        >
          <div
            className="bg-[#1a1a2e] border border-white/20 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Contact Details</h2>
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">Name</label>
                <p className="text-white font-medium">
                  {selectedContact.first_name} {selectedContact.last_name}
                </p>
              </div>

              <div>
                <label className="text-sm text-gray-400">Email</label>
                <p className="text-white">
                  <a
                    href={`mailto:${selectedContact.email}`}
                    className="text-blue-400 hover:underline"
                  >
                    {selectedContact.email}
                  </a>
                </p>
              </div>

              <div>
                <label className="text-sm text-gray-400">Subject</label>
                <p className="text-white font-medium">{selectedContact.subject}</p>
              </div>

              <div>
                <label className="text-sm text-gray-400">Message</label>
                <p className="text-white whitespace-pre-wrap bg-white/5 p-4 rounded-lg">
                  {selectedContact.message}
                </p>
              </div>

              <div>
                <label className="text-sm text-gray-400">Submitted</label>
                <p className="text-white">{formatDate(selectedContact.created_at)}</p>
              </div>

              {selectedContact.is_read && selectedContact.read_at && (
                <div>
                  <label className="text-sm text-gray-400">Read</label>
                  <p className="text-white">
                    {formatDate(selectedContact.read_at)}
                    {selectedContact.read_by_name && ` by ${selectedContact.read_by_name}`}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-4">
              {!selectedContact.is_read && selectedContact.id && (
                <button
                  onClick={async () => {
                    try {
                      await markContactRead({ contactId: selectedContact.id! }).unwrap();
                      toast.success("Contact marked as read");
                      setIsDetailsModalOpen(false);
                      refetch();
                    } catch (error) {
                      toast.error("Failed to mark contact as read");
                    }
                  }}
                  className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-white transition-colors"
                >
                  Mark as Read
                </button>
              )}
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Contact?"
        description={`Are you sure you want to delete the contact from "${contactToDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setContactToDelete(null);
        }}
      />
    </div>
  );
}

