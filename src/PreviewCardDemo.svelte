<script>
    import PreviewCard from 'svelte-preview-card';
</script>

<style>
    .card-display {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        margin: auto;
        justify-content: center;
    }

</style>

<h2><a href="https://github.com/Linkcube/svelte-preview-card">Svelte Preview Card</a></h2>
<div class="card-display">
    <!-- Images from https://unsplash.com -->
    <PreviewCard background_source="https://images.unsplash.com/photo-1524639099061-f8beec2b7538" primary_text="Default" sub_text="Config"></PreviewCard>
    <PreviewCard background_source="https://images.unsplash.com/photo-1578508678408-f4292c7636d5" primary_text="Primary Only"></PreviewCard>
    <PreviewCard background_source="https://images.unsplash.com/photo-1567365167067-5da250d258a5" sub_text="Sub Only"></PreviewCard>
    <PreviewCard background_source="https://images.unsplash.com/photo-1579489225078-27977a77bf72"></PreviewCard>
    <PreviewCard
        background_source="https://images.unsplash.com/photo-1580193769210-b8d1c049a7d9"
        primary_text="Styled"
        sub_text="Colors"
        background_color="#ffd5db"
        primary_text_color="white"
        sub_text_color="blue"
        active_color="pink"
    ></PreviewCard>
    <PreviewCard background_source="https://images.unsplash.com/photo-1580193667916-75207858183b" primary_text="Disabled" sub_text="Clicking" disabled={true}></PreviewCard>
    <PreviewCard background_source="https://images.unsplash.com/photo-1574780879552-9c07b351ea86" primary_text="Focus" sub_text="Color" focus_color="#3c8bff"></PreviewCard>
    <PreviewCard background_source="https://images.unsplash.com/photo-1579619272436-7bf4271f0bff" primary_text="Active" sub_text="Color" active_color="#3c8bff"></PreviewCard>
    <PreviewCard background_source="" primary_text="Empty Source" sub_text="displays alt text" alt_text="Alt text here"></PreviewCard>
    <PreviewCard primary_text="Background disabled" sub_text="It's an option" alt_text="Alt text here"></PreviewCard>
</div>