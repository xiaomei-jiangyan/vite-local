// 给定一个整数数组 nums 和一个目标值 target，请你在该数组中找出和为目标值的那 两个 整数，并返回他们的数组下标。

function sum(arr, target) {
  const map = new Map();
  arr.forEach((i) => map.set(arr[i], i));
  for (let i in arr) {
    const c = arr[i];
    if (map.has(target - c)) return [i, map.get(target - c)];
  }
}

// 给定一个只包括 '('，')'，'{'，'}'，'['，']' 的字符串，判断字符串是否有效。

function kuohao(str) {
  const map = {
    ")": "(",
    "}": "{",
    "]": "[",
  };
  const arr = [];
  for (let value of str) {
    if (value === "(" || value === "{" || value === "[") arr.push(value);
    else if (map[value]) {
      if (!arr.length) return false;
      const top = arr.pop();
      if (top !== map[value]) return false;
    }
  }
  if (arr.length > 0) return false;
  return true;
}
kuohao("((1[23]))");

// 将两个升序链表合并为一个新的升序链表并返回。新链表是通过拼接给定的两个链表的所有节点组成的。

// 示例：

// 输入：1->2->4, 1->3->4
// 输出：1->1->2->3->4->4
const mergeTwoLists = function (l1, l2) {
  if (l1 === null) {
    return l2;
  }
  if (l2 === null) {
    return l1;
  }
  if (l1.val < l2.val) {
    l1.next = mergeTwoLists(l1.next, l2);
    return l1;
  } else {
    l2.next = mergeTwoLists(l1, l2.next);
    return l2;
  }
};

// 给定一个 !!!排序数组，你需要在 原地 删除重复出现的元素，使得每个元素只出现一次，返回移除后数组的新长度。

function remove(arr) {
  const map = new Map();
  for (let i = 0; i < arr.length; i++) {
    const cur = arr[i];
    if (map.has(cur)) {
      arr.splice(i, 1);
      i--;
    } else {
      map.set(cur, i);
    }
  }
  console.log(111, arr);
  return arr.length;
}

function remove(arr) {
  let result = [];
  let slow = 0;
  if (!arr.length) return 0;
  for (let fast = 0; fast < arr.length; ) {
    if (arr[fast] === arr[slow]) fast++;
    else {
      slow++;
      arr[slow] = arr[fast];
    }
  }
  console.log(111, arr);
  return slow + 1;
}

// 给定一个整数数组 nums ，找到一个具有最大和的连续子数组（子数组最少包含一个元素），返回其最大和。
// 输入: [-2,1,-3,4,-1,2,1,-5,4] //
// -2+1 cur 和 -2 prev
// -2+1 -3  和 1-3
// 6
function maxSum(arr) {
  let prev = arr[0];
  let current = prev;
  let sum;
  for (let i = 1; i < arr.length; i++) {
    const value = arr[i]; // 1
    if (prev + value > current) {
      prev = prev + value;
      current = value;
    } else {
      prev = current;
      current = prev + value;
    }
  }
  return prev;
}
