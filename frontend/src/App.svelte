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
  import type { ApiImage, GalleryImage } from "./lib/types";
  import ImageCard from "./lib/ImageCard.svelte";
  import Search from "./assets/Search.svelte";
  import { toSearchValue } from "./lib/utils";

  let debounceTimeout: any;
  let isLoading = true;
  let allImages: GalleryImage[] = [];
  let filteredImages: GalleryImage[] = [];
  let searchParts: string[] = [];
  let searchValue = "";

  const fetchImages = async () => {
    isLoading = true;

    try {
      const response = await fetch("/api/images");

      if (response.status !== 200) {
        const text = await response.text();

        throw new Error(`Unexpected response ${response.status}: ${text}`);
      }

      const data = await response.json();

      allImages = data.images.map((apiImage: ApiImage) => {
        const searchContextValues = [
          toSearchValue(apiImage.name),
          toSearchValue(apiImage.info?.title),
          toSearchValue(apiImage.info?.description),
          toSearchValue(apiImage.info?.tags),
          apiImage.info ? ":info" : ":noinfo",
        ].filter((sv) => {
          return sv !== "";
        });

        return {
          apiImage,
          searchContext: toSearchValue(
            [...new Set(searchContextValues)].join(" ")
          ),
        } satisfies GalleryImage;
      });

      refreshList();
    } finally {
      isLoading = false;
    }
  };

  const handleSearchValueChange = (e: any) => {
    searchValue = (e.target as HTMLInputElement).value;

    rebuildSearchParts();
  };

  const rebuildSearchParts = () => {
    searchParts = [
      ...new Set<string>(
        toSearchValue(searchValue)
          .split(" ")
          .filter((p) => p.trim() !== "")
      ),
    ].filter((_, i) => {
      return i < 10; // max. 10
    });
  };

  const refreshList = () => {
    console.log("refreshList", searchParts);

    if (searchParts.length === 0) {
      filteredImages = allImages;
      return;
    }

    filteredImages = allImages.filter((img) => {
      return searchParts.every((sp) => {
        return img.searchContext.includes(sp);
      });
    });
  };

  onMount(() => {
    fetchImages().catch(console.error);
  });

  $: if (searchValue) {
    clearTimeout(debounceTimeout);

    debounceTimeout = setTimeout(() => {
      refreshList();
    }, 300);
  }
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
      <Search
        cssClass={"absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none"}
      />

      <input
        type="text"
        class="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
        placeholder="Search ..."
        oninput={handleSearchValueChange}
        autofocus
        disabled={isLoading}
      />
    </div>
  </div>

  <div
    class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 p-4"
  >
    {#each filteredImages as image}
      <ImageCard image={image.apiImage} />
    {/each}
  </div>
{/if}
