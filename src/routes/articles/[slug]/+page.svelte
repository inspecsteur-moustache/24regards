<script lang="ts">
  import { canonical } from '#lib/composition/metadata.ts';
  import ArticleView from '#lib/components/ArticleView.svelte';
  import type { Article, Redacteur } from '#lib/domain/models.ts';
  let { data }: { data: { articles: readonly Article[]; selected: Article; author?: Redacteur } } =
    $props();
  const description = $derived(
    data.selected.contentHtml
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .slice(0, 160),
  );
</script>

<svelte:head
  ><title>{data.selected.title} — 24 Regards</title><meta
    name="description"
    content={description}
  /><link rel="canonical" href={canonical(`/articles/${data.selected.slug}/`)} /><meta
    property="og:title"
    content={data.selected.title}
  /><meta property="og:type" content="article" /></svelte:head
>
<ArticleView articles={data.articles} selected={data.selected} author={data.author} />
