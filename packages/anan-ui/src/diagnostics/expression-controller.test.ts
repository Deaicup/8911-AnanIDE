import { AnanExpression } from '../live2d/expressions';
import { expressionForDiagnostics, normalizeDiagnosticSummary } from './expression-controller';

describe('expression controller', () => {
  it('prioritizes errors over all other states', () => {
    expect(expressionForDiagnostics({ errors: 1, warnings: 3, lastRunSucceeded: true })).toBe(AnanExpression.Error);
  });

  it('uses warnings when there are no errors', () => {
    expect(expressionForDiagnostics({ warnings: 2 })).toBe(AnanExpression.Warning);
  });

  it('normalizes invalid diagnostic counts', () => {
    expect(normalizeDiagnosticSummary({ errors: -3, warnings: 'oops', isTyping: true })).toEqual({
      errors: 0,
      warnings: undefined,
      isTyping: true,
      lastRunSucceeded: false,
    });
  });
});
