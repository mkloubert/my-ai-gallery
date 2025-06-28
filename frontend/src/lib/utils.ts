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

import type { ApiImage, GalleryImage } from "./types";

/**
 * Returns the props for an <img /> html tag for an API image.
 *
 * @param {ApiImage|null|undefined} image The input image.
 *
 * @returns {Record<string,any>} The props for the tag.
 */
export function getImgPropsFromApiImage(
  image: ApiImage | null | undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Record<string, any> {
  if (!image) {
    return {};
  }

  return {
    alt:
      image.info?.description || image.info?.title || image.name || undefined,
    src: image.url || undefined,
  };
}

/**
 * Returns the props for an <img /> html tag for a gallery image.
 *
 * @param {GalleryImage|null|undefined} image The input image.
 *
 * @returns {Record<string,any>} The props for the tag.
 */
export function getImgPropsFromGallaryImage(
  image: GalleryImage | null | undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Record<string, any> {
  return getImgPropsFromApiImage(image?.apiImage);
}

/**
 * Converts a value to a string that can be used as search value.
 *
 * @param {string} val The input value.
 *
 * @returns {string} The string.
 */
export function toSearchValue(val: unknown): string {
  let str = String(val ?? "")
    .toLowerCase()
    .split("\n")
    .join(" ")
    .split("\r")
    .join("")
    .split("\t")
    .join("  ")
    .split("ä")
    .join("ae")
    .split("ö")
    .join("oe")
    .split("ü")
    .join("ue")
    .split("ß")
    .join("ss");

  while (str.includes("  ")) {
    str = str.split("  ").join(" ");
  }

  return [...new Set(str.split(" "))].sort().join(" ").trim();
}
