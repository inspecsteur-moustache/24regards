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
  ><title>{data.selected.name} — La rédaction — 24 Regards</title><meta
    name="description"
    content={`Les films coups de cœur et les textes de ${data.selected.name}, ${data.selected.role.toLowerCase()} au 24 Regards.`}
  /><link rel="canonical" href={canonical(`/redaction/${data.selected.slug}/`)} /></svelte:head
>
<AuthorView {...data} />
