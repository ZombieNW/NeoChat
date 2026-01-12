<script>
	import { onMount, onDestroy, tick } from 'svelte';
	import Message from '$lib/components/message.svelte';
	import UserDropdown from '$lib/components/userDropdown.svelte';
	import ConversationList from '$lib/components/conversationList.svelte';
	import ChatHeader from '$lib/components/chatHeader.svelte';
	import MessageInput from '$lib/components/messageInput.svelte';

	// Core State
	let actingUser = null;
	let openUser = null;
	let userList = [];
	let loadedMessages = [];
	let lastLoadedMessageId = null;
	let pollIntervalId = null;
	let aiThinking = false;
	let actingUserDropdownOpen = false;

	// Dynamic Values
	$: otherUsers = userList.filter((u) => u.id !== actingUser?.id);
	$: conversationMessages = loadedMessages.filter(
		(m) =>
			(m.sender.id === actingUser?.id && m.receiver.id === openUser?.id) ||
			(m.sender.id === openUser?.id && m.receiver.id === actingUser?.id)
	);

	// Scrolling
	let messageContainer = null;

	async function scrollToBottom() {
		await tick();
		if (messageContainer) {
			messageContainer.scrollTo({ top: messageContainer.scrollHeight });
		}
	}

	// API Stuff
	async function loadMessages() {
		try {
			const res = await fetch('/api/chat?since=' + (lastLoadedMessageId || ''));
			if (!res.ok) throw new Error('Failed to load messages');

			const messages = await res.json();

			// Parse JSON strings and merge messages
			const parsedMessages = messages.map((m) => ({
				...m,
				sender: typeof m.sender === 'string' ? JSON.parse(m.sender) : m.sender,
				receiver: typeof m.receiver === 'string' ? JSON.parse(m.receiver) : m.receiver
			}));

			// Merge messages
			loadedMessages = parsedMessages.reduce((acc, cur) => {
				const existingIdx = acc.findIndex((m) => m.id === cur.id);
				if (existingIdx >= 0) {
					acc[existingIdx] = cur;
					return acc;
				}
				return [...acc, cur];
			}, loadedMessages);

			// Scroll to bottom
			if (parsedMessages.length > 0) {
				lastLoadedMessageId = Math.max(...parsedMessages.map((m) => m.id));
				await scrollToBottom();
			}
		} catch (error) {
			console.error('Error loading messages:', error);
		}
	}

	async function pollMessages() {
		await loadMessages();
		pollIntervalId = setTimeout(pollMessages, 1000);
	}

	async function sendMessage(event) {
		const { text, image } = event.detail;

		if (!text || text.trim() === '') return;

		try {
			// Show AI Thinking Indicator
			if (openUser.id === 5) {
				aiThinking = true;
				await scrollToBottom();
			}

			// Image Handling
			let imageUrl = null;
			if (image) {
				const formData = new FormData();
				formData.append('image', image);
				const uploadRes = await fetch('/api/chat/upload', {
					method: 'POST',
					body: formData
				});
				if (!uploadRes.ok) throw new Error('Failed to upload image');
				const data = await uploadRes.json();
				imageUrl = data.path;
			}

			// Send Message
			const res = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					sender: actingUser,
					receiver: openUser,
					text,
					image: imageUrl
				})
			});

			if (!res.ok) throw new Error('Failed to send message');

			aiThinking = false;
			await loadMessages();
		} catch (error) {
			console.error('Error sending message:', error);
			aiThinking = false;
		}
	}

	function changeActingUser(event) {
		const newUser = event.detail;
		actingUser = newUser;
		openUser = otherUsers.find((u) => u.id !== newUser.id); // Set open user to another user
		actingUserDropdownOpen = false;
	}

	async function selectConversation(event) {
		openUser = event.detail;
		await scrollToBottom();
	}

	function getLastMessageForUser(user) {
		const relevantMessages = loadedMessages.filter(
			(m) => m.sender.id === user.id || m.receiver.id === user.id
		);
		return relevantMessages.length > 0 ? relevantMessages[relevantMessages.length - 1] : null;
	}

	onMount(async () => {
		try {
			const res = await fetch('/api/chat/users');
			if (!res.ok) throw new Error('Failed to load users');

			userList = await res.json();
			if (userList.length > 0) {
				actingUser = userList[0];
				openUser = userList.find((u) => u.id !== actingUser.id);
			}

			await pollMessages();
		} catch (error) {
			console.error('Error initializing chat:', error);
		}
	});

	onDestroy(() => {
		if (pollIntervalId) clearTimeout(pollIntervalId);
	});
</script>

<svelte:head>
	<title>NeoMessenger</title>
</svelte:head>

<div class="flex h-screen w-full flex-col overflow-hidden bg-gray-950 text-gray-50">
	<!-- Top Bar -->
	<div class="m-6 h-16 w-auto rounded-xl bg-gray-900 outline-2 outline-gray-800">
		<div class="flex h-full w-full items-center justify-between px-3 py-3">
			<UserDropdown
				user={actingUser}
				{otherUsers}
				bind:isOpen={actingUserDropdownOpen}
				on:selectUser={changeActingUser}
			/>

			<div class="flex items-center">
				<img src="/chat_logo.png" alt="NeoMessenger" class="h-12" />
				<h1 class="text-3xl font-semibold">NeoMessenger</h1>
			</div>

			<div class="flex items-center justify-center pr-2">
				<h1 class="pr-2">Online</h1>
				<span class="text-6xl text-green-500">•</span>
			</div>
		</div>
	</div>

	<!-- Messenger -->
	<div
		class="m-6 mt-0 flex h-full max-h-full overflow-hidden rounded-xl bg-gray-900 outline-2 outline-gray-800"
	>
		<!-- Left Sidebar -->
		<ConversationList
			users={otherUsers}
			{openUser}
			{getLastMessageForUser}
			on:selectConversation={selectConversation}
		/>

		<!-- Chat Area -->
		<div class="flex h-full w-4/5 flex-col">
			<ChatHeader {openUser} {actingUser} />

			<!-- Messages & Input -->
			<div class="flex h-full flex-col justify-end overflow-y-auto">
				<!-- Messages -->
				<div class="flex-grow overflow-y-auto" bind:this={messageContainer}>
					{#each conversationMessages as message (message.id)}
						<Message {message} {actingUser} />
					{/each}

					{#if openUser?.id === 5 && aiThinking}
						<Message
							message={{
								id: 0,
								text: '',
								thinking: true,
								sender: {
									id: 5,
									name: 'Neo AI',
									image: 'https://cdn.pixabay.com/photo/2022/07/28/13/53/logo-7349896_1280.png'
								},
								receiver: openUser,
								timestamp: Date.now()
							}}
							{actingUser}
						/>
					{/if}
				</div>

				<!-- Input -->
				<MessageInput on:send={sendMessage} />
			</div>
		</div>
	</div>
</div>
