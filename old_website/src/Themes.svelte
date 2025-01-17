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
	import ThemeBlock from './ThemeBlock.svelte';
</script>

<h2>Theming</h2>

<div>
	<ThemeBlock />
</div>

<div
	style="
    --primary-color: lightgray;
    --secondary-color: black;
    --background-color: gray;
    --primary-text-color: white;
    --secondary-text-color: lightblue;
    --highlight-color: blue;
    background: gray;"
>
	<ThemeBlock />
</div>

<div
	style="
    --primary-color: #3700B3;
    --secondary-color: #03DAC6;
    --background-color: white;
    --primary-text-color: black;
    --secondary-text-color: grey;
    --highlight-color: yellow;
    background: white;"
>
	<ThemeBlock />
</div>

<div
	style="
    --primary-color: white;
    --secondary-color: #00BCD4;
    --background-color: #3700B3;
    --primary-text-color: white;
    --secondary-text-color: #BDBDBD;
    --highlight-color: yellow;
    background: #3700B3;"
>
	<ThemeBlock />
</div>

<div
	style="
    --primary-color: #FFA000;
    --secondary-color: #CDDC39;
    --background-color: #212121;
    --primary-text-color: white;
    --secondary-text-color: #BDBDBD;
    --highlight-color: #607D8B;
    background: #212121;"
>
	<ThemeBlock />
</div>

<style>
	div {
		margin-left: auto;
		margin-right: auto;
	}
</style>
