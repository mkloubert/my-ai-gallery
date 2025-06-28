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

import React, { useEffect, useRef, useState } from "react";

import type { ApiImage, UpdateImageMetaDataResponse } from "../types";

import ThreeDots from "../../assets/ThreeDots";
import Modal from "./Modal";
import ImageCardTagList from "./ImageCardTagList";

interface ImageCardProps {
  image: ApiImage;
  onImageClick: () => void;
  onTagClick: (tag: string) => void;
  onUpdate: () => void;
}

const ImageCard: React.FC<ImageCardProps> = ({
  image,
  onImageClick,
  onTagClick,
  onUpdate,
}) => {
  const [detailsToShow, setDetailsToShow] = useState<string>("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUpdatingMeta, setIsUpdatingMeta] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [title, setTitle] = useState<string>(image.info?.title || image.name);

  const menuRef = useRef<HTMLDivElement | null>(null);

  const handleBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      setIsMenuOpen(false);
    }
  };

  const doDownload = () => {
    setIsMenuOpen(false);
    window.open(image.url, "_blank");
  };

  const doMetaUpdate = async () => {
    setIsUpdatingMeta(true);
    try {
      const response = await fetch(
        `/api/images/${encodeURIComponent(image.name)}/meta`,
        { method: "PATCH" }
      );
      if (response.status !== 200) {
        const text = await response.text();
        throw new Error(`Unexpected response ${response.status}: ${text}`);
      }

      const data: UpdateImageMetaDataResponse = await response.json();

      image.info = {
        description: data.image_information.detailed_description,
        tags: [...data.image_information.tags],
        title: data.image_information.title,
      };

      updateDetails();
      updateTags();

      onUpdate();
    } catch (error: unknown) {
      alert(`Could not update meta: ${error}`);
    } finally {
      setIsUpdatingMeta(false);
    }
  };

  const showDetails = () => {
    setIsMenuOpen(false);
    updateDetails();
  };

  const updateDetails = () => {
    setDetailsToShow(
      image.info?.description ||
      image.info?.title ||
      image.name ||
      ""
    );
    setTitle(image.info?.title || image.name);
  };

  const updateTags = () => {
    const allTags: string[] = (image.info?.tags ?? [])
      .flatMap((t) =>
        t.split(",").map((t2) => t2.trim())
      )
      .filter((t) => t !== "");
    setTags([...new Set(allTags)].sort());
  };

  useEffect(() => {
    updateTags();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    setTitle(image.info?.title || image.name);
  }, [image.info?.title, image.name]);

  return (
    <>
      <div
        className="relative aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-xl shadow bg-gray-100 group"
      >
        <img
          className="cursor-pointer object-cover w-full h-full transition-transform duration-200 hover:scale-105"
          alt={
            image.info?.description ||
            image.info?.title ||
            image.name ||
            undefined
          }
          title={image.info?.title || image.name || undefined}
          loading="lazy"
          src={image.url}
          onClick={onImageClick}
        />

        <ImageCardTagList tags={tags} onTagClick={onTagClick} />

        <div
          className="absolute bottom-2 right-2 z-10"
          tabIndex={0}
          onBlur={handleBlur}
          ref={menuRef}
        >
          <button
            className="bg-black/40 text-white rounded-full p-2 hover:bg-black/70 focus:outline-none cursor-pointer"
            style={{ zIndex: 20 }}
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-label="Context menu"
            tabIndex={0}
          >
            <ThreeDots width={24} height={24} />
          </button>

          {/* Kontextmenü */}
          {isMenuOpen && (
            <div
              className="absolute right-0 bottom-10 min-w-[150px] rounded-lg shadow-lg bg-white border border-gray-200 p-2 space-y-1 z-20"
            >
              <button
                className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 cursor-pointer"
                onClick={showDetails}
              >
                Details
              </button>
              <button
                className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 cursor-pointer"
                onClick={doDownload}
              >
                Download
              </button>
            </div>
          )}
        </div>
      </div>

      <Modal
        onClose={
          isUpdatingMeta
            ? null
            : () => {
              setDetailsToShow("");
            }
        }
        open={!!detailsToShow}
        title={title}
      >
        <div className="w-full">{detailsToShow}</div>
        <div className="w-full" slot="actions">
          <button
            disabled={isUpdatingMeta}
            className={`px-3 py-1 rounded ${isUpdatingMeta ? "bg-gray-500" : "bg-blue-500"
              } text-white cursor-pointer w-full ${isUpdatingMeta ? "italic" : ""}`}
            onClick={doMetaUpdate}
          >
            {isUpdatingMeta ? "Updating ..." : "Update"}
          </button>
        </div>
      </Modal>
    </>
  );
};

export default ImageCard;
