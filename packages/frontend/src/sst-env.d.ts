/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_AUTH_URL: string
  readonly VITE_SLACK_AUTH_URL: string
  readonly VITE_REGION: string
  readonly VITE_SLACK_BOT_ID: string
  readonly VITE_LOCAL: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}