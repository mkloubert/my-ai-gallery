<script lang="ts">
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

  import { onMount } from "svelte";
  import type { FormEventHandler } from "svelte/elements";

  type ApiImage = any;

  interface GalleryImage {
    alt?: string;
    apiImage: ApiImage;
    src: string;
    title: string;
  }

  let isLoading = true;
  let allImages: GalleryImage[] = [];
  let filteredImages: GalleryImage[] = [];
  let searchValue = "";

  // Dummy-API-Call (simuliert ein Progress-Update)
  async function fetchImages() {
    isLoading = true;

    try {
      const response = await fetch("/api/images");

      if (response.status !== 200) {
        const text = await response.text();

        throw new Error(`Unexpected response ${response.status}: ${text}`);
      }

      const data = await response.json();

      allImages = data.images.map((apiImage: ApiImage) => {
        let title = String(apiImage.name);
        if (apiImage.info?.title) {
          title = String(apiImage.info.title);
        }

        return {
          apiImage,
          src: apiImage.url,
          title,
        } satisfies GalleryImage;
      });

      refreshList();
    } finally {
      isLoading = false;
    }
  }

  const toSearchValue = (val: unknown): string => {
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

    return str.trim();
  };

  const refreshList = () => {
    const parts = [
      ...new Set<string>(
        toSearchValue(searchValue)
          .split(" ")
          .filter((p) => p.trim() !== "")
      ),
    ].filter((_, i) => {
      return i < 10; // max. 10
    });
    if (parts.length === 0) {
      filteredImages = [...allImages];
      return;
    }

    filteredImages = allImages.filter((img) => {
      const values = [toSearchValue(img.title), toSearchValue(img.src)].filter(
        (v) => {
          return v.trim() !== "";
        }
      );

      return parts.every((p) => {
        return values.some((v) => {
          return v.includes(p);
        });
      });
    });
  };

  const handleSearchValueChange = (e: any) => {
    searchValue = (e.target as HTMLInputElement).value;

    refreshList();
  };

  onMount(() => {
    fetchImages().catch(console.error);
  });
</script>

{#if isLoading}
  <div class="flex justify-center items-center w-full h-lvh">
    <div
      class="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500"
    />
  </div>
{:else}
  <div class="w-full flex justify-center mt-4">
    <div class="relative w-full max-w-md">
      <!-- Such-Icon (Heroicons SVG) -->
      <svg
        class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        viewBox="0 0 24 24"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        type="text"
        class="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
        bind:value={searchValue}
        placeholder="Search ..."
        onkeyup={handleSearchValueChange}
      />
    </div>
  </div>

  <div
    class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 p-4"
  >
    {#each filteredImages as image}
      <div
        class="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-xl shadow"
      >
        <img
          class="object-cover w-full h-full transition-transform duration-200 hover:scale-105"
          src={image.src}
          alt={image.alt || image.title || undefined}
          title={image.title}
          loading="lazy"
        />
      </div>
    {/each}
  </div>
{/if}
