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

/**
 * An image entry from the API.
 */
export type ApiImage = {
  /**
   * Optional information.
   */
  info?: {
    /**
     * Descriptions.
     */
    description: string;
    /**
     * List of tags.
     */
    tags: string[];
    /**
     * The title.
     */
    title: string;
  } | null;
  /**
   * File name.
   */
  name: string;
  /**
   * URL.
   */
  url: string;
};

/**
 * An entry for the gallery.
 */
export interface GalleryImage {
  /**
   * The underlying entry from the API.
   */
  apiImage: ApiImage;
  /**
   * A string representing a search context.
   */
  searchContext: string;
}

/**
 * Reponse of a PATCH API call for updating image meta data.
 */
export interface UpdateImageMetaDataResponse {
  /**
   * The information information.
   */
  image_information: {
    /**
     * The detailed description.
     */
    detailed_description: string;
    /**
     * The list of tags.
     */
    tags: string[];
    /**
     * The title.
     */
    title: string;
  };
}
