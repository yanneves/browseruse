<script>
  import { abort, launch } from "$lib/agent.svelte.js";
  import account from "$lib/stores/account.svelte.js";
  import browser from "$lib/stores/browser.svelte.js";
  import feed from "$lib/stores/feed.svelte.js";

  const { data } = $props();
  const { session } = data;

  let url = $state.raw("");
  let prompt = $state.raw("");
  let launching = $state.raw(false);

  $effect(() => {
    if (feed.status !== "idle") {
      launching = false;
    }
  });

  account.balance = data.balance;

  const numberStyle = new Intl.NumberFormat();

  function run(event) {
    event?.preventDefault();

    if (!url || !prompt) {
      return;
    }

    launching = true;
    launch(session, prompt, `https://${url}`);
  }

  function cancel(event) {
    event?.preventDefault();
    abort(session);
  }
</script>

<section
  class="mx-auto max-w-prose px-3 py-6 sm:grid sm:max-h-screen sm:max-w-full sm:grid-cols-2 sm:grid-rows-1 sm:gap-x-3 sm:p-0 xl:max-w-screen-2xl"
>
  <div class="relative flex flex-col gap-y-6 sm:py-6 sm:pl-3">
    <div class="rounded-md border border-gray-300">
      <div
        class="flex items-center justify-between border-b border-gray-400 bg-bg-100 p-2"
      >
        <aside class="flex justify-around space-x-1">
          <div class="h-2.5 w-2.5 rounded-full bg-gray-500"></div>
          <div class="h-2.5 w-2.5 rounded-full bg-gray-500"></div>
          <div class="h-2.5 w-2.5 rounded-full bg-gray-500"></div>
        </aside>
        <div
          class="mx-auto flex w-4/5 items-center gap-x-2 rounded-md border border-gray-300 bg-bg-50 px-4 py-1"
        >
          <i class="iconify size-5 text-gray-500 lucide--shield"></i>
          <span class="cursor-default text-gray-500">https://{url}</span>
        </div>
      </div>
      <figure class="relative grid aspect-video bg-bg-100">
        {#if browser.render}
          <img
            alt="Browser viewport displaying the agent's activity"
            class="h-full w-full rounded-b-md object-scale-down"
            src={browser.render}
          />
        {:else}
          <figcaption class="place-self-center text-gray-500">
            1280 x 720
          </figcaption>
        {/if}
      </figure>
    </div>

    <form onsubmit={run}>
      <div
        class="relative overflow-hidden rounded-lg border border-gray-300 shadow-sm focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500"
      >
        <label for="prompt" class="sr-only">Prompt</label>
        <textarea
          rows="4"
          name="prompt"
          id="prompt"
          class="block w-full resize-none border-0 bg-transparent py-0 pt-2.5 text-text-400 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
          placeholder="Write a prompt..."
          bind:value={prompt}
          required
        ></textarea>

        <dl
          class="absolute bottom-16 right-3 flex items-baseline gap-x-1 rounded-lg bg-bg-100 px-3 py-2"
        >
          <dt class="order-last text-xs">credits remaining</dt>
          <dd class="text-sm font-semibold">
            {numberStyle.format(account.balance)}
          </dd>
        </dl>

        <aside>
          <div class="h-px"></div>
          <div class="py-2">
            <div class="py-px">
              <div class="h-9"></div>
            </div>
          </div>
        </aside>

        <div class="absolute inset-x-px bottom-0">
          <div
            class="flex items-center justify-between space-x-3 border-t border-gray-200 px-2 py-2 sm:px-3"
          >
            <div class="flex">
              <label for="url" class="sr-only">URL</label>
              <div
                class="flex w-64 rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-600 sm:w-80"
              >
                <span
                  class="flex select-none items-center pl-3 text-gray-500 sm:text-sm"
                  >https://</span
                >
                <input
                  type="text"
                  name="url"
                  id="url"
                  class="block w-full flex-1 border-0 bg-transparent py-1.5 pl-1 text-text-400 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                  placeholder="example.com"
                  bind:value={url}
                  required
                />
              </div>
            </div>
            <div class="flex-shrink-0">
              {#if feed.status === "idle"}
                <button
                  type="submit"
                  class="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:hover:bg-primary-600"
                  disabled={launching}
                >
                  {#if launching}
                    <i class="iconify size-5 svg-spinners--gooey-balls-1"></i>
                  {:else}
                    <span>Run</span>
                  {/if}
                </button>
              {:else}
                <button
                  class="inline-flex items-center rounded-md bg-accent-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-accent-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
                  onclick={cancel}
                >
                  Cancel
                </button>
              {/if}
            </div>
          </div>
        </div>
      </div>
    </form>
  </div>

  <aside class="relative py-6 sm:hidden">
    <div class="absolute inset-0 flex items-center">
      <hr class="w-full border-gray-300" />
    </div>
    <div class="relative flex justify-center">
      <div class="flex justify-center bg-bg-50 px-2">
        <i class="iconify size-5 text-gray-500 lucide--plus"></i>
      </div>
    </div>
  </aside>

  <ul class="relative max-h-full space-y-6 overflow-y-auto sm:py-6 sm:pr-3">
    <!-- <li class="relative flex gap-x-4">
      <div class="absolute -bottom-6 left-0 top-0 flex w-6 justify-center">
        <div class="w-px bg-gray-200"></div>
      </div>
      <div
        class="relative flex h-6 w-6 flex-none items-center justify-center bg-bg-50"
      >
        <i class="iconify size-2 text-gray-300 lucide--badge"></i>
      </div>
      <p class="flex-auto py-0.5 text-xs leading-5 text-text-200">
        <span class="font-medium text-text-400">Agent</span> ran out of credits.
      </p>
      <time
        datetime="2023-01-23T11:24"
        class="flex-none py-0.5 text-xs leading-5 text-text-200">6d ago</time
      >
    </li> -->
    {#if feed.status === "thinking"}
      <li class="relative flex gap-x-4">
        {#if feed.thoughts.length}
          <div class="absolute -bottom-6 left-0 top-0 flex w-6 justify-center">
            <div class="w-px bg-gray-200"></div>
          </div>
        {/if}
        <div
          class="relative flex size-6 flex-none items-center justify-center bg-bg-50"
        >
          <i class="iconify size-2 text-gray-300 lucide--badge"></i>
        </div>
        <div class="flex-auto rounded-md p-3 ring-1 ring-inset ring-gray-200">
          <div class="flex justify-between gap-x-4">
            <div class="py-0.5 text-xs leading-5 text-text-200">
              <span class="font-medium text-text-400">Agent</span> thinking
            </div>
          </div>
          <i class="iconify size-5 text-accent-500 svg-spinners--3-dots-bounce"
          ></i>
        </div>
      </li>
    {/if}
    {#each feed.thoughts as { status, message }, i}
      <li class="relative flex gap-x-4">
        {#if i < feed.thoughts.length - 1}
          <div class="absolute -bottom-6 left-0 top-0 flex w-6 justify-center">
            <div class="w-px bg-gray-200"></div>
          </div>
        {/if}
        <div
          class="relative flex size-6 flex-none items-center justify-center bg-bg-50"
        >
          <i
            class="iconify"
            class:size-4={status !== "live"}
            class:text-accent-500={status !== "live"}
            class:size-2={status === "live"}
            class:text-gray-300={status === "live"}
            class:lucide--badge={status === "live"}
            class:lucide--badge-check={status === "complete"}
            class:lucide--badge-alert={status === "exhausted"}
            class:lucide--badge-x={status === "quit"}
          ></i>
        </div>
        <div class="flex-auto rounded-md p-3 ring-1 ring-inset ring-gray-200">
          <div class="flex justify-between gap-x-4">
            <div class="py-0.5 text-xs leading-5 text-text-200">
              <span class="font-medium text-text-400">Agent</span> commented
            </div>
            <time
              datetime="2023-01-23T15:56"
              class="flex-none py-0.5 text-xs leading-5 text-text-200"
              >moments ago</time
            >
          </div>
          <p class="text-sm leading-6 text-text-200">
            {message}
          </p>
        </div>
      </li>
    {:else}
      <li class="relative flex gap-x-4">
        <div
          class="relative flex h-6 w-6 flex-none items-center justify-center bg-bg-50"
        >
          <i class="iconify size-4 text-gray-300 lucide--badge-info"></i>
        </div>
        <div
          class="flex-auto rounded-md p-3 ring-1 ring-inset ring-gray-200 text-text-400 prose dark:prose-invert"
        >
          <p>
            That browser to the left is controlled by a multimodal AI agent in
            the cloud. Enter a prompt with an end goal along with a web address
            of your choice.
          </p>
          <p><strong>Known issues:</strong></p>
          <ul>
            <li>Agent may continue past its goal</li>
            <li>Browser stream could be smoother</li>
            <li>Advanced form inputs can be challenging</li>
            <li>Doesn't consume video or animated content reliably</li>
            <li>Can't use multi-factor authentication</li>
          </ul>
          <p>
            The model is improving rapidly. If one of the above prevents you
            using the tool, be sure to check back soon.
          </p>
          <small class="hidden sm:inline">(This app runs on mobile too!)</small>
        </div>
      </li>
    {/each}
  </ul>
</section>
