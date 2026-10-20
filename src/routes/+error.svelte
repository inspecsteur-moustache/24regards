<script lang="ts">
  import { page } from '$app/state';
  import { base } from '#lib/composition/paths.ts';
</script>

<svelte:head><title>Page introuvable — 24 Regards</title></svelte:head>
<p class="eyebrow">{page.status}</p>
<h1>Hors champ.</h1>
<p>{page.error?.message ?? 'Cette page est introuvable.'}</p>
<a class="button" href={`${base}/`}>Retrouver les magazines</a>
