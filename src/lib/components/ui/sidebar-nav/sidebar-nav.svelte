<script lang="ts">
    import ChevronDown from "lucide-svelte/icons/chevron-down";
    import * as Sidebar from "$lib/components/ui/sidebar/index.js";
    import * as Collapsible from "$lib/components/ui/collapsible/index";

    let { groups=[] } = $props();
  </script>

  <Sidebar.Root>
    <Sidebar.Content>
      <Sidebar.Group>
        <Sidebar.GroupContent>
          <Sidebar.Menu>
            {#each groups as group}
                {#if group.items.length == 0}
                    <Sidebar.MenuItem>
                        <Sidebar.MenuButton>
                        {#snippet child({ props })}
                            <a href={group.slug} {...props}>
                            <span>{group.title}</span>
                            </a>
                        {/snippet}
                        </Sidebar.MenuButton>
                    </Sidebar.MenuItem>
                {:else}
                    <Collapsible.Root open class="group/collapsible">
                        <Sidebar.MenuItem>
                        <Collapsible.Trigger>
                            {#snippet child({ props })}
                            <Sidebar.MenuButton {...props}>
                                <span>{group.title}</span>
                                <ChevronDown class="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180"/>
                            </Sidebar.MenuButton>
                            {/snippet}
                        </Collapsible.Trigger>
                        <Collapsible.Content>
                            <Sidebar.MenuSub>
                                {#each group.items as item}
                                    <Sidebar.MenuSubItem>
                                        <a href={group.slug + item.slug}>
                                            <span>{item.title}</span>
                                        </a>
                                    </Sidebar.MenuSubItem>
                                {/each}
                            </Sidebar.MenuSub>
                        </Collapsible.Content>
                        </Sidebar.MenuItem>
                    </Collapsible.Root>
                {/if}
            {/each}
          </Sidebar.Menu>
        </Sidebar.GroupContent>
      </Sidebar.Group>
    </Sidebar.Content>
  </Sidebar.Root>