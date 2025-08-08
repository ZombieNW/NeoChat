<script>
	import { onMount } from 'svelte';
	import Dropdown from '$lib/components/icons/dropdown.svelte';
	import Message from '$lib/components/message.svelte';

	let messages = [];
	let users = [];
	let currentUser = null;
	let currentDM = null;
	let isUserDropdownMenuOpen = false;
	let text = '';
	let image = null;

	async function loadMessages() {
		const res = await fetch('/api/chat');
		messages = await res.json();
	}

	async function getUsers() {
		const res = await fetch('/api/chat/users');
		return await res.json();
	}

	async function sendMessage() {
		console.log(currentUser, text, image);
		let imagePath = null;

		if (image) {
			const formData = new FormData();
			formData.append('image', image);
			const res = await fetch('/api/chat/upload', {
				method: 'POST',
				body: formData
			});
			const json = await res.json();
			imagePath = json.path;
		}

		await fetch('/api/chat', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				sender: JSON.stringify(currentUser),
				receiver: JSON.stringify(currentDM),
				text,
				image: imagePath
			})
		});

		text = '';
		image = null;
		await loadMessages();
	}

	function changeUser(user) {
		currentUser = user;
		isUserDropdownMenuOpen = false;
		currentDM = users.find((user) => user.id !== currentUser.id);
	}

	onMount(async () => {
		users = await getUsers();
		currentUser = users[0];
		currentDM = users[1];

		await loadMessages();

		console.log(currentUser, text, image);
	});
</script>

<div class="flex h-screen w-full overflow-hidden bg-gray-950 text-gray-50">
	<div class="h-full w-1/5 border-r-2 border-gray-700 bg-gray-900">
		<div class="static h-24 w-full flex-col items-center justify-center">
			<button
				class="flex h-24 w-full items-center border-b-2 border-gray-700 px-8 hover:cursor-pointer"
				on:click={() => (isUserDropdownMenuOpen = !isUserDropdownMenuOpen)}
			>
				{#if currentUser}
					<img
						src={currentUser.image}
						alt="Profile"
						class="aspect-square w-12 rounded-full object-cover"
					/>
					<h1 class="mx-4 text-2xl">{currentUser.name}</h1>
					<Dropdown />
				{/if}
			</button>
			{#if isUserDropdownMenuOpen}
				{#each users as user}
					<button
						class="relative flex h-24 w-full items-center border-b-2 border-gray-700 bg-gray-900 px-8 hover:cursor-pointer"
						on:click={() => {
							changeUser(user);
						}}
					>
						<img
							src={user.image}
							alt="Profile"
							class="aspect-square w-12 rounded-full object-cover"
						/>
						<h1 class="mx-4 text-2xl">{user.name}</h1>
					</button>
				{/each}
			{/if}
		</div>

		<div class="flex flex-col">
			<h1 class="px-8 pt-8 text-2xl font-bold">Messages</h1>
			{#each users as user}
				<button
					class="mx-auto flex h-24 w-full items-center px-8 hover:cursor-pointer"
					class:bg-gray-800={user === currentDM}
					class:hidden={user === currentUser}
					on:click={() => (currentDM = user)}
				>
					<img
						src={user.image}
						alt="Profile"
						class="aspect-square w-12 rounded-full object-cover"
					/>
					<h1 class="mx-4 text-xl text-gray-300">{user.name}</h1>
				</button>
			{/each}
		</div>
	</div>
	<div class="flex h-full w-4/5 flex-col">
		<div class="flex h-24 w-full items-center border-b-2 border-gray-700 bg-gray-900 px-8">
			{#if currentDM}
				<img
					src={currentDM.image}
					alt="Profile"
					class="aspect-square w-12 rounded-full object-cover"
				/>
				<h1 class="mx-4 text-2xl">{currentDM.name}</h1>
			{/if}
		</div>
		<div class="flex w-full flex-grow flex-col">
			<div class="flex-grow overflow-y-auto">
				{#each messages as message}
					{#if (JSON.parse(message.receiver).id === currentDM.id && JSON.parse(message.sender).id === currentUser.id) || (JSON.parse(message.receiver).id === currentUser.id && JSON.parse(message.sender).id === currentDM.id)}
						<Message {message} {currentUser} />
					{/if}
				{/each}
			</div>
			<div class="h-20 p-4">
				<div class="flex h-full w-full rounded-2xl border-2 border-gray-800 bg-gray-900">
					<input
						type="text"
						placeholder="Type your message..."
						bind:value={text}
						class="w-full flex-grow bg-transparent px-4 py-2 focus:outline-none"
						on:keydown={(e) => {
							if (e.keyCode === 13 && !e.shiftKey) {
								sendMessage();
								e.preventDefault();
							} else if (e.shiftKey && e.keyCode === 13) {
								text += '\n';
								e.preventDefault();
							}
						}}
					/>
					<button
						on:click={sendMessage}
						class="m-1.5 rounded-xl border-2 border-gray-700 bg-gray-800 px-4">Send</button
					>
				</div>
			</div>
		</div>
	</div>
</div>
