---
title: FPGA相关知识点2---锁存器（latch）
date: 2025-10-04
categories: FPGA学习
tags: HDLbits
---

# FPGA相关知识点2---锁存器（latch）

## 一、定义

latch是指锁存器，顾名思义是一种可以锁定原来状态的器件，在数字电路中我们学习过SR锁存器，JK锁存器，T锁存器等等，这些电路都是一种存储电路，可以用来**临时存储1位二进制数据**，并且他们属于**组合电路**。

## 二、产生原理

本质上，是由于**综合器在分析代码逻辑时，发现某个寄存器（reg）变量存在 “未被完全赋值” 的场景，为了保持该变量的原值，会自动推断出锁存器来实现 “保持” 功能**。

例如:

![image-20251210221314328](https://raw.githubusercontent.com/ub-w/Article-images/main/Typora20251210221325887.png)

```verilog
module top_module (
    input d, 
    input ena,
    output q);
    always@(*)begin
        if(ena)
            q <= d;
    end
endmodule
```

等同于`if(ena) q<=d;else q<=q;`

所以latch在组合逻辑中出现的原因主要是**if或者case语句不完整描述。**

**危害：**

1. **时序难以约束**：锁存器是电平敏感，容易导致时序分析复杂，出现亚稳态；
2. **功耗更高**：电平有效期间，锁存器会持续消耗功耗，而寄存器仅在时钟边沿动作；
3. **易出毛刺**：组合逻辑中的锁存器容易被输入毛刺影响，导致输出不稳定。