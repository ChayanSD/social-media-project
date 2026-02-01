"use client";

import { Toaster as SonnerToaster } from "sonner";

type ToasterProps = React.ComponentProps<typeof SonnerToaster>;

const Toaster = (props: ToasterProps) => {
  return (
    <SonnerToaster
      position="top-center"
      toastOptions={{
        classNames: {
          toast: "bg-[#06133F] text-white border border-white/20",
          description: "text-gray-300",
          actionButton:
            "bg-white text-black hover:bg-gray-100 transition-colors",
          cancelButton:
            "bg-transparent text-white border border-white/30 hover:bg-white/10",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
export { toast } from "sonner";

