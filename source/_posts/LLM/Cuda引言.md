---
title: Cuda引言
date: 2026-6-1
categories: 大模型
tags: cuda
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

## 六、Cuda错误检查函数

```c++
#pragma once
#include <stdlib.h>
#include <stdio.h>

cudaError_t ErrorCheck(cudaError_t error_code, const char* filename, int lineNumber){
    if(error_code != cudaSuccess){
        printf("CUDA error:\r\ncode=%d, name=%s, description=%s\r\nfile=%s, line%d\r\n",
            error_code, cudaGetErrorName(error_code), cudaGetErrorString(error_code), filename, lineNumber);
        return error_code;
    }
    return error_code;
}

void setGPU(){
    int iDeviceCount = 0;
    cudaError_t error = ErrorCheck(cudaGetDeviceCount(&iDeviceCount), __FILE__, __LINE__);

    if(error != cudaSuccess || iDeviceCount == 0){
        printf("No CUDA campatable GPU found!\n");
        exit(-1);
    }
    else{
        printf("The count of GPUs is %d\n", iDeviceCount);
    }

    int iDev = 0;
    error = ErrorCheck(cudaSetDevice(iDev), __FILE__, __LINE__);
    if(error != cudaSuccess){
        printf("fail to set GPU 0 for computing.\n");
        exit(-1);
    }
    else{
        printf("set GPU 0 for computing.\n");
    }
}

```

这里的cudaError_t是一个枚举类型：

```c++
// 在 cuda_runtime.h 中定义
typedef enum cudaError_enum {
    cudaSuccess = 0,                      // 成功
    cudaErrorInvalidValue = 1,            // 无效的值
    cudaErrorMemoryAllocation = 2,        // 内存分配失败
    cudaErrorInvalidDevice = 10,          // 无效的设备
    cudaErrorInvalidKernelImage = 29,     // 内核映像无效
    cudaErrorNoDevice = 38,               // 没有支持CUDA的设备
    cudaErrorInvalidDeviceFunction = 98,  // 无效的设备函数
    // ... 还有几十种其他错误码
} cudaError_t;
```

下面这个函数主要作用是：接收 CUDA 错误码、文件名、行号，返回 CUDA 错误码

```
cudaError_t ErrorCheck(cudaError_t error_code, const char* filename, int lineNumber)
```

**参数**：`error_code` 为CUDA 函数返回的错误状态；`filename` 为调用处的文件名（通常用 `__FILE__`）；`lineNumber` 为调用处的行号（通常用 `__LINE__`）

比如如果我们增加错误函数如下：

```
ErrorCheck(cudaMemcpy(x_d, x, N*sizeof(float), cudaMemcpyDeviceToHost), __FILE__, __LINE__);
```

原来的是从cpu到gpu，现在改成gpu到cpu，于是报错：

```
code=1, name=cudaErrorInvalidValue, description=invalid argument
file=vecadd_gpu.cu, line34
```

## 七、核函数错误检查

由于核函数的返回值是void，故没有返回错误码。

通过下面这种方式检查：

```c++
    const unsigned int numThreadsPerBlock = 512;
    const unsigned int numBlocks = (N + 512 -1)/512;
    vecadd_Kernel<<< numBlocks, numThreadsPerBlock >>>(x_d, y_d, z_d, N);
    ErrorCheck(cudaGetLastError(), __FILE__, __LINE__);
    ErrorCheck(cudaDeviceSynchronize(), __FILE__, __LINE__);
```

增加对`cudaGetLastError`的检查，他的作用是获取最后一个 CUDA 错误；然后增加同步函数，并对其进行错误检查。比如：

```
xxxx:~/cuda_project/02add$ nvcc vecadd_gpu.cu timer.cu -o vecadd_gpu -gencode=arch=compute_90,code=sm_90
xxxx:~/cuda_project/02add$ ./vecadd_gpu
cpu time: 116.699 ms
CUDA error:
code=209, name=cudaErrorNoKernelImageForDevice, description=no kernel image is available for execution on the device
file=vecadd_gpu.cu, line41
gpu time: 137.170 ms
xxxx:~/cuda_project/02add$ nvcc vecadd_gpu.cu timer.cu -o vecadd_gpu -gencode=arch=compute_120,code=sm_120
xxxx:~/cuda_project/02add$ ./vecadd_gpu
cpu time: 119.797 ms
gpu time: 41.049 ms
```

