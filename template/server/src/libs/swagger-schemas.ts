import { zodToJsonSchema } from 'zod-to-json-schema';
import type { ZodTypeAny } from 'zod';

const schemaCache = new Map<string, any>();

export function toJsonSchema(schema: ZodTypeAny, name: string): any {
    if (schemaCache.has(name)) return schemaCache.get(name);
    const jsonSchema = zodToJsonSchema(schema as any, name);
    schemaCache.set(name, jsonSchema);
    return jsonSchema;
}

export function getDefinition(schema: ZodTypeAny, name: string): any {
    const converted = toJsonSchema(schema, name);
    return (converted as any).definitions?.[name] || converted;
}
