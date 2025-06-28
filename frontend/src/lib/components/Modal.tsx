// MIT License
//
// Copyright (c) 2025 Marcel Joachim Kloubert (https://marcel.coffee)
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import React, { useEffect } from "react";
import X from "../../assets/X";

interface ModalProps {
  onClose: (() => void) | null;
  open: boolean;
  title?: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ onClose, open, title = "", children, actions }) => {
  useEffect(() => {
    if (!open) return;

    const onKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose?.();
      }
    };

    window.addEventListener("keydown", onKeydown);
    return () => window.removeEventListener("keydown", onKeydown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    // Overlay
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={() => onClose?.()}
      tabIndex={-1}
      aria-modal="true"
      role="dialog"
    >
      {/* Modal */}
      <div
        className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 relative"
        onClick={e => e.stopPropagation()}
      >
        {onClose && (
          <button
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 cursor-pointer"
            aria-label="Close"
            onClick={() => onClose?.()}
          >
            <X width={24} height={24} />
          </button>
        )}
        {title && (
          <h2 className="text-xl font-bold mb-4">{title}</h2>
        )}

        {children}

        {actions && (
          <div className="w-full flex justify-center mt-8">{actions}</div>
        )}
      </div>
    </div>
  );
};

export default Modal;