**第一次尝试（失败）**

- 使用 `compute_90/sm_90` (Hopper架构，H100)
- 你的GPU**不支持**这个架构
- 报错 `code=209`

**第二次尝试（成功！）**

- 使用 `compute_120/sm_120`
- 程序**成功运行**，GPU时间 **41ms**
- 这说明GPU支持计算能力 **12.0** 或更高

因为使用的是50系显卡，但是cuda的版本并不是最新版本，导致默认编译时会选择较低真实架构版本，导致转化的cubin代码运行失败。

## 八、GPU硬件资源

### 1.核心计算单元：从SM到CUDA核心

GPU的并行计算能力构建在一个层次化的架构之上。

- **流式多处理器 (SM)**：GPU的基本计算单元。一个GPU由数十到上百个SM组成（如RTX 4090有128个SM，H100有132个以上）。SM是硬件资源的集大成者，它包含了计算核心、控制逻辑和高速缓存。
- **SM 内部组成**：
  - **CUDA核心**：执行通用浮点（FP32）和整数（INT32）运算的基本单元。每个SM通常包含64-128个CUDA核心， 又称为SP（streaming processor）。
  - **张量核心 (Tensor Core)**：专门用于加速矩阵乘加运算的硬件单元。它是AI计算的核心，对FP16、INT8等混合精度运算有10-20倍的加速效果。
  - **Warp调度器**：SM的基本执行单元是线程束（Warp），包含**32个并行线程**。Warp调度器负责以锁步（Lock-step）的方式为这32个线程分派和执行相同的指令。
  - **特殊功能单元 (SFU)**：用于执行超越函数（如sin、cos、平方根倒数）等复杂数学运算。

**软件视角的对应**：
CUDA编程模型中的**线程 (Thread)** 最终在**CUDA核心**上执行；
一个**线程块 (Block)** 会被调度到单个**SM**上，并在其包含的多个Warp中以SIMD（单指令多数据）执行。

**硬件视角对应：**

硬件将执行相同指令的**线程**分组到**线程束（Warp）**中，多个Warp构成**线程块**。

