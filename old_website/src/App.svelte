<script>
	import AudioDemo from './AudioDemo.svelte';
	import PreviewCardDemo from './PreviewCardDemo.svelte';
	import InputDemo from './InputDemo.svelte';
	import ThemeDemo from './Themes.svelte';
</script>

<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">

<main>
	<h1>Linkcube's Svelte Components Demo</h1>
	
	<AudioDemo></AudioDemo>
	<PreviewCardDemo></PreviewCardDemo>
	<InputDemo />
	<ThemeDemo />
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>