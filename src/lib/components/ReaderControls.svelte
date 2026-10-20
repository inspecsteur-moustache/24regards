<script lang="ts">
  import type { BookSnapshot, PageNavigator } from '#lib/domain/ports.ts';
  import Icon from './Icon.svelte';
  let {
    navigation,
    snapshot,
    label = 'Page',
  }: { navigation: PageNavigator | undefined; snapshot: BookSnapshot; label?: string } = $props();
</script>

<div class="reader-controls" aria-label="Commandes de lecture">
  <button
    class="icon-button"
    aria-label="Page précédente"
    disabled={!navigation || snapshot.pageIndex === 0}
    onclick={() => void navigation?.previous()}><Icon name="left" /></button
  ><span aria-live="polite" aria-atomic="true"
    >{label} <strong>{snapshot.pageIndex + 1}</strong> <span class="separator">/</span>
    {snapshot.pageCount || '—'}</span
  ><button
    class="icon-button"
    aria-label="Page suivante"
    disabled={!navigation || snapshot.pageIndex >= snapshot.pageCount - 1}
    onclick={() => void navigation?.next()}><Icon name="right" /></button
  >{#if navigation && snapshot.pageCount > 1}<label class="jump"
      >Aller à<input
        aria-label="Aller à la page"
        type="number"
        min="1"
        max={snapshot.pageCount}
        value={snapshot.pageIndex + 1}
        onchange={(event) => navigation?.goTo(Number(event.currentTarget.value) - 1)}
      /></label
    >{/if}
</div>

<style>
  .reader-controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.2rem;
    margin-top: 1.8rem;
    font: 10px var(--sans);
    letter-spacing: 0.06em;
  }
  .separator {
    margin: 0 0.5rem;
    color: var(--line);
  }
  strong {
    font-weight: 400;
    color: var(--accent);
  }
  .jump {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    color: var(--muted);
  }
  input {
    appearance: textfield;
    width: 3rem;
    height: 1.875rem;
    background: transparent;
    color: var(--ink);
    border: 1px solid var(--line);
    padding: 0;
    font: 11px var(--sans);
    text-align: center;
  }
  input::-webkit-inner-spin-button,
  input::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  @media (max-width: 480px) {
    .reader-controls {
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .jump {
      display: none;
    }
  }
</style>
