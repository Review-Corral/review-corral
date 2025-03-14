"use client";
import { useEffect, useRef, useState } from "react";

export function ClientModal() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsModalOpen(false);
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setIsModalOpen(false);
      }
    };

    if (isModalOpen) {
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isModalOpen]);

  return (
    <div className="md:w-1/2 flex justify-center">
      <button
        onClick={() => setIsModalOpen(true)}
        className="cursor-zoom-in focus:outline-none"
        type="button"
      >
        <div className="max-w-md md:max-w-fit bg-gray-200 rounded-lg flex items-center justify-center">
          <img
            height={400}
            width={600}
            src="/rc_example_1.png"
            alt="Review Corral Example 1"
          />
        </div>
      </button>
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fadeIn"
          // biome-ignore lint/a11y/useSemanticElements: <explanation>
          role="dialog"
          aria-modal="true"
        >
          <div
            ref={modalRef}
            className="relative max-w-screen-lg w-full rounded-lg animate-scaleIn"
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 focus:outline-none"
              type="button"
              aria-label="Close modal"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <div className="p-2">
              <img
                src="/rc_example_1_full.png"
                alt="Review Corral Example 1 Full"
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
