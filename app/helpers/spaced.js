import { helper } from '@ember/component/helper';

export function spaced([string]) {
  var answer = false;
  if(string.indexOf(' ') >= 0){
    answer = true;
  }
  return answer;
}

export default helper(spaced);