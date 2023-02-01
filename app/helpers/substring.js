import { helper } from '@ember/component/helper';

export function substring([string], { start, end }) {
  return string.substring(start || 0, end);
}

export default helper(substring);