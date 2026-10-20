<script lang="ts">
  let { name, size = 20 }: { name: string; size?: number } = $props();
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.5"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
>
  {#if name === 'sun'}<circle cx="12" cy="12" r="4" /><path
      d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"
    />
  {:else if name === 'moon'}<path d="M20.5 13A8.5 8.5 0 0 1 11 3.5 8.5 8.5 0 1 0 20.5 13Z" />
  {:else if name === 'mail'}<rect x="3" y="5" width="18" height="14" rx="1" /><path
      d="m3 6 9 7 9-7"
    />
  {:else if name === 'instagram'}<rect x="3" y="3" width="18" height="18" rx="5" /><circle
      cx="12"
      cy="12"
      r="4"
    /><path d="M17.5 6.5h.01" />
  {:else if name === 'bluesky'}<path
      d="M12 11C10 7 4 2 3 4c-1 2 0 7 2 8-4 3 0 9 4 5l3-4 3 4c4 4 8-2 4-5 2-1 3-6 2-8-1-2-7 3-9 7Z"
    />
  {:else if name === 'pigeon'}<path
      d="M4 18h9a6 6 0 0 0 6-6V7a3 3 0 0 0-6 0v3L5 5l2 8-5 5h2Z"
    /><path d="m19 8 3 2-3 1M9 18l-1 3m5-3 1 3m-9-8 5 2 4-3" /><circle
      cx="16.5"
      cy="7.5"
      r=".5"
      fill="currentColor"
    />
  {:else if name === 'download'}<path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5" />
  {:else if name === 'left'}<path d="m14 5-7 7 7 7M7 12h14" />
  {:else if name === 'right'}<path d="m10 5 7 7-7 7M3 12h14" />
  {:else if name === 'menu'}<path d="M3 6h18M3 12h18M3 18h18" />
  {:else if name === 'close'}<path d="m6 6 12 12M6 18 18 6" />
  {:else if name === 'book'}<path
      d="M12 5v16m0-16C8 2 3 3 2 4v15c4-2 7-1 10 2 3-3 6-4 10-2V4c-1-1-6-2-10 1Z"
    />
  {:else if name === 'external'}<path d="M14 3h7v7m0-7L10 14M10 4H4v16h16v-6" />
  {/if}
</svg>
