import { evaluateCommandConfirmation } from './confirmation';

describe('evaluateCommandConfirmation', () => {
  it('allows safe commands without confirmation', () => {
    expect(evaluateCommandConfirmation('npm test')).toEqual({
      allowed: true,
      requireConfirm: false,
      level: 'safe',
    });
  });

  it('asks for confirmation on dangerous recoverable commands', () => {
    const decision = evaluateCommandConfirmation('git reset --hard');

    expect(decision).toEqual(
      expect.objectContaining({
        allowed: false,
        requireConfirm: true,
        level: 'P1',
        countdownSeconds: 5,
      })
    );
  });

  it('blocks irreversible commands by default', () => {
    const decision = evaluateCommandConfirmation('rm -rf /');

    expect(decision).toEqual(
      expect.objectContaining({
        allowed: false,
        requireConfirm: false,
        level: 'P0',
      })
    );
  });
});
