<script lang="ts">
  import { canonical } from '#lib/composition/metadata.ts';
  import { onMount } from 'svelte';
  import { base } from '#lib/composition/paths.ts';
  let { data }: { data: { target: string } } = $props();
  onMount(() => location.replace(`${base}${data.target}`));
</script>

<svelte:head
  ><title>Cette page a déménagé — 24 Regards</title><meta
    http-equiv="refresh"
    content={`0;url=${base}${data.target}`}
  /><link rel="canonical" href={canonical(data.target)} /></svelte:head
>
<h1>Un nouveau regard.</h1>
<p>Cette page a déménagé. <a href={`${base}${data.target}`}>Continuer la lecture.</a></p>
