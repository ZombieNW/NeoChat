<script>
	import { onMount, onDestroy } from 'svelte';
	import Dropdown from '$lib/components/icons/dropdown.svelte';
	import Message from '$lib/components/message.svelte';

	// Global state-related variables
	let actingUser = {};
	let openUser = {};
	let userList = [];
	let lastLoadedMessageId = null;
	let loadedMessages = [];
	let pollIntervalId = null;
	let loadedImage = null;
	let messageText = '';
	let messageElement = null;
	let aiThinking = false;
	let actingUserDropdownMenuOpen = false;
	let actingUserDropdownLeft = 0;
	let actingUserDropdownTop = 0;
	let actingUserDropdownWidth = 0;
	let actingUserDropdownElement = null;

	const scrollToBottom = (node) => {
		const scroll = () =>
			node.scroll({
				top: node.scrollHeight
			});
		scroll();

		return { update: scroll };
	};

	async function loadMessages() {
		const res = await fetch('/api/chat?since=' + lastLoadedMessageId);
		const messages = await res.json();

		// Merge messages and erase overlapping messages
		loadedMessages = messages.reduce((acc, cur) => {
			const existingMessage = acc.find((m) => m.id === cur.id);
			if (existingMessage) {
				return acc.map((m) => (m.id === cur.id ? cur : m));
			}
			return [...acc, cur];
		}, loadedMessages);

		if (messages.length !== 0) {
			lastLoadedMessageId = Math.max(...messages.map((message) => message.id));

			attemptToScrollToBottom();
		}
	}

	function attemptToScrollToBottom() {
		// Scroll to bottom, not very elegant but this is all for show anyways
		if (messageElement) {
			// I hate having to do 0 tick timeouts to get things to work
			// but Svelte's reactivity system is a pain sometimes
			setTimeout(() => {
				scrollToBottom(messageElement);
			}, 0);
		}
	}

	async function pollMessages() {
		await loadMessages();
		pollIntervalId = setTimeout(pollMessages, 2000);
	}

	function changeToUser(user) {
		actingUser = user;
		openUser = userList.find((u) => u.id !== user.id);
		actingUserDropdownMenuOpen = !actingUserDropdownMenuOpen;
	}

	function openToUser(user) {
		openUser = user;
	}

	function getLastMessageMentioningUser(user) {
		return loadedMessages.reduce(
			(latest, current) => {
				if (
					JSON.parse(current.sender).id === user.id ||
					JSON.parse(current.receiver).id === user.id
				) {
					return current.id > latest.id ? current : latest;
				}
				return latest;
			},
			{ id: null, timestamp: 0 }
		);
	}

	async function sendMessage() {
		let imageUrl = null;

		// Start thinking for AI message
		if (openUser.id === 5) {
			aiThinking = true;
			attemptToScrollToBottom();
		}

		if (loadedImage) {
			const formData = new FormData();
			formData.append('image', loadedImage);
			const res = await fetch('/api/chat/upload', {
				method: 'POST',
				body: formData
			});
			const data = await res.json();
			imageUrl = data.path;
		}

		loadedMessages.push({
			id: lastLoadedMessageId + 1,
			sender: actingUser,
			receiver: openUser,
			text: messageText,
			image: imageUrl
		});

		const res = await fetch('/api/chat', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				sender: actingUser,
				receiver: openUser,
				text: messageText,
				image: imageUrl
			})
		});

		// Reset messaging related states
		loadedImage = null;
		messageText = '';
		if (openUser.id === 5) aiThinking = false;
		await loadMessages();
	}

	function openUserDropdownMenu() {
		actingUserDropdownMenuOpen = !actingUserDropdownMenuOpen;

		// NOTE
		// Weird inconsistencies in where the left bounding box is calculated are because of the scaling during hover

		// Set proper left/top position
		actingUserDropdownWidth = actingUserDropdownElement.getBoundingClientRect().width;
		actingUserDropdownLeft = actingUserDropdownElement.getBoundingClientRect().left;
		actingUserDropdownTop =
			actingUserDropdownElement.getBoundingClientRect().top +
			actingUserDropdownElement.getBoundingClientRect().height;
	}

	onMount(async () => {
		// Fetch and set user data
		userList = await fetch('/api/chat/users').then((res) => res.json());
		actingUser = userList[0];
		openUser = userList[1];

		await pollMessages();
	});

	onDestroy(() => {
		clearTimeout(pollIntervalId);
	});
</script>

<svelte:head>
	<title>NeoMessenger</title>
</svelte:head>

