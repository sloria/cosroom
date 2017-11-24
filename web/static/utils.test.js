import { randomChoice } from './utils';
test('randomChoice', () => {
  expect(randomChoice(['foo', 'bar', 'baz'])).toBeTruthy();
});
