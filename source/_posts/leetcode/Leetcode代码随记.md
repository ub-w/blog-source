---
title: 算法练习
date: 2026-5-30
categories: 算法
tags: leetcode
---

# 算法练习

## 一、哈希

### 1.字母异位词分组
**题目：**

给你一个字符串数组，请你将字母异位词组合在一起。可以按任意顺序返回结果列表。

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

**思路：**

重点可能在于if key not in out，判断key是否在哈希表内，然后创建字典，然后按照key值相同重新排列。

### 2.两数之和

**题目：**

给定一个整数数组 nums 和一个整数目标值 target，请你在该数组中找出 和为目标值 target  的那 两个 整数，并返回它们的数组下标。

你可以假设每种输入只会对应一个答案，并且你不能使用两次相同的元素。

你可以按任意顺序返回答案。

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

**思路：**

创建哈希表out，将num作为key，判断差值是否在键中，然后返回改键的值，即索引。反向操作。

### 3.最长连续序列

**题目：**

给定一个未排序的整数数组 `nums` ，找出数字连续的最长序列（不要求序列元素在原数组中连续）的长度。

请你设计并实现时间复杂度为 `O(n)` 的算法解决此问题。

```python
class Solution(object):
    def longestConsecutive(self, nums):
        """
        :type nums: List[int]
        :rtype: int
        """
        numset = set(nums)
        maxlength = 0
        for num in numset:
            if num - 1 not in numset:
                start = num
                currentlength = 1
                while num + 1 in numset:
                    currentlength += 1
                    num += 1
                maxlength = max(maxlength, currentlength)
        return maxlength
```

**示例 1：**

```
输入：nums = [100,4,200,1,3,2]
输出：4
解释：最长数字连续序列是 [1, 2, 3, 4]。它的长度为 4。
```

**思路：**

将原来的列表转化为哈希表，因为查找这个操作在哈希表的时间复杂度为O（1），即只查询一次，通过计算哈希值，和反解哈希值查找。这里的还用到判断起始值，以及不断加1话更新连续长度。

### 4.快乐数

**题目：**

编写一个算法来判断一个数 `n` 是不是快乐数。

**「快乐数」** 定义为：

- 对于一个正整数，每一次将该数替换为它每个位置上的数字的平方和。
- 然后重复这个过程直到这个数变为 1，也可能是 **无限循环** 但始终变不到 1。
- 如果这个过程 **结果为** 1，那么这个数就是快乐数。

如果 `n` 是 *快乐数* 就返回 `true` ；不是，则返回 `false` 。

```python
class Solution(object):
    def isHappy(self, n):
        outset = set()
        while n not in outset:
            outset.add(n)
            out = 0
            for i in str(n):
                out += int(i)**2
            if (out == 1):
                return True
            else:
                n = out
        return False
```

**示例 1：**

```
输入：n = 19
输出：true
解释：
12 + 92 = 82
82 + 22 = 68
62 + 82 = 100
12 + 02 + 02 = 1
```

### 5.四数相加

**题目：**

给你四个整数数组 `nums1`、`nums2`、`nums3` 和 `nums4` ，数组长度都是 `n` ，请你计算有多少个元组 `(i, j, k, l)` 能满足：

- `0 <= i, j, k, l < n`
- `nums1[i] + nums2[j] + nums3[k] + nums4[l] == 0`

```python
class Solution(object):
    def fourSumCount(self, nums1, nums2, nums3, nums4):
        cnt = 0
        sum12 = {}
        for num1 in nums1:
            for num2 in nums2:
                if num1 + num2 in sum12:
                    sum12[num1 + num2] += 1
                else:
                    sum12[num1 + num2] = 1
        for num3 in nums3:
            for num4 in nums4:
                if -(num3 + num4) in sum12:
                    cnt = cnt + sum12[-(num3 + num4)]
        return cnt
```

**示例 1：**

```
输入：nums1 = [1,2], nums2 = [-2,-1], nums3 = [-1,2], nums4 = [0,2]
输出：2
解释：
两个元组如下：
1. (0, 0, 0, 1) -> nums1[0] + nums2[0] + nums3[0] + nums4[1] = 1 + (-2) + (-1) + 2 = 0
2. (1, 1, 0, 0) -> nums1[1] + nums2[1] + nums3[0] + nums4[0] = 2 + (-1) + (-1) + 0 = 0
```

**思路：**

正常的思维四个for循环，但是时间复杂度是O（n^4）。故这里需要转变思维，可以两两拆分组合，通过算一个的哈希表，然后另一个在表里查询，但是如果创建集合，就会去重，最后结果仍然不对，所以这里选择字典，并且把和作为索引，重复次数作为值，最后计算和即可。

### 6.赎金信

**题目：**

给你两个字符串：`ransomNote` 和 `magazine` ，判断 `ransomNote` 能不能由 `magazine` 里面的字符构成。

如果可以，返回 `true` ；否则返回 `false` 。

`magazine` 中的每个字符只能在 `ransomNote` 中使用一次。

