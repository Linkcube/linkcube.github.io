<script>
import { 
    IconButton, MaterialButton, MaterialInput, MaterialSelect, MaterialTable, MaterialTableRow, MaterialTextArea
} from 'linkcube-svelte-components';

const numbers = ["One", "Two", "Three", "Four", "Five", "Six", "Seven"];
const moreNumbers = ["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven"];
const brands = ["Sennheiser", "Audeze", "Beyerdynamic", "HifiMan", "STAX"]

let numVal = 0;
let bVal = 0;
</script>

<style>
    .container {
        display: flex;
        flex-direction: column;
    }

    .display-row {
        display: flex;
        flex-direction: row;
        justify-content: space-around;
    }

    .padding {
        padding: 5px;
    }

    .smaller {
        width: 500px;
    }

    .bottom-padding {
        margin-bottom: 500px;
    }
</style>

<h2>Icon Buttons</h2>
<div class="container">
    <div class="display-row">
        <IconButton icon="add" title="add"></IconButton>
        <IconButton icon="note" title="note"></IconButton>
        <IconButton icon="book" title="book"></IconButton>
        <IconButton icon="eject" title="eject"></IconButton>
    </div>
    <div class="display-row" style="--secondary-text-color: green">
        <IconButton icon="home" title="home"></IconButton>
        <IconButton icon="info" title="info"></IconButton>
        <IconButton icon="note_add" title="note_add"></IconButton>
        <IconButton icon="pan_tool" title="pan_tool"></IconButton>
    </div>
    <div class="display-row" style="--secondary-text-color: red">
        <IconButton icon="rowing" title="rowing"></IconButton>
        <IconButton icon="store" title="store"></IconButton>
        <IconButton icon="swap_vert" title="swap_vert"></IconButton>
        <IconButton icon="delete" title="delete"></IconButton>
    </div>
</div>

<h2>Material Buttons</h2>
<div class="container">
    <div class="display-row padding" >
        <div class="padding" style="--secondary-text-color: black">
            <MaterialButton value="click me"/>
        </div>
        <div class="padding" style="--secondary-text-color: blue; --secondary-color: lightblue;">
        <MaterialButton value="click me"/>
        </div>
        <div class="padding" style="--secondary-text-color: red; --secondary-color: rgb(253, 229, 232);">
            <MaterialButton value="click me"/>
        </div>
    </div>
</div>

<h2>Material Input</h2>
<div class="container">
    <div class="display-row">
        <div class="padding">
            <MaterialInput label="Try me out"/>
        </div>
        <div class="padding">
            <MaterialInput label="Try me out" hintText="Hints go here"/>
        </div>
        <div class="padding" style="--primary-color: lightblue; --secondary-color: blue; --highlight-color: red; --secondary-text-color: pink;">
            <MaterialInput label="Styling" hintText="This can be styled as well" value="Some Default Text"/>
        </div>
    </div>
</div>

<h2>Material Select</h2>
<div class="container">
    <div class="display-row">
        <div>
            <MaterialSelect label="pick a number" bind:value={numVal}>
                {#each numbers as number, index}
                    <option value={index}>{number}</option>
                {/each}
            </MaterialSelect>
        </div>
        <div>
            <MaterialSelect bind:value={bVal}>
                {#each brands as brand, index}
                    <option value={index}>{brand}</option>
                {/each}
            </MaterialSelect>
        </div>
    </div>
</div>

<h2>Material Table</h2>
<div class="container">
    <div class="display-row">
        <div class="smaller">
            <MaterialTable items={numbers} columnSizes={["10%", "90%"]}>
                <div slot="item" let:item let:index>
                    <MaterialTableRow values={[index + 1, item]}></MaterialTableRow>
                </div>
            </MaterialTable>
        </div>
        <div class="smaller">
            <MaterialTable items={moreNumbers} columnSizes={["10%", "90%"]} height="350px">
                <div slot="header">
                    <MaterialTableRow values={["#", "Number"]} type="header"></MaterialTableRow>
                </div>
                <div slot="item" let:item let:index>
                    <MaterialTableRow values={[index + 1, item]}></MaterialTableRow>
                </div>
            </MaterialTable>
        </div>
    </div>
</div>

<h2>Material Text Area</h2>
<div class="container bottom-padding">
    <div class="display-row">
        <MaterialTextArea height=300 width=300 resize="none" label="No Resizing"/>
        <MaterialTextArea height=300 width=300 resize="horizontal" label="Horizontal Resizing"/>
        <div style="--primary-color: lightblue; --secondary-color: blue; --highlight-color: pink;">
            <MaterialTextArea height=300 width=300 resize="none" hintText="Hints as well"/>
        </div>
    </div>
</div>