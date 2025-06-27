<script lang="ts">
  import ArrowLeft from "../assets/ArrowLeft.svelte";
  import ArrowRight from "../assets/ArrowRight.svelte";
  import type { GalleryImage } from "./types";
  import { getImgPropsFromGallaryImage } from "./utils";

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

  export let images: GalleryImage[] = [];
  export let open = false;
  export let onClose = () => {};
  export let start = 0;

  let current = start;
  let thumbRefs: HTMLImageElement[] = [];

  const handleClose = () => {
    onClose();
  };

  const handleNext = () => {
    current = (current + 1) % images.length;
  };

  const handlePrev = () => {
    current = (current - 1 + images.length) % images.length;
  };

  const handleKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      handleClose();
    } else if (e.key === "ArrowLeft") {
      handlePrev();
    } else if (e.key === "ArrowRight") {
      handleNext();
    }
  };

  $: if (open) {
    current = start;
  }
  $: if (thumbRefs[current]) {
    thumbRefs[current].scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }
</script>

{#if open}
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
    tabindex="0"
    on:click={handleClose}
    on:keydown={handleKey}
    autofocus
  >
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
      class="relative flex flex-col items-center w-full h-full"
      on:click|stopPropagation
    >
      <img
        class="max-w-[90vw] max-h-[80vh] rounded shadow-xl select-none"
        draggable="false"
        {...getImgPropsFromGallaryImage(images[current])}
      />

      <button
        class="cursor-pointer absolute left-2 top-1/2 -translate-y-1/2 text-white bg-black/40 hover:bg-black/60 rounded-full p-2"
        on:click={handlePrev}
        aria-label="Back"
      >
        <ArrowLeft />
      </button>
      <button
        class="cursor-pointer absolute right-2 top-1/2 -translate-y-1/2 text-white bg-black/40 hover:bg-black/60 rounded-full p-2"
        on:click={handleNext}
        aria-label="Next"
      >
        <ArrowRight />
      </button>

      <div class="absolute bottom-4 w-full flex justify-center">
        <div
          class="flex gap-2 px-4 overflow-x-auto scrollbar-thin max-w-xl rounded bg-black/30 py-2"
        >
          {#each images as image, i}
            <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
            <img
              {...getImgPropsFromGallaryImage(image)}
              class="h-10 w-16 object-cover rounded cursor-pointer border-2 transition-all flex-shrink-0"
              class:border-blue-400={i === current}
              on:click={() => (current = i)}
              bind:this={thumbRefs[i]}
              draggable="false"
            />
          {/each}
        </div>
      </div>

      <button
        class="cursor-pointer absolute top-4 right-4 text-gray-200 hover:text-white text-2xl"
        on:click={handleClose}
        aria-label="Close"
      >
        &times;
      </button>
    </div>
  </div>
{/if}
