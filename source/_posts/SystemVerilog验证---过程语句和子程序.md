---
title: SystemVerilog验证---过程语句和子程序
date: 2026-04-07
categories: IC学习
tags: SystemVerilog验证
---

# SystemVerilog验证---过程语句和子程序

## 一、过程语句

1.1 过程块特有语句：

1. **`begin...end`**：组合多条语句为顺序块。

2. **`fork...join` / `join_any` / `join_none`**：并发执行子语句（常用于测试平台）。

   其中，**`fork...join`** - 等待所有子进程结束；

   ​			**`fork...join_any`** - 等待任意一个子进程结束；

   ​            **`fork...join_none`** - 不等待，立即继续。

1.2 循环语句

- **`for`**：标准计数循环。
  `for (int i=0; i<10; i++)`
- **`while`**：条件为真时循环。
  `while (cond) stmt;`
- **`do-while`**：先执行一次，再判断条件。
  `do stmt while (cond);`
- **`foreach`**（数组专用）：遍历数组或队列。
  `foreach (arr[i]) $display("%0d", arr[i]);`
- **`repeat`**：固定次数循环。
  `repeat (5) stmt;`
- **`forever`**：无限循环，常用于时钟生成。
  `forever #10 clk = ~clk;`

1.3 条件语句

- **`if-else`**：支持嵌套，注意 `else` 与最近的 `if` 匹配。

- **`case` / `casez` / `casex`**：多分支选择。
  `casez` 将 `z` 视为无关位，`casex` 将 `x`/`z` 均视为无关位。

  `case`可以通过`inside`关键字，列出取值范围。

1.4 跳转语句

- **`break`**：退出当前循环。
- **`continue`**：跳过本次循环剩余语句。

1.5 事件控制与延时

- **`@(event)`**：等待事件触发。
  `@(posedge clk) a = b;`
- **`wait(cond)`**：阻塞直到条件为真。
  `wait(ready == 1);`
- **`#delay`**：延时指定时间单位。
  `#10 a = 1;`

## 二、任务、函数以及void函数

## 三、子程序参数

## 四、子程序返回

## 五、局部数据存储

## 六、时间值

