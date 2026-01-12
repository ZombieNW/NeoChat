<script>
	export let openUser = null;
	export let actingUser = null;
</script>

<div class="flex min-h-24 items-center justify-between border-b-2 border-gray-800 p-6">
	{#if openUser}
		<div class="flex items-center">
			<img
				src={openUser.image}
				alt={openUser.name}
				class="aspect-square w-12 rounded-full object-cover"
			/>
			<div class="flex h-full flex-col items-start justify-center px-3 leading-none">
				<h2 class="text-gray-500">Chatting with...</h2>
				<h1 class="text-lg font-semibold">{openUser.name}</h1>
			</div>
		</div>
	{/if}

	{#if actingUser}
		<h1 class="text-gray-500">
			Chatting as <span class="border-b border-gray-500">{actingUser.name}</span>
		</h1>
	{/if}
</div>
