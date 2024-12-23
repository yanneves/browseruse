<script>
  import { onMount } from "svelte";

  let cyclesRun = $state.raw(0);
  let websitesExplored = $state.raw(0);
  let inviteEmail = $state.raw("");

  onMount(() => {
    // Simulating data fetching
    cyclesRun = 15000;
    websitesExplored = 500;
  });

  function handleInviteRequest(event) {
    event?.preventDefault();

    // Handle the invite request (e.g., send to server)
    alert(`Early access requested for ${inviteEmail}`);
    inviteEmail = "";
  }
</script>

<main class="bg-slate-100 min-h-screen p-4 font-mono">
  <header class="mb-8">
    <h1
      class="bg-indigo-600 mb-2 inline-block -rotate-2 transform p-2 text-4xl font-bold text-white"
    >
      Gadabout.ai
    </h1>
    <p class="border-slate-800 border-4 bg-white p-2 text-xl font-semibold">
      Dominate B2B markets with AI-powered competitive insights
    </p>
  </header>

  <section
    class="bg-teal-400 border-slate-800 mb-8 rotate-1 transform border-4 p-4"
  >
    <h2 class="mb-2 text-2xl font-bold">The Villain: Obscurity</h2>
    <p class="border-slate-800 border-2 bg-white p-2">
      In the crowded B2B landscape, obscurity is your greatest enemy. It:
    </p>
    <ul class="border-slate-800 mt-2 list-disc border-2 bg-white p-2 pl-8">
      <li>Shrouds your unique value proposition</li>
      <li>Muffles your voice in a sea of competitors</li>
      <li>Blinds you to crucial market opportunities</li>
    </ul>
  </section>

  <section
    class="bg-amber-300 border-slate-800 mb-8 -rotate-1 transform border-4 p-4"
  >
    <h2 class="mb-2 text-2xl font-bold">Your Solution: Gadabout.ai</h2>
    <p class="border-slate-800 border-2 bg-white p-2">
      Gadabout.ai <strong>transforms your digital presence</strong> with
      AI-driven personas, delivering <strong>comprehensive insights</strong> for
      market research and competitor analysis.
      <strong>Create strategic, customer-centric experiences</strong> that make you
      stand out and win market share.
    </p>
  </section>

  <section class="bg-rose-300 border-slate-800 mb-8 border-4 p-4">
    <h2 class="mb-2 text-2xl font-bold">Unleash Your Competitive Edge</h2>
    <ul class="border-slate-800 space-y-2 border-2 bg-white p-2">
      <li class="flex items-center space-x-2">
        <div class="bg-indigo-600 flex-shrink-0 rounded-full p-2 text-white">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
        <span>AI-driven user personas uncover hidden opportunities</span>
      </li>
      <li class="flex items-center space-x-2">
        <div class="bg-indigo-600 flex-shrink-0 rounded-full p-2 text-white">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
        <span
          >Accessibility testing ensures you reach every potential customer</span
        >
      </li>
      <li class="flex items-center space-x-2">
        <div class="bg-indigo-600 flex-shrink-0 rounded-full p-2 text-white">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
        <span>Automated competitor analysis keeps you ahead of the curve</span>
      </li>
    </ul>
  </section>

  <section class="bg-indigo-300 border-slate-800 mb-8 border-4 p-4">
    <h2 class="mb-2 text-2xl font-bold">Real-time Impact</h2>
    <div class="border-slate-800 flex justify-between border-2 bg-white p-2">
      <div>
        <strong>{cyclesRun.toLocaleString()}</strong>
        <br />Cycles Run
      </div>
      <div>
        <strong>{websitesExplored.toLocaleString()}</strong>
        <br />Websites Explored
      </div>
    </div>
  </section>

  <section class="bg-teal-400 border-slate-800 rotate-1 transform border-4 p-4">
    <h2 class="mb-2 text-2xl font-bold">Secure Your Competitive Advantage</h2>
    <form
      onsubmit={handleInviteRequest}
      class="border-slate-800 border-2 bg-white p-2"
    >
      <input
        type="email"
        bind:value={inviteEmail}
        placeholder="Enter your work email"
        required
        class="border-slate-800 mb-2 w-full border-2 p-2"
      />
      <button
        type="submit"
        class="bg-indigo-600 hover:bg-indigo-700 w-full transform p-2 font-bold text-white transition-transform hover:scale-105"
      >
        Get Early Access
      </button>
    </form>
  </section>
  <footer class="mt-8 text-center text-sm text-gray-500">
    <a href="/landing" class="hover:underline">Home</a>
    <span class="mx-2">|</span>
    <a href="/pricing" class="hover:underline">Pricing</a>
  </footer>
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
</style>
