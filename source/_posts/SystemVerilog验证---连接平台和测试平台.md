---
title: SystemVerilog验证---连接平台和测试平台
date: 2026-05-07
categories: IC学习
tags: SystemVerilog验证
---

# SystemVerilog验证---连接平台和测试平台

## 一、测试平台与设计平台通过端口通信

这里主要包含有三个文件：

**设计文件**

```verilog
module arb_with_port (
    input bit clk,
    input bit rst,
    input logic [1:0] request,
    output logic [1:0] grant
);
    always@(posedge clk or posedge rst)begin
        if(rst)
            grant <= 2'b00;
        else if(request[0])
            grant <= 2'b01;
        else if(request[1])
            grant <= 2'b10;
        else
            grant <= 2'b00;
    end
endmodule
```

**测试文件**

```verilog
module test_with_port(
    input logic [1:0] grant,
    output logic [1:0] request,
    output bit rst,
    input bit clk
);
    initial begin
        @(posedge clk)
        request <= 2'b01;
        $display("@%0t: Drove req=01", $time);
        repeat (2) @(posedge clk);
        if(grant == 2'b01)
            $display("@%0t: Success: grant == 2'b01", $time);
        else
            $display("@%0t: Error: grant != 2'b01", $time);
            $finish; 
    end
endmodule
```

**顶层文件**

```verilog
module top;
    logic [1:0] grant, request;
    bit clk;
    always #50 clk = ~clk;

    arb_with_port arb (
        .clk(clk),
        .rst(rst),
        .request(request),
        .grant(grant)
    );

    test_with_port test (
        .grant(grant),
        .request(request),
        .rst(rst),
        .clk(clk)
    );
endmodule
```

在顶层文件中我们可以清晰看到，通过模块例化，我们将测试平台和DUT连接起来，并且包含有一个时钟生成器。但是这种模块很简单，**在真实的设计中，往往含有数百个端口和信号，需要数页代码来声明信号端口，通过这种方式极易出错，故我们引入接口设计来提前声明。**

## 二、测试平台与设计平台通过接口通信

### Q1：什么是接口

其实准确的来讲，这里的接口指的一个文件，我们通过interface 名字（输入时钟）...endinterface来定义的一个接口文件。

### Q2：接口的作用

为不同块之间的通信建模，可以看作一捆线，连接了测试平台与设计平台。

### Q3：怎么使用接口

**接口文件**

```verilog
interface arb_if(input bit clk);
    logic [1:0] grant, request;
    bit rst;
endinterface
```

**测试文件**

```verilog
module test_with_ifc(arb_if arbif);
    initial begin
        @(posedge arbif.clk)
        arbif.request <= 2'b01;
        $display("@%0t: Drove req=01", $time);
        repeat (2) @(posedge arbif.clk);
        if(arbif.grant == 2'b01)
            $display("@%0t: Success: grant == 2'b01", $time);
        else
            $display("@%0t: Error: grant != 2'b01", $time);
            $finish; 
    end
endmodule
```

**设计文件**

```verilog
module arb_with_ifc (arb_if arbif);
    always@(posedge arbif.clk or posedge arbif.rst)begin
        if(arbif.rst)
            arbif.grant <= 2'b00;
        else if(arbif.request[0])
            arbif.grant <= 2'b01;
        else if(arbif.request[1])
            arbif.grant <= 2'b10;
        else
            arbif.grant <= 2'b00;
    end
endmodule
```

可以看到我们首先定义了一个`arb_if`的接口文件，我们需要在不同块上的声明中，声明形如`arb_if arbif`这样的定义，然后便可以在块中使用接口中定义的信号。

**顶层文件**

```verilog
module top;
    bit clk;
    always #50 clk = ~clk;

    arb_if arbif(clk);
    arb_with_ifc a1(arbif);
    test_with_ifc t1(arbif);
endmodule:top
```

对比传统的顶层文件，与通过接口定义后的顶层文件，我们发现，只需要定义一个clk信号，然后例化三个模块。如果你需要在接口中放入一个新的信号，只需要在接口定义和实际使用接口的这个模块中进行修改，不需要改变任何模块，极大的降低了连线出错的概率。

