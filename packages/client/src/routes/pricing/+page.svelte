<script>
  function handleInviteRequest(event) {
    event?.preventDefault();

    // Handle the invite request (e.g., send to server)
    alert("Early access requested");
  }
</script>

<main class="bg-slate-100 min-h-screen p-4 font-mono">
  <header class="mb-8 text-center">
    <a
      href="/landing"
      class="bg-indigo-600 mb-2 inline-block -rotate-2 transform p-2 text-4xl font-bold text-white"
    >
      Gadabout.ai
    </a>
    <h1 class="mt-4 text-3xl font-bold">Pricing Plans</h1>
  </header>

  <div class="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
    <div
      class="border-slate-800 rotate-1 transform rounded-lg border-4 bg-white p-6 shadow-lg"
    >
      <h2 class="mb-4 text-2xl font-bold">Starter</h2>
      <p class="mb-4 text-3xl font-bold">
        £99<span class="text-xl font-normal">/mo</span>
      </p>
      <ul class="mb-6 space-y-2">
        <li>650 credits included</li>
        <li>£15.50 per 100 additional credits</li>
      </ul>
      <button
        onclick={handleInviteRequest}
        class="bg-indigo-600 hover:bg-indigo-700 w-full transform p-2 font-bold text-white transition-transform hover:scale-105"
      >
        Request Invite
      </button>
    </div>

    <div
      class="border-slate-800 -rotate-1 transform rounded-lg border-4 bg-white p-6 shadow-lg"
    >
      <h2 class="mb-4 text-2xl font-bold">Pro</h2>
      <p class="mb-4 text-3xl font-bold">
        £248<span class="text-xl font-normal">/mo</span>
      </p>
      <ul class="mb-6 space-y-2">
        <li>2,000 credits included</li>
        <li>£12.50 per 100 additional credits</li>
      </ul>
      <button
        onclick={handleInviteRequest}
        class="bg-indigo-600 hover:bg-indigo-700 w-full transform p-2 font-bold text-white transition-transform hover:scale-105"
      >
        Request Invite
      </button>
    </div>

    <div
      class="bg-teal-400 border-slate-800 rotate-2 transform rounded-lg border-4 p-6 shadow-lg"
    >
      <h2 class="mb-4 text-2xl font-bold">Enterprise</h2>
      <p class="mb-4 text-3xl font-bold">
        £495<span class="text-xl font-normal">/mo</span>
      </p>
      <ul class="mb-6 space-y-2">
        <li>Enterprise base plan</li>
        <li>£5.00 per 100 credits</li>
        <li>Custom solutions available</li>
      </ul>
      <button
        onclick={handleInviteRequest}
        class="bg-indigo-600 hover:bg-indigo-700 w-full transform p-2 font-bold text-white transition-transform hover:scale-105"
      >
        Contact Sales
      </button>
    </div>
  </div>

  <footer class="mt-8 text-center text-sm text-gray-500">
    <a href="/landing" class="hover:underline">Home</a>
    <span class="mx-2">|</span>
    <a href="/pricing" class="hover:underline">Pricing</a>
  </footer>
</main>
