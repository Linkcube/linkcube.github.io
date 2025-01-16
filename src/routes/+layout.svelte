<script lang="ts">
	import '../app.css';
	import { ModeWatcher } from 'mode-watcher';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import SidebarNav from '$lib/components/ui/sidebar-nav/sidebar-nav.svelte';
	import type { LayoutData } from './$types';
	import type { Snippet } from 'svelte';

	let { data, children }: { data: LayoutData, children: Snippet} = $props();
</script>

<ModeWatcher />


<Sidebar.Provider>
	<SidebarNav groups={data.groups} />
	<main>
		<header>
			<div class="toggle-button">
				<Sidebar.Trigger />
			</div>
			<h1 class="title scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
				Linkcube.github.io
			</h1>
		</header>
		<div class="render-container">
			{@render children()}
		</div>
	</main>
</Sidebar.Provider>

<style>

	main {
		overflow: hidden
	}
	header {
		width: 100vw;
		background: hsl(var(--accent));
		display: flex;
		flex-direction: row;
		justify-content: start;
		position: fixed;
		top: 0px;
	}

	.toggle-button {
		margin-top: .75rem;
	}

	.title {
		margin-left: 1rem;
	}

	.render-container {
		padding-top: 3rem;
	}

</style>