### Q4：modport的作用

上面的接口文件中，我们使用的是点对点的无信号方向的连接方式。**modport结构能够将信号分组并指定方向。**

**带有modport模块的接口**

```verilog
interface arb_if(input bit clk);
    logic [1:0] grant, request;
    bit rst;
    
    modport TEST (output request, rst, input grant, clk);
    
    modport DUT (input request, rst, clk, output grant);
    
    modport MONITOR (input request, grant ,rst, clk);
    
endinterface
```

在测试模块中，我们使用`arb_if.TEST arbif`来作为输入信号的声明，其中信号指明了方向，输入为grant，clk，输出为request，rst信号。

在被测模块中，我们使用`arb_if.DUT arbif`来作为输入的信号的声明，其中信号指明了方向，输入为request，rst，clk，输出为grant。

## 三、激励时序

### Q1：什么是竞争状态

```verilog
// 设计代码（DUT）
always @(posedge clk) begin
    data_out <= data_in;  // 在Active区域执行
end

// 测试平台代码
always @(posedge clk) begin
    @(posedge clk);       // 等待时钟边沿
    data_in = stimulus;   // 也在同一时钟边沿驱动
    check_data = data_out; // 采样输出
end
```

**问题**：

- `data_out`应该采样的是上一拍的数据，但测试平台的`check_data`可能采样到新值，也可能采样到旧值
- `data_in`的驱动可能与DUT内部的`data_out`更新处于同一事件队列的不同区域
- 同一个仿真在不同仿真器、甚至同一仿真器不同版本下，结果可能不一致

这里的不同区域是指仿真的**时间片模型**，将仿真过程发、划分为不同区域，每一个语句执行在不同的区域。

因此在仿真时，我们需要严格控制激励时序，故使用**时钟块**控制同步信号的时序。

### Q2：如何定义时钟块

- 在`interface`内部，通过`clocking`关键字定义时钟块，明确指定信号的**方向**和**时序**。
- 时钟块默认采用 **`#1step`延时采样输入信号**（在前一个时间片的Postponed区域采样，即时钟上升沿前一刻的值，保证采样到的是稳定数据），采用 **`#0`延时驱动输出信号**（在Reactive区域驱动，确保驱动发生在采样之后，防止竞争）。

### Q3：什么是时间片区域

```text
时间片（同一仿真时间）
├── Preponed（仅用于采样）
├── Active（设计RTL更新）
├── Inactive
├── NBA（非阻塞赋值更新）
├── Observed（断言检查）
├── Reactive（测试平台执行） ← 测试平台代码在这里
├── Re-Inactive
├── Re-NBA
└── Postponed（只读采样）
```

![image-20260506112156387](https://raw.githubusercontent.com/ub-w/Article-images/main/Typora20260506112156581.png)

主要记住Active，Observerd，Reactive，Postponed。

### Q4：时钟块的作用

作用：解决竞争现象。

```verilog
clocking cb @(posedge clk)
    output request;
    input grant;
endclocking
```

**cb触发事件是clk上升沿，但是同时我们指明了信号方向，即request在上升沿之后被驱动，而grant在上升沿之前采样。**

单靠modport，虽然指明了方向，但是执行顺序未知。

clocking block 是 testbench 侧的“安全访问规则”，不是 DUT 侧的时钟逻辑。

同样，也可以使用default语句改变信号的先后执行时间。

```verilog
clocking cb @(posedge clk)
    default input #15ns output #10ns;
    output request;
    input grant;
endclocking

clocking cb @(posedge clk)
    output #10ns request;
    input #15ns grant;
endclocking
```

表示对于输入信号，在时钟上升沿之前15ns采样，对于输出信号，在时钟上升沿之后10ns驱动。



参考：克里斯·斯皮尔 格雷格·图姆布斯[著] 张春[译]。SystemVerilog测试平台编写指南 科学出版社
