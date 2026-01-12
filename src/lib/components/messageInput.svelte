<script>
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	let messageText = '';
	let loadedImage = null;

	function handleSend() {
		if (!messageText.trim() && !loadedImage) return;

		dispatch('send', {
			text: messageText,
			image: loadedImage
		});

		// Reset
		messageText = '';
		loadedImage = null;
	}

	function handleKeydown(e) {
		if (e.key === 'Enter' && !e.shiftKey) {
			handleSend();
			e.preventDefault();
		}
	}
</script>

<div class="sticky bottom-0">
	<div class="flex h-22 justify-end p-4">
		<div class="flex h-full w-full rounded-2xl border-2 border-gray-800 bg-gray-900">
			<input
				type="text"
				placeholder="Type your message..."
				bind:value={messageText}
				on:keydown={handleKeydown}
				class="w-full flex-grow bg-transparent px-4 py-2 focus:outline-none"
			/>
			<button
				on:click={handleSend}
				class="m-1.5 rounded-xl border-2 border-gray-700 bg-gray-800 px-4 transition-transform duration-500 ease-in-out hover:scale-105"
			>
				Send
			</button>
		</div>
	</div>
</div>
