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

import React, { useCallback, useEffect, useRef, useState } from "react";

import ImageCard from "./lib/components/ImageCard";
import ImageCarouselModal from "./lib/components/ImageCarouselModal";
import { toSearchValue } from "./lib/utils";
import type { ApiImage, GalleryImage } from "./lib/types";
import ArrowUp from "./assets/ArrowUp";

const pageSize = 100;

const App: React.FC = () => {
  const [allImages, setAllImages] = useState<GalleryImage[]>([]);
  const [filteredImages, setFilteredImages] = useState<GalleryImage[]>([]);
  const [visibleImages, setVisibleImages] = useState<GalleryImage[]>([]);
  const [searchValue, setSearchValue] = useState<string>("");
  const [searchParts, setSearchParts] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState<number | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const inputEl = useRef<HTMLInputElement | null>(null);
  const topMarker = useRef<HTMLDivElement | null>(null);
  const sentinel = useRef<HTMLDivElement | null>(null);

  const sentinelObserver = useRef<IntersectionObserver | null>(null);
  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchImages = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/images");

      if (response.status !== 200) {
        const text = await response.text();
        throw new Error(`Unexpected response ${response.status}: ${text}`);
      }

      const data = await response.json();

      const galleryImages = data.images.map((apiImage: ApiImage) => {
        const searchContextValues = [
          toSearchValue(apiImage.name),
          toSearchValue(apiImage.info?.title),
          toSearchValue(apiImage.info?.description),
          toSearchValue(apiImage.info?.tags),
          apiImage.info ? ":info" : ":noinfo",
        ].filter((sv) => sv !== "");

        return {
          apiImage,
          searchContext: toSearchValue(
            [...new Set(searchContextValues)].join(" ")
          ),
        } as GalleryImage;
      });

      setAllImages(galleryImages);
      refreshList(galleryImages, searchParts, searchValue); // initial aufbauen
    } finally {
      setIsLoading(false);

      setTimeout(() => {
        requestAnimationFrame(() => {
          refreshSentinelObserver();
        });
      }, 100);
    }
    // eslint-disable-next-line
  }, [searchParts, searchValue]);

  const rebuildSearchParts = useCallback((value: string) => {
    const parts = [
      ...new Set(
        toSearchValue(value)
          .split(" ")
          .filter((p) => p.trim() !== "")
      ),
    ].filter((_, i) => i < 10);
    setSearchParts(parts);
    return parts;
  }, []);

  const refreshList = useCallback(
    (
      images: GalleryImage[] = allImages,
      parts: string[] = searchParts,
      value: string = searchValue
    ) => {
      let filtered = images;
      if (parts.length > 0) {
        filtered = images.filter((img) =>
          parts.every((sp) => img.searchContext.includes(sp))
        );
      }
      setFilteredImages(filtered);
      setPage(1);
    },
    [allImages, searchParts, searchValue]
  );

  useEffect(() => {
    setVisibleImages(filteredImages.slice(0, page * pageSize));
  }, [filteredImages, page]);

  const handleGlobalHotkey = useCallback(
    (e: KeyboardEvent) => {
      // CMD+Space (Mac) or CTRL+Space
      if ((e.metaKey || e.ctrlKey) && e.code === "Space" && !isSearchOpen) {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if (e.code === "Escape") {
        setIsSearchOpen(false);
      }
    },
    [isSearchOpen]
  );

  const handleWindowClick = useCallback(
    (event: MouseEvent) => {
      if (inputEl.current?.contains(event.target as Node)) {
        // ignore
      } else {
        setIsSearchOpen(false);
      }
    },
    []
  );

  const handleSearchValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateSearchValue(e.target.value);
  };

  const updateSearchValue = (v: unknown) => {
    const value = String(v ?? "");
    setSearchValue(value);
    const parts = rebuildSearchParts(value);
    refreshList(allImages, parts, value);
  };

  const updateSearchValueWithTag = (tag: string) => {
    tag = tag.toLowerCase().trim();
    if (!tag) return;
    if (searchValue.toLowerCase().includes(tag)) return;
    updateSearchValue(searchValue.trim() + " " + tag);
  };

  const refreshSentinelObserver = useCallback(() => {
    sentinelObserver.current?.disconnect();

    sentinelObserver.current = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { threshold: 1 }
    );

    if (sentinel.current) {
      sentinelObserver.current.observe(sentinel.current);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMore = () => {
    if (visibleImages.length < filteredImages.length) {
      setPage((prev) => prev + 1);
    }
  };

  const refreshView = () => {
    setVisibleImages((imgs) => [...imgs]);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    inputEl.current?.focus();
  };

  useEffect(() => {
    const marker = topMarker.current;
    if (!marker) return;

    const observer = new window.IntersectionObserver(
      ([entry]) => {
        setShowScrollTop(!entry.isIntersecting);
      },
      { threshold: 0 }
    );

    observer.observe(marker);

    fetchImages();

    window.addEventListener("keydown", handleGlobalHotkey);
    window.addEventListener("mousedown", handleWindowClick);

    return () => {
      observer.disconnect();
      window.removeEventListener("mousedown", handleWindowClick);
      window.removeEventListener("keydown", handleGlobalHotkey);
      sentinelObserver.current?.disconnect();
    };
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (isSearchOpen && inputEl.current) {
      setTimeout(() => {
        inputEl.current?.focus();
      }, 10);
    }
  }, [isSearchOpen]);

  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      refreshList(allImages, searchParts, searchValue);
    }, 300);
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
    // eslint-disable-next-line
  }, [searchValue]);

  return (
    <>
      <div ref={topMarker} style={{ height: 1 }}></div>
      {isLoading ? (
        <div className="flex justify-center items-center w-full h-lvh">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500" />
        </div>
      ) : (
        <>
          <div className="py-2 w-full justify-center items-center flex text-sm">
            {filteredImages.length} found
          </div>
          {filteredImages.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 p-4">
              {visibleImages.map((image, imageIndex) => (
                <ImageCard
                  key={image.apiImage.name ?? imageIndex}
                  image={image.apiImage}
                  onImageClick={() => setCurrentCarouselIndex(imageIndex)}
                  onTagClick={updateSearchValueWithTag}
                  onUpdate={refreshView}
                />
              ))}
              <div ref={sentinel}></div>
            </div>
          )}
        </>
      )}

      {showScrollTop && (
        <button
          className="cursor-pointer fixed bottom-6 right-6 z-50 bg-gray-900/70 hover:bg-gray-900/90 text-white p-3 rounded-full shadow-lg transition-opacity opacity-70 hover:opacity-100 backdrop-blur"
          onClick={scrollToTop}
          aria-label="Scroll to top"
        >
          <ArrowUp />
        </button>
      )}

      <ImageCarouselModal
        images={visibleImages}
        onClose={() => setCurrentCarouselIndex(null)}
        start={currentCarouselIndex ?? 0}
        open={typeof currentCarouselIndex === "number"}
      />

      {isSearchOpen && (
        <div className="fixed top-6 left-1/2 z-50 -translate-x-1/2 w-full max-w-xl shadow-2xl">
          <div className="relative rounded-xl bg-white p-3 border border-gray-200 flex items-center shadow-xl">
            <svg
              className="w-6 h-6 mr-2 text-gray-400"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className="w-full bg-transparent text-xl text-gray-900 focus:outline-none"
              placeholder="Search ..."
              onInput={handleSearchValueChange}
              ref={inputEl}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default App;
