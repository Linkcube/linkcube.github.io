<div class="content">
    <h1 class="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
        Radio Archiver
    </h1>
    <p class="leading-7 [&:not(:first-child)]:mt-6">
        A journey of one man trying to save an online stream locally, many iterations included.
    </p>

    <h2 class="mt-6 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
        <a class="hover:underline" href="https://github.com/Linkcube/radio-archiver">Radio Archiver</a>
    </h2>
    <h4 class="scroll-m-20 text-xl font-semibold tracking-tight">
        Electron Bundle of Svelte Radio Interface and NoRa
    </h4>
    <p class="leading-7 [&:not(:first-child)]:mt-6">
        An attempt to make deployment easier by bundling both programs into a single electron binary.
        While the proof of concept worked, I don't think anyone has migrated to it, but if it offers an easy way to demo the program then it has served it's purpose.
    </p>

    <h2 class="mt-6 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
        <a class="hover:underline" href="https://github.com/Linkcube/svelte-radio-interface">Svelte Radio Interface</a>
    </h2>
    <h4 class="scroll-m-20 text-xl font-semibold tracking-tight">
        Svelte NoRa Interface
    </h4>
    <p class="leading-7 [&:not(:first-child)]:mt-6">
        Best part of UI? there's always something new to work with, well also probably the worst part of it as well.
        But anyways, svelte! a newfangled frontend not-framework-ish thing that proved much easier to work with than react or angular.
        While porting Nai over, all the material components had to be rebuilt, which in svelte was a great way to learn more about the language and css in general.
    </p>

    <h2 class="mt-6 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
        <a class="hover:underline" href="https://github.com/Linkcube/nai">Nai</a>
    </h2>
    <h4 class="scroll-m-20 text-xl font-semibold tracking-tight">
        ReactJS NoRa Interface
    </h4>
    <p class="leading-7 [&:not(:first-child)]:mt-6">
        The first GUI for these radio archivers! While working at Delphix on the UI automation, I fancied that I might move into development one day.
        This project was the beginning of that, as I hadn't worked with any frameworks before this (more evident by the fact this is done in react).
        Overall a good exercise for learning the basics of UI when working in a framework, and a component library (material in this case).
    </p>

    <h2 class="mt-6 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
        <a class="hover:underline" href="https://github.com/Linkcube/Nora">NoRa</a>
    </h2>
    <h4 class="scroll-m-20 text-xl font-semibold tracking-tight">
        NodeJS Radio Archiver
    </h4>
    <p class="leading-7 [&:not(:first-child)]:mt-6">
        A direct upgrade from the python version, was developed both as an improvement and practice in nodeJS.
        Most notably this included APIs for monitoring and start/stop/restarting of a recording.
        The threading of system calls in node also allows for this to potentially use up as many cores as possible when splitting a stream unlike the python version's sequential nature.
    </p>
</div>

<style>
    .content {
        padding: 2.5rem;
    }
</style>