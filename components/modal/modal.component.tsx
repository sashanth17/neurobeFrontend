import { Dialog, Transition } from "@headlessui/react";
import React, { Fragment } from "react";
import IconX from "../Icon/IconX";
import { X } from "lucide-react";

export default function Modal(props: any) {
  const {
    open,
    close,
    renderComponent,
    edit,
    addHeader,
    updateHeader,
    subTitle,
    modalIcon,
    isFullWidth,
    maxWidth = "max-w-xl",
    padding,
    closeIcon,
  } = props;

  return (
    <Transition appear show={open ?? false} as={Fragment}>
      <Dialog
        as="div"
        open={open}
        onClose={() => close()}
        className="relative z-50"
      >
        {/* Overlay */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-[black]/60" />
        </Transition.Child>

        {/* Modal Content */}
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center px-4 py-8">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className={`panel w-full ${
                  isFullWidth ? "" : maxWidth
                } rounded-lg border-0 p-0 text-black dark:text-white-dark`}
                style={{ overflow: "visible" }}
              >
                {/* SUBTITLE */}
                {subTitle || closeIcon ? (
                  <div className="flex items-center justify-between border-b border-gray-200 bg-[#fbfbfb] px-5 py-3 dark:border-gray-700 dark:bg-[#121c2c]">
                    <div className="flex-1 flex items-center gap-3">
                      {modalIcon && (
                        <div className="flex-shrink-0">
                          {modalIcon}
                        </div>
                      )}
                      {subTitle && (
                        <h3 className="text-lg font-semibold text-[#000] dark:text-white">
                          {subTitle}
                        </h3>
                      )}
                    </div>
                    {closeIcon && (
                      <button
                        type="button"
                        onClick={() => close()}
                        className="ml-4 rounded-md p-1 transition hover:bg-gray-200 dark:hover:bg-gray-700"
                      >
                        <X className="h-5 w-5 text-[#000] dark:text-gray-300" />
                      </button>
                    )}
                  </div>
                ) : null}

                {/* CONTENT */}
                <div className={`${padding ? padding : "p-5"}`} style={{ overflow: "visible" }}>
                  {renderComponent()}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
