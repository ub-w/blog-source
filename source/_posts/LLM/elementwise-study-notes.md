---
title: elementwisse-study-notes
date: 2026-7-6
categories: 大模型
tags: 基础
---
---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: 3445fcf48a03cd4474350b43a154dfcb_702bd9ea790b11f1a8895254002afed2
    ReservedCode1: VIg+kUlmyEbxeFcgCTyH1K/o7ZplZIae2vuaGB3ahqdn7B/Ap2bFLNuEmYnlyyJuNXu1HrLeJHdP052ZpY57tyPup2MSG4OEZaC3VdLs+P36qu8ZbPtw9O8qzd7L0+6rcmIjnr8FFej1RLrhY4OtvJ+ku8xC4tW3VYt5285bElTp6fFI4FWTWrkSULY=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: 3445fcf48a03cd4474350b43a154dfcb_702bd9ea790b11f1a8895254002afed2
    ReservedCode2: VIg+kUlmyEbxeFcgCTyH1K/o7ZplZIae2vuaGB3ahqdn7B/Ap2bFLNuEmYnlyyJuNXu1HrLeJHdP052ZpY57tyPup2MSG4OEZaC3VdLs+P36qu8ZbPtw9O8qzd7L0+6rcmIjnr8FFej1RLrhY4OtvJ+ku8xC4tW3VYt5285bElTp6fFI4FWTWrkSULY=
---

# LeetCUDA D1：Elementwise Kernels 学习笔记

> 日期：2026-07-06
> 项目路径：`/home/ww/LeetCUDA/kernels/elementwise/`
> 文件：README.md / elementwise.cu / elementwise.py

## 六个 Kernel 总览

6 个 kernel 构成一条完整的优化递进链：

```
f32 ──→ f32x4 ──→ f16 ──→ f16x2 ──→ f16x8 ──→ f16x8_pack
 │        │        │        │          │            │
 基准    向量化    降精度   half2      循环展开    128bit pack
```

| 序号 | Kernel | 每线程处理 | 一次内存事务 | 核心概念 |
|:---:|---|---|---|---|
| 1 | `elementwise_add_f32_kernel` | 1 个 float | 4 字节 | grid/block/thread 一维索引 |
| 2 | `elementwise_add_f32x4_kernel` | 4 个 float | 16 字节 (float4) | float4 向量化读写，128bit 事务 |
| 3 | `elementwise_add_f16_kernel` | 1 个 half | 2 字节 | half 类型，`__hadd` intrinsic |
| 4 | `elementwise_add_f16x2_kernel` | 2 个 half | 4 字节 (half2) | half2 向量化，32bit 事务 |
| 5 | `elementwise_add_f16x8_kernel` | 8 个 half | 多次 4 字节 | 手动循环展开，ILP |
| 6 | `elementwise_add_f16x8_pack_kernel` | 8 个 half | 128bit 一次 | pack + `__hadd2`，终极优化 |

---

## Kernel 1：elementwise_add_f32_kernel

```cuda
__global__ void elementwise_add_f32_kernel(float *a, float *b, float *c, int N) {
  int idx = blockIdx.x * blockDim.x + threadIdx.x;
  if (idx < N)
    c[idx] = a[idx] + b[idx];
}
```

### 线程索引公式

`idx = blockIdx.x × blockDim.x + threadIdx.x`

| 变量 | 含义 |
|---|---|
| `blockIdx.x` | 当前是第几个 block |
| `blockDim.x` | 每个 block 有多少线程 |
| `threadIdx.x` | 当前 block 内的线程编号 |
| `idx` | 全局线程位置 |

### 启动配置

```cuda
dim3 block(256);
dim3 grid((N + 255) / 256);  // ceil(N/256)
```

`(N + 255) / 256` 是向上取整技巧。边界检查 `if (idx < N)` 防止越界。

### 关键事实

- 一维 grid + 一维 block 是最简单的 CUDA launch 模式
- 线程总数 = grid × block，通常会略大于 N，边界检查是标准操作
- block 大小 256 是经验值：平衡 warp 调度、SM 容量和延迟隐藏

---

## Kernel 2：elementwise_add_f32x4_kernel

```cuda
__global__ void elementwise_add_f32x4_kernel(float *a, float *b, float *c, int N) {
  int idx = 4 * (blockIdx.x * blockDim.x + threadIdx.x);
  if ((idx + 3) < N) {
    float4 reg_a = FLOAT4(a[idx]);
    float4 reg_b = FLOAT4(b[idx]);
    float4 reg_c;
    reg_c.x = reg_a.x + reg_b.x;
    reg_c.y = reg_a.y + reg_b.y;
    reg_c.z = reg_a.z + reg_b.z;
    reg_c.w = reg_a.w + reg_b.w;
    FLOAT4(c[idx]) = reg_c;
  } else if (idx < N) {
    for (int i = 0; (idx + i) < N; i++)
      c[idx + i] = a[idx + i] + b[idx + i];
  }
}
```

