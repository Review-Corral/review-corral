/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly NEXT_PUBLIC_API_URL: string;
  readonly NEXT_PUBLIC_BASE_URL: string;
  readonly NEXT_PUBLIC_LOCAL: string;
  readonly NEXT_PUBLIC_POSTHOG_KEY: string;
  readonly NEXT_PUBLIC_POSTHOG_HOST: string;
  readonly NEXT_PUBLIC_GITHUB_CLIENT_ID: string;
  readonly NEXT_PUBLIC_SLACK_BOT_ID: string;
  readonly NEXT_PUBLIC_GITHUB_APP_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
