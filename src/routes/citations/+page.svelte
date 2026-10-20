<script lang="ts">
  import { base } from '#lib/composition/paths.ts';
  import type { Credit } from '#lib/domain/models.ts';
  let { data }: { data: { credits: readonly Credit[] } } = $props();
</script>

<svelte:head
  ><title>Sources, crédits et licences — 24 Regards</title><meta
    name="description"
    content="Sources éditoriales, crédits des images et licences des ressources utilisées par 24 Regards."
  /></svelte:head
>
<p class="eyebrow">Derrière les images</p>
<h1>Sources & crédits.</h1>
<div class="credits-layout">
  <section>
    <div class="section-heading"><h2>Les contenus</h2></div>
    <p>
      Les textes et les éléments d’identité proviennent du site original du 24 Regards. Les crédits
      disponibles dans les publications et les métadonnées des images sont conservés ci-dessous.
    </p>
    <ul>
      {#each data.credits as credit}<li>
          <a href={credit.sourceUrl} target="_blank" rel="noopener noreferrer">{credit.label}</a
          >{#if credit.credit}<span>{credit.credit}</span>{/if}
        </li>{/each}
    </ul>
  </section>
  <section id="licences">
    <div class="section-heading"><h2>Licences</h2></div>
    <p>
      Les textes, photographies et éléments d’identité conservent les droits et mentions de leurs
      auteurs respectifs. Leur présence sur ce site ne leur attribue aucune licence de réutilisation
      supplémentaire.
    </p>
    <ul>
      <li><a href="https://github.com/sveltejs/svelte/blob/main/LICENSE.md">Svelte — MIT</a></li>
      <li><a href="https://github.com/sveltejs/kit/blob/main/LICENSE">SvelteKit — MIT</a></li>
      <li>
        <a href="https://github.com/benhonda/openpageflip/blob/main/LICENSE">OpenPageFlip — MIT</a
        ><span>Géométrie du feuilletage dérivée de StPageFlip, Oleg Litovski.</span>
      </li>
      <li>
        <a href="https://github.com/mozilla/pdf.js/blob/master/LICENSE">PDF.js — Apache 2.0</a>
      </li>
    </ul>
    <p>
      <a href={`${base}/THIRD_PARTY_NOTICES.txt`}
        >Consulter les notices complètes des bibliothèques distribuées.</a
      >
    </p>
    <p>
      Typographies système : Georgia et Arial. Icônes de l’interface dessinées en SVG pour ce site.
    </p>
  </section>
</div>

<style>
  h1 {
    margin-bottom: 3rem;
  }
  .credits-layout {
    display: grid;
    grid-template-columns: 1.5fr 1fr;
    gap: 4rem;
  }
  .credits-layout p {
    font-size: 14px;
    color: var(--muted);
  }
  ul {
    list-style: none;
    padding: 0;
  }
  li {
    padding: 0.9rem 0;
    border-bottom: 1px solid var(--line);
    font-size: 14px;
    line-height: 1.6;
  }
  li span {
    display: block;
    color: var(--muted);
    font: 11px var(--sans);
    line-height: 1.7;
    margin-top: 0.4rem;
  }
  section {
    scroll-margin-top: 2rem;
  }
  @media (max-width: 900px) {
    .credits-layout {
      grid-template-columns: 1fr;
      gap: 2rem;
    }
  }
</style>
