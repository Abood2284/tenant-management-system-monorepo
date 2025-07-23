// apps/web/app/dashboard/transactions/components/DownloadReceiptButton.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Printer, Loader2 } from "lucide-react";

interface IDownloadReceiptButtonProps {
  transactionId: string;
}

export function DownloadReceiptButton({
  transactionId,
}: IDownloadReceiptButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handlePrint() {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const workerUrl =
        process.env.NEXT_PUBLIC_WORKER_URL || "http://localhost:8787";
      const response = await fetch(
        `${workerUrl}/api/transaction/${transactionId}/receipt`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch receipt. Status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      // The filename is set by the Content-Disposition header from the server
      a.download = `bill-${transactionId}.pdf`;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error printing bill:", error);
      // You can add a user-facing error notification here (e.g., a toast)
      alert("Could not print the bill. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="flex-1"
      onClick={handlePrint}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Printer className="h-4 w-4 mr-2" />
      )}
      {isLoading ? "Printing..." : "Print Bill"}
    </Button>
  );
}
