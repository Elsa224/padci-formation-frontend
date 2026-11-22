/**
 * Typed access to the product contract (AGENTS.md: `docs/api/openapi.json`
 * in emsp-api is the only product contract). `schema.d.ts` is generated —
 * never edit it by hand; regenerate with `npm run gen:api` after every API
 * change, once the backend has re-exported the Scramble spec.
 *
 * Migration path: new code types API payloads with `Schema<'…Resource'>`;
 * hand-written interfaces in composables are replaced as they are touched.
 */
import type { components, paths } from './schema'

export type Schemas = components['schemas']

/** A component schema of the contract, e.g. `Schema<'CourseResource'>`. */
export type Schema<Name extends keyof Schemas> = Schemas[Name]

export type ApiPaths = paths
