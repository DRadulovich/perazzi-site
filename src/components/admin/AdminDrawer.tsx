"use client";
import { Fragment, ReactNode } from "react";
import { Dialog, Transition } from "@headlessui/react";

export function AdminDrawer({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="fixed inset-0 z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
        </Transition.Child>

        <div className="fixed inset-y-0 left-0 flex w-full max-w-[260px] flex-col outline-none">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="ease-in duration-150"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <Dialog.Panel className="h-full overflow-y-auto border-r border-border bg-card p-4 shadow-xl outline-none">
              {children}
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
