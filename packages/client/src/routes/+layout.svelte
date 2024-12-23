<script>
  import "../app.css";

  let { children } = $props();
</script>

<svelte:head>
  <title>Gadabout</title>
  <meta name="description" content="The autonomous browser agent" />
</svelte:head>

{@render children()}
