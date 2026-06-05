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

**示例 1:**

```
输入: strs = ["eat", "tea", "tan", "ate", "nat", "bat"]
输出:[["bat"],["nat","tan"],["ate","eat","tea"]]
```

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

**示例 1：**

```
输入：nums = [2,7,11,15], target = 9
输出：[0,1]
解释：因为 nums[0] + nums[1] == 9 ，返回 [0, 1] 。
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

**思路：**

创建哈希表out，将num作为key，判断差值是否在键中，然后返回改键的值，即索引。反向操作。

### 3.最长连续序列

**题目：**

给定一个未排序的整数数组 `nums` ，找出数字连续的最长序列（不要求序列元素在原数组中连续）的长度。

请你设计并实现时间复杂度为 `O(n)` 的算法解决此问题。

**示例 1：**

```
输入：nums = [100,4,200,1,3,2]
输出：4
解释：最长数字连续序列是 [1, 2, 3, 4]。它的长度为 4。
```

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

### 5.四数相加

**题目：**

给你四个整数数组 `nums1`、`nums2`、`nums3` 和 `nums4` ，数组长度都是 `n` ，请你计算有多少个元组 `(i, j, k, l)` 能满足：

- `0 <= i, j, k, l < n`
- `nums1[i] + nums2[j] + nums3[k] + nums4[l] == 0`

**示例 1：**

```
输入：nums1 = [1,2], nums2 = [-2,-1], nums3 = [-1,2], nums4 = [0,2]
输出：2
解释：
两个元组如下：
1. (0, 0, 0, 1) -> nums1[0] + nums2[0] + nums3[0] + nums4[1] = 1 + (-2) + (-1) + 2 = 0
2. (1, 1, 0, 0) -> nums1[1] + nums2[1] + nums3[0] + nums4[0] = 2 + (-1) + (-1) + 0 = 0
```

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

**思路：**

正常的思维四个for循环，但是时间复杂度是O（n^4）。故这里需要转变思维，可以两两拆分组合，通过算一个的哈希表，然后另一个在表里查询，但是如果创建集合，就会去重，最后结果仍然不对，所以这里选择字典，并且把和作为索引，重复次数作为值，最后计算和即可。

### 6.赎金信

**题目：**

给你两个字符串：`ransomNote` 和 `magazine` ，判断 `ransomNote` 能不能由 `magazine` 里面的字符构成。

如果可以，返回 `true` ；否则返回 `false` 。

`magazine` 中的每个字符只能在 `ransomNote` 中使用一次。

**示例 1：**

```
输入：ransomNote = "aa", magazine = "aab"
输出：true
```

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

## 二、双指针

### 1.反转字符串

**题目：**

编写一个函数，其作用是将输入的字符串反转过来。输入字符串以字符数组 `s` 的形式给出。

不要给另外的数组分配额外的空间，你必须**[原地](https://baike.baidu.com/item/原地算法)修改输入数组**、使用 O(1) 的额外空间解决这一问题。

**示例 1：**

```
输入：s = ["h","e","l","l","o"]
输出：["o","l","l","e","h"]
```

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

### 2.移动零

给定一个数组 `nums`，编写一个函数将所有 `0` 移动到数组的末尾，同时保持非零元素的相对顺序。

**请注意** ，必须在不复制数组的情况下原地对数组进行操作。

**示例 1:**

```
输入: nums = [0,1,0,3,12]
输出: [1,3,12,0,0]
```

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

### 3.反转字符串中的单词

**题目：**

给你一个字符串 `s` ，请你反转字符串中 **单词** 的顺序。

**单词** 是由非空格字符组成的字符串。`s` 中使用至少一个空格将字符串中的 **单词** 分隔开。

返回 **单词** 顺序颠倒且 **单词** 之间用单个空格连接的结果字符串。

**注意：**输入字符串 `s`中可能会存在前导空格、尾随空格或者单词间的多个空格。返回的结果字符串中，单词间应当仅用单个空格分隔，且不包含任何额外的空格。

**示例 1：**

```
输入：s = "the sky is blue"
输出："blue is sky the"
```



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

### 4.盛最多的水容器

题目：

给定一个长度为 `n` 的整数数组 `height` 。有 `n` 条垂线，第 `i` 条线的两个端点是 `(i, 0)` 和 `(i, height[i])` 。

找出其中的两条线，使得它们与 `x` 轴共同构成的容器可以容纳最多的水。

返回容器可以储存的最大水量。

**说明：**你不能倾斜容器。

**示例 1：**

![img](https://aliyun-lc-upload.oss-cn-hangzhou.aliyuncs.com/aliyun-lc-upload/uploads/2018/07/25/question_11.jpg)

```
输入：[1,8,6,2,5,4,8,3,7]
输出：49 
解释：图中垂直线代表输入数组 [1,8,6,2,5,4,8,3,7]。在此情况下，容器能够容纳水（表示为蓝色部分）的最大值为 49。
```

```python
class Solution(object):
    def maxArea(self, height):
        left = 0
        right = len(height) - 1
        h = 0
        length = 0
        max_v = 0
        while left < right:
            h = height[left] if height[left] < height[right] else height[right]
            max_v = max(max_v, h * (right - left))
            if(height[left] < height[right]):
                left += 1
            else:
                right -= 1
        return max_v
