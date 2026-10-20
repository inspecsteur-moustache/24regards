<script lang="ts">
  import type { SiteConfig } from '#lib/domain/models.ts';
  import Icon from './Icon.svelte';
  let { config }: { config: SiteConfig['newsletter'] } = $props();
  let dialog: HTMLDialogElement;
  export function open() {
    dialog.showModal();
  }
</script>

<dialog bind:this={dialog} aria-labelledby="newsletter-title">
  <div class="dialog-content">
    <button
      class="icon-button close"
      aria-label="Fermer l’infolettre"
      onclick={() => dialog.close()}><Icon name="close" /></button
    >
    <div class="pigeon"><Icon name="pigeon" size={48} /></div>
    <p class="eyebrow">Des nouvelles par pigeon voyageur</p>
    <h2 id="newsletter-title">Gardons le contact.</h2>
    <p>
      Les prochains numéros et les nouveaux regards sur le cinéma, directement dans votre boîte
      courriel.
    </p>
    {#if config.actionUrl}<form action={config.actionUrl} method="post">
        <label for="newsletter-email">Votre adresse courriel</label><input
          id="newsletter-email"
          type="email"
          name={config.emailFieldName}
          autocomplete="email"
          required
          placeholder="vous@exemple.ca"
        />{#each Object.entries(config.hiddenFields) as [name, value]}<input
            type="hidden"
            {name}
            {value}
          />{/each}<button class="button primary" type="submit"
          >M’inscrire à l’infolettre <Icon name="right" /></button
        >
      </form>{:else}<p class="coming-soon" role="status">Inscriptions bientôt disponibles</p>{/if}
  </div>
</dialog>

<style>
  dialog {
    border: 1px solid var(--ink);
    padding: 0;
    width: min(480px, calc(100% - 2rem));
    max-height: 90dvh;
    background: var(--paper);
    color: var(--ink);
  }
  dialog::backdrop {
    background: #14110fc4;
    backdrop-filter: blur(3px);
  }
  .dialog-content {
    padding: 3rem 2rem;
  }
  .close {
    position: absolute;
    right: 1rem;
    top: 1rem;
  }
  .pigeon {
    color: var(--accent);
    margin-bottom: 2rem;
  }
  h2 {
    font-size: 2.6rem;
    margin: 0.8rem 0;
  }
  p {
    line-height: 1.7;
    color: var(--muted);
  }
  form {
    display: grid;
    gap: 1rem;
    margin-top: 2rem;
  }
  label {
    font: 12px var(--sans);
  }
  input {
    background: var(--surface);
    color: var(--ink);
    border: 1px solid var(--line);
    padding: 1rem;
    font: 16px var(--sans);
  }
  .coming-soon {
    border-top: 1px solid var(--line);
    padding-top: 1.5rem;
    font: 12px var(--sans);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
</style>
