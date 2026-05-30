# 一、哈希
## 1.字母异位词分组
**题目：**

给你一个字符串数组，请你将字母异位词组合在一起。可以按任意顺序返回结果列表。

**语法：**

（1）`join()` 是一个**字符串方法**，用于将一个可迭代对象（如列表、元组）中的字符串元素**连接成一个新的字符串**。

（2）`sort()` 是一个**列表方法**，用于**原地排序**列表元素。返回值None，原列表被修改。

（3）`sorted()` 是一个**内置函数**，用于对任何可迭代对象进行排序，并**返回一个新的排序后的列表**（原对象不变）。

（4）`append()` 是 Python **列表（list）**的一个方法，用于**在列表末尾添加一个元素**。

```python
class Solution(object):
    def groupAnagrams(self, strs):
        out = {}
        for a in strs:
            key = ''.join(sorted(a))
            if key not in out:
                out[key] = []
            out[key].append(a)
        return list(out.values())
```

**示例 1:**

```
输入: strs = ["eat", "tea", "tan", "ate", "nat", "bat"]
输出:[["bat"],["nat","tan"],["ate","eat","tea"]]
```

**解释：**

- 在 strs 中没有字符串可以通过重新排列来形成 `"bat"`。
- 字符串 `"nat"` 和 `"tan"` 是字母异位词，因为它们可以重新排列以形成彼此。
- 字符串 `"ate"` ，`"eat"` 和 `"tea"` 是字母异位词，因为它们可以重新排列以形成彼此。

## 2.两数之和

**题目：**

给定一个整数数组 nums 和一个整数目标值 target，请你在该数组中找出 和为目标值 target  的那 两个 整数，并返回它们的数组下标。

你可以假设每种输入只会对应一个答案，并且你不能使用两次相同的元素。

你可以按任意顺序返回答案。

语法：

（1）enumerate() 是 Python 的一个内置函数，用于在遍历可迭代对象（如列表、元组、字符串）时，同时获取元素的索引和值。

（2）字典的主要操作都是基于键的：

```python
my_dict[key] = value   # 通过键存值
value = my_dict[key]   # 通过键取值
if key in my_dict:     # 通过键检查存在性
del my_dict[key]       # 通过键删除
```

```python
class Solution(object):
    def twoSum(self, nums, target):
        out = {}
        for index, num in enumerate(nums):
            b = target -num
            if b in out:
                return [out[b], index]
            out[num] = index
        return []
```

**示例 1：**

```
输入：nums = [2,7,11,15], target = 9
输出：[0,1]
解释：因为 nums[0] + nums[1] == 9 ，返回 [0, 1] 。
```

**示例 2：**

```
输入：nums = [3,2,4], target = 6
输出：[1,2]
```

**示例 3：**

```
输入：nums = [3,3], target = 6
输出：[0,1]
```

