<script lang="ts">
  import { onMount } from 'svelte';
  import { base } from '#lib/composition/paths.ts';
  import { page } from '$app/state';
  import { createThemeStore } from '#lib/composition/theme.ts';
  import type { Theme } from '#lib/domain/ports.ts';
  import Icon from './Icon.svelte';
  let { onnewsletter }: { onnewsletter: () => void } = $props();
  let menuOpen = $state(false);
  let theme = $state<Theme>('light');
  let navElement: HTMLElement;
  let hoveredIndex = $state<number>();
  let focusedIndex = $state<number>();
  let indicatorReady = $state(false);
  let indicator = $state({ left: 0, width: 0 });
  const links = [
    { label: 'Magazines', path: '/' },
    { label: 'Articles', path: '/articles/' },
    { label: 'Rédaction', path: '/redaction/' },
    { label: 'Participer', path: '/participer/' },
  ];
  const activeIndex = $derived(
    links.findIndex((link) =>
      link.path === '/'
        ? page.url.pathname === `${base}/`
        : page.url.pathname.startsWith(`${base}${link.path}`),
    ),
  );
  const indicatedIndex = $derived(hoveredIndex ?? focusedIndex ?? activeIndex);
  function updateIndicator() {
    if (!navElement) return;
    const link = navElement.querySelectorAll('a')[indicatedIndex];
    if (!link || navElement.clientWidth === 0) {
      indicatorReady = false;
      return;
    }
    indicator = { left: link.offsetLeft, width: link.offsetWidth };
    indicatorReady = true;
  }
  $effect(updateIndicator);
  onMount(() => {
    theme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
    const resize = new ResizeObserver(updateIndicator);
    resize.observe(navElement);
    return () => resize.disconnect();
  });
  function toggleTheme() {
    theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = theme;
    createThemeStore().write(theme);
  }
  $effect(() => {
    page.url.pathname;
    menuOpen = false;
    hoveredIndex = undefined;
    focusedIndex = undefined;
  });
</script>

<header class:home={page.url.pathname === `${base}/`}>
  <a class="wordmark-link" href={`${base}/`} aria-label="24 Regards — accueil"
    ><img
      class="wordmark"
      src={`${base}/media/titre-magazine.png`}
      alt="Le 24 Regards — Le cinéma sous tous ses angles"
      width="1000"
      height="250"
    /></a
  >
  <div class="nav-row">
    <button
      class="menu-button"
      aria-expanded={menuOpen}
      aria-controls="navigation"
      onclick={() => (menuOpen = !menuOpen)}
      ><Icon name={menuOpen ? 'close' : 'menu'} /><span>Menu</span></button
    >
    <nav
      id="navigation"
      bind:this={navElement}
      class:open={menuOpen}
      class:indicator-ready={indicatorReady}
      aria-label="Navigation principale"
    >
      {#each links as link, index}<a
          href={`${base}${link.path}`}
          onpointerenter={(event) => {
            if (event.pointerType !== 'touch') hoveredIndex = index;
          }}
          onpointerleave={() => (hoveredIndex = undefined)}
          onfocus={(event) => {
            focusedIndex = event.currentTarget.matches(':focus-visible') ? index : undefined;
          }}
          onblur={() => (focusedIndex = undefined)}
          aria-current={index === activeIndex ? 'page' : undefined}>{link.label}</a
        >{/each}
      {#if indicatorReady}<span
          class="nav-indicator"
          aria-hidden="true"
          style:width={`${indicator.width}px`}
          style:transform={`translateX(${indicator.left}px)`}
        ></span>{/if}
    </nav>
    <div class="tools">
      <button
        class="icon-button"
        onclick={onnewsletter}
        aria-label="S’inscrire à l’infolettre"
        title="L’infolettre"><Icon name="pigeon" size={22} /></button
      ><button
        class="icon-button"
        onclick={toggleTheme}
        aria-label={theme === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre'}
        aria-pressed={theme === 'dark'}
        title="Changer le thème"><Icon name={theme === 'dark' ? 'sun' : 'moon'} /></button
      >
    </div>
  </div>
</header>

<style>
  header {
    border-bottom: 1px solid var(--ink);
    margin-bottom: clamp(2rem, 4vw, 4rem);
  }
  header.home {
    margin-bottom: 1.5rem;
  }
  .tools {
    display: flex;
    gap: 0.6rem;
    grid-column: 3;
    grid-row: 1;
    justify-self: end;
    align-self: stretch;
  }
  .tools .icon-button {
    width: auto;
    height: auto;
    padding-block: 0;
  }
  .wordmark-link {
    display: block;
    width: min(620px, 75%);
    margin: 1.8rem auto;
  }
  .wordmark {
    display: block;
    width: 100%;
    height: auto;
    mix-blend-mode: multiply;
  }
  :global([data-theme='dark']) .wordmark {
    filter: invert(1);
    mix-blend-mode: screen;
  }
  .nav-row {
    min-height: calc(var(--nav-control-height) + 1px);
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    align-items: center;
    border-top: 1px solid var(--ink);
    gap: 1rem;
  }
  nav {
    position: relative;
    display: flex;
    grid-column: 2;
    grid-row: 1;
    gap: 0;
    justify-content: center;
    align-self: stretch;
  }
  nav a,
  .tools .icon-button {
    padding-inline: var(--control-padding-inline);
  }
  nav a {
    display: flex;
    align-items: center;
    text-decoration: none;
    font: 12px var(--sans);
    letter-spacing: 0.06em;
    position: relative;
  }
  nav a:hover,
  nav a:focus-visible,
  .menu-button:hover,
  .menu-button:focus-visible {
    color: var(--accent);
    background-color: var(--accent-soft);
  }
  nav a[aria-current] {
    color: var(--accent);
  }
  nav a[aria-current]::after {
    content: '';
    height: 3px;
    background: var(--accent);
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
  }
  nav.indicator-ready a[aria-current]::after {
    display: none;
  }
  .nav-indicator {
    position: absolute;
    bottom: -1px;
    left: 0;
    height: 3px;
    background: var(--accent);
    pointer-events: none;
    transition:
      transform 180ms ease,
      width 180ms ease;
  }
  .menu-button {
    display: none;
  }
  @media (max-width: 767px) {
    .wordmark-link {
      width: 100%;
      margin: 1.3rem auto;
    }
    .nav-row {
      position: relative;
      grid-template-columns: 1fr auto;
    }
    .tools {
      grid-column: 2;
    }
    .menu-button {
      display: flex;
      grid-column: 1;
      grid-row: 1;
      justify-self: start;
      align-items: center;
      gap: 0.4rem;
      background: none;
      border: 0;
      padding: 0.6rem 0;
      font: 12px var(--sans);
    }
    nav {
      display: none;
      position: absolute;
      grid-column: 1 / -1;
      top: 100%;
      left: 0;
      right: 0;
      background: var(--paper);
      border-bottom: 1px solid var(--ink);
      padding: 1rem;
      z-index: 20;
      box-shadow: 0 15px 20px #0001;
    }
    nav.open {
      display: grid;
      gap: 0;
    }
    nav a {
      padding: 1rem;
      justify-content: center;
    }
    nav a[aria-current]::after {
      display: none;
    }
    .nav-indicator {
      display: none;
    }
  }
</style>
