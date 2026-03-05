<script lang="ts">
	import favicon from '$lib/assets/favicon.svg'
	import { remult, Remult } from 'remult'
	import { createSubscriber } from 'svelte/reactivity'
	import type { LayoutData } from './$types'
	import { untrack } from 'svelte'

	interface Props {
		data: LayoutData
		children?: import('svelte').Snippet
	}

	function initRemultSvelteReactivity() {
		{
			let update = () => {}
			let s = createSubscriber((u: () => void) => {
				update = u
			})
			remult.subscribeAuth({
				reportObserved: () => s(),
				reportChanged: () => update()
			})
		}

		{
			Remult.entityRefInit = (x) => {
				let update = () => {}
				let s = createSubscriber((u: () => void) => {
					update = u
				})
				x.subscribe({
					reportObserved: () => s(),
					reportChanged: () => update()
				})
			}
		}
	}
	initRemultSvelteReactivity()

	let { data, children }: Props = $props()

	$effect(() => {
		data.user
		untrack(() => {
			remult.user = data.user
		})
	})
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Research Agent</title>
</svelte:head>

{@render children?.()}
