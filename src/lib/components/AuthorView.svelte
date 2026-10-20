<script lang="ts">
  import { base } from '#lib/composition/paths.ts';
  import { goto } from '$app/navigation';
  import type { Redacteur } from '#lib/domain/models.ts';
  import Icon from './Icon.svelte';
  let {
    authors,
    selected,
    texts,
  }: {
    authors: readonly Redacteur[];
    selected: Redacteur;
    texts: readonly { title: string; href: string; kind: string }[];
  } = $props();
</script>

<h1>La rédaction.</h1>
<p class="intro">Des sensibilités différentes. Un même amour du cinéma.</p>
<div class="author-layout">
  <aside aria-label="Choisir un membre de la rédaction">
    <div class="desktop-authors">
      {#each authors as author}<a
          href={`${base}/redaction/${author.slug}/`}
          class:active={selected.slug === author.slug}
          aria-current={selected.slug === author.slug ? 'page' : undefined}
          ><span>{author.name}</span><small>{author.role}</small></a
        >{/each}
    </div>
    <div class="mobile-select">
      <label for="author-select">La rédaction</label><select
        id="author-select"
        value={selected.slug}
        onchange={(event) => void goto(`${base}/redaction/${event.currentTarget.value}/`)}
        >{#each authors as author}<option value={author.slug}>{author.name}</option>{/each}</select
      >
    </div>
  </aside>
  <section class="author-profile">
    <p class="eyebrow">{selected.role}</p>
    <h2>{selected.name}</h2>
    <div class="profile-columns">
      <section>
        <div class="section-heading">
          <h3>Coups de cœur</h3>
          <span>{selected.favorites.length} films</span>
        </div>
        <ol class="favorites">
          {#each selected.favorites as favorite}<li>{favorite}</li>{/each}
        </ol>
      </section>
      <section>
        <div class="section-heading">
          <h3>Les textes</h3>
          <span>{texts.length} regards</span>
        </div>
        <ul class="texts">
          {#each texts as text}<li>
              <a href={`${base}${text.href}`}
                ><span
                  >{text.title}<small
                    >{text.kind === 'magazine' ? 'Dans le magazine' : 'Article'}</small
                  ></span
                ><Icon name="right" size={16} /></a
              >
            </li>{/each}
        </ul>
      </section>
    </div>
  </section>
</div>

<style>
  h1 {
    margin-bottom: 1rem;
  }
  .intro {
    font-size: 15px;
    color: var(--muted);
    margin-bottom: 3rem;
  }
  .author-layout {
    display: grid;
    grid-template-columns: 230px minmax(0, 1fr);
    gap: 4rem;
    border-top: 1px solid var(--ink);
    padding-top: 2rem;
  }
  .desktop-authors a {
    display: block;
    text-decoration: none;
    border-bottom: 1px solid var(--line);
    padding: 1.3rem 0;
    font-size: 19px;
  }
  .desktop-authors a:first-child {
    padding-top: 0;
  }
  .desktop-authors a small {
    display: block;
    font: 10px var(--sans);
    color: var(--muted);
    margin-top: 0.6rem;
  }
  .desktop-authors a.active {
    color: var(--accent);
  }
  .author-profile h2 {
    font-size: 3rem;
    letter-spacing: -0.04em;
    margin: 0 0 2.5rem;
  }
  .profile-columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2.5rem;
  }
  .section-heading h3 {
    font-size: 1.5rem;
    margin: 0;
  }
  .favorites {
    padding-left: 1.4rem;
    margin: 0;
  }
  .favorites li {
    padding: 0.7rem 0 0.7rem 0.5rem;
    font-size: 14px;
    line-height: 1.7;
    border-bottom: 1px solid var(--line);
  }
  .favorites li::marker {
    color: var(--accent);
    font: 10px var(--sans);
  }
  .texts {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .texts a {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.9rem 0;
    border-bottom: 1px solid var(--line);
    text-decoration: none;
    font-size: 14px;
    line-height: 1.5;
  }
  .texts small {
    display: block;
    color: var(--muted);
    font: 9px var(--sans);
    margin-top: 0.5rem;
  }
  .mobile-select {
    display: none;
  }
  @media (max-width: 1050px) {
    .profile-columns {
      grid-template-columns: 1fr;
    }
  }
  @media (max-width: 767px) {
    .author-layout {
      grid-template-columns: 1fr;
      gap: 2rem;
    }
    .desktop-authors {
      display: none;
    }
    .mobile-select {
      display: grid;
      font: 10px var(--sans);
      gap: 0.8rem;
    }
    .author-profile h2 {
      font-size: 2.3rem;
    }
    .profile-columns {
      gap: 2rem;
    }
  }
</style>
