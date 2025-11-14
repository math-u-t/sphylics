<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
    <div class="max-w-md w-full">
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
        <!-- Loading State -->
        <div v-if="isLoading" class="text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 dark:bg-indigo-900 rounded-full mb-4">
            <svg
              class="animate-spin h-8 w-8 text-indigo-600 dark:text-indigo-400"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Completing Sign In
          </h2>
          <p class="text-gray-600 dark:text-gray-400">
            Please wait while we verify your credentials...
          </p>
          <div class="mt-6 space-y-2 text-sm text-gray-500 dark:text-gray-500">
            <p>✓ Validating authorization code</p>
            <p>✓ Exchanging for access token</p>
            <p>✓ Setting up your session</p>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full mb-4">
            <svg class="w-8 h-8 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Authentication Failed
          </h2>
          <p class="text-gray-600 dark:text-gray-400 mb-6">
            {{ error }}
          </p>
          <div class="space-y-3">
            <button
              @click="retryLogin"
              class="w-full px-6 py-3 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 dark:focus:ring-indigo-800 transition-all duration-200 font-medium"
            >
              Try Again
            </button>
            <button
              @click="goToLogin"
              class="w-full px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none transition-all duration-200 font-medium"
            >
              Back to Login
            </button>
          </div>
        </div>

        <!-- Success State -->
        <div v-else class="text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full mb-4">
            <svg class="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Sign In Successful
          </h2>
          <p class="text-gray-600 dark:text-gray-400">
            Redirecting to your dashboard...
          </p>
        </div>
      </div>

      <!-- Debug Info (only in development) -->
      <div v-if="isDevelopment && debugInfo" class="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs text-gray-600 dark:text-gray-400">
        <details>
          <summary class="cursor-pointer font-semibold mb-2">Debug Information</summary>
          <pre class="whitespace-pre-wrap">{{ debugInfo }}</pre>
        </details>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth';

const router = useRouter();
const { handleCallback, isLoading, error } = useAuth();

const isDevelopment = import.meta.env.DEV;
const debugInfo = ref(null);

onMounted(async () => {
  try {
    // Get full callback URL with query parameters
    const callbackUrl = window.location.href;

    if (isDevelopment) {
      debugInfo.value = {
        url: callbackUrl,
        params: Object.fromEntries(new URL(callbackUrl).searchParams)
      };
    }

    // Handle OAuth callback
    await handleCallback(callbackUrl);

    // Success - will be redirected by handleCallback
  } catch (err) {
    console.error('OAuth callback error:', err);
    // Error will be displayed by the component
  }
});

function retryLogin() {
  router.push('/login');
}

function goToLogin() {
  router.push('/login');
}
</script>
