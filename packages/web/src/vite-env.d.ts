/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_BASE_URL: string;
  readonly VITE_LOCAL: string;
  readonly VITE_POSTHOG_KEY: string;
  readonly VITE_POSTHOG_HOST: string;
  readonly VITE_GITHUB_CLIENT_ID: string;
  readonly VITE_SLACK_BOT_ID: string;
  readonly VITE_GITHUB_APP_URL: string;
  readonly VITE_STRIPE_PRICE_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
