<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { base } from '#lib/composition/paths.ts';
  import type { Article } from '#lib/domain/models.ts';
  import type { BookSnapshot, PageNavigator, PaginatedPage } from '#lib/domain/ports.ts';
  import ReaderControls from './ReaderControls.svelte';
  let { article }: { article: Article } = $props();
  let frame: HTMLDivElement;
  let host: HTMLDivElement;
  let mounted = $state(false);
  let continuous = $state(false);
  let enhanced = $state(false);
  let fontSize = $state(18);
  let resizeToken = $state(0);
  let error = $state('');
  let loading = $state(false);
  let navigation = $state<PageNavigator>();
  let snapshot = $state<BookSnapshot>({ pageIndex: 0, pageCount: 0, orientation: 'single' });
  let pages: readonly PaginatedPage[] = [];
  let currentSlug = '';
  let dimensions = $state({ width: 600, height: 640 });
  const localizedHtml = $derived(
    article.contentHtml.replace(
      /(src|href)="(\/[^\"]*)"/g,
      (_match, attribute, path) => `${attribute}="${base}${path}"`,
    ),
  );
  onMount(() => {
    mounted = true;
    let lastWidth = frame.clientWidth;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(() => resizeToken++, 150);
    };
    const observer = new ResizeObserver(() => {
      const width = frame.clientWidth;
      if (Math.abs(width - lastWidth) > 1) {
        lastWidth = width;
        schedule();
      }
    });
    observer.observe(frame);
    window.addEventListener('resize', schedule);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
      window.removeEventListener('resize', schedule);
    };
  });
  $effect(() => {
    if (!mounted || continuous) return;
    const html = localizedHtml;
    const selectedSlug = article.slug;
    const size = fontSize;
    resizeToken;
    const anchor = untrack(() =>
      selectedSlug === currentSlug ? (pages[snapshot.pageIndex]?.offset ?? 0) : 0,
    );
    currentSlug = selectedSlug;
    const abort = new AbortController();
    let dispose = () => {};
    loading = true;
    error = '';
    void (async () => {
      try {
        const { createArticlePaginator, createPageTurner } =
          await import('#lib/composition/notebook-reader.ts');
        if (abort.signal.aborted) return;
        const width = Math.min(640, frame.clientWidth);
        const height = Math.round(Math.min(760, Math.max(480, window.innerHeight * 0.72)));
        const padding = width < 400 ? 20 : 32;
        const renderedSize = width < 400 ? Math.max(16, size - 2) : size;
        const lineHeight = renderedSize + 10;
        const contentHeight = Math.floor((height - 2 * padding - 30) / lineHeight) * lineHeight;
        const nextPages = await createArticlePaginator().paginate(html, {
          width: width - 2 * padding - 2,
          height: contentHeight,
          fontSize: renderedSize,
          lineHeight,
          signal: abort.signal,
        });
        if (abort.signal.aborted) return;
        pages = nextPages;
        dimensions = { width, height };
        host.replaceChildren();
        const probe = document.createElement('div');
        Object.assign(probe.style, {
          position: 'absolute',
          visibility: 'hidden',
          font: `${renderedSize}px Georgia`,
          lineHeight: `${lineHeight}px`,
        });
        probe.innerHTML =
          'M<span style="display:inline-block;width:0;height:0;vertical-align:baseline"></span>';
        document.body.append(probe);
        const baseline =
          probe.querySelector('span')!.getBoundingClientRect().top -
          probe.getBoundingClientRect().top;
        probe.remove();
        const elements = nextPages.map((page, index) => {
          const element = document.createElement('div');
          element.className = 'notebook-page';
          element.setAttribute('aria-label', `Page ${index + 1} sur ${nextPages.length}`);
          element.style.padding = `${padding}px`;
          element.style.setProperty('--notebook-line', `${lineHeight}px`);
          element.style.setProperty('--font-size', `${renderedSize}px`);
          element.style.setProperty('--baseline', `${baseline}px`);
          const content = document.createElement('div');
          content.className = 'notebook-content ruled';
          content.innerHTML = page.html;
          content.style.height = `${contentHeight}px`;
          const number = document.createElement('span');
          number.className = 'notebook-page-number';
          number.textContent = `— ${index + 1} —`;
          element.append(content, number);
          host.append(element);
          return element;
        });
        let startPage = 0;
        nextPages.forEach((page, index) => {
          if (page.offset <= anchor) startPage = index;
        });
        const turner = createPageTurner(host, elements, {
          width,
          height,
          size: 'fixed',
          layout: 'single',
          binding: 'top',
          startPage,
          cover: false,
          flipDuration: 650,
          shadowOpacity: 0.2,
          click: 'edges',
        });
        const unsubscribe = turner.navigation.subscribe((value) => (snapshot = value));
        navigation = turner.navigation;
        enhanced = true;
        loading = false;
        dispose = () => {
          unsubscribe();
          turner.destroy();
          host.replaceChildren();
        };
      } catch (cause) {
        if (!abort.signal.aborted) {
          error = cause instanceof Error ? cause.message : 'Le carnet est indisponible.';
          enhanced = false;
          loading = false;
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
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault();
      void navigation?.next();
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault();
      void navigation?.previous();
    }
  }
</script>

<div class="notebook-toolbar">
  <div class="reading-options">
    <button
      aria-label="Réduire la taille du texte"
      disabled={fontSize <= 18}
      onclick={() => (fontSize -= 2)}>A−</button
    ><button
      aria-label="Agrandir le texte"
      onclick={() => (fontSize += 2)}>A+</button
    ><button
      class="reading-mode"
      aria-pressed={continuous}
      onclick={() => (continuous = !continuous)}
      >{continuous ? 'Lecture en carnet' : 'Lecture continue'}</button
    >
  </div>
</div>
<div bind:this={frame} class="notebook-frame" aria-busy={loading}>
  {#if loading}<p class="pagination-status" role="status">Préparation du carnet…</p>{/if}
  {#if error}<p role="status" class="error-message">{error}</p>{/if}
  <div
    class="notebook"
    class:concealed={!enhanced || continuous}
    style:width={`${dimensions.width}px`}
  >
    <div class="rings" aria-hidden="true">
      {#each Array(8) as _}<span></span>{/each}
    </div>
    <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions (Labelled reading region with scoped keyboard page navigation.) -->
    <div
      bind:this={host}
      class="notebook-book"
      role="region"
      tabindex="0"
      aria-label="Carnet. Flèches haut et bas pour feuilleter."
      onkeydown={onKey}
    ></div>
    <ReaderControls {navigation} {snapshot} />
    <p class="gesture-note">Soulevez le bas de la page pour continuer.</p>
  </div>
  <article
    class="continuous notebook-content"
    hidden={enhanced && !continuous}
    style:font-size={`${fontSize}px`}
    style:--notebook-line={`${fontSize + 10}px`}
    aria-label="Article en lecture continue"
  >
    {@html localizedHtml}
  </article>
</div>

<style>
  .notebook-toolbar {
    display: flex;
    flex-wrap: wrap;
    justify-content: end;
    align-items: center;
    gap: 0.8rem;
    margin: 2rem 0 1.5rem;
    border-top: 1px solid var(--line);
    padding-top: 1rem;
  }
  .reading-options {
    display: flex;
    align-items: stretch;
    gap: 0.3rem;
  }
  .reading-options button {
    border: 0;
    background: none;
    font: 12px var(--sans);
    min-height: var(--nav-control-height);
    min-width: 32px;
    padding: 0 var(--control-padding-inline);
  }
  .reading-options button:enabled:hover,
  .reading-options button:enabled:focus-visible {
    color: var(--accent);
    background-color: var(--accent-soft);
  }
  .reading-options .reading-mode {
    border-left: 1px solid var(--line);
    margin-left: 0.3rem;
    font-size: 10px;
    text-decoration: underline;
    text-underline-offset: 4px;
  }
  .notebook-frame {
    position: relative;
    min-width: 0;
    overflow-x: clip;
  }
  .notebook {
    margin: 0 auto;
    max-width: 100%;
    padding-top: 13px;
  }
  .notebook.concealed {
    display: none;
  }
  .rings {
    height: 20px;
    position: relative;
    z-index: 3;
    display: flex;
    justify-content: space-around;
    padding: 0 10%;
    margin-bottom: -13px;
    pointer-events: none;
  }
  .rings span {
    width: 9px;
    height: 22px;
    border: 2px solid #78776e;
    border-radius: 5px;
    box-shadow: 1px 1px 0 #fff6;
    background: linear-gradient(90deg, #aaa, #e0ddd2, #777);
    transform: rotate(-5deg);
  }
  .notebook-book {
    box-shadow: 0 12px 30px #0002;
    border-top: 3px solid var(--accent);
  }
  .gesture-note {
    font: 9px var(--sans);
    text-align: center;
    color: var(--muted);
    letter-spacing: 0.04em;
    margin-top: 1rem;
  }
  .pagination-status {
    font: 11px var(--sans);
    color: var(--muted);
    text-align: center;
  }
  .error-message {
    font: 12px var(--sans);
    color: var(--accent);
    line-height: 1.6;
  }
  .continuous {
    max-width: 700px;
    margin: 0 auto;
  }
  .continuous[hidden] {
    display: none;
  }
  :global(.notebook-page) {
    background: var(--notebook-paper, #faf6ec);
    overflow: hidden;
    border: 1px solid var(--line);
  }
  :global([data-theme='dark'] .notebook-page) {
    --notebook-paper: #262823;
  }
  :global(.notebook-content.ruled) {
    background-image: linear-gradient(
      to bottom,
      transparent calc(var(--notebook-line) - 1px),
      var(--rule, #baa88538) 0
    );
    background-size: 100% var(--notebook-line);
    background-position: 0 calc(var(--baseline) + 3px - var(--notebook-line));
  }
  :global(.notebook-page-number) {
    display: block;
    text-align: center;
    font: 9px var(--sans);
    color: var(--muted);
    padding-top: 10px;
  }
  :global(.continuous figure) {
    height: auto !important;
  }
  :global(.continuous img) {
    width: 100%;
    height: auto !important;
    max-height: none;
  }
  :global(.continuous figure a) {
    display: block;
  }
  :global(.continuous figcaption) {
    font-size: 12px;
    color: var(--muted);
  }
  @media (max-width: 480px) {
    .reading-options button {
      font-size: 11px;
    }
    .reading-options .reading-mode {
      font-size: 9px;
    }
  }
</style>
