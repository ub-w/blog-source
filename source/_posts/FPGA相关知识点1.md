---
title: FPGA相关知识点1---generate语法
date: 2025-10-02
categories: FPGA学习
tags: HDLbits
---

# FPGA相关知识点1---generate语法

Verilog 中的 `generate` 语法是用于**批量生成结构化代码**的关键特性，主要解决**重复模块实例化**、**重复逻辑**（如多路选择器、寄存器组）、**条件化生成硬件**等场景。

## 1.语法规则

1.1 变量声明---`genvar`

1.2 开始和结束---`generate，endgenerate`

1.3 命名要求：在generate结构块中使用for或者if语句，必须后面使用`begin：名称`完成显示命名。

## 2.实例演示

2.1 100位加法器计数（重复模块实例化）

```verilog
module top_module( 
    input [99:0] a, b,
    input cin,
    output [99:0] cout,
    output [99:0] sum );
    genvar i;
    generate
        for(i=0;i<=99;i=i+1)begin:adder
            if(i==0)
                Full_adder inist(a[i],b[i],cin,cout[i],sum[i]);
            else
                Full_adder inist(a[i],b[i],cout[i-1],cout[i],sum[i]);           
        end
    endgenerate

endmodule

module Full_adder( 
    input a, b, cin,
    output cout, sum );
    assign {cout,sum} = a + b + cin;
endmodule
```

这里adder为generate语句模块名，可以通过它对循环语句进行层次化引用。

代码中`i = i + 1`，不能使用C语言的常见表示`i++`，此语法在综合中不支持。

for循环中，变量都可以用i，不必为每一个for循环都声明一个专门变量，综合器会自动综合出a[0]~a[99]。