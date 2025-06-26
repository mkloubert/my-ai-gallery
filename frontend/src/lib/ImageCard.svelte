<script lang="ts">
  import { onMount } from "svelte";
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

  import ThreeDots from "../assets/ThreeDots.svelte";
  import Modal from "./Modal.svelte";
  import type { ApiImage } from "./types";

  export let onTagClick: (tag: string) => void;
  export let image: ApiImage;

  let detailsToShow: string | null = null;
  let menuOpen = false;
  let tags: string[] = [];

  const handleBlur = (event: any) => {
    // check if focus is outside
    if (!event.currentTarget.contains(event.relatedTarget)) {
      menuOpen = false;
    }
  };

  const doDownload = () => {
    menuOpen = false;

    window.open(image.url, "_blank");
  };

  const showDetails = () => {
    menuOpen = false;

    detailsToShow =
      image.info?.description || image.info?.title || image.name || "";
  };

  onMount(() => {
    const allTags: string[] = (image.info?.tags ?? [])
      .flatMap((t) => {
        return t.split(",").map((t2) => t2.trim());
      })
      .filter((t) => {
        return t != "";
      });

    tags = [...new Set(allTags)].sort();
  });
</script>

<div
  class="relative aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-xl shadow bg-gray-100 group"
>
  <img
    class="object-cover w-full h-full transition-transform duration-200 hover:scale-105"
    alt={image.info?.description ||
      image.info?.title ||
      image.name ||
      undefined}
    title={image.info?.title || image.name || undefined}
    loading="lazy"
    src={image.url}
  />

  {#if tags.length}
    <div
      class="absolute bottom-2 left-2 flex flex-wrap gap-1"
      style="z-index: 10;"
    >
      {#each tags as tag}
        <span
          class="cursor-pointer px-2 py-0.5 text-xs rounded-full bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 shadow"
              on:click={() => onTagClick(tag)}
          >
          {tag}
        </span>
      {/each}
    </div>
  {/if}

  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <div class="absolute bottom-2 right-2 z-10" tabindex="0" on:blur={handleBlur}>
    <button
      class="bg-black/40 text-white rounded-full p-2 hover:bg-black/70 focus:outline-none cursor-pointer"
      style="z-index: 20;"
      on:click={() => (menuOpen = !menuOpen)}
      aria-label="Context menu"
      tabindex="0"
    >
      <ThreeDots />
    </button>

    <!-- context menu -->
    {#if menuOpen}
      <div
        class="absolute right-0 bottom-10 min-w-[150px] rounded-lg shadow-lg bg-white border border-gray-200 p-2 space-y-1 z-20"
      >
        <button
          class="w-full text-left px-3 py-2 rounded hover:bg-gray-100 cursor-pointer"
          on:click={showDetails}
        >
          Details
        </button>

        <button
          class="w-full text-left px-3 py-2 rounded hover:bg-gray-100 cursor-pointer"
          on:click={doDownload}
        >
          Download
        </button>
      </div>
    {/if}
  </div>
</div>

<Modal
  onClose={() => {
    detailsToShow = null;
  }}
  open={!!detailsToShow}
  title={image.info?.title || image.name}
>
  {detailsToShow}
</Modal>
