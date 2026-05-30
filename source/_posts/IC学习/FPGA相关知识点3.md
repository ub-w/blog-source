---
title: FPGA相关知识点3---寄存器引入带来的延迟
date: 2025-11-09
categories: FPGA学习
tags: HDLbits
---

# FPGA相关知识点3---寄存器引入带来的延迟

给定如下模块：

![image-20251211115755192](https://raw.githubusercontent.com/ub-w/Article-images/main/Typora20251211115803794.png)

我们现在给出两种解决办法：

方法1：

```verilog
module top_module (
    input clk,
    input w, R, E, L,
    output reg Q
);
    reg m1 = 1'b0;
    always@(posedge clk)begin
        case(E)
            1'b0: m1 <= Q;
            1'b1: m1 <= w;
        endcase
        case(L)
            1'b0: Q <= m1;
            1'b1: Q <= R;
        endcase
    end
endmodule
```

方法2：

```verilog
module top_module (
    input clk,
    input w, R, E, L,
    output reg Q
);

    always@(posedge clk)begin
        Q <= L ? R : (E ? w : Q);
    end
endmodule
```

方法1引入了中间寄存器m1，本来的想法是为了增加可读性，但是由于always块中非阻塞赋值时并发执行的，导致Q会先执行寄存器m1的上一次clk上升沿时存储的值，从而造成了数据路径的延迟。

方法一对应电路：

```text
       +---------+    +---------+
w ---->|         |    |         |
       |    MUX  |    |    MUX  |
Q ---- |  (E)    |--->|  (L)    |----> Q
       |         |    |         |
       +---------+    +---------+
           |              |
          m1              R
          ^
          |
      [D-FF]    ← m1 是一个独立的触发器
```

方法二对应电路：

```text
       +----------------+
       |                |
w -----|                |
       |    组合逻辑    |-----> Q
Q -----|    (L?R:E?w:Q) |
       |                |
       +----------------+
              |
             [D-FF]    ← 只有一个触发器 Q
```

这体现了数字电路设计中的重要原则：**寄存器会引入延迟，组合逻辑不会**。第一个模块相当于在数据路径中多插入了一级流水线，使得响应变慢但可能有更高的时钟频率。

------

**下面介绍一种引入寄存器的用途：**

![image-20251211163557487](https://raw.githubusercontent.com/ub-w/Article-images/main/Typora20251211163557526.png)

```verilog
module top_module (
    input clk,
    input [7:0] in,
    output reg [7:0] anyedge
);
    reg [7:0] in_r;
    always@(posedge clk)begin
        in_r <= in;
        anyedge <= in ^ in_r;
    end
endmodule
```

这是一种边缘检测电路，通过引入in_r寄存器，暂存in的数值，从而通过异或运算与当前in的数值比较，输出检测结果。