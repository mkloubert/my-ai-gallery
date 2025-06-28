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

  import ImageCard from "./lib/components/ImageCard.svelte";
  import ImageCarouselModal from "./lib/components/ImageCarouselModal.svelte";
  import type { ApiImage, GalleryImage } from "./lib/types";
  import { toSearchValue } from "./lib/utils";

  import ArrowUp from "./assets/ArrowUp.svelte";

  const pageSize = 100;

  let allImages: GalleryImage[] = [];
  let currentCarouselIndex: number | null = null;
  let debounceTimeout: any;
  let filteredImages: GalleryImage[] = [];
  let inputEl: any;
  let isLoading = true;
  let isSearchOpen = false;
  let page = 1;
  let searchParts: string[] = [];
  let sentinel: any;
  let sentinelObserver!: IntersectionObserver;
  let showScrollTop = false;
  let topMarker: any;

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

  const handleGlobalHotkey = (e: KeyboardEvent) => {
    // CMD+Space (Mac) or CTRL+Space
    if ((e.metaKey || e.ctrlKey) && e.code === "Space" && !isSearchOpen) {
      e.preventDefault();

      isSearchOpen = true;
    } else if (e.code === "Escape") {
      isSearchOpen = false;
    }
  };

  const handleSearchValueChange = (e: any) => {
    updateSearchValue((e.target as HTMLInputElement).value);
  };

  const handleWindowClick = (event: MouseEvent) => {
    if (inputEl?.contains(event.target as Node)) {
      // ignore
    } else {
      isSearchOpen = false;
    }
  };

  const loadMore = () => {
    if (visibleImages.length < filteredImages.length) {
      page += 1;
    }
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

  const refreshView = () => {
    visibleImages = [...visibleImages];
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });

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

    window.addEventListener("keydown", handleGlobalHotkey);
    window.addEventListener("mousedown", handleWindowClick);

    return () => {
      observer.disconnect();
    };
  });

  onDestroy(() => {
    window.removeEventListener("mousedown", handleWindowClick);
    window.removeEventListener("keydown", handleGlobalHotkey);

    sentinelObserver?.disconnect();
  });

  $: if (isSearchOpen && inputEl) setTimeout(() => inputEl?.focus(), 10);
  $: searchValue = "";
  $: visibleImages = filteredImages.slice(0, page * pageSize);
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
    <!-- svelte-ignore element_invalid_self_closing_tag -->
    <div
      class="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500"
    />
  </div>
{:else}
  <div class="py-2 w-full justify-center items-center flex text-sm">
    {filteredImages.length} found
  </div>

  {#if filteredImages.length > 0}
    <div
      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 p-4"
    >
      {#each visibleImages as image, imageIndex}
        <ImageCard
          image={image.apiImage}
          onImageClick={() => {
            currentCarouselIndex = imageIndex;
          }}
          onTagClick={updateSearchValueWithTag}
          onUpdate={refreshView}
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

<ImageCarouselModal
  images={visibleImages}
  onClose={() => {
    currentCarouselIndex = null;
  }}
  start={currentCarouselIndex ?? 0}
  open={typeof currentCarouselIndex === "number"}
/>

{#if isSearchOpen}
  <div
    class="fixed top-6 left-1/2 z-50 -translate-x-1/2 w-full max-w-xl shadow-2xl"
  >
    <div
      class="relative rounded-xl bg-white p-3 border border-gray-200 flex items-center shadow-xl"
    >
      <svg
        class="w-6 h-6 mr-2 text-gray-400"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        viewBox="0 0 24 24"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        class="w-full bg-transparent text-xl text-gray-900 focus:outline-none"
        placeholder="Search ..."
        oninput={handleSearchValueChange}
        bind:this={inputEl}
      />
    </div>
  </div>
{/if}
