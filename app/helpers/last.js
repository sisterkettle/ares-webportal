import { helper } from '@ember/component/helper';

export function last([string]) {
  return string.toString().split(' ').slice(-1);
}

export default helper(last);