### 和 f32 的差异

| | f32 | f32x4 |
|---|---|---|
| 每线程处理 | 1 个 float | 4 个 float |
| 全局索引 | `idx = blockIdx×blockDim + threadIdx` | `idx = 4×(blockIdx×blockDim + threadIdx)` |
| block 线程数 | 256 | 64（256/4） |
| 一次内存事务 | 4 字节 | 16 字节（float4 = 128bit） |

### FLOAT4 宏

```cuda
#define FLOAT4(value) (reinterpret_cast<float4 *>(&(value))[0])
```

把 float 数组的地址重新解释为 `float4*`，一次读写 128bit（4 个 float）。**不创建新对象**，只是换了视角看同一块内存。

### 数据流（线程 0 为例）

```
读 a:  a[0][1][2][3] ──FLOAT4──→ reg_a = {x:a0, y:a1, z:a2, w:a3}
读 b:  b[0][1][2][3] ──FLOAT4──→ reg_b = {x:b0, y:b1, z:b2, w:b3}
算:    reg_c.x = a0+b0, .y = a1+b1, .z = a2+b2, .w = a3+b3
写 c:  reg_c ──FLOAT4──→ c[0][1][2][3]
```

3 次 128bit 事务 vs f32 的 8 次 32bit 事务。**向量化提速的本质：减少内存事务次数，而非让计算变快。**

### 边界处理

- 快速路径 `(idx+3) < N`：float4 批量处理
- 慢速路径 `idx < N`：逐元素 fallback，处理尾部 1-3 个元素

---

## Kernel 3：elementwise_add_f16_kernel

```cuda
__global__ void elementwise_add_f16_kernel(half *a, half *b, half *c, int N) {
  int idx = blockIdx.x * blockDim.x + threadIdx.x;
  if (idx < N)
    c[idx] = __hadd(a[idx], b[idx]);
}
```

### 和 f32 的差异

| | f32 | f16 |
|---|---|---|
| 指针类型 | `float *` | `half *` |
| 加法指令 | `a + b` | `__hadd(a, b)` |
| 每元素大小 | 4 字节 | 2 字节 |
| 每元素带宽 | 12 字节（8读+4写） | 6 字节（4读+2写） |

### FP16 格式

| | FP32 | FP16 |
|---|---|---|
| 总位数 | 32 | 16 |
| 符号位 | 1 | 1 |
| 指数位 | 8 | 5 |
| 尾数位 | 23 | 10 |
| 表示范围 | ~1.2×10⁻³⁸ ~ 3.4×10³⁸ | ~6.1×10⁻⁵ ~ 65504 |

### 硬件层面

GPU SM 内有两套独立的计算电路：FP32 单元处理 float 加法，FP16 单元处理 half 加法。`__hadd` 显式指定使用 FP16 电路。`__hadd2` 则是两个 FP16 单元并行工作。

---

## Kernel 4：elementwise_add_f16x2_kernel

```cuda
__global__ void elementwise_add_f16x2_kernel(half *a, half *b, half *c, int N) {
  int idx = 2 * (blockIdx.x * blockDim.x + threadIdx.x);
  if ((idx + 1) < N) {
    half2 reg_a = HALF2(a[idx]);
    half2 reg_b = HALF2(b[idx]);
    half2 reg_c;
    reg_c.x = __hadd(reg_a.x, reg_b.x);
    reg_c.y = __hadd(reg_a.y, reg_b.y);
    HALF2(c[idx]) = reg_c;
  } else if (idx < N) {
    c[idx] = __hadd(a[idx], b[idx]);
  }
}
```

### 定位

f16x2 = f16 精度 + f32x4 的向量化思路。`half2` 一次读写 2 个 half（4 字节 = 32bit）。

| | f16 | f16x2 |
|---|---|---|
| 每线程处理 | 1 个 half | 2 个 half |
| 索引倍数 | 1× | 2× |
| block 线程数 | 256 | 128 |
| 一次内存事务 | 2 字节 | 4 字节 |

### block 线程数推导

所有 kernel 保持每个 block 处理 **256 个元素**，线程数跟着向量化粒度缩放：

```
f16:   1 线程 = 1 元素 → 256 线程
f16x2: 1 线程 = 2 元素 → 128 线程
f32x4: 1 线程 = 4 元素 →  64 线程
```

grid 公式统一为 `ceil(N/256)`。

