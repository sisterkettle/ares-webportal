import { helper } from '@ember/component/helper';

export function spaces([string]) {
  return string.toString().split(',').join(' ');
}

export default helper(spaces);