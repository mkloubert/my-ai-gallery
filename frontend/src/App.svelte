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

  import { onDestroy, onMount } from "svelte";
  import type { ApiImage, GalleryImage } from "./lib/types";
  import ImageCard from "./lib/ImageCard.svelte";
  import Search from "./assets/Search.svelte";
  import { toSearchValue } from "./lib/utils";
  import ArrowUp from "./assets/ArrowUp.svelte";

  let debounceTimeout: any;
  let isLoading = true;
  let allImages: GalleryImage[] = [];
  let filteredImages: GalleryImage[] = [];
  let searchParts: string[] = [];
  $: searchValue = "";

  let page = 1;
  const pageSize = 100;
  $: visibleImages = filteredImages.slice(0, page * pageSize);

  let sentinelObserver!: IntersectionObserver;
  let sentinel: any;

  let showScrollTop = false;
  let topMarker: any;

  let inputEl: any;

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

      setTimeout(() => {
        requestAnimationFrame(() => {
          refreshSentinalObserver();
        });
      }, 100);
    }
  };

  const handleSearchValueChange = (e: any) => {
    updateSearchValue((e.target as HTMLInputElement).value);
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
    if (searchParts.length === 0) {
      filteredImages = allImages;
      return;
    }

    filteredImages = allImages.filter((img) => {
      return searchParts.every((sp) => {
        return img.searchContext.includes(sp);
      });
    });

    page = 1;
  };

  function loadMore() {
    if (visibleImages.length < filteredImages.length) {
      page += 1;
    }
  }

  const refreshSentinalObserver = () => {
    sentinelObserver?.disconnect();

    sentinelObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { threshold: 1 }
    );

    if (sentinel) {
      sentinelObserver.observe(sentinel);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    inputEl?.focus();
  };

  const updateSearchValue = (v: unknown) => {
    searchValue = String(v ?? "");

    rebuildSearchParts();
  };

  const updateSearchValueWithTag = (tag: string) => {
    tag = tag.toLowerCase().trim();
    if (!tag) {
      return;
    }

    if (searchValue.toLowerCase().includes(tag)) {
      return;
    }

    updateSearchValue(searchValue.trim() + " " + tag);
  };


  onMount(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        showScrollTop = !entry.isIntersecting;
      },
      { threshold: 0 }
    );
    observer.observe(topMarker);

    fetchImages().catch(console.error);

    return () => {
      observer.disconnect();
    };
  });

  onDestroy(() => {
    sentinelObserver?.disconnect();
  });

  $: if (searchValue || !searchValue) {
    clearTimeout(debounceTimeout);

    debounceTimeout = setTimeout(() => {
      refreshList();
    }, 300);
  }
</script>

<div bind:this={topMarker} style="height: 1px;"></div>

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
        value={searchValue}
        bind:this={inputEl}
      />
    </div>
  </div>

  <div class="py-2 w-full justify-center items-center flex text-sm">
    {filteredImages.length} found
  </div>

  {#if filteredImages.length > 0}
    <div
      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 p-4"
    >
      {#each visibleImages as image}
        <ImageCard
          image={image.apiImage}
          onTagClick={updateSearchValueWithTag}
        />
      {/each}

      <div bind:this={sentinel}></div>
    </div>
  {/if}
{/if}

{#if showScrollTop}
  <button
    class="cursor-pointer fixed bottom-6 right-6 z-50 bg-gray-900/70 hover:bg-gray-900/90 text-white p-3 rounded-full shadow-lg transition-opacity opacity-70 hover:opacity-100 backdrop-blur"
    onclick={scrollToTop}
    aria-label="Scoll to top"
  >
    <ArrowUp />
  </button>
{/if}
