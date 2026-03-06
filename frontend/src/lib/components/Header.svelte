<script lang="ts">
	import Icon from '@iconify/svelte';
	import { uiScale } from '$lib/stores/uiScale';

	let { showNav = true }: { showNav?: boolean } = $props();
</script>

<header
	class="fixed top-0 left-0 right-0 z-50 px-6 py-4 ui-scaled-header"
	style="transform: scale({$uiScale}); transform-origin: top center;"
>
	<nav class="max-w-6xl mx-auto">
		<div
			class="bg-white/70 backdrop-blur-xl rounded-2xl border border-zinc-200/50 px-6 py-3 flex items-center justify-between shadow-sm"
		>
			<a href="/" class="flex items-center gap-3 group">
				<div
					class="w-9 h-9 bg-zinc-900 rounded-xl flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-300"
				>
					<Icon icon="mdi:magnify" class="text-white text-lg" />
				</div>
			</a>

			{#if showNav}
				<div class="flex items-center gap-1">
					<button
						onclick={() => uiScale.zoomOut()}
						class="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
						title="Zoom out"
						aria-label="Zoom out"
					>
						<Icon icon="mdi:minus" class="text-zinc-600 text-lg" />
					</button>
					<span class="text-xs text-zinc-400 min-w-[3rem] text-center">
						{Math.round($uiScale * 100)}%
					</span>
					<button
						onclick={() => uiScale.zoomIn()}
						class="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
						title="Zoom in"
						aria-label="Zoom in"
					>
						<Icon icon="mdi:plus" class="text-zinc-600 text-lg" />
					</button>
				</div>
			{/if}
		</div>
	</nav>
</header>
