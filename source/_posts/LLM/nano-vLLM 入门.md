---
title: nano-vLLM 入门
date: 2026-5-30
categories: 大模型
tags: 基础
---
# nano-vLLM 入门

## 一、tokenizer

将prompt通过**分词器**转化为token id:

```python
token_ids = tokenizer.encode("Hi, I'm kaiyuan")
positions = list(range(len(token_ids)))
print(token_ids)
print(positions)
```

```
[13048, 11, 358, 2776, 595, 2143, 88, 10386]
[0, 1, 2, 3, 4, 5, 6, 7]
```

Positions用来记住每一个token id的位置。

## 二、slot

 **Slot** 来存放一个 Token所占用的 Key 和 Value 向量。

一个 Slot 的大小 = `2 * num_layers * head_dim * num_heads * bytes_per_element`。

## 三、Block

### 1.Block ID 是什么？

Block ID 是每个内存块（Block）的唯一编号。

物理显存slot计算函数：

```python
def get_slots(block_ids, block_size, seq_len):
  slots = []
  for block_id in block_ids[:-1]:
    start = block_id * block_size
    end = start + block_size
    slots.extend(list(range(start, end)))
  # 最后一个block
  start = block_ids[-1] * block_size
  end = start + (seq_len - (len(block_ids)-1) * block_size)
  slots.extend(list(range(start, end)))
  return slots
```

```python
get_slots([12, 13], block_size=4, seq_len=6)
```

```
这个请求用了 block 12 和 block 13
每个 block 能放 4 个 token
但整个请求只有 6 个 token
[48, 49, 50, 51, 52, 53]
即：
前 4 个 token 放 block 12
后 2 个 token 放 block 13 的前两个 slot
```

### 2.Block Table 是什么？

Block Table 是一张映射表，记录了一个序列（Sequence）的所有 Token 分别存放在哪些 Block 里（按顺序）。

```python
examples = [
    ([12, 13], 4, 6),
    ([20, 25], 4, 7),
    ([0], 4, 3),
    ([0, 1, 2], 4, 10),
]

for block_ids, block_size, seq_len in examples:
    slots = get_slots(block_ids, block_size, seq_len)

    print("block_ids:", block_ids)
    print("block_size:", block_size)
    print("seq_len:", seq_len)
    print("slots:", slots)
    print("-" * 50)
```

```
block_ids: [12, 13]
block_size: 4
seq_len: 6
slots: [48, 49, 50, 51, 52, 53]
--------------------------------------------------
block_ids: [20, 25]
block_size: 4
seq_len: 7
slots: [80, 81, 82, 83, 100, 101, 102]
--------------------------------------------------
block_ids: [0]
block_size: 4
seq_len: 3
slots: [0, 1, 2]
--------------------------------------------------
block_ids: [0, 1, 2]
block_size: 4
seq_len: 10
slots: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
--------------------------------------------------
```

**一个请求的 KV Cache 逻辑上是连续的 token，但物理上不一定连续存储。**

逻辑 token 位置
  ↓
token_pos // block_size 得到**逻辑 block id**
  ↓
block_table[逻辑 block id] 得到**物理 block id**
  ↓
物理 block id * block_size + token_pos % block_size 得到物理 slot

## 四、Sequence 类

一个 `Sequence` 可以理解成：**一个正在被模型处理的用户请求。**

```python
from dataclasses import dataclass
from copy import copy
from enum import Enum, auto
from itertools import count

@dataclass
class Config:
    model: str = "dummy"
    max_num_batched_tokens: int = 16384
    max_num_seqs: int = 512
    max_model_len: int = 4096
    gpu_memory_utilization: float = 0.9
    tensor_parallel_size: int = 1
    enforce_eager: bool = False
    eos: int = -1
    kvcache_block_size: int = 256
    num_kvcache_blocks: int = -1

    def __post_init__(self):
        assert self.kvcache_block_size % 256 == 0
        assert 1 <= self.tensor_parallel_size <= 8
        assert self.max_num_batched_tokens >= self.max_model_len

@dataclass
class SamplingParams:
    temperature: float = 1.0
    max_tokens: int = 64
    ignore_eos: bool = False

class SequenceStatus(Enum):
    WAITING = auto()
    RUNNING = auto()
    FINISHED = auto()


class Sequence:
    block_size = 4 # 方便演示，从默认256修改4
    counter = count()

    def __init__(self, token_ids: list[int], sampling_params = SamplingParams()):
        self.seq_id = next(Sequence.counter)
        self.status = SequenceStatus.WAITING
        self.token_ids = copy(token_ids)
        self.last_token = token_ids[-1]
        self.num_tokens = len(self.token_ids)
        self.num_prompt_tokens = len(token_ids)
        self.num_cached_tokens = 0
        self.block_table = []
        self.temperature = sampling_params.temperature
        self.max_tokens = sampling_params.max_tokens
        self.ignore_eos = sampling_params.ignore_eos

    def __len__(self):
        return self.num_tokens

    def __getitem__(self, key):
        return self.token_ids[key]

    @property
    def is_finished(self):
        return self.status == SequenceStatus.FINISHED

    @property
    def num_completion_tokens(self):
        return self.num_tokens - self.num_prompt_tokens

    @property
    def prompt_token_ids(self):
        return self.token_ids[:self.num_prompt_tokens]

    @property
    def completion_token_ids(self):
        return self.token_ids[self.num_prompt_tokens:]

    @property
    def num_cached_blocks(self):
        return self.num_cached_tokens // self.block_size

    @property
    def num_blocks(self):
        return (self.num_tokens + self.block_size - 1) // self.block_size

    @property
    def last_block_num_tokens(self):
        return self.num_tokens - (self.num_blocks - 1) * self.block_size

    def block(self, i):
        assert 0 <= i < self.num_blocks
        return self.token_ids[i*self.block_size: (i+1)*self.block_size]

    def append_token(self, token_id: int):
        self.token_ids.append(token_id)
        self.last_token = token_id
        self.num_tokens += 1

    def __getstate__(self):
        return (self.num_tokens, self.num_prompt_tokens, self.num_cached_tokens, self.block_table,
                self.token_ids if self.num_completion_tokens == 0 else self.last_token)

    def __setstate__(self, state):
        self.num_tokens, self.num_prompt_tokens, self.num_cached_tokens, self.block_table = state[:-1]
        if self.num_completion_tokens == 0:
            self.token_ids = state[-1]
        else:
            self.last_token = state[-1]

```

Sequence 表示 nano-vLLM 中的一个用户请求。它不是模型本身，而是用于保存请求状态。

一个 Sequence 中包含：

- seq_id：请求编号
- status：请求状态，例如 WAITING、RUNNING、FINISHED
- **token_ids**：当前请求的所有 token
- last_token：当前最后一个 token
- **num_tokens**：当前 token 总数
- num_prompt_tokens：prompt 的 token 数量
- num_completion_tokens：已经生成的 token 数量
- num_cached_tokens：prefix cache 命中的 token 数
- **block_table**：逻辑 block 到物理 KV Cache block 的映射
- temperature / max_tokens / ignore_eos：采样参数

**Sequence.block_size** 表示每个 KV Cache block 能存放多少个 token。本 notebook 中为了演示方便设置为 4。

**num_blocks** 表示当前请求需要多少个 KV Cache block，计算方式是：

num_blocks = ceil(num_tokens / block_size)

**block(i)** 用于查看第 i 个逻辑 block 中包含哪些 token。

**append_token(token_id)** 用于模拟 decode 阶段生成一个新 token 后，将该 token 追加到请求序列中。