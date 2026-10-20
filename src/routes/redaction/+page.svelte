<script lang="ts">
  import { canonical } from '#lib/composition/metadata.ts';
  import AuthorView from '#lib/components/AuthorView.svelte';
  import type { Redacteur } from '#lib/domain/models.ts';
  let {
    data,
  }: {
    data: {
      authors: readonly Redacteur[];
      selected: Redacteur;
      texts: readonly { title: string; href: string; kind: string }[];
    };
  } = $props();
</script>

<svelte:head
  ><title>La rédaction — 24 Regards</title><meta
    name="description"
    content="Découvrez les rédactrices et rédacteurs du 24 Regards, leurs films coups de cœur et leurs textes."
  /><link rel="canonical" href={canonical('/redaction/')} /></svelte:head
>
<AuthorView {...data} />
