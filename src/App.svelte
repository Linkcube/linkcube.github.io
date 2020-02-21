<script>
	export let name;
	import AudioControls from 'svelte-audio-controls';
</script>

<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">

<main>
	<h1>Linkcube's Component Demo</h1>
	<h2><a href="https://github.com/Linkcube/svelte-audio-controls">Svelte Audio Controls</a></h2>
	<div class="audio-container">
		<article>
			<!-- https://musopen.org/music/9862-the-blue-danube-op-314/ -->
			<h3>The Blue Danube Waltz</h3>
			<p><b>Johann Strauss</b> / performed by European Archive</p>
			<AudioControls
				src="https://sveltejs.github.io/assets/music/strauss.mp3"
				display={true}
			/>
		</article>

		<article>
			<h3>Mars, the Bringer of War</h3>
			<p><b>Gustav Holst</b> / performed by USAF Heritage of America Band</p>
			<!-- https://musopen.org/music/43775-the-planets-op-32/ -->
			<AudioControls
				src="https://sveltejs.github.io/assets/music/holst.mp3"
				display={true}
			/>
		</article>

		<article>
			<h3>Gymnopédie no. 1</h3>
			<p><b>Erik Satie</b> / performed by Prodigal Procrastinator</p>
			<!-- https://musopen.org/music/8010-3-gymnopedies/ -->
			<AudioControls
				src="https://sveltejs.github.io/assets/music/satie.mp3"
				display={true}
			/>
		</article>

		<article>
			<h3>Symphony no. 5 in Cm, Op. 67 - I. Allegro con brio</h3>
			<p><b>Ludwig van Beethoven</b> / performed by European Archive</p>
			<!-- https://musopen.org/music/2567-symphony-no-5-in-c-minor-op-67/ -->
			<AudioControls
				src="https://sveltejs.github.io/assets/music/beethoven.mp3"
				display={true}
			/>
		</article>

		<article>
			<h3>Requiem in D minor, K. 626 - III. Sequence - Lacrymosa</h3>
			<p><b>Wolfgang Amadeus Mozart</b> / performed by Markus Staab</p>
			<!-- https://musopen.org/music/43683-requiem-in-d-minor-k-626/ -->
			<AudioControls
				src="https://sveltejs.github.io/assets/music/mozart.mp3"
				display={true}
			/>
		</article>
	</div>
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

	.audio-container {
		width: 600px;
	}

	article {
		justify-content: center;
	}
</style>