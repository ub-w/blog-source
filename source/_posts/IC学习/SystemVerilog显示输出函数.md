---
title: SystemVerilog 显示/输出函数总结
date: 2026-04-02
categories: IC
tags: SystemVerilog验证
---

## SystemVerilog 显示/输出函数

### 1. $display - 标准输出（自动换行）

**语法：**

```verilog
$display(format_string, [argument_list]);
```

**参数说明：**

| 参数            | 类型   | 说明                           |
| :-------------- | :----- | :----------------------------- |
| `format_string` | string | 包含格式说明符和文本的输出格式 |
| `argument_list` | any    | 可选，要输出的变量/表达式列表  |

### 2. $write - 输出不换行

**语法：**

```verilog
$write(format_string, [argument_list]);
```

**参数说明：**

| 参数            | 类型   | 说明                           |
| :-------------- | :----- | :----------------------------- |
| `format_string` | string | 包含格式说明符和文本的输出格式 |
| `argument_list` | any    | 可选，要输出的变量/表达式列表  |

**与$display区别：** 输出后不自动添加换行符

### 3. $monitor - 监控信号变化输出

**语法：**

```verilog
$monitor(format_string, [argument_list]);
$monitoron;
$monitoroff;
```

**参数说明：**

| 函数/参数       | 类型   | 说明                           |
| :-------------- | :----- | :----------------------------- |
| `format_string` | string | 包含格式说明符和文本的输出格式 |
| `argument_list` | any    | 要监控的变量/表达式列表        |
| `$monitoron`    | -      | 启用监控输出                   |
| `$monitoroff`   | -      | 禁用监控输出                   |

**执行时机：** 当监控列表中的任何信号发生变化时输出

### 4. $fdisplay - 输出到文件（自动换行）

**语法：**

```verilog
$fdisplay(file_descriptor, format_string, [argument_list]);
```

**参数说明：**

| 参数              | 类型    | 说明                           |
| :---------------- | :------ | :----------------------------- |
| `file_descriptor` | integer | 由`$fopen`返回的文件句柄       |
| `format_string`   | string  | 包含格式说明符和文本的输出格式 |
| `argument_list`   | any     | 可选，要输出的变量/表达式列表  |

### 5. $finish - 结束仿真

**语法：**

```verilog
$finish(finish_code);
```

**参数说明：**

| 参数          | 类型    | 说明                                       |
| :------------ | :------ | :----------------------------------------- |
| `finish_code` | integer | 可选，0=显示统计，1=不显示，2=不显示并退出 |

### 6. $time - 返回当前仿真时间

**语法：**

```verilog
current_time = $time;
```

**返回值：** 64位整数（integer），当前仿真时间



### 格式说明符（format_string中使用）

| 格式符       | 参数类型 | 说明                     |
| :----------- | :------- | :----------------------- |
| `%d` / `%0d` | integer  | 十进制整数               |
| `%h` / `%x`  | integer  | 十六进制整数             |
| `%b`         | integer  | 二进制整数               |
| `%o`         | integer  | 八进制整数               |
| `%c`         | integer  | ASCII字符                |
| `%s`         | string   | 字符串                   |
| `%t`         | time     | 时间值                   |
| `%f`         | real     | 浮点数（十进制）         |
| `%e`         | real     | 浮点数（科学计数法）     |
| `%g`         | real     | 浮点数（紧凑格式）       |
| `%p`         | any      | 数组/结构体/队列完整格式 |
| `%m`         | -        | 层次路径名               |
| `%l`         | -        | 库名                     |

### 特殊转义字符

| 转义符 | 说明     |
| :----- | :------- |
| `\n`   | 换行     |
| `\t`   | 制表符   |
| `\\`   | 反斜杠   |
| `\"`   | 双引号   |
| `\v`   | 垂直制表 |
| `\f`   | 换页     |
| `\a`   | 响铃     |
| `%%`   | 百分号   |
