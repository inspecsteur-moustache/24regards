<script lang="ts">
  import '#lib/styles/global.css';
  import '@openpageflip/core/styles.css';
  import { base } from '#lib/composition/paths.ts';
  import { site } from '#lib/composition/catalog.ts';
  import SiteHeader from '#lib/components/SiteHeader.svelte';
  import NewsletterDialog from '#lib/components/NewsletterDialog.svelte';
  import Icon from '#lib/components/Icon.svelte';
  let { children } = $props();
  let newsletter: NewsletterDialog;
</script>

<svelte:head><link rel="icon" href={`${base}/media/favicon.png`} /></svelte:head>
<a class="skip-link" href="#contenu">Aller au contenu</a>
<aside class="social-rail" aria-label="Nous retrouver">
  {#if site.instagramUrl}<a
      class="icon-button"
      href={site.instagramUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Instagram"><Icon name="instagram" /></a
    >{:else}<span
      class="icon-button unavailable"
      aria-label="Instagram — lien bientôt disponible"
      title="Instagram — bientôt disponible"><Icon name="instagram" /></span
    >{/if}<a
    class="icon-button"
    href={site.blueskyUrl}
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Bluesky"><Icon name="bluesky" /></a
  ><a class="icon-button" href={`mailto:${site.email}`} aria-label="Nous écrire par courriel"
    ><Icon name="mail" /></a
  ><span class="rail-line"></span><span class="rail-caption">UN AUTRE REGARD</span>
</aside>
<div class="site-shell">
  <SiteHeader onnewsletter={() => newsletter.open()} />
  <main id="contenu" tabindex="-1">{@render children()}</main>
  <footer>
    <div class="footer-brand">
      <span class="brand-name">24 Regards</span>
      <span class="footer-tagline">Le cinéma sous tous ses angles.</span>
    </div>
    <span class="footer-location">Montréal, Québec</span>
    <div class="footer-links">
      <a href={`mailto:${site.email}`}>Contact — {site.contactName}</a><a
        href={`${base}/citations/`}>Licences &amp; Citations</a
      >
    </div>
  </footer>
</div>
<NewsletterDialog bind:this={newsletter} config={site.newsletter} />

<style>
  .site-shell {
    width: min(1280px, calc(100% - 168px));
    margin-inline: auto;
  }
  .social-rail {
    position: fixed;
    left: 18px;
    top: 48%;
    transform: translateY(-30%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.8rem;
    z-index: 10;
  }
  .unavailable {
    opacity: 0.3;
  }
  .rail-line {
    height: 65px;
    width: 1px;
    background: var(--line);
    margin-top: 0.5rem;
  }
  .rail-caption {
    writing-mode: vertical-rl;
    font: 9px var(--sans);
    letter-spacing: 0.2em;
    color: var(--muted);
    margin-top: 0.4rem;
  }
  main {
    min-height: 35vh;
    outline: none;
  }
  footer {
    margin-top: 5rem;
    border-top: 1px solid var(--ink);
    padding: 2.2rem 0 1.5rem;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    gap: 1.5rem;
    align-items: center;
  }
  .footer-brand {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    font-size: 1.5rem;
    justify-self: start;
  }
  .footer-location,
  .footer-tagline {
    font: 11px var(--sans);
    color: var(--muted);
  }
  .footer-location {
    justify-self: center;
    text-align: center;
  }
  .footer-links {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    justify-self: end;
    max-width: 100%;
    gap: 1.4rem;
    font: 11px var(--sans);
  }
  .footer-links a {
    text-decoration: none;
    white-space: nowrap;
  }
  @media (max-width: 767px) {
    .site-shell {
      width: calc(100% - 96px);
    }
    .social-rail {
      left: 4px;
      top: 42%;
      gap: 0.5rem;
    }
    .social-rail :global(.icon-button) {
      width: 36px;
      min-width: 36px;
    }
    .rail-caption {
      display: none;
    }
    .rail-line {
      height: 35px;
    }
    .footer-brand,
    .footer-links {
      justify-self: center;
      align-items: center;
    }
    .footer-links {
      flex-direction: column;
      gap: 1rem;
    }
    footer {
      margin-top: 3rem;
      grid-template-columns: 1fr;
      text-align: center;
    }
  }
</style>
