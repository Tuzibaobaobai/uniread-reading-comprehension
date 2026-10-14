/** Export zod schemas to JSON Schema files in schema/json/ for UniRead / other languages. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { Attempt, Catalog, Item, ItemKey, Playlist } from '../schema/index.ts';

const out = join(import.meta.dirname, '..', 'schema', 'json');
mkdirSync(out, { recursive: true });
for (const [name, schema] of Object.entries({ Item, ItemKey, Playlist, Catalog, Attempt })) {
  writeFileSync(join(out, `${name}.schema.json`), JSON.stringify(zodToJsonSchema(schema, name), null, 2) + '\n');
  console.log(`schema/json/${name}.schema.json`);
}
