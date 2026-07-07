import { CommandTemplate, DEFAULT_TEMPLATES } from '../types/mcp';

export interface ResolvedCommandTemplate {
  alias: string;
  description: string;
  toolName: string;
  parameters: Record<string, unknown>;
  args: string[];
}

export function resolveCommandTemplate(
  input: string,
  templates: CommandTemplate[] = DEFAULT_TEMPLATES
): ResolvedCommandTemplate | undefined {
  const tokens = input.trim().split(/\s+/).filter(Boolean);
  if (!tokens.length) return undefined;

  if (tokens[0].toLowerCase() === 'anan') {
    tokens.shift();
  }
  if (!tokens.length) return undefined;

  const alias = tokens.shift()?.toLowerCase();
  const template = templates.find(item => item.alias.toLowerCase() === alias);
  if (!template) return undefined;

  const parsed = parseTemplateArgs(tokens);
  return {
    alias: template.alias,
    description: template.description,
    toolName: template.toolName,
    parameters: {
      ...(template.parameters || {}),
      ...parsed.parameters,
    },
    args: parsed.args,
  };
}

export function parseTemplateArgs(tokens: string[]): { parameters: Record<string, string>; args: string[] } {
  const parameters: Record<string, string> = {};
  const args: string[] = [];

  for (const token of tokens) {
    const eqIndex = token.indexOf('=');
    if (eqIndex > 0) {
      const key = token.slice(0, eqIndex).trim();
      const value = token.slice(eqIndex + 1).trim();
      if (key && value) {
        parameters[key] = value;
        continue;
      }
    }
    args.push(token);
  }

  return { parameters, args };
}
