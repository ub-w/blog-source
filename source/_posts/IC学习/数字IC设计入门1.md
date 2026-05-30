---
title: 数字IC设计入门1---数字IC行业概述
date: 2025-12-23
categories: IC学习
tags: IC设计入门
---

# 数字IC行业概述

## 一、IC设计公司分类

按照有无芯片生产能力分：**IDM和Fabless**

IDM就是兼具设计和生产

而Fabless仅仅就是设计，生产的任务交给类似台积电这种**代工厂**，称为**Foundry**。

按照产品类型也可以分为：数字IC公司和模拟IC公司

**数字IC公司着重于数据的运算和传输**，模拟电路起辅助作用，比如电源驱动电路，时钟发生器来触发运算。

**模拟IC公司重点在于模拟，比如ADC芯片，时钟控制芯片，电源管理芯片**，但同时也需要IIC和SPI等数字电路。

而USB接口芯片，既需要数字电路传输数据，也需要SerDes技术，利用模拟处理电路，提高传输速率，这种芯片称为**数模混合芯片**。

## 二、数字IC设计流程

设计的流程主要分为3步：

1. 利用Verilog编写RTL设计文件。
2. 综合，将设计文件转化为实际电子元器件，并进行连接，生成网表。
3. 布局布线，网表变为实际的电路图，也成为版图，类似于PCB图。

将版图交给Foundry，制造的过程称为流片，交付流片称为**TapeOut**。

除了上述三个过程外，还存在验证和验收（**SignOff**），如下图所示。

![image-20251223111132703](https://raw.githubusercontent.com/ub-w/Article-images/main/Typora20251223111141557.png)

其中，DFT称为可测性设计，属于附属工序。

前端设计也就是抽象电路设计，只描述功能。

后端设计是针对具体电路。

## 三、芯片整体规划

芯片整体规划包括：估计芯片的总面积，总成本，工艺，Foundry，**数字和模拟电路的位置，面积，形状等特征**。

数字和模拟电路的位置，面积，形状等特征的规划也称为版图布局规划**FloorPlan**，如下图所示。

![image-20251223113300188](https://raw.githubusercontent.com/ub-w/Article-images/main/Typora20251223113300217.png)

FloorPlan的周围是芯片引脚Pad，而I/O包含Pad和内部逻辑在内的整个引脚设计，如下图所示。

![image-20251223113419466](https://raw.githubusercontent.com/ub-w/Article-images/main/Typora20251223113419494.png)

## 四、IC设计中常用软件

![image-20251223150243966](https://raw.githubusercontent.com/ub-w/Article-images/main/Typora20251223150244020.png)

## 五、IC设计公司的分工和职位

![image-20251223150542898](https://raw.githubusercontent.com/ub-w/Article-images/main/Typora20251223150542931.png)

1. 数字IC设计：数字前端设计，**用Verilog语言设计电路**，使其能够完成某种功能，最终生成用HDL描述的电路设计文本RTL。
2. 数字IC验证：负责验证数字电路是否符合预期功能，对数字版图进行后仿，**使用System Verilog**，**并用UVM等验证方法指导验证流程**。有些SoC芯片的验证，需要编写C语言在CPU上运行。
3. 数字后端：使用后端自动布局布线工具将综合后的网表转变为可以流片的版图，**并通过PT的检查和修正**，使最终的版图满足时序，面积，功耗的要求，并且要使版图**通过DRC和LVS的检查**。



参考：白栎旸。数字 IC 设计入门（微课视频版）[M]. 北京：清华大学出版社