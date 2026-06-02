---
title: Cuda引言
date: 2026-6-1
categories: 大模型
tags:cuda
---

# Cuda引言

## 一、CPU与GPU架构

![image-20260601214038723](https://raw.githubusercontent.com/ub-w/Article-images/main/Typoraimage-20260601214038723.png)

对于cpu而言，动态随机存取储存器DRAM就是内存条，对于GPU而言，动态随机存取储存器DRAM就是显存。

## 二、什么是cuda

### 1.定义

**CUDA (Compute Unified Device Architecture)** 是 NVIDIA 推出的**并行计算平台**和**应用程序编程接口 (API)** 模型。CUDA 将 GPU 从专用的图形处理器，暴露为一个**高度并行的、多线程的、支持随机读写内存的通用数据并行协处理器**。

![image-20260601214918211](https://raw.githubusercontent.com/ub-w/Article-images/main/Typoraimage-20260601214918211.png)

### 2.编程

安装cuda即可使用NVCC，NVCC支持纯C++代码的编译，NVCC主要编译扩展名为.cu的CUDA文件

编译指令：nvcc .cu文件 -o 输出文件

### 3.核函数

（1）核函数才GPU上进行并行执行

（2）由限定词`__global__`修饰

（3）返回值必须是void

（4）核函数只能访问GPU内存

（5）核函数不能使用边长参数

（6）核函数不能使用静态变量

（7）核函数不能使用函数指针

（8）核函数具有异步性，必须调用同步函数`cudaDeviceSynchronize()`，与CPU同步执行

（9）核函数不支持C++的iostream