<div class="flex h-screen w-full flex-col overflow-hidden bg-gray-950 text-gray-50">
	<!-- Top Bar -->
	<div class="m-6 h-24 w-auto rounded-xl bg-gray-900 outline-2 outline-gray-800">
		<div class="flex h-full w-full items-center justify-between px-3 py-3">
			<button
				class="flex h-full rounded-xl px-3 py-1 outline-2 outline-gray-800 transition-transform duration-500 ease-in-out hover:scale-105"
				on:click={openUserDropdownMenu}
				bind:this={actingUserDropdownElement}
			>
				{#if actingUser}
					<img
						src={actingUser?.image}
						alt="Profile"
						class="my-auto aspect-square h-12 w-12 rounded-full object-cover"
					/>
					<div class="flex h-full flex-col items-start justify-center px-3 leading-none">
						<h2 class="text-gray-500">Chatting as...</h2>
						<h1 class="text-lg font-semibold">{actingUser.name}</h1>
					</div>
					<div class="flex h-full items-center">
						<Dropdown />
					</div>
				{/if}
			</button>
			<div class="flex items-center">
				<img src="/chat_logo.png" alt="NeoMessenger" class="h-18" />
				<h1 class="text-4xl font-semibold">NeoMessenger</h1>
			</div>
			<div>
				<h1>gear icon</h1>
			</div>
		</div>
	</div>

	<!-- Messenger -->
	<div
		class="m-6 mt-0 flex h-full max-h-full overflow-hidden rounded-xl bg-gray-900 outline-2 outline-gray-800"
	>
		<!-- Left Sidebar -->
		<div class="h-full w-1/5 overflow-hidden border-r-2 border-gray-800 p-6">
			<h1 class="mb-3 text-2xl font-semibold">Messages</h1>
			<div class="flex h-full flex-col overflow-x-hidden overflow-y-auto">
				{#each userList as user}
					<button on:click={() => openToUser(user)} class:hidden={user === actingUser}>
						<div
							class="my-1 flex w-full items-center rounded-xl p-3 transition-colors duration-300 ease-in-out hover:bg-gray-800/50"
							class:bg-gray-800={user === openUser}
						>
							<img
								src={user.image}
								class="aspect-square w-12 rounded-full object-cover"
								alt="Profile"
							/>
							<div class="ml-3 w-full text-left">
								<h1 class="text-lg font-semibold">{user.name}</h1>
								<p class="w-5/6 truncate text-gray-500">
									{#if loadedMessages}
										{getLastMessageMentioningUser(user)?.text}
									{/if}
								</p>
							</div>
						</div>
					</button>
				{/each}
				<span class="text-transparent">puss puss</span>
			</div>
		</div>

		<!-- Chat Area -->
		<div class="flex h-full w-4/5 flex-col">
			<!-- Top Bar -->
			<div class="flex min-h-24 items-center justify-between border-b-2 border-gray-800 p-6">
				{#if openUser}
					<div class="flex items-center">
						<img
							src={openUser?.image}
							alt="Profile"
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

			<!-- Messages & Input -->
			<div class="flex h-full flex-col justify-end overflow-y-auto">
				<!-- Messages -->
				<div
					class="flex-grow overflow-y-auto"
					use:scrollToBottom={openUser}
					bind:this={messageElement}
				>
					{#each loadedMessages as message}
						{#if (actingUser && openUser && JSON.parse(message.receiver).id === openUser.id && JSON.parse(message.sender).id === actingUser.id) || (JSON.parse(message.receiver).id === actingUser.id && JSON.parse(message.sender).id === openUser.id)}
							<Message {message} {actingUser} />
						{/if}
					{/each}
					{#if openUser.id === 5 && aiThinking}
						<Message
							message={{
								id: 0,
								text: '',
								thinking: true,
								sender: JSON.stringify({
									id: 5,
									name: 'Neo AI',
									image: 'https://cdn.pixabay.com/photo/2022/07/28/13/53/logo-7349896_1280.png'
								}),
								receiver: JSON.stringify({ id: openUser.id }),
								timestamp: Date.now()
							}}
							{actingUser}
						/>
					{/if}
				</div>
				<!-- Input -->
				<div class="sticky bottom-0">
					<div class="flex h-22 justify-end p-4">
						<div class="flex h-full w-full rounded-2xl border-2 border-gray-800 bg-gray-900">
							<input
								type="text"
								placeholder="Type your message..."
								bind:value={messageText}
								class="w-full flex-grow bg-transparent px-4 py-2 focus:outline-none"
								on:keydown={(e) => {
									if (e.keyCode === 13 && !e.shiftKey) {
										sendMessage();
										e.preventDefault();
									} else if (e.shiftKey && e.keyCode === 13) {
										messageText += '\n';
										e.preventDefault();
									}
								}}
							/>
							<button
								on:click={sendMessage}
								class="m-1.5 rounded-xl border-2 border-gray-700 bg-gray-800 px-4 transition-transform duration-500 ease-in-out hover:scale-105"
								>Send</button
							>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<!--Dropdown-->
<div
	style:top={actingUserDropdownTop + 'px'}
	style:left={actingUserDropdownLeft + 'px'}
	class:hidden={!actingUserDropdownMenuOpen}
	class="absolute z-50"
>
	{#each userList as user}
		{#if user !== actingUser && user.id !== 5}
			<button
				style:width={actingUserDropdownWidth + 'px'}
				class="my-3 flex h-full rounded-xl bg-gray-900 px-3 py-1 text-white shadow-lg outline-2 outline-gray-800 transition-transform duration-500 ease-in-out hover:scale-105"
				on:click={() => changeToUser(user)}
			>
				<img src={user?.image} alt="Profile" class="aspect-square w-12 rounded-full object-cover" />
				<div class="flex h-full flex-col items-start justify-center px-3 leading-none">
					<h2 class="text-gray-500">Switch to...</h2>
					<h1 class="text-lg font-semibold">{user.name}</h1>
				</div>
			</button>
		{/if}
	{/each}
</div>
