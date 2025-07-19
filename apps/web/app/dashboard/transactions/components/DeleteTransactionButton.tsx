"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface DeleteTransactionButtonProps {
  transactionId: string;
  tenantName: string;
  propertyName: string;
  amount: number;
  paymentDate: string;
  paymentMethod: number;
  onSuccess: () => void;
}

export function DeleteTransactionButton({
  transactionId,
  tenantName,
  propertyName,
  amount,
  paymentDate,
  paymentMethod,
  onSuccess,
}: DeleteTransactionButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const getPaymentMethodName = (method: number) => {
    switch (method) {
      case 1:
        return "Cash";
      case 2:
        return "Cheque";
      case 3:
        return "Online";
      default:
        return "Unknown";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const workerUrl =
        process.env.NEXT_PUBLIC_WORKER_URL || "http://localhost:8787";

      const response = await fetch(
        `${workerUrl}/api/transaction/delete/${transactionId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete transaction");
      }

      const result = await response.json();

      toast.success("Transaction deleted successfully", {
        description: `Payment of ₹${amount.toLocaleString()} for ${tenantName} has been removed.`,
      });

      setIsOpen(false);
      onSuccess();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast.error("Failed to delete transaction", {
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          size="sm"
          className="flex-1"
          disabled={isDeleting}
        >
          {isDeleting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4 mr-2" />
          )}
          Delete Transaction
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this transaction? This action cannot
            be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="font-medium text-muted-foreground">
                Transaction ID:
              </span>
              <div className="font-mono text-xs">
                {transactionId.slice(0, 8)}...
              </div>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Amount:</span>
              <div className="font-medium">₹{amount.toLocaleString()}</div>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Tenant:</span>
              <div>{tenantName}</div>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">
                Property:
              </span>
              <div>{propertyName}</div>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">
                Payment Date:
              </span>
              <div>{formatDate(paymentDate)}</div>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">
                Payment Method:
              </span>
              <div>{getPaymentMethodName(paymentMethod)}</div>
            </div>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Transaction"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
