<script>
	import LoadingDots from './icons/loading_dots.svelte';
	export let message;
	export let actingUser;

	const sender = JSON.parse(message.sender);
	const receiver = JSON.parse(message.receiver);
</script>

<div class="p-4">
	{#if sender.id === actingUser.id}
		<div class="flex justify-end">
			<div
				class="max-w-md rounded-2xl bg-indigo-600 p-4 text-white outline-2 outline-indigo-500 transition-transform duration-500 ease-in-out hover:scale-105"
			>
				<div class="text-right">{message.text}</div>
				{#if message.image}
					<img src={message.image} alt="Message" class="mt-2 max-w-xs" />
				{/if}
			</div>

			<img
				src={sender.image}
				alt={sender.name}
				class="mx-4 my-auto aspect-square h-10 w-10 rounded-full object-cover outline-2 outline-white/25"
			/>
		</div>
	{:else}
		<div class="flex justify-start">
			<img
				src={sender.image}
				alt={sender.name}
				class="mx-4 my-auto aspect-square h-10 w-10 rounded-full object-cover"
			/>
			<div
				class="max-w-md rounded-2xl bg-gray-800 p-4 text-white outline-2 outline-gray-700 transition-transform duration-500 ease-in-out hover:scale-105"
			>
				{#if message.thinking === true}
					<LoadingDots />
				{:else}
					<div class="text-left">{message.text}</div>
				{/if}

				{#if message.image}
					<img src={message.image} alt="Message" class="mt-2 max-w-xs" />
				{/if}
			</div>
		</div>
	{/if}
</div>
