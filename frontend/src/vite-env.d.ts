/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Only set for a split deploy — see lib/apiClient.ts's doc comment.
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
