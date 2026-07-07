import { AnanExpression } from '../live2d/expressions';

export interface DiagnosticSummary {
  errors?: number;
  warnings?: number;
  isTyping?: boolean;
  lastRunSucceeded?: boolean;
}

export function expressionForDiagnostics(summary: DiagnosticSummary): AnanExpression {
  if ((summary.errors || 0) > 0) return AnanExpression.Error;
  if ((summary.warnings || 0) > 0) return AnanExpression.Warning;
  if (summary.isTyping) return AnanExpression.Thinking;
  if (summary.lastRunSucceeded) return AnanExpression.Happy;
  return AnanExpression.Normal;
}

export function normalizeDiagnosticSummary(value: unknown): DiagnosticSummary {
  if (typeof value !== 'object' || value === null) return {};
  const record = value as Record<string, unknown>;
  return {
    errors: toCount(record.errors),
    warnings: toCount(record.warnings),
    isTyping: record.isTyping === true,
    lastRunSucceeded: record.lastRunSucceeded === true,
  };
}

function toCount(value: unknown): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
  return Math.max(0, Math.floor(value));
}
