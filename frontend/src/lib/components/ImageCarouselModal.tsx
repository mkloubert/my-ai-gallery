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

import React, { useEffect, useRef, useCallback } from "react";
import type { GalleryImage } from "../types";
import { getImgPropsFromGallaryImage } from "../utils";

import ArrowLeft from "../../assets/ArrowLeft";
import ArrowRight from "../../assets/ArrowRight";

interface ImageCarouselModalProps {
  images: GalleryImage[];
  open: boolean;
  onClose: () => void;
  start?: number;
}

const ImageCarouselModal: React.FC<ImageCarouselModalProps> = ({
  images = [],
  open = false,
  onClose,
  start = 0,
}) => {
  const [current, setCurrent] = React.useState(start);

  // Thumbnail refs
  const thumbRefs = useRef<Array<HTMLImageElement | null>>([]);

  // Bild auf "start" setzen, wenn das Modal aufgeht
  useEffect(() => {
    if (open) setCurrent(start);
    // eslint-disable-next-line
  }, [open, start]);

  // Thumbnail zum aktuellen Bild scrollen
  useEffect(() => {
    if (
      open &&
      thumbRefs.current[current] &&
      typeof thumbRefs.current[current].scrollIntoView === "function"
    ) {
      thumbRefs.current[current]?.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
    // eslint-disable-next-line
  }, [current, open]);

  // ESC, ←, → abfangen
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        setCurrent((curr) => (curr - 1 + images.length) % images.length);
      } else if (e.key === "ArrowRight") {
        setCurrent((curr) => (curr + 1) % images.length);
      }
    },
    [images.length, onClose, open]
  );

  useEffect(() => {
    if (!open) return;
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey, open]);

  if (!open || images.length === 0) return null;

  const handlePrev = () =>
    setCurrent((curr) => (curr - 1 + images.length) % images.length);
  const handleNext = () => setCurrent((curr) => (curr + 1) % images.length);

  // Overlay click schließt Modal
  const handleOverlayClick = () => onClose();

  // Verhindert Schließen bei Klick ins Modal
  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      tabIndex={0}
      onClick={handleOverlayClick}
      aria-modal="true"
      role="dialog"
    // autofocus gibt's so nicht, der Fokus bleibt aber erhalten
    >
      <div
        className="relative flex flex-col items-center w-full h-full"
        onClick={stopPropagation}
      >
        <img
          className="max-w-[90vw] max-h-[80vh] rounded shadow-xl select-none"
          draggable={false}
          {...getImgPropsFromGallaryImage(images[current])}
        />

        <button
          className="cursor-pointer absolute left-2 top-1/2 -translate-y-1/2 text-white bg-black/40 hover:bg-black/60 rounded-full p-2"
          onClick={handlePrev}
          aria-label="Back"
        >
          <ArrowLeft />
        </button>
        <button
          className="cursor-pointer absolute right-2 top-1/2 -translate-y-1/2 text-white bg-black/40 hover:bg-black/60 rounded-full p-2"
          onClick={handleNext}
          aria-label="Next"
        >
          <ArrowRight />
        </button>

        <div className="absolute bottom-4 w-full flex justify-center">
          <div className="flex gap-2 px-4 overflow-x-auto scrollbar-thin max-w-xl rounded bg-black/30 py-2">
            {images.map((image, i) => (
              <img
                key={image.apiImage?.name ?? i}
                {...getImgPropsFromGallaryImage(image)}
                className={
                  "h-10 w-16 object-cover rounded cursor-pointer border-2 transition-all flex-shrink-0" +
                  (i === current ? " border-blue-400" : "")
                }
                onClick={() => setCurrent(i)}
                ref={(el) => (thumbRefs.current[i] = el)}
                draggable={false}
              />
            ))}
          </div>
        </div>

        <button
          className="cursor-pointer absolute top-4 right-4 text-gray-200 hover:text-white text-2xl"
          onClick={handleOverlayClick}
          aria-label="Close"
        >
          &times;
        </button>
      </div>
    </div>
  );
};

export default ImageCarouselModal;
