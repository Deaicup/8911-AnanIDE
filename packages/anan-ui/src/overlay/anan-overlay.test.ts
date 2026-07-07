import { AnanExpression } from '../live2d/expressions';

describe('Anan overlay source', () => {
  it('defines labels for every expression', () => {
    const expressions = Object.values(AnanExpression);

    expect(expressions).toEqual(['normal', 'happy', 'thinking', 'warning', 'error']);
  });
});
