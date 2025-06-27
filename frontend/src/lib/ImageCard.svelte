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

  import type { ApiImage, UpdateImageMetaDataResponse } from "./types";

  import ThreeDots from "../assets/ThreeDots.svelte";
  import Modal from "./Modal.svelte";

  export let image: ApiImage;
  export let onImageClick: () => void;
  export let onTagClick: (tag: string) => void;
  export let onUpdate: () => void;

  let isUpdatingMeta = false;
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

  const doMetaUpdate = async () => {
    isUpdatingMeta = true;

    try {
      const response = await fetch(
        `/api/images/${encodeURIComponent(image.name)}/meta`,
        {
          method: "PATCH",
        }
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

      onUpdate();
    } catch (error) {
      alert(`Could not update meta: ${error}`);
    } finally {
      isUpdatingMeta = false;
    }
  };

  const showDetails = () => {
    menuOpen = false;

    updateDetails();
  };

  const updateDetails = () => {
    detailsToShow =
      image.info?.description || image.info?.title || image.name || "";

    title = image.info?.title || image.name;
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

  $: detailsToShow = "";
  $: title = image.info?.title || image.name;
</script>

<div
  class="relative aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-xl shadow bg-gray-100 group"
>
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <img
    class="cursor-pointer object-cover w-full h-full transition-transform duration-200 hover:scale-105"
    alt={image.info?.description ||
      image.info?.title ||
      image.name ||
      undefined}
    title={image.info?.title || image.name || undefined}
    loading="lazy"
    src={image.url}
    on:click={() => onImageClick()}
  />

  {#if tags.length}
    <div
      class="absolute bottom-2 left-2 flex flex-wrap gap-1"
      style="z-index: 10;"
    >
      {#each tags as tag}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
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
    detailsToShow = "";
  }}
  open={!!detailsToShow}
  {title}
>
  <div class="w-full">
    {detailsToShow}
  </div>

  <div slot="actions" class="w-full">
    <button
      disabled={isUpdatingMeta}
      class={`px-3 py-1 rounded ${isUpdatingMeta ? "bg-gray-500": "bg-blue-500"} text-white cursor-pointer w-full ${isUpdatingMeta ? "italic" : ""}`}
      on:click={doMetaUpdate}
    >
      {isUpdatingMeta ? "Updating ..." : "Update"}
    </button>
  </div>
</Modal>