![image-20260603135801009](https://cdn.jsdelivr.net/gh/ub-w/Article-images@main/Typoraimage-20260603135801009.png)

综上，SM在执行相同指令时，可以调度多个线程块，以32个线程为单位的线程束（warp）作为执行单元，并发执行多个线程。（每个线程都有自己独立的指令地址计数器和寄存器状态）

当一个kernel启动后，thread会被分配到很多SM中执行。大量的thread可能会被分配到不同的SM，但是**同一个block中的thread必然在同一个SM中并行执行**

### 2.cuda内存模型

![image-20260603141252513](https://cdn.jsdelivr.net/gh/ub-w/Article-images@main/Typoraimage-20260603141252513.png)

![image-20260603141658583](https://cdn.jsdelivr.net/gh/ub-w/Article-images@main/Typoraimage-20260603141658583.png)

### 3.寄存器内存

- 寄存器内存在片上，具有GPU最快的访问速度，但是数量有限。

- 寄存器仅在线程内可见，生命周期与所属线程一致

- 核函数中定义的不加任何限定符的变量一般存放在寄存器中

- 内建变量存在于寄存中，如gridDim、blockDim、blockIdx等

- 核函数中定义的不加任何限定符的数组有可能存放于寄存器中，但也有可能存放在本地内存中，即局部内存。

- 寄存器都是32位的，即保存一个double类型的数据需要两个寄存器，寄存器保存在SM的寄存器文件中

- 下图可以看到每个SM的寄存器数量是64K

- 每一个线程块的使用的最大数量，根据架构不同而不同

- 每个线程的最大寄存器数量是255个，即可以存放255*4=1020个字节

  ![image-20260603142645191](https://cdn.jsdelivr.net/gh/ub-w/Article-images@main/Typoraimage-20260603142645191.png)

### 4.本地内存

![image-20260603144410160](https://cdn.jsdelivr.net/gh/ub-w/Article-images@main/Typoraimage-20260603144410160.png)

- 每个线程最多高达可使用512KB的本地内存
- 本地内存从硬件角度看知识全局内存的一部分，延迟页很高，本地内存过多使用，会减低程序性能
- 对于计算能力2.0以上的设备，本地内存的数据存储在每个SM的一级缓存和设备的二级缓存中。

通过下面这个命令：`--resource-usage` 是 NVCC 编译器的一个**信息输出选项**，用于**显示 GPU 内核函数对硬件资源的使用情况**。

输出结果：

```
nvcc --resource-usage vecadd_gpu.cu timer.cu -o registerNum -arch=compute_120 -code=sm_120
ptxas info    : 0 bytes gmem
ptxas info    : Compiling entry function '_Z13vecadd_KernelPfS_S_i' for 'sm_120'
ptxas info    : Function properties for _Z13vecadd_KernelPfS_S_i
    0 bytes stack frame, 0 bytes spill stores, 0 bytes spill loads
ptxas info    : Used 12 registers, used 0 barriers
ptxas info    : Compile time = 22.145 ms
ptxas info    : 0 bytes gmem
```

### 5.全局内存

- 即显存，在片外，特点是容量最大，延迟最大。
- 全局内存中数据所有线程可见，Host端可见，且具有与程序相同的生命周期。
- 动态全局内存，主机代码使用CUDA运行时API cudaMalloc动态声明内存空间，由cudaFFree释放全局内存。
- 静态全局内存，使用`__device__`关键字静态声明全局内存。

### 6.共享内存

- 共享内存在片上，与本地内存和全局内存相比具有更高的带宽和延迟
- 共享内存中的数据在线程块内所有线程可见，可用线程间通信，共享内存的生命周期也与所属线程块一致。
- 使用`__shared__`修饰的变量存放于共享内存中，共享内存可定义动态与静态两种。
- 每个SM的共享内存数量是一定的
- 访问共享内存必须加入同步机制，线程块内同步：void __syncthreads();
- 不同计算能力架构，每个SM中拥有的共享内存大小是不同的
- 每个线程块使用的最大数量不同架构是不同的

![image-20260603153401201](https://cdn.jsdelivr.net/gh/ub-w/Article-images@main/Typoraimage-20260603153401201.png)

- 静态共享内存声明：`__shared__ float tile[size,szie]`
- 静态共享内存作用域：核函数中声明，文件核函数外声明。
- 静态共享内存在编译时就要确定内存的大小。

### 7.常量内存

常量内存作用

- 常量内存是有常量缓存的全局内存，数量有限。大小仅为 64KB，由于有缓存，线程在读取相同的常量内存数据时，访问速度比全局内存快。
- 常量内存中的数据对同一编译单元内所有线程可见。
- 使用 `__constant__` 修饰的变量存放于常量内存中，不能定义在核函数中，且常量内存是静态定义的。
- 常量内存仅可读，不可写。
- 给核函数传递数值参数时，这个变量就存放于常量内存。

------

静态共享内存相关函数

**cudaMemcpyFromSymbol**

```
host cudaError_t cudaMemcpyFromSymbol(
    void *dst,           // Destination memory address
    const void *symbol,  // Device symbol address
    size_t count,        // Size in bytes to copy
    size_t offset,       // Offset from start of symbol in bytes
    cudaMemcpyKind kind  // Type of transfer
)
```

- 从设备上的给定符号地址复制数据到主机。
- 返回值：`cudaSuccess`、`cudaErrorInvalidValue`、`cudaErrorInvalidSymbol`、`cudaErrorInvalidMemcpyDirection`、`cudaErrorNoKernelImageForDevice`

**cudaMemcpyToSymbol**

```
host cudaError_t cudaMemcpyToSymbol(
    const void *symbol,  // Device symbol address
    const void *src,     // Source memory address
    size_t count,        // Size in bytes to copy
    size_t offset,       // Offset from start of symbol in bytes
    cudaMemcpyKind kind  // Type of transfer
)
```

- 将数据复制到设备上的给定符号地址。
- 返回值：`cudaSuccess`、`cudaErrorInvalidValue`、`cudaErrorInvalidSymbol`、`cudaErrorInvalidMemcpyDirection`、`cudaErrorNoKernelImageForDevice

------

补充说明

- 常量内存必须在主机端使用 `cudaMemcpyToSymbol` 进行初始化。
- 线程束（warp）中所有线程从相同内存地址中读取数据时，常量内存表现最好。例如数学公式中的系数，因为线程束中所有的线程都需要读取同一个地址空间的系数数据，因此只需要读取一次，广播给线程束中的所有线程。

### 8.GPU缓存

![image-20260603160513997](https://cdn.jsdelivr.net/gh/ub-w/Article-images@main/Typoraimage-20260603160513997.png)

**GPU缓存作用**

- **不可编程**：硬件自动管理
- **L1缓存**：每个SM独立拥有
- **L2缓存**：所有SM共享
- **缓存内容**：本地内存、全局内存、寄存器溢出部分
- **缓存规则**：✅ 加载可缓存 | ❌ 存储不可缓存
- **专用缓存**：每个SM有只读常量缓存 + 只读纹理缓存

------

**L1缓存查询与设置**

**查询是否支持L1缓存**

```
cudaDeviceProp::globalL1CacheSupported
```

**编译选项启用L1缓存**

| 选项               | 效果                           |
| :----------------- | :----------------------------- |
| `-Xptxas -dlcm=ca` | 除内联汇编禁用外，所有读取缓存 |
| `-Xptxas -fscm=ca` | 所有数据读取都缓存             |

> 默认：数据**不**缓存在L1/纹理缓存中

------

**L1缓存与共享内存（不同架构配置）**

**核心概念**：统一数据缓存 = 共享内存 + 纹理内存 + L1缓存

| 架构        | 计算能力 | 统一缓存大小 | 共享内存可配置（KB）            |
| :---------- | :------- | :----------- | :------------------------------ |
| 伏特 Volta  | 7.0      | 128 KB       | 0, 8, 16, 32, 64, 96            |
| 图灵 Turing | 7.5      | 96 KB        | 32, 64                          |
| 安培 Ampere | 8.0      | 192 KB       | 0, 8, 16, 32, 64, 100, 132, 164 |

## 九、计算资源分配

**线程执行资源分配**

- 线程束本地执行上下文主要资源：**程序计数器、寄存器、共享内存**
- 这些资源属于 **片上（on-chip）资源**，**上下文切换无时间损耗**
- 同一SM中同时存在的线程块/线程束数量，取决于**寄存器和共享内存的可用量**

------

**寄存器对线程数目的影响**

| 关系       | 说明                       |
| :--------- | :------------------------- |
| 寄存器越多 | 每SM可容纳的线程束越少     |
| 寄存器越少 | 每SM可同时处理的线程束越多 |

**以计算能力 8.9 为例**：每个SM寄存器数量 = **64KB**

------

**共享内存对线程块数量的影响**

| 关系         | 说明                       |
| :----------- | :------------------------- |
| 共享内存越多 | 每SM可同时处理的线程块越少 |
| 共享内存越少 | 可同时处理的线程块越多     |

**以计算能力 8.9 为例**：每个SM共享内存大小 = **100KB**

------

## **十、SM占有率**

**基本概念**

| 术语           | 定义                       |
| :------------- | :------------------------- |
| 活跃线程块     | 已分配计算资源的线程块     |
| 活跃线程束     | 活跃线程块包含的线程束     |
| 活跃线程束类型 | 选定的、阻塞的、符合条件的 |

**占用率公式**：

```
占用率 = 活跃线程束数量 / 最大线程束数量
```

**计算能力 8.9 硬件参数（RTX 4070）**

| 参数                 | 数值  |
| :------------------- | :---- |
| SM数量               | 48    |
| SM寄存器数量         | 64KB  |
| SM共享内存上限       | 100KB |
| 单线程块共享内存上限 | 99KB  |
| SM最多驻留线程块数   | 24    |
| SM最多驻留线程数     | 1536  |

**占有率分析（并行规模足够大时）**

| 条件                                  | 结果                          |
| :------------------------------------ | :---------------------------- |
| 寄存器和共享内存使用很少，线程块 ≥ 64 | 可获得 **100%** 占有率        |
| 每个线程最多使用寄存器数              | **42个**（达到1536线程时）    |
| 线程块大小=64，达到100%占有率         | 每线程块共享内存 ≤ **4.16KB** |

> ⚠️ **注意**：线程块共享内存超过 **99KB** 会导致核函数无法启动

------

**网格和线程块大小准则**

1. 线程块中线程数量是**线程束大小的倍数**
2. 线程块**不要太小**
3. 根据内核资源**调整线程块大小**
4. 线程块数量**远大于SM数量**，保证足够并行

## 十一、延迟隐藏

### 1.延迟隐藏的概念

| 术语     | 定义                                                 |
| :------- | :--------------------------------------------------- |
| 指令延迟 | 指令发出到完成之间的时钟周期数                       |
| 延迟隐藏 | GPU用其他线程束的计算来掩盖指令延迟                  |
| 理想状态 | 每个时钟周期，所有线程周期器都有一个符合条件的线程束 |

**指令分为两种基本类型**：

1. 算术指令
2. 内存指令

------

### 2.算术指令延迟隐藏

**基本参数**

- 算术运算指令延迟：通常为 **4个时钟周期**

**利特尔法则（估算所需线程束数量）**

```
所需线程束数量 = 延迟 × 吞吐量
```

**计算示例**

| 指令延迟（周期） | 吞吐量（操作/周期） | 指令操作数 | 所需线程束 |
| :--------------- | :------------------ | :--------- | :--------- |
| 4                | 128                 | 512        | 16         |
| 4                | 128                 | 512        | 16         |
| 4                | 2                   | 8          | 1          |

- 16-bit：512 ÷ 32 = 16
- 32-bit：512 ÷ 32 = 16
- 8个操作：8 ÷ 32 = 1（8个操作也需要1个线程束）

**提升算术指令并行性的方法**

1. 线程中增加**更多独立指令**
2. 使用**更多并发线程**

------

### 3.内存指令延迟隐藏

**基本参数**

- 内存访问指令延迟：通常为 **400~800个时钟周期**
- 对内存操作，所需并行表示为：**每时钟周期隐藏内存延迟所需的字节数**

**计算示例（以800周期为例）**

| 参数               | 数值        |
| :----------------- | :---------- |
| 指令延迟           | 800 周期    |
| 带宽               | 504.2 GB/s  |
| GPU内存频率        | 10.0145 GHz |
| 每周期字节数       | 50 B/cycle  |
| 隐藏延迟所需数据量 | **39 KB**   |

**计算过程**：

```
504.2 GB/s ÷ 10.0145 GHz ≈ 50 B/cycle
800 × 50 ÷ 1024 = 39 KB
```

**所需线程/线程束估算**

假设每个线程移动一个浮点数（4字节）从全局内存到SM：

| 项目         | 数量                          |
| :----------- | :---------------------------- |
| 所需线程数   | 39KB ÷ 4 ≈ **10000 个线程**   |
| 所需线程束数 | 10000 ÷ 32 ≈ **313 个线程束** |

------

**关键对比速记**

| 指令类型 | 延迟（周期） | 隐藏方法                          |
| :------- | :----------- | :-------------------------------- |
| 算术指令 | ~4           | 独立指令 + 并发线程               |
| 内存指令 | 400~800      | 足够的线程/线程束（≈313个线程束） |
