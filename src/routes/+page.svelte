<script>
	import { navigate } from 'svelte-routing';
	import { onMount } from 'svelte';

	// Redirect without code so it doesn't cache
	onMount(() => {
		navigate('/chat');
	});
</script>
