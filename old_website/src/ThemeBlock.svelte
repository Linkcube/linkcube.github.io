<script>
	import {
		IconButton,
		MaterialButton,
		MaterialInput,
		MaterialSelect,
		MaterialTable,
		MaterialTableRow,
		MaterialTextArea,
		AudioControls
	} from 'linkcube-svelte-components';

	const moreNumbers = [
		'One',
		'Two',
		'Three',
		'Four',
		'Five',
		'Six',
		'Seven',
		'Eight',
		'Nine',
		'Ten',
		'Eleven'
	];
	let numVal = 1;
</script>

<div class="col container">
	<div class="row">
		<div class="col">
			<div class="row">
				<MaterialInput label="Try me out" hintText="Hints go here" />
			</div>
			<div class="row">
				<IconButton icon="eject" title="eject"></IconButton>
			</div>
			<div class="row">
				<MaterialSelect label="pick a number" bind:value={numVal}>
					{#each moreNumbers as number, index}
						<option value={index + 1}>{number}</option>
					{/each}
				</MaterialSelect>
			</div>
			<div class="row">
				<MaterialButton value={numVal} />
			</div>
			<div class="row">
				<AudioControls src="https://sveltejs.github.io/assets/music/strauss.mp3" />
			</div>
		</div>
		<div class="col">
			<MaterialTable items={moreNumbers} columnSizes={['10%', '90%']} height="350px">
				<div slot="header">
					<MaterialTableRow values={['#', 'Number']} type="header"></MaterialTableRow>
				</div>
				<div slot="item" let:item let:index>
					<MaterialTableRow values={[index + 1, item]}></MaterialTableRow>
				</div>
			</MaterialTable>
		</div>
	</div>
</div>

<style>
	.row {
		display: flex;
		flex-direction: row;
		justify-content: space-around;
	}

	.col {
		display: flex;
		flex-direction: column;
		width: 1000px;
		justify-content: space-around;
	}
</style>
