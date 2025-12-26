"use client";
import { Fragment, ReactNode } from "react";
import { Dialog, DialogPanel, Transition, TransitionChild } from "@headlessui/react";

export function AdminDrawer({ open, onClose, children }: Readonly<{ open: boolean; onClose: () => void; children: ReactNode }>) {
  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="fixed inset-0 z-50" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/45 backdrop-blur-sm" aria-hidden="true" />
        </TransitionChild>

        <div className="fixed inset-y-0 left-0 flex w-full max-w-[260px] flex-col outline-none">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="ease-in duration-150"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <DialogPanel className="h-full overflow-y-auto border-r border-border bg-card/95 p-4 shadow-elevated ring-1 ring-border/70 backdrop-blur-xl outline-none">
              {children}
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}
