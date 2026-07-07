import { resolveCommandTemplate, parseTemplateArgs } from './command-template';

describe('resolveCommandTemplate', () => {
  it('resolves default anan commands', () => {
    const resolved = resolveCommandTemplate('anan scan path=src');

    expect(resolved).toMatchObject({
      alias: 'scan',
      toolName: 'security-scan.run',
      parameters: { path: 'src' },
    });
  });

  it('resolves aliases without the anan prefix', () => {
    const resolved = resolveCommandTemplate('test file=src/index.ts');

    expect(resolved).toMatchObject({
      alias: 'test',
      toolName: 'workbuddy.generate-tests',
      parameters: { file: 'src/index.ts' },
    });
  });

  it('returns undefined for unknown aliases', () => {
    expect(resolveCommandTemplate('anan unknown')).toBeUndefined();
  });
});

describe('parseTemplateArgs', () => {
  it('splits key-value parameters and positional args', () => {
    expect(parseTemplateArgs(['path=src', 'fast', 'level=high'])).toEqual({
      parameters: {
        path: 'src',
        level: 'high',
      },
      args: ['fast'],
    });
  });
});
