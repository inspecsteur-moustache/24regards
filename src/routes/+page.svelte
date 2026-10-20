<script lang="ts">
  import { canonical } from '#lib/composition/metadata.ts';
  import { onMount } from 'svelte';
  import { base } from '#lib/composition/paths.ts';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import type { Magazine } from '#lib/domain/models.ts';
  import MagazineReader from '#lib/components/MagazineReader.svelte';
  import Icon from '#lib/components/Icon.svelte';
  let { data }: { data: { magazines: readonly Magazine[]; selected: Magazine } } = $props();
  let ready = $state(false);
  onMount(() => {
    ready = true;
  });
  const selected = $derived(
    (ready
      ? data.magazines.find((magazine) => magazine.id === page.url.searchParams.get('numero'))
      : undefined) ?? data.selected,
  );
</script>

<svelte:head
  ><title>24 Regards — Le cinéma sous tous ses angles</title><meta
    name="description"
    content="Magazine montréalais dédié au cinéma et à la cinéphilie. Feuilletez nos numéros et découvrez les regards de notre rédaction."
  /><link rel="canonical" href={canonical('/')} /></svelte:head
>
<section class="home-intro" aria-labelledby="about-title">
  <div class="about">
    <div class="section-heading">
      <h1 id="about-title">À propos</h1>
    </div>
    <p>
      Le 24 Regards est un magazine dédié au cinéma et à la cinéphilie. Né d’une initiative
      montréalaise, le projet a comme objectif d’encourager quiconque avec un amour cinéphile à
      écrire sur un sujet de son choix, peu importe l’angle et la forme.
    </p>
    <p>
      Vous voulez nous envoyer un texte ? Faites-le nous parvenir et il sera révisé pour être
      ensuite publié dans le prochain numéro.
    </p>
    <a class="button participate-button" href={`${base}/participer/`}
      >Faire partie du prochain regard <Icon name="right" size={17} /></a
    >
  </div>
</section>
<section class="magazines-section" aria-labelledby="magazine-title">
  <div class="catalog-heading">
    <div>
      <p class="eyebrow">À lire, à garder, à partager</p>
      <h2 id="magazine-title">
        Les magazines à feuilleter<span> / {String(data.magazines.length).padStart(2, '0')}</span>
      </h2>
    </div>
    <div class="catalog-actions">
      <label class="sr-only" for="magazine-select">Choisir un magazine</label><select
        id="magazine-select"
        value={selected.id}
        onchange={(event) =>
          void goto(`${base}/?numero=${event.currentTarget.value}`, { reset: false })}
        >{#each data.magazines as magazine}<option value={magazine.id}>{magazine.title}</option
          >{/each}</select
      ><a
        class="button pdf-button"
        href={`${base}${selected.pdfFile}`}
        download={selected.pdfFile.split('/').at(-1)}
        ><Icon name="download" size={16} /><span>Télécharger le PDF</span></a
      >
    </div>
  </div>
  <MagazineReader magazine={selected} />
</section>

<style>
  .home-intro {
    padding-bottom: 3.4rem;
  }
  .about {
    max-width: 52rem;
    margin-inline: auto;
  }
  .about .section-heading {
    margin-bottom: 1.2rem;
  }
  .about .section-heading h1 {
    font-size: 1.65rem;
    letter-spacing: -0.025em;
    margin: 0;
  }
  .about > p {
    font-size: 15px;
    color: var(--muted);
    margin-bottom: 1rem;
    line-height: 1.8;
    text-align: justify;
    hyphens: auto;
  }
  .participate-button {
    font: 10px var(--sans);
    margin-top: 0.2rem;
  }
  .magazines-section {
    padding-top: 2.6rem;
  }
  .catalog-heading {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 1.5rem;
    padding: 0.5rem;
  }
  .catalog-heading .eyebrow {
    margin-bottom: 0.7rem;
  }
  .catalog-heading h2 {
    font-size: 2.1rem;
    letter-spacing: -0.035em;
    margin: 0;
  }
  .catalog-heading h2 span {
    font: inherit;
    color: var(--muted);
    letter-spacing: inherit;
    margin-inline-start: 0.2em;
    white-space: nowrap;
  }
  .catalog-actions {
    display: flex;
    gap: 0.8rem;
    flex-wrap: wrap;
  }
  .catalog-actions select {
    min-width: 215px;
    cursor: pointer;
  }
  .participate-button:hover,
  .catalog-actions select:hover {
    border-color: var(--accent);
    color: var(--accent);
    background-color: var(--accent-soft);
  }
  @media (max-width: 1000px) {
    .catalog-heading {
      align-items: flex-start;
      flex-direction: column;
    }
  }
  @media (max-width: 767px) {
    .home-intro {
      padding-bottom: 2rem;
    }
    .about > p {
      font-size: 14px;
    }
    .catalog-actions {
      width: 100%;
    }
    .catalog-actions select {
      min-width: 0;
    }
    .catalog-actions select,
    .catalog-actions .button {
      width: 100%;
    }
    .catalog-heading h2 {
      font-size: 1.8rem;
    }
  }
</style>
