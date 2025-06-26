"use client";
import * as React from "react";
import {
  Dialog as RadixDialog,
  DialogTrigger as RadixDialogTrigger,
  DialogTitle as RadixDialogTitle,
  DialogDescription as RadixDialogDescription,
  DialogClose as RadixDialogClose,
  DialogContent as RadixDialogContentPrimitive,
  DialogOverlay as RadixDialogOverlay,
} from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

// Re-export with shadcn/ui naming and structure
export const Dialog = RadixDialog;
export const DialogTrigger = RadixDialogTrigger;
export const DialogTitle = RadixDialogTitle;
export const DialogDescription = RadixDialogDescription;
export const DialogClose = RadixDialogClose;

export const DialogHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
  )
);
DialogHeader.displayName = "DialogHeader";

export const DialogFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
  )
);
DialogFooter.displayName = "DialogFooter";

export const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof RadixDialogOverlay>,
  React.ComponentPropsWithoutRef<typeof RadixDialogOverlay>
>(({ className, ...props }, ref) => (
  <RadixDialogOverlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-all animate-in fade-in",
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = "DialogOverlay";

export const DialogContent = React.forwardRef<
  React.ElementRef<typeof RadixDialogContentPrimitive>,
  React.ComponentPropsWithoutRef<typeof RadixDialogContentPrimitive>
>(({ className, children, ...props }, ref) => (
  <>
    <DialogOverlay />
    <RadixDialogContentPrimitive
      ref={ref}
      className={cn(
        "fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-6 shadow-lg duration-200 rounded-xl",
        className
      )}
      {...props}
    >
      {children}
    </RadixDialogContentPrimitive>
  </>
));
DialogContent.displayName = "DialogContent"; 