<script>
	import { PreviewCard } from 'linkcube-svelte-components';
</script>

<h2>Svelte Preview Card</h2>
<div class="card-display">
	<!-- Images from https://unsplash.com -->
	<PreviewCard
		backgroundSource="https://images.unsplash.com/photo-1524639099061-f8beec2b7538"
		primaryText="Default"
		subText="Config"
	></PreviewCard>
	<PreviewCard
		backgroundSource="https://images.unsplash.com/photo-1578508678408-f4292c7636d5"
		primaryText="Primary Only"
	></PreviewCard>
	<PreviewCard
		backgroundSource="https://images.unsplash.com/photo-1567365167067-5da250d258a5"
		subText="Sub Only"
	></PreviewCard>
	<PreviewCard backgroundSource="https://images.unsplash.com/photo-1579489225078-27977a77bf72"
	></PreviewCard>
	<div
		style="--background-color: #ffd5db; --primary-text-color: white; --secondary-text-color: blue; --active-color: pink; --focus-color: pink;"
	>
		<PreviewCard
			backgroundSource="https://images.unsplash.com/photo-1580193769210-b8d1c049a7d9"
			primaryText="Styled"
			subText="Colors"
		></PreviewCard>
	</div>
	<PreviewCard
		backgroundSource="https://images.unsplash.com/photo-1580193667916-75207858183b"
		primaryText="Disabled"
		subText="Clicking"
		disabled={true}
	></PreviewCard>
	<div style="--focus-color: #3c8bff">
		<PreviewCard
			backgroundSource="https://images.unsplash.com/photo-1574780879552-9c07b351ea86"
			primaryText="Focus"
			subText="Color"
		></PreviewCard>
	</div>
	<div style="--active-color: #3c8bff">
		<PreviewCard
			backgroundSource="https://images.unsplash.com/photo-1579619272436-7bf4271f0bff"
			primaryText="Active"
			subText="Color"
		></PreviewCard>
	</div>
	<PreviewCard
		backgroundSource=""
		primaryText="Empty Source"
		subText="displays alt text"
		alt_text="Alt text here"
	></PreviewCard>
	<PreviewCard primaryText="Background disabled" subText="It's an option" alt_text="Alt text here"
	></PreviewCard>
</div>

<style>
	.card-display {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		margin: auto;
		justify-content: center;
	}
</style>