```python
class Solution(object):
    def canConstruct(self, ransomNote, magazine):
        r_dict = {}
        for r in ransomNote:
            r_dict[r] = r_dict.get(r, 0) + 1
        
        for m in magazine:
            if m in r_dict and r_dict[m] > 0:
                r_dict[m] -= 1
        
        return all(v == 0 for v in r_dict.values())
```

**示例 1：**

```
输入：ransomNote = "aa", magazine = "aab"
输出：true
```

## 二、双指针

### 1.反转字符串

**题目：**

编写一个函数，其作用是将输入的字符串反转过来。输入字符串以字符数组 `s` 的形式给出。

不要给另外的数组分配额外的空间，你必须**[原地](https://baike.baidu.com/item/原地算法)修改输入数组**、使用 O(1) 的额外空间解决这一问题。

```python
class Solution(object):
    def reverseString(self, s):
        left = 0
        right = len(s) - 1
        while left < right:
            s[left], s[right] = s[right], s[left]
            left += 1
            right -= 1
```

**示例 1：**

```
输入：s = ["h","e","l","l","o"]
输出：["o","l","l","e","h"]
```

### 2.移动零

给定一个数组 `nums`，编写一个函数将所有 `0` 移动到数组的末尾，同时保持非零元素的相对顺序。

**请注意** ，必须在不复制数组的情况下原地对数组进行操作。

```python
class Solution(object):
    def moveZeroes(self, nums):
        slowIndex = 0
        for num in nums:
            if num != 0:
                nums[slowIndex] = num
                slowIndex += 1
        count = len(nums) - slowIndex
        nums[slowIndex:] = [0] * count
```

**示例 1:**

```
输入: nums = [0,1,0,3,12]
输出: [1,3,12,0,0]
```

### 3.反转字符串中的单词

给你一个字符串 `s` ，请你反转字符串中 **单词** 的顺序。

**单词** 是由非空格字符组成的字符串。`s` 中使用至少一个空格将字符串中的 **单词** 分隔开。

返回 **单词** 顺序颠倒且 **单词** 之间用单个空格连接的结果字符串。

**注意：**输入字符串 `s`中可能会存在前导空格、尾随空格或者单词间的多个空格。返回的结果字符串中，单词间应当仅用单个空格分隔，且不包含任何额外的空格。

```python
class Solution(object):
    def reverseWords(self, s):
        words = s.strip().split()
        left = 0
        right = len(words) - 1
        while left < right:
            words[left], words[right] = words[right], words[left]
            left += 1
            right -= 1
        return ' '.join(words)
```

**示例 1：**

```
输入：s = "the sky is blue"
输出："blue is sky the"
```

















# **语法知识点：**

（1）分隔符.`join()` 是一个**字符串方法**，用于将一个可迭代对象（如列表、元组）中的字符串元素**连接成一个新的字符串**。

（2）`sort()` 是一个**列表方法**，用于**原地排序**列表元素。返回值None，原列表被修改。

（3）`sorted()` 是一个**内置函数**，用于对任何可迭代对象进行排序，并**返回一个新的排序后的列表**（原对象不变）。

（4）`append()` 是 Python **列表（list）**的一个方法，用于**在列表末尾添加一个元素**。

（5）`list()` 是 Python 中的一个**内置函数**，用于创建列表。

（6）`enumerate()` 是 Python 的一个内置函数，用于在遍历可迭代对象（如列表、元组、字符串）时，同时获取元素的索引和值。

（7）字典的主要操作都是基于键的：

```python
my_dict[key] = value   # 通过键存值
value = my_dict[key]   # 通过键取值
if key in my_dict:     # 通过键检查存在性
del my_dict[key]       # 通过键删除
```

（8）对于一个整数，把它的每一位拆出来，通常有两种主要方法：第一种，通过取模和整除；第二种，先转成字符串，然后再转化为整型。

（9）集合中使用`add()` 添加**单个**元素。如果元素已存在，则不会报错，也不会产生任何变化（集合自动去重）。

（10）**`{}`** 在 Python 中默认是**空字典**，**空集合**必须用 `set()` 创建，字典也可以i用`dict()`创建

（11）`all()`是 Python 的一个内置函数，用于判断**可迭代对象**中的**所有元素**是否都为True，如果**任意**元素为假，返回 `False`

（12）`s[left], s[right] = s[right], s[left]`这是 Python 的**元组解包交换**，会同时计算右边的值，然后同时赋值，实现真正的交换。

（13）`len()` 是 Python 的内置函数，用于返回**对象的长度**（元素个数）。

（14）切片操作 [start：end：step]，注意nums[:3]从开头到2。

（15）反向切片nums[:-2]，从开头到倒数第三个

（16）`split()` 是 Python 中非常实用的字符串方法，用于**将字符串分割成多个子字符串**，返回一个**列表**。默认为**任意空白字符**

（17）`strip()` 是 Python 字符串方法，用于**去除字符串首尾指定的字符**（默认为空白字符）。