```

### 5.三数之和

题目：给你一个整数数组 `nums` ，判断是否存在三元组 `[nums[i], nums[j], nums[k]]` 满足 `i != j`、`i != k` 且 `j != k` ，同时还满足 `nums[i] + nums[j] + nums[k] == 0` 。请你返回所有和为 `0` 且不重复的三元组。

**注意：**答案中不可以包含重复的三元组。

**示例 1：**

```
输入：nums = [-1,0,1,2,-1,-4]
输出：[[-1,-1,2],[-1,0,1]]
解释：
nums[0] + nums[1] + nums[2] = (-1) + 0 + 1 = 0 。
nums[1] + nums[2] + nums[4] = 0 + 1 + (-1) = 0 。
nums[0] + nums[3] + nums[4] = (-1) + 2 + (-1) = 0 。
不同的三元组是 [-1,0,1] 和 [-1,-1,2] 。
注意，输出的顺序和三元组的顺序并不重要。
```

```python
class Solution(object):
    def threeSum(self, nums):
        out = []
        length = len(nums)
        nums = sorted(nums)
        for i in range(length - 2):
            if nums[i] > 0:
                break
            if i>0 and nums[i] == nums[i-1]:
                continue
            left = i + 1
            right = length - 1
            while left < right:
                total = nums[i] + nums[left] + nums[right]
                if total == 0:
                    out.append([nums[i], nums[left], nums[right]])
                    while left < right and nums[left] == nums[left+1]:
                        left += 1
                    while left < right and nums[right] == nums[right - 1]:
                        right -= 1
                    left += 1
                    right -= 1
                elif total < 0:
                    left += 1
                elif total > 0:
                    right -= 1
        return out
```

理解：

if i>0 and nums[i] == nums[i-1]:判断下一个i的值是不是和之前一样，如果一样则跳过。

为什么不是i+1呢？因为如果i+1，则还没有计算就往后移，造成缺漏。

 while left < right and nums[left] == nums[left+1]:

包括这里也是，都是算完之后看后面的是不是和前面一样，如果一样则跳过。

所以，操作手法都是先算，算完之后判断下一个数是不是重复。

这道题的核心就是nums = sorted(nums)排列，先排列，后面才可以减少计算量。

6.接雨水

题目：

给定 `n` 个非负整数表示每个宽度为 `1` 的柱子的高度图，计算按此排列的柱子，下雨之后能接多少雨水。

**示例 1：**

![img](https://assets.leetcode.cn/aliyun-lc-upload/uploads/2018/10/22/rainwatertrap.png)

```
输入：height = [0,1,0,2,1,0,1,3,2,1,2,1]
输出：6
解释：上面是由数组 [0,1,0,2,1,0,1,3,2,1,2,1] 表示的高度图，在这种情况下，可以接 6 个单位的雨水（蓝色部分表示雨水）。 
```

```python
class Solution(object):
    def trap(self, height):
        left = 0
        right = len(height) - 1
        leftmax = height[left]
        rightmax = height[right] 
        out = 0
        if len(height) < 3:
            return 0
        while left < right:
            if height[left] < height[right]:
                if height[left] > leftmax:
                    leftmax = height[left]
                else:
                    out += leftmax - height[left]
                left += 1
            else:
                if height[right] > rightmax:
                    rightmax = height[right]
                else:
                    out += rightmax - height[right]
                right -= 1
        return out
```

**思路总结**

**核心逻辑**：每个位置能接多少水，取决于它**左边最高柱子**和**右边最高柱子**中较矮的那个，减去自己高度。

**双指针技巧**：

- 左指针 `left`、右指针 `right` 从两端向中间移动
- `leftmax` 记录左边见过的最高柱子，`rightmax` 记录右边见过的最高柱子
- **哪边矮，先处理哪边**（因为积水上限由矮的一侧决定）

具体步骤：

1. 比较 `height[left]` 和 `height[right]`
2. 如果左边矮：
   - 更新 `leftmax`（如果当前更高）
   - 否则累加积水：`leftmax - height[left]`
   - 左指针右移
3. 如果右边矮或相等：
   - 更新 `rightmax`（如果当前更高）
   - 否则累加积水：`rightmax - height[right]`
   - 右指针左移
4. 重复直到两指针相遇



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

（18）python中的三目运算符：value_if_true if condition else value_if_false
