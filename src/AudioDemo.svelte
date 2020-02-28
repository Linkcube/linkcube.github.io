<script>
    import AudioControls from 'svelte-audio-controls';
</script>

<style>
    .audio-container {
		margin: auto;
		max-width: 800px;
		min-width: 350px;
	}

	article {
		justify-content: center;
	}
</style>

<h2><a href="https://github.com/Linkcube/svelte-audio-controls">Svelte Audio Controls</a></h2>
	<div class="audio-container">
		<article>
			<!-- https://musopen.org/music/9862-the-blue-danube-op-314/ -->
			<h3>The Blue Danube Waltz (Default config)</h3>
			<p><b>Johann Strauss</b> / performed by European Archive</p>
			<AudioControls
				src="https://sveltejs.github.io/assets/music/strauss.mp3"
				display={true}
			/>
		</article>

		<article>
			<h3>Mars, the Bringer of War (Inline tooltip)</h3>
			<p><b>Gustav Holst</b> / performed by USAF Heritage of America Band</p>
			<!-- https://musopen.org/music/43775-the-planets-op-32/ -->
			<AudioControls
				src="https://sveltejs.github.io/assets/music/holst.mp3"
				display={true}
				barPrimaryColor="#3c8bff"
                inlineTooltip={true}
			/>
		</article>

		<article>
			<h3>Gymnopédie no. 1 (Semi-transparent Tooltip)</h3>
			<p><b>Erik Satie</b> / performed by Prodigal Procrastinator</p>
			<!-- https://musopen.org/music/8010-3-gymnopedies/ -->
			<AudioControls
				src="https://sveltejs.github.io/assets/music/satie.mp3"
				display={true}
				barPrimaryColor="gold"
				iconColor="#d56ed5"
				backgroundColor="#f0f0f050"
			/>
		</article>

		<article>
			<h3>Symphony no. 5 in Cm, Op. 67 - I. Allegro con brio (No Tooltip)</h3>
			<p><b>Ludwig van Beethoven</b> / performed by European Archive</p>
			<!-- https://musopen.org/music/2567-symphony-no-5-in-c-minor-op-67/ -->
			<AudioControls
				src="https://sveltejs.github.io/assets/music/beethoven.mp3"
				display={true}
				barPrimaryColor="lightpink"
                disableTooltip={true}
			/>
		</article>

		<article>
			<h3>Requiem in D minor, K. 626 - III. Sequence - Lacrymosa (Controls with coloring)</h3>
			<p><b>Wolfgang Amadeus Mozart</b> / performed by Markus Staab</p>
			<!-- https://musopen.org/music/43683-requiem-in-d-minor-k-626/ -->
			<AudioControls
				src="https://sveltejs.github.io/assets/music/mozart.mp3"
				display={true}
				barPrimaryColor="lightgreen"
				barSecondaryColor="pink"
				textColor="orange"
			/>
		</article>
	</div>