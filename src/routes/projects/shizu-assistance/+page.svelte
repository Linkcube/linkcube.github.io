<div class="content">
	<h1 class="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">Shizu Assistance</h1>
	<p class="leading-7 [&:not(:first-child)]:mt-6">
		Event and DJ organizer named after Anison Hijack's mascot. Allows an organization/event manager
		to add/edit/remove DJs and Promotions, and create events of said entries. Includes an additional
		OBS script for importing these events to save time when setting up scenes.
	</p>

	<h2
		class="mt-6 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0"
	>
		<a class="hover:underline" href="https://github.com/Linkcube/shizu-assistance-contained">
			Shizu Assistance (Contained)
		</a>
	</h2>
	<h4 class="scroll-m-20 text-xl font-semibold tracking-tight">
		Dockerized Version of Shizu OBS Assistant
	</h4>
	<p class="leading-7 [&:not(:first-child)]:mt-6">
		Current iteration, containerizing each of the services and placing the backend+db on it's own
		private network. After enough instances of new users being intimidated by CLI windows and
		closing them instinctively, the program was moved to docker to keep them safe. The backend was
		also moved from a json blob to a postgresql db, UI overhauled and a custom in-browser file
		browser created for remote access. Additional functionality was added for the OBS side of
		things, including ways to preserve special themes and generate automatic scripts for blocks of
		pre-recorded DJs.
	</p>

	<h2
		class="mt-6 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0"
	>
		<a class="hover:underline" href="https://github.com/Linkcube/ShizuObsAssistant">
			Shizu OBS Assistant [JS]
		</a>
	</h2>
	<h4 class="scroll-m-20 text-xl font-semibold tracking-tight">Svelte and NodeJS Ledger</h4>
	<p class="leading-7 [&:not(:first-child)]:mt-6">
		Second iteration, giving a much more standard GUI (reusing svelte components) and allowing for a
		mild improvement in use. Since the python version was using a json blob to store data, this
		program piggy-backs off of that and makes no notable changes for storage. However with the web
		interface, it was much easier to implement a way to preview DJ logos and recordings when
		selecting them (using a hacky file browser).
	</p>

	<h2
		class="mt-6 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0"
	>
		<a
			class="hover:underline"
			href="https://github.com/Linkcube/ShizuObsAssistant/tree/main/Python%20Version"
		>
			Shizu Obs Assistant [Python]
		</a>
	</h2>
	<h4 class="scroll-m-20 text-xl font-semibold tracking-tight">Python QT Ledger</h4>
	<p class="leading-7 [&:not(:first-child)]:mt-6">
		The first iteration of this program, a chance to experiment with QT for a local program rather
		than electron bundles. While it had enough basic functionality to create/update/delete entries
		and export to OBS, the UI was fairly unfriendly.
	</p>
</div>

<style>
	.content {
		padding: 2.5rem;
	}
</style>