---

## Kernel 5：elementwise_add_f16x8_kernel

```cuda
__global__ void elementwise_add_f16x8_kernel(half *a, half *b, half *c, int N) {
  int idx = 8 * (blockIdx.x * blockDim.x + threadIdx.x);
  if ((idx + 7) < N) {
    half2 reg_a_0 = HALF2(a[idx + 0]);
    half2 reg_a_1 = HALF2(a[idx + 2]);
    half2 reg_a_2 = HALF2(a[idx + 4]);
    half2 reg_a_3 = HALF2(a[idx + 6]);
    // ... 同样方式加载 b，用 __hadd 逐分量计算 ...
    HALF2(c[idx + 0]) = reg_c_0;
    HALF2(c[idx + 2]) = reg_c_1;
    HALF2(c[idx + 4]) = reg_c_2;
    HALF2(c[idx + 6]) = reg_c_3;
  } else if (idx < N) { /* fallback */ }
}
```

### 思路

把 f16x2 的逻辑**手写展开 4 遍**：每线程用 4 个 `half2` 处理 8 个 half。block = 32 线程 = 1 个 warp。

### 为什么手写展开

偏移量 `+0, +2, +4, +6` 是编译期常量，编译器可以：

- **指令重排**：四条独立的 load 交错发射，隐藏延迟
- **寄存器分配优化**：确切知道需要多少个寄存器
- **消除循环开销**：没有 i++ 比较和跳转

这就是 ILP（指令级并行）。

---

## Kernel 6：elementwise_add_f16x8_pack_kernel

```cuda
__global__ void elementwise_add_f16x8_pack_kernel(half *a, half *b, half *c, int N) {
  int idx = 8 * (blockIdx.x * blockDim.x + threadIdx.x);
  if ((idx + 7) < N) {
    half pack_a[8], pack_b[8], pack_c[8];        // 8×16bit = 128bit，存在寄存器
    LDST128BITS(pack_a[0]) = LDST128BITS(a[idx]); // 一次 128bit 读
    LDST128BITS(pack_b[0]) = LDST128BITS(b[idx]);
    #pragma unroll
    for (int i = 0; i < 8; i += 2)
      HALF2(pack_c[i]) = __hadd2(HALF2(pack_a[i]), HALF2(pack_b[i]));
    LDST128BITS(c[idx]) = LDST128BITS(pack_c[0]); // 一次 128bit 写
  } else if (idx < N) { /* fallback */ }
}
```

### 和 f16x8 的核心差异

| | f16x8 | f16x8_pack |
|---|---|---|
| 读 a | 4 次 half2 load (各 4B) | 1 次 128bit load |
| 读 b | 4 次 half2 load | 1 次 128bit load |
| 计算 | 8 次 `__hadd` | 4 次 `__hadd2` |
| 写 c | 4 次 half2 store | 1 次 128bit store |

### `__hadd2` 指令

```cuda
__hadd2(half2 p, half2 q) → half2 {p.x+q.x, p.y+q.y}
```

真正的 SIMD——一条指令，两组 FP16 加法并行执行。两个 FP16 硬件单元同时工作。

### `LDST128BITS` 宏

```cuda
#define LDST128BITS(value) (reinterpret_cast<float4 *>(&(value))[0])
```

和 `FLOAT4` 实现完全相同，只是语义不同：`FLOAT4` 暗示 float 语义，`LDST128BITS` 强调通用 128bit 传输。

### 数据路径

```
显存 ──128bit──→ L2 Cache ──→ 寄存器(pack_a)
                               ↓ __hadd2 ×4
显存 ←──128bit── L2 Cache ←── 寄存器(pack_c)
```

从加载到计算到存储，全程 128bit 宽度，没有 32bit 碎片。

---

## 三条优化策略总结

| 策略 | 起作用的 kernel | 效果 |
|---|---|---|
| 向量化读写 | f32x4, f16x2, f16x8 | 减少内存事务次数 |
| 精度降级 | f16 系列全部 | 减半带宽需求 |
| 128bit pack | f32x4, f16x8_pack | 事务宽度最大化 |
| SIMD 计算 | f16x8_pack (`__hadd2`) | 计算也并行化 |

三条策略独立叠加。f16x8_pack 是最终形态：读写 128bit + 计算 SIMD。

---

## PyTorch Binding 拆解

### 四层架构

```
PYBIND11_MODULE              ← 最外层：注册到 Python
  ↕
TORCH_BINDING_COMMON_EXTENSION  ← 中间层：暴露 C++ 函数名
  ↕
TORCH_BINDING_ELEM_ADD       ← 核心层：生成 C++ wrapper
  ↕
elementwise_add_xxx_kernel   ← 底层：CUDA kernel
```

