import { DataField } from "@/components/template-builder/types";

export function parseTemplateContent(content: string | null | undefined): DataField[] {
    if (!content) return [];
    try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) return parsed;
        if (parsed.fields && Array.isArray(parsed.fields)) return parsed.fields;
        return [];
    } catch (error) {
        console.warn("Failed to parse template content:", error);
        return [];
    }
}

export function serializeTemplateContent(fields: DataField[]): string {
    return JSON.stringify(fields);
}
