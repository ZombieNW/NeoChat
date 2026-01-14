<script>
	import { createEventDispatcher } from 'svelte';

	export let users = [];
	export let openUser = null;
	export let getLastMessageForUser = () => null;

	const dispatch = createEventDispatcher();

	function selectConversation(user) {
		dispatch('selectConversation', user);
	}
</script>

<div class="h-full w-1/5 overflow-hidden border-r-2 border-gray-800 p-6">
	<h1 class="mb-3 text-2xl font-semibold">Messages</h1>
	<div class="flex h-full flex-col overflow-x-hidden overflow-y-auto">
		{#each users as user (user.id)}
			<button on:click={() => selectConversation(user)}>
				<div
					class="my-1 flex w-full items-center rounded-xl p-3 transition-colors duration-300 ease-in-out hover:bg-gray-800/50"
					class:bg-gray-800={user.id === openUser?.id}
				>
					<img
						src={user.image}
						alt={user.name}
						class="aspect-square w-12 rounded-full object-cover"
					/>
					<div class="ml-3 w-full text-left">
						<h1 class="text-lg font-semibold">{user.name}</h1>
						<p class="w-5/6 truncate text-gray-500">
							{getLastMessageForUser(user)?.sender.name}: {getLastMessageForUser(user)?.text || ''}
						</p>
					</div>
				</div>
			</button>
		{/each}
	</div>
</div>
