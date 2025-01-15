<script lang="ts">
	import '../app.css';
	import { ModeWatcher } from 'mode-watcher';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import SidebarNav from '$lib/components/ui/sidebar-nav/sidebar-nav.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import type { LayoutData } from './$types';
	import type { Snippet } from 'svelte';

	let { data, children }: { data: LayoutData, children: Snippet} = $props();
</script>

<ModeWatcher />
<Sidebar.Provider>
	<SidebarNav groups={data.groups} />
	<main>
		<Sidebar.Trigger />
		<div class="title">
			<h1 class="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">Title Here</h1>
			<Button>Click Here!</Button>
		</div>
		{@render children()}
	</main>
</Sidebar.Provider>

<style>
</style>