### 辅助宏

```cuda
#define STRINGFY(str) #str                                    // 宏参数转字符串
#define CHECK_TORCH_TENSOR_DTYPE(T, th_type) { /* 类型检查 */ }
#define TORCH_BINDING_COMMON_EXTENSION(func)                  // pybind11 注册
    m.def(STRINGFY(func), &func, STRINGFY(func));
```

### 核心宏：TORCH_BINDING_ELEM_ADD

接受 4 个参数：`(packed_type, th_type, element_type, n_elements)`

以 `TORCH_BINDING_ELEM_ADD(f16x2, torch::kHalf, half, 2)` 为例，展开后：

1. **类型检查**：确保 a、b、c 三个张量都是 `torch.kHalf`
2. **grid/block 自适应**：
   - N 维张量 → 1D flat：`block(256/n_elements)`, `grid(ceil(N/256))`
   - 2D 张量 (S,K) → 尝试按 K 维优化：`block(K/n_elements)`, `grid(S)`
   - 2D 但 K 太大 → 退化为 1D flat
3. **Kernel launch**：`elementwise_add_f16x2_kernel<<<grid, block>>>(ptr_a, ptr_b, ptr_c, N)`

### 批量实例化

```cuda
TORCH_BINDING_ELEM_ADD(f32,       torch::kFloat32, float, 1)
TORCH_BINDING_ELEM_ADD(f32x4,     torch::kFloat32, float, 4)
TORCH_BINDING_ELEM_ADD(f16,       torch::kHalf,    half,  1)
TORCH_BINDING_ELEM_ADD(f16x2,     torch::kHalf,    half,  2)
TORCH_BINDING_ELEM_ADD(f16x8,     torch::kHalf,    half,  8)
TORCH_BINDING_ELEM_ADD(f16x8_pack, torch::kHalf,   half,  8)
```

6 行宏调用，生成 6 个 C++ wrapper 函数。

### 注册到 Python

```cuda
PYBIND11_MODULE(TORCH_EXTENSION_NAME, m) {
  TORCH_BINDING_COMMON_EXTENSION(elementwise_add_f32)
  TORCH_BINDING_COMMON_EXTENSION(elementwise_add_f32x4)
  TORCH_BINDING_COMMON_EXTENSION(elementwise_add_f16)
  TORCH_BINDING_COMMON_EXTENSION(elementwise_add_f16x2)
  TORCH_BINDING_COMMON_EXTENSION(elementwise_add_f16x8)
  TORCH_BINDING_COMMON_EXTENSION(elementwise_add_f16x8_pack)
}
```

`TORCH_EXTENSION_NAME` 由 `torch.utils.cpp_extension.load` 自动传入。

### 完整调用链

```
Python:  lib.elementwise_add_f16x2(a, b, c)
           ↓ pybind11
C++:     elementwise_add_f16x2(Tensor a, Tensor b, Tensor c)
           ↓ 类型检查 → grid/block 计算 → reinterpret_cast
CUDA:    elementwise_add_f16x2_kernel<<<grid, block>>>(half* a, half* b, half* c, N)
           ↓ GPU 执行
         c[idx] = __hadd(a[idx], b[idx]) × N 次
```

---

## 编译运行

```bash
cd /home/ww/LeetCUDA/kernels/elementwise
conda activate LLM
export TORCH_CUDA_ARCH_LIST=Ada
python3 elementwise.py
```

测试脚本遍历 S∈{1024,2048,4096} × K∈{1024,2048,4096} 共 9 组规模，每组对比 6 个自定义 kernel 与 PyTorch 原生实现的性能。

---

## 关键概念速查

| 概念 | 说明 |
|---|---|
| `grid(N/256), block(256)` | 一维 CUDA launch 标准模式 |
| `idx = bx*bd + tx` | 一维全局线程索引公式 |
| `float4` | CUDA 内建 128bit 向量类型，含 {x,y,z,w} |
| `half2` | FP16 的 2 元素打包类型 |
| `__hadd` | 单 half 加法 intrinsic |
| `__hadd2` | 双 half 并行加法 intrinsic（SIMD） |
| `reinterpret_cast` | 类型重解释，不创建新对象 |
| `#pragma unroll` | 强制编译器展开循环，暴露 ILP |
| `ceil(N/256)` | `(N+255)/256`，整数向上取整技巧 |
| `memory-bound` | elementwise 操作的瓶颈在带宽，不在计算 |
| warp = 32 线程 | GPU 最小调度单元 |
| `__global__` | CUDA kernel 函数声明，CPU 调用、GPU 执行 |
*（内容由AI生成，仅供参考）*
