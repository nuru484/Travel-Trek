// src/components/ui/confirmation-dialog.tsx
"use client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  requireExactMatch?: string;
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDestructive = false,
  requireExactMatch,
}: ConfirmationDialogProps) {
  const [inputValue, setInputValue] = useState("");

  const handleConfirm = () => {
    onConfirm();
    setInputValue("");
  };

  const isConfirmDisabled =
    requireExactMatch && inputValue !== requireExactMatch;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="text-left">
            {description}
          </DialogDescription>
        </DialogHeader>

        {requireExactMatch && (
          <div className="space-y-2">
            <Label htmlFor="confirm-input">
              Type{" "}
              <span className="font-mono font-bold">{requireExactMatch}</span>{" "}
              to confirm:
            </Label>
            <Input
              id="confirm-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={requireExactMatch}
              className="font-mono"
            />
          </div>
        )}

        <DialogFooter>
          <Button
            className="hover:cursor-pointer"
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setInputValue("");
            }}
          >
            {cancelText}
          </Button>
          <Button
            className="hover:cursor-pointer"
            variant={isDestructive ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
