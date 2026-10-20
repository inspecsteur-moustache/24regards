<script lang="ts">
  import { canonical } from '#lib/composition/metadata.ts';
  import ArticleView from '#lib/components/ArticleView.svelte';
  import type { Article, Redacteur } from '#lib/domain/models.ts';
  let { data }: { data: { articles: readonly Article[]; selected?: Article; author?: Redacteur } } =
    $props();
</script>

<svelte:head
  ><title>Articles — 24 Regards</title><meta
    name="description"
    content="Critiques, découvertes et détours cinéphiles : les articles du 24 Regards."
  /><link rel="canonical" href={canonical('/articles/')} /></svelte:head
>
{#if data.selected}<ArticleView
    articles={data.articles}
    selected={data.selected}
    author={data.author}
  />{:else}<h1>Les articles</h1>
  <p>Les prochains regards arrivent bientôt.</p>{/if}
