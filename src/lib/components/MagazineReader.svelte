<script lang="ts">
  import { onMount } from 'svelte';
  import { base } from '#lib/composition/paths.ts';
  import { ReaderError, type Magazine } from '#lib/domain/models.ts';
  import type { BookSnapshot, PageNavigator } from '#lib/domain/ports.ts';
  import { observeBookShadow } from '#lib/application/book-shadow.ts';
  import { createRasterWindow } from '#lib/application/raster-window.ts';
  import ReaderControls from './ReaderControls.svelte';
  import Icon from './Icon.svelte';
  let { magazine }: { magazine: Magazine } = $props();
  let table: HTMLDivElement;
  let host: HTMLDivElement;
  let stage: HTMLDivElement;
  let mounted = $state(false);
  let attempt = $state(0);
  let navigation = $state<PageNavigator>();
  let snapshot = $state<BookSnapshot>({ pageIndex: 0, pageCount: 0, orientation: 'spread' });
  let loading = $state(true);
  let error = $state('');
  onMount(() => {
    mounted = true;
  });
  $effect(() => {
    if (!mounted) return;
    const selected = magazine;
    attempt;
    const abort = new AbortController();
    let dispose = () => {};
    loading = true;
    error = '';
    navigation = undefined;
    void (async () => {
      try {
        const { createPdfRasterizer, createPageTurner, observeMagazineSize } =
          await import('#lib/composition/magazine-reader.ts');
        if (abort.signal.aborted) return;
        const rasterizer = createPdfRasterizer();
        const earlyDispose = () => {
          void rasterizer.destroy();
        };
        dispose = earlyDispose;
        const count = await rasterizer.open(`${base}${selected.pdfFile}`, abort.signal);
        const dimensions = await rasterizer.dimensions(0);
        if (abort.signal.aborted) return;
        host.replaceChildren();
        const elements = Array.from({ length: count }, (_, index) => {
          const page = document.createElement('div');
          page.className = 'pdf-page';
          page.dataset.page = String(index + 1);
          page.setAttribute('role', 'img');
          page.setAttribute('aria-label', `${selected.title}, page ${index + 1}`);
          const placeholder = document.createElement('span');
          placeholder.className = 'pdf-placeholder';
          placeholder.textContent = `24 Regards · ${index + 1}`;
          const image = document.createElement('img');
          image.alt = '';
          image.hidden = true;
          image.draggable = false;
          page.append(placeholder, image);
          return page;
        });
        elements.forEach((element) => host.append(element));
        const limits = { minWidth: 180, maxWidth: 510 };
        const stopSizing = observeMagazineSize(table, stage, dimensions, limits);
        dispose = () => {
          stopSizing();
          earlyDispose();
        };
        const turner = createPageTurner(host, elements, {
          width: dimensions.width,
          height: dimensions.height,
          ...limits,
          autoSize: false,
          size: 'stretch',
          layout: 'auto',
          binding: 'left',
          cover: true,
          flipDuration: 500,
          shadowOpacity: 0.28,
        });
        const windowed = createRasterWindow(
          rasterizer,
          (index, page) => {
            const image = elements[index].querySelector('img')!;
            const placeholder = elements[index].querySelector('span')!;
            if (page) {
              image.src = page.url;
              image.hidden = false;
              placeholder.hidden = true;
              elements[index].dataset.rendered = 'true';
            } else {
              image.removeAttribute('src');
              image.hidden = true;
              placeholder.hidden = false;
              delete elements[index].dataset.rendered;
            }
            turner.refresh();
          },
          (cause) => {
            error =
              cause instanceof ReaderError
                ? cause.message
                : 'Cette page du magazine ne peut pas être affichée. Vous pouvez toujours ouvrir le PDF.';
          },
        );
        const selectWindow = (value: BookSnapshot) => {
          snapshot = value;
          windowed.select(value, host.clientWidth / (value.orientation === 'spread' ? 2 : 1));
        };
        const unsubscribe = turner.navigation.subscribe(selectWindow);
        const stopShadow = observeBookShadow(turner.navigation, turner.progress, (left, right) => {
          stage.style.setProperty('--left', String(left));
          stage.style.setProperty('--right', String(right));
        });
        const resize = new ResizeObserver(() =>
          windowed.select(
            turner.navigation.snapshot(),
            host.clientWidth / (turner.navigation.snapshot().orientation === 'spread' ? 2 : 1),
          ),
        );
        resize.observe(host);
        navigation = turner.navigation;
        loading = false;
        dispose = () => {
          resize.disconnect();
          stopSizing();
          unsubscribe();
          stopShadow();
          windowed.destroy();
          turner.destroy();
          host.replaceChildren();
          void rasterizer.destroy();
        };
      } catch (cause) {
        if (!abort.signal.aborted) {
          loading = false;
          error =
            cause instanceof ReaderError
              ? cause.message
              : 'Le magazine ne peut pas être chargé. Vous pouvez toujours ouvrir le PDF.';
        }
      }
    })();
    return () => {
      abort.abort();
      dispose();
    };
  });
  function onKey(event: KeyboardEvent) {
    if ((event.target as HTMLElement).closest('input,button,a,select')) return;
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      void navigation?.next();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      void navigation?.previous();
    }
  }
