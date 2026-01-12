<script>
	import { createEventDispatcher } from 'svelte';
	import Dropdown from '$lib/components/icons/dropdown.svelte';

	export let user = null;
	export let otherUsers = [];
	export let isOpen = false;

	const dispatch = createEventDispatcher();

	let buttonElement = null;
	let dropdownPosition = { top: 0, left: 0, width: 0 };

	function toggleDropdown() {
		isOpen = !isOpen;
		if (isOpen && buttonElement) {
			const rect = buttonElement.getBoundingClientRect();
			dropdownPosition = {
				top: rect.bottom,
				left: rect.left,
				width: rect.width
			};
		}
	}

	function selectUser(selectedUser) {
		dispatch('selectUser', selectedUser);
		isOpen = false;
	}
</script>

<div>
	<button
		class="flex h-full rounded-xl px-3 py-1 outline-2 outline-gray-800 transition-transform duration-500 ease-in-out hover:scale-105"
		on:click={toggleDropdown}
		bind:this={buttonElement}
	>
		{#if user}
			<img
				src={user.image}
				alt={user.name}
				class="my-auto aspect-square h-7 w-7 rounded-full object-cover"
			/>
			<div class="flex h-full flex-col items-start justify-center px-3 leading-none">
				<h1 class="text-lg font-semibold">{user.name}</h1>
			</div>
			<div class="flex h-full items-center">
				<Dropdown />
			</div>
		{/if}
	</button>

	{#if isOpen}
		<div
			class="absolute z-50"
			style:top="{dropdownPosition.top}px"
			style:left="{dropdownPosition.left}px"
		>
			{#each otherUsers as otherUser}
				{#if otherUser.id !== 5}
					<button
						style:width="{dropdownPosition.width}px"
						class="my-3 flex h-full rounded-xl bg-gray-900 px-3 py-1 text-white shadow-lg outline-2 outline-gray-800 transition-transform duration-500 ease-in-out hover:scale-105"
						on:click={() => selectUser(otherUser)}
					>
						<img
							src={otherUser.image}
							alt={otherUser.name}
							class="aspect-square w-7 rounded-full object-cover"
						/>
						<div class="flex h-full flex-col items-start justify-center px-3 leading-none">
							<h1 class="text-lg font-semibold">{otherUser.name}</h1>
						</div>
					</button>
				{/if}
			{/each}
		</div>
	{/if}
</div>
