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

## 三、线程模型结构

### 1.结构

![image-20260602154244422](https://cdn.jsdelivr.net/gh/ub-w/Article-images@main/Typora20260602154244824.png)

- 每个线程在核函数中都有一个唯一的身份标识；
- 每个线程的唯一标识由这两个<<<grid_size, block_size>>>确定；grid_size, block_size保存在内建变量（build-in variable）：**gridDim.x**：该变量的数值等于执行配置中变量grid_size的值；**blockDim.x**：该变量的数值等于执行配置中变量block_size的值。
- 线程索引保存成内建变量：**blockId.x**：该变量指定一个线程在一个网格中线程块索引值，范围为0—gridDim.x - 1；**threadIdx.x**：该变量指定一个线程在一个线程块中线程索引值，范围为0—blockDime.x - 1。
- 为什么这里都是x，因为目前只考虑一维；实际上还有y，z。

![image-20260602155322516](https://cdn.jsdelivr.net/gh/ub-w/Article-images@main/Typora20260602155322565.png)

**解释**每个线程的唯一标识由这两个<<<grid_size, block_size>>>确定的意义：

比如：

```c++
__global__ void vecadd_GPU(float* x, float* y, float* z, int N){
	unsigned int i = blockDim.x*blockIdx.x + threadIdx.x;
	z[i] = x[i] + y[i];
}
```

由于每个线程的 threadIdx 和 blockIdx 都不同，这是由硬件赋予的，故每一个线程算出来的i都不同：

- **线程 #0**（在 block 0, thread 0）：它的 `blockIdx.x=0, threadIdx.x=0`，算出来 `i=0`，执行 `z[0]=x[0]+y[0]`
- **线程 #1**（在 block 0, thread 1）：它的 `blockIdx.x=0, threadIdx.x=1`，算出来 `i=1`，执行 `z[1]=x[1]+y[1]`
- **线程 #256**（在 block 1, thread 0）：它的 `blockIdx.x=1, threadIdx.x=0`，算出来 `i=256`，执行 `z[256]=x[256]+y[256]`
- ...
- **线程 #32767**：它的 `i=32767`，执行 `z[32767]=x[32767]+y[32767]`

这也就是单程序多数据（SPMD）。

![image-20260602161714840](https://cdn.jsdelivr.net/gh/ub-w/Article-images@main/Typora20260602161714929.png)

### 2. 定义方式

**一维：**

```cuda
dim3 blockDim(256);      // 或者直接写 256
dim3 gridDim(128);
kernel<<<gridDim, blockDim>>>(...);
```

**二维（处理图像/矩阵）：**

```cuda
dim3 blockDim(16, 16);   // 16x16 = 256 个线程
dim3 gridDim(32, 32);    // 32x32 = 1024 个块
kernel<<<gridDim, blockDim>>>(...);
```

**三维（处理体积数据/CT扫描）：**

```cuda
dim3 blockDim(8, 8, 4);  // 8x8x4 = 256 个线程
dim3 gridDim(10, 10, 10); // 10x10x10 = 1000 个块
kernel<<<gridDim, blockDim>>>(...);
```

### 3.索引方式

**一维：**

```cuda
int id = blockIdx.x * blockDim.x + threadIdx.x;
```

**二维：**

```
int blockId = blockIdx.x + blockIdx.y * gridDim.x;
int threadId = threadIdx.x + threadIdx.y * blockDim.x;
int id = blockId * (blockDim.x * blockDim.y) + threadId;
```

**三维：**

```cuda
int blockId = blockIdx.x + blockIdx.y * gridDim.x + blockIdx.z * gridDim.x * gridDim.y;
int threadId = threadIdx.x + (threadIdx.y * blockDim.x) + (threadIdx.z * (blockDim.x * blockDim.y));
int id = blockId * (blockDim.x * blockDim.y * blockDim.z) + threadId;
```

## 四、NVCC编译流程

```
CUDA源代码 (.cu)
      ↓
   预处理 (去除注释、宏展开等)
      ↓
   分离器 (CUDASplit)
      ↓
      ├──────────────┐
      ↓              ↓
  设备代码        主机代码
  (GPU部分)      (CPU部分)
      ↓              ↓
  NVIDIA编译器    C++预处理器
  (nvaccel)       (如gcc/g++)
      ↓              ↓
   PTX中间代码    预处理后的主机代码
      ↓              ↓
   优化/汇编         C++编译器
  (ptxas)           (gcc/g++/cl.exe)
      ↓              ↓
   Cubin目标文件   主机目标文件 (.o/.obj)
  (设备二进制)         ↓
      └──────────────┘
            ↓
         链接器
      (nvlink + 系统链接器)
            ↓
         可执行文件
```

- PTX（Paraller Thread Execution）伪汇编代码

- 在将源代码编译为PTX代码时，需要用选项-arch=compute_XY指定一个虚拟架构计算能力，用以确定代码中能够使用的CUDA功能。

- 在将PTX代码编译为cubin代码时，需要用选项-code=sm_ZW指定一个真实架构的计算能力，用以确定可执行文件能够使用的GPU。

- NVCC编译命令总是使用两个体系架构：一个是虚拟的中间体系架构，另一个是实际的GPU体系架构。

  ![image-20260602174146758](https://cdn.jsdelivr.net/gh/ub-w/Article-images@main/Typora20260602174146863.png)

## 五、计算能力选择

指定虚拟架构计算能力：

```
-arch=compute_XY
XY:第一个数字X代表计算能力的主版本好，第二个数字Y代表计算能力的次版本号
C/C++源码编译为PTX时，可以指定虚拟架构的计算能力，用来确定代码中能够使用的CUDA功能
PTX的指令只能在更高的真实计算能力的GPU使用
```

指定真实架构计算能力：

```
-code=sm_XY
XY:第一个数字X代表计算能力的主版本好，第二个数字Y代表计算能力的次版本号
PTX的指令转化为二进制cubin代码与就的GPU架构有关
指定的真实架构计算能力的时候必须指定虚拟架构计算能力，且真实架构能力必须大于或等于虚拟架构能力
```

在使用NVCC编译时，可以指定多个GPU版本编译，例如

```
-gencode=arch=compute_35,code=sm_35
-gencode=arch=compute_50,code=sm_50
-gencode=arch=compute_60,code=sm_60
-gencode=arch=compute_70,code=sm_70
```

编译出的可执行文件包含4个二进制版本，生成的可执行文件称为胖二进制文件（fatbinary）。

![image-20260602180226724](https://cdn.jsdelivr.net/gh/ub-w/Article-images@main/Typora20260602180226791.png)

通过NVCC .cu文件 -ptx，可直接生成PTX代码文件。