</script>

<section class="magazine-reader" aria-label={`Lire ${magazine.title}`}>
  {#if loading}<p class="status" role="status">Ouverture du magazine…</p>{/if}
  {#if error}<div class="reader-error" role="alert">
      <p>{error}</p>
      <button class="button" onclick={() => attempt++}>Réessayer</button>
    </div>{/if}
  <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions (Labelled reading region: keyboard shortcuts only act while this region has focus.) -->
  <div
    class="book-table"
    class:loading
    bind:this={table}
    tabindex="0"
    role="region"
    aria-label="Lecteur du magazine. Flèches gauche et droite pour feuilleter."
    onkeydown={onKey}
  >
    <div class="book-viewport">
      <div class="book-stage" bind:this={stage}>
        <div class="cast-shadow"></div>
        <div class="pdf-book" bind:this={host}></div>
      </div>
    </div>
  </div>
  <ReaderControls {navigation} {snapshot} />
  <div class="reader-footnote">
    <a
      class="button pdf-button"
      href={`${base}${magazine.pdfFile}`}
      target="_blank"
      rel="noopener noreferrer"
      ><Icon name="external" size={16} /><span>Ouvrir dans un nouvel onglet</span></a
    >
  </div>
</section>

<style>
  .magazine-reader {
    margin-top: 2.8rem;
    padding-top: 1.3rem;
  }
  .book-table {
    position: relative;
    width: 100%;
    max-width: 1020px;
    margin: 0 auto;
    isolation: isolate;
    min-height: 200px;
  }
  .book-table.loading {
    min-height: 300px;
  }
  .book-viewport {
    overflow: clip;
    margin: -3rem;
    padding: 3rem;
  }
  .book-stage {
    position: relative;
    margin-inline: auto;
    transform: translateX(calc((var(--left, 0) - var(--right, 1)) * 25%));
  }
  .pdf-book {
    position: relative;
    width: 100%;
    height: 100%;
    z-index: 1;
  }
  .cast-shadow {
    position: absolute;
    top: 0;
    bottom: 0;
    left: calc(50% * (1 - var(--left, 0)));
    right: calc(50% * (1 - var(--right, 1)));
    box-shadow: 0 18px 38px #0003;
    z-index: 0;
    pointer-events: none;
  }
  .status {
    text-align: center;
    font: 12px var(--sans);
    padding: 1rem;
  }
  .reader-error {
    padding: 1rem;
    background: var(--accent-soft);
    text-align: center;
    margin-bottom: 1rem;
  }
  .reader-error p {
    font: 13px var(--sans);
  }
  .reader-footnote {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 1rem;
    margin-top: 1.5rem;
    font: 9px var(--sans);
    color: var(--muted);
    line-height: 1.7;
  }
  .reader-footnote a {
    white-space: normal;
  }
  :global(.pdf-page) {
    background: white;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  :global(.pdf-page img) {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  :global(.pdf-page img[hidden]) {
    display: none;
  }
  :global(.pdf-placeholder) {
    color: #8b8276;
    font: 12px Georgia;
    letter-spacing: 0.08em;
  }
  :global(.pdf-placeholder[hidden]) {
    display: none;
  }
  @media (max-width: 767px) {
    .book-table {
      max-width: 340px;
    }
    .reader-footnote {
      flex-direction: column;
      align-items: stretch;
    }
    .reader-footnote a {
      justify-content: center;
    }
  }
  @media (orientation: landscape) and (pointer: coarse) {
    .book-table {
      min-height: 0;
    }
  }
</style>
