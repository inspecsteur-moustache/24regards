<script lang="ts">
  import { base } from '#lib/composition/paths.ts';
  import { goto } from '$app/navigation';
  import type { Article, Redacteur } from '#lib/domain/models.ts';
  import ArticleNotebook from './ArticleNotebook.svelte';
  let {
    articles,
    selected,
    author,
  }: { articles: readonly Article[]; selected: Article; author?: Redacteur } = $props();
  const date = (value: string) =>
    new Intl.DateTimeFormat('fr-CA', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'America/Toronto',
    }).format(new Date(value));
</script>

<div class="page-intro">
  <h1>Un film.<br />Un regard.</h1>
  <p>Critiques, découvertes et détours cinéphiles.</p>
</div>
<div class="article-layout">
  <aside class="article-list" aria-label="Choisir un article">
    <div class="list-title">
      Les articles <span>{articles.length.toString().padStart(2, '0')}</span>
    </div>
    <div class="desktop-list">
      {#each articles as article, index}<a
          href={`${base}/articles/${article.slug}/`}
          class:active={selected.slug === article.slug}
          aria-current={selected.slug === article.slug ? 'page' : undefined}
          ><span class="article-index">{String(index + 1).padStart(2, '0')}</span>
          <div>
            <span class="article-title">{article.title}</span><span class="article-date"
              >{date(article.publishedAt)}</span
            >
          </div></a
        >{/each}
    </div>
    <div class="mobile-select">
      <label for="article-select">Choisir un texte</label><select
        id="article-select"
        value={selected.slug}
        onchange={(event) => void goto(`${base}/articles/${event.currentTarget.value}/`)}
        >{#each articles as article}<option value={article.slug}>{article.title}</option
          >{/each}</select
      >
    </div>
  </aside>
  <section class="selected-article" aria-label={selected.title}>
    <h2>{selected.title}</h2>
    <p class="article-meta">
      {#if author}<a href={`${base}/redaction/${author.slug}/`}>{author.name}</a><span>·</span
        >{/if}<time datetime={selected.publishedAt}>{date(selected.publishedAt)}</time>
    </p>
    <ArticleNotebook article={selected} />
  </section>
</div>

<style>
  .page-intro {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 0 2rem;
    margin-bottom: 3rem;
  }
  .page-intro .eyebrow {
    width: 100%;
  }
  .page-intro h1 {
    margin-bottom: 0;
  }
  .page-intro > p:last-child {
    font-size: 14px;
    color: var(--muted);
    margin-bottom: 0.4rem;
  }
  .article-layout {
    display: grid;
    grid-template-columns: 260px minmax(0, 1fr);
    gap: clamp(2rem, 5vw, 5rem);
    border-top: 1px solid var(--ink);
    padding-top: 2rem;
  }
  .list-title {
    font: 10px var(--sans);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    display: flex;
    justify-content: space-between;
    padding-bottom: 1.3rem;
  }
  .list-title span {
    color: var(--muted);
  }
  .desktop-list a {
    display: flex;
    gap: 0.8rem;
    padding: 1.25rem 0;
    border-top: 1px solid var(--line);
    text-decoration: none;
  }
  .article-index {
    font: 9px var(--sans);
    color: var(--muted);
    padding-top: 0.3rem;
  }
  .article-title {
    font-size: 16px;
    line-height: 1.4;
    display: block;
  }
  .article-date {
    display: block;
    margin-top: 0.6rem;
    color: var(--muted);
    font: 9px var(--sans);
  }
  .desktop-list a.active {
    color: var(--accent);
  }
  .desktop-list a.active .article-index {
    color: var(--accent);
  }
  .selected-article {
    min-width: 0;
  }
  .selected-article > h2 {
    font-size: clamp(1.8rem, 3vw, 2.7rem);
    letter-spacing: -0.03em;
    margin-bottom: 1rem;
  }
  .article-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.7rem;
    font: 10px var(--sans);
    color: var(--muted);
    line-height: 1.7;
  }
  .article-meta a {
    text-decoration: none;
  }
  .mobile-select {
    display: none;
  }
  @media (max-width: 900px) {
    .article-layout {
      grid-template-columns: 1fr;
      gap: 2rem;
    }
    .desktop-list,
    .list-title {
      display: none;
    }
    .mobile-select {
      display: grid;
      font: 10px var(--sans);
      gap: 0.8rem;
    }
    .mobile-select select {
      width: 100%;
    }
    .page-intro {
      margin-bottom: 2rem;
    }
    .page-intro > p:last-child {
      margin-top: 1rem;
    }
  }
</style>
