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

Sequence 表示 nano-vLLM 中的一个用户请求。它不是模型本身，而是用于**保存请求状态。**

一个 Sequence 中包含：

- seq_id：请求编号
- status：请求状态，例如 WAITING、RUNNING、FINISHED
- token_ids：当前请求的所有 token
- last_token：当前最后一个 token
- num_tokens：当前 token 总数
- num_prompt_tokens：prompt 的 token 数量
- num_completion_tokens：已经生成的 token 数量
- num_cached_tokens：prefix cache 命中的 token 数
- block_table：逻辑 block 到物理 KV Cache block 的映射
- temperature / max_tokens / ignore_eos：采样参数

**Sequence.block_size** 表示每个 KV Cache block 能存放多少个 token。本 notebook 中为了演示方便设置为 4。

**num_blocks** 表示当前请求**需要多少个 KV Cache block**，计算方式是：num_blocks = ceil(num_tokens / block_size)，这里就是逻辑block

**block(i)** 用于查看第 i 个逻辑 block 中包含哪些 token。

**append_token(token_id)** 用于模拟 decode 阶段生成一个新 token 后，将该 token 追加到请求序列中。

## 五、BlockManager

```python
import xxhash
from collections import deque
import numpy as np

class Block:

    def __init__(self, block_id):
        self.block_id = block_id
        self.ref_count = 0
        self.hash = -1
        self.token_ids = []

    def update(self, hash: int, token_ids: list[int]):
        self.hash = hash
        self.token_ids = token_ids

    def reset(self):
        self.ref_count = 1
        self.hash = -1
        self.token_ids = []


class BlockManager:

    def __init__(self, num_blocks: int, block_size: int):
        self.block_size = block_size
        self.blocks: list[Block] = [Block(i) for i in range(num_blocks)]
        self.hash_to_block_id: dict[int, int] = dict()
        self.free_block_ids: deque[int] = deque(range(num_blocks))
        self.used_block_ids: set[int] = set()

    @classmethod
    def compute_hash(cls, token_ids: list[int], prefix: int = -1):
        h = xxhash.xxh64()
        if prefix != -1:
            h.update(prefix.to_bytes(8, "little"))
        h.update(np.array(token_ids).tobytes())
        return h.intdigest()

    def _allocate_block(self, block_id: int) -> Block:
        block = self.blocks[block_id]
        assert block.ref_count == 0
        block.reset()
        self.free_block_ids.remove(block_id)
        self.used_block_ids.add(block_id)
        return self.blocks[block_id]

    def _deallocate_block(self, block_id: int) -> Block:
        assert self.blocks[block_id].ref_count == 0
        self.used_block_ids.remove(block_id)
        self.free_block_ids.append(block_id)

    def can_allocate(self, seq: Sequence) -> bool:
        return len(self.free_block_ids) >= seq.num_blocks

    def allocate(self, seq: Sequence):
        assert not seq.block_table
        h = -1
        cache_miss = False
        for i in range(seq.num_blocks):
            token_ids = seq.block(i)
            h = self.compute_hash(token_ids, h) if len(token_ids) == self.block_size else -1
            block_id = self.hash_to_block_id.get(h, -1)
            if block_id == -1 or self.blocks[block_id].token_ids != token_ids:
                cache_miss = True
            if cache_miss:
                block_id = self.free_block_ids[0]
                block = self._allocate_block(block_id)
            else:
                seq.num_cached_tokens += self.block_size
                if block_id in self.used_block_ids:
                    block = self.blocks[block_id]
                    block.ref_count += 1
                else:
                    block = self._allocate_block(block_id)
            if h != -1:
                block.update(h, token_ids)
                self.hash_to_block_id[h] = block_id
            seq.block_table.append(block_id)

    def deallocate(self, seq: Sequence):
        for block_id in reversed(seq.block_table):
            block = self.blocks[block_id]
            block.ref_count -= 1
            if block.ref_count == 0:
                self._deallocate_block(block_id)
        seq.num_cached_tokens = 0
        seq.block_table.clear()

    def can_append(self, seq: Sequence) -> bool:
        return len(self.free_block_ids) >= (len(seq) % self.block_size == 1)

    def may_append(self, seq: Sequence):
        block_table = seq.block_table
        last_block = self.blocks[block_table[-1]]
        if len(seq) % self.block_size == 1:
            assert last_block.hash != -1
            block_id = self.free_block_ids[0]
            self._allocate_block(block_id)
            block_table.append(block_id)
        elif len(seq) % self.block_size == 0:
            assert last_block.hash == -1
            token_ids = seq.block(seq.num_blocks-1)
            prefix = self.blocks[block_table[-2]].hash if len(block_table) > 1 else -1
            h = self.compute_hash(token_ids, prefix)
            last_block.update(h, token_ids)
            self.hash_to_block_id[h] = last_block.block_id
        else:
            assert last_block.hash == -1
```

```python
# 定义一个block_manager状态打印函数
def print_block_manager_info(block_manager):
    print(f"block_manager.blocks size: {len(block_manager.blocks)}")
    print(f"blocks list: {[block.block_id for block in block_manager.blocks]}")
    print(f"free_block_ids: {block_manager.free_block_ids}")
    print(f"used_block_ids: {block_manager.used_block_ids}")
```

### 1.管理过程

执行下面的代码：

```python
num_kvcache_blocks = 10
kvcache_block_size = 4
block_manager = BlockManager(num_kvcache_blocks, kvcache_block_size)
print_block_manager_info(block_manager)
```

结果：

```
block_manager.blocks size: 10
blocks list: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
free_block_ids: deque([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
used_block_ids: set()
```

**增加一个用户请求：**

```python
sampling_params = SamplingParams(temperature=0.6, max_tokens=256)
token_ids = tokenizer.encode("hi, I'm kaiyuan")
seq_0 = Sequence(token_ids, sampling_params)

block_manager.allocate(seq_0)

print("seq_0 token_ids:", seq_0.token_ids)
print("seq_0 num_tokens:", seq_0.num_tokens)
print("seq_0 num_blocks:", seq_0.num_blocks)
print("seq_0 block_table:", seq_0.block_table)
print_block_manager_info(block_manager)
```

```
seq_0 token_ids: [6023, 11, 358, 2776, 595, 2143, 88, 10386]
seq_0 num_tokens: 8
seq_0 num_blocks: 2
seq_0 block_table: [0, 1]
block_manager.blocks size: 10
blocks list: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
free_block_ids: deque([2, 3, 4, 5, 6, 7, 8, 9])
used_block_ids: {0, 1}
```

该请求的token id被打印出来，数目，以及需要的block数目。这是都是固有的。观察到block table改变了，free block ids，used block ids也已经改变。

block table的结果体现的是逻辑block到物理block的映射。

`block_table` 这个列表的“索引”表示逻辑 block 编号，里面存的“值”表示物理 block id。

即：逻辑block0对应物理block0，逻辑block1对应物理block1。

**增加第二用户请求：**

```python
sampling_params = SamplingParams(temperature=0.6, max_tokens=256)
token_ids = tokenizer.encode("can you speak English?")
seq_1 = Sequence(token_ids, sampling_params)

block_manager.allocate(seq_1)

print("seq_1 token_ids:", seq_1.token_ids)
print("seq_1 num_tokens:", seq_1.num_tokens)
print("seq_1 num_blocks:", seq_1.num_blocks)
print("seq_1 block_table:", seq_1.block_table)
print_block_manager_info(block_manager)
```

```
seq_1 token_ids: [4814, 498, 6468, 6364, 30]
seq_1 num_tokens: 5
seq_1 num_blocks: 2
seq_1 block_table: [2, 3]
block_manager.blocks size: 10
blocks list: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
free_block_ids: deque([4, 5, 6, 7, 8, 9])
used_block_ids: {0, 1, 2, 3}
```

可以看到，block table改变了，即逻辑block0对应物理block2，逻辑block1对应物理block3。

### 2.分配过程

重点看allocate函数：

```
for 每个逻辑 block:
    如果这个 block 是完整 block:
        计算它和前缀相关的 hash
        查有没有可复用的物理 block
    否则:
        不查 cache

    如果没命中 cache:
        从 free_block_ids 拿一个新物理 block
    否则:
        复用已有物理 block
        num_cached_tokens 增加
        ref_count 增加

    如果是完整 block:
        记录 hash -> block_id

    seq.block_table.append(block_id)
```

### 3.释放 block

```python
block_manager.deallocate(seq_0)

print("after deallocate seq_0")
print("seq_0 block_table:", seq_0.block_table)
print_block_manager_info(block_manager)
```

```
after deallocate seq_0
seq_0 block_table: []
block_manager.blocks size: 10
blocks list: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
free_block_ids: deque([4, 5, 6, 7, 8, 9, 1, 0])
used_block_ids: {2, 3}
```

观察到seq_0.block_table 清空；used_block_ids 减少；free_block_ids 增加

`deallocate(seq)` 会遍历这个请求的 `block_table`，让对应 block 的 `ref_count = ref_count - 1`。如果 `ref_count` 变成 0，就说明没有请求再使用这个 block，可以释放回 free_block_ids。

### 4.prefix cache

```python
# 第一个请求
token_ids = tokenizer.encode("hi, I'm kaiyuan")
seq_a = Sequence(token_ids, sampling_params)
block_manager.allocate(seq_a)

# 第二个完全相同请求
token_ids = tokenizer.encode("hi, I'm kaiyuan")
seq_b = Sequence(token_ids, sampling_params)
block_manager.allocate(seq_b)

print("seq_a block_table:", seq_a.block_table)
print("seq_b block_table:", seq_b.block_table)
print("seq_b num_cached_tokens:", seq_b.num_cached_tokens)

for block_id in seq_b.block_table:
    block = block_manager.blocks[block_id]
    print(block_id, "ref_count:", block.ref_count, "token_ids:", block.token_ids)
```

```
seq_a block_table: [0, 1]
seq_b block_table: [0, 1]
seq_b num_cached_tokens: 8
0 ref_count: 2 token_ids: [6023, 11, 358, 2776]
1 ref_count: 2 token_ids: [595, 2143, 88, 10386]
```

观察到参考数目为2，即如果多个请求有相同前缀，可以共享已经算好的 KV Cache，减少重复 prefill。

### 5.may_append

```python
token_ids = tokenizer.encode("hi, I'm kaiyuan")
seq = Sequence(token_ids, sampling_params)
block_manager.allocate(seq)

print("before append")
print("tokens:", seq.token_ids)
print("num_tokens:", seq.num_tokens)
print("num_blocks:", seq.num_blocks)
print("block_table:", seq.block_table)

seq.append_token(123)
block_manager.may_append(seq)

print("after append")
print("tokens:", seq.token_ids)
print("num_tokens:", seq.num_tokens)
print("num_blocks:", seq.num_blocks)
print("block_table:", seq.block_table)
print_block_manager_info(block_manager)
```

```
before append
tokens: [6023, 11, 358, 2776, 595, 2143, 88, 10386]
num_tokens: 8
num_blocks: 2
block_table: [0, 1]
after append
tokens: [6023, 11, 358, 2776, 595, 2143, 88, 10386, 123]
num_tokens: 9
num_blocks: 3
block_table: [0, 1, 2]
block_manager.blocks size: 10
blocks list: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
free_block_ids: deque([3, 4, 5, 6, 7, 8, 9])
used_block_ids: {0, 1, 2}
```

decode 每生成一个 token → KV Cache 也要追加一个 token 的 K/V

## 六、Scheduler 调度器

Scheduler 负责排队和调度，BlockManager 负责 KV cache 空间分配。

```python
from collections import deque

class Scheduler:

    def __init__(self, config: Config):
        self.max_num_seqs = config.max_num_seqs
        self.max_num_batched_tokens = config.max_num_batched_tokens
        self.eos = config.eos
        self.block_manager = BlockManager(config.num_kvcache_blocks, config.kvcache_block_size)
        self.waiting: deque[Sequence] = deque()
        self.running: deque[Sequence] = deque()
        self.num_seqs = 0
        self.num_batched_tokens = 0

    def is_finished(self):
        return not self.waiting and not self.running

    def add(self, seq: Sequence):
        self.waiting.append(seq)

    def prefill(self):
        scheduled_seqs = []
        while self.waiting and self.num_seqs < self.max_num_seqs:
            seq = self.waiting[0]
            if self.num_batched_tokens + len(seq) > self.max_num_batched_tokens or not self.block_manager.can_allocate(seq):
                break
            self.num_seqs += 1
            self.block_manager.allocate(seq)
            self.num_batched_tokens += len(seq) - seq.num_cached_tokens
            seq.status = SequenceStatus.RUNNING
            self.waiting.popleft()
            self.running.append(seq)
            scheduled_seqs.append(seq)
        return scheduled_seqs, True

    def decode(self):
        scheduled_seqs = []
        while self.running and self.num_seqs < self.max_num_seqs:
            seq = self.running.popleft()
            while not self.block_manager.can_append(seq):
                if self.running:
                    self.preempt(self.running.pop())
                else:
                    self.preempt(seq)
                    break
            else:
                self.num_seqs += 1
                self.block_manager.may_append(seq)
                scheduled_seqs.append(seq)
        if scheduled_seqs:
          self.running.extendleft(reversed(scheduled_seqs))
        return scheduled_seqs, False

    def preempt(self, seq: Sequence):
        seq.status = SequenceStatus.WAITING
        self.block_manager.deallocate(seq)
        self.waiting.appendleft(seq)

    def schedule(self, prefill_first=True) -> tuple[list[Sequence], bool]:
        scheduled_seqs = []
        self.num_seqs = 0
        self.num_batched_tokens = 0
        is_prefill = True

        if prefill_first:
            first_call, second_call = self.prefill, self.decode
        else:
            first_call, second_call = self.decode, self.prefill

        scheduled_seqs, is_prefill = first_call()
        if scheduled_seqs:
            return scheduled_seqs, is_prefill

        scheduled_seqs, is_prefill = second_call()
        if scheduled_seqs:
          return scheduled_seqs, is_prefill
        assert scheduled_seqs

    def postprocess(self, seqs: list[Sequence], token_ids: list[int]) -> list[bool]:
        for seq, token_id in zip(seqs, token_ids):
            seq.append_token(token_id)
            if (not seq.ignore_eos and token_id == self.eos) or seq.num_completion_tokens == seq.max_tokens:
                seq.status = SequenceStatus.FINISHED
                self.block_manager.deallocate(seq)
                self.running.remove(seq)

```

```python

config = Config()
config.num_kvcache_blocks = 100
config.max_num_seqs = 3 # 最多运行多少个请求
config.max_model_len = 15 # 单条请求长度


sampling_params = SamplingParams(temperature=0.6, max_tokens=256)
scheduler = Scheduler(config)


# 增加第一个请求
token_ids = tokenizer.encode("Do you subscribe InfraTech?")
seq = Sequence(token_ids, sampling_params)
scheduler.add(seq)

# 增加第二个请求
token_ids = tokenizer.encode("hi, I'm kaiyuan")
seq = Sequence(token_ids, sampling_params)
scheduler.add(seq)

# 打印输入请求情况
print("scheduler waiting queue: ")
for id, seq in enumerate(scheduler.waiting):
    print(f"id:{id} seq:{seq.token_ids}")

# 测试调度与生成：
print("\nrunning: ")
while not scheduler.is_finished():
    seqs, is_prefill = scheduler.schedule()
    token_ids = run_fake_model(seqs, config.max_model_len)
    scheduler.postprocess(seqs, token_ids)
    for id, seq in enumerate(seqs):
        print(f"id:{id} seq:{seq.token_ids}")
```

```
scheduler waiting queue: 
id:0 seq:[5404, 498, 17963, 14921, 956, 34097, 30]
id:1 seq:[6023, 11, 358, 2776, 595, 2143, 88, 10386]

running: 
id:0 seq:[5404, 498, 17963, 14921, 956, 34097, 30, 100]
id:1 seq:[6023, 11, 358, 2776, 595, 2143, 88, 10386, 831]
id:0 seq:[5404, 498, 17963, 14921, 956, 34097, 30, 100, 58]
id:1 seq:[6023, 11, 358, 2776, 595, 2143, 88, 10386, 831, 37]
id:0 seq:[5404, 498, 17963, 14921, 956, 34097, 30, 100, 58, 205]
id:1 seq:[6023, 11, 358, 2776, 595, 2143, 88, 10386, 831, 37, 736]
id:0 seq:[5404, 498, 17963, 14921, 956, 34097, 30, 100, 58, 205, 241]
id:1 seq:[6023, 11, 358, 2776, 595, 2143, 88, 10386, 831, 37, 736, 317]
id:0 seq:[5404, 498, 17963, 14921, 956, 34097, 30, 100, 58, 205, 241, 320]
id:1 seq:[6023, 11, 358, 2776, 595, 2143, 88, 10386, 831, 37, 736, 317, 427]
id:0 seq:[5404, 498, 17963, 14921, 956, 34097, 30, 100, 58, 205, 241, 320, 747]
id:1 seq:[6023, 11, 358, 2776, 595, 2143, 88, 10386, 831, 37, 736, 317, 427, 696]
id:0 seq:[5404, 498, 17963, 14921, 956, 34097, 30, 100, 58, 205, 241, 320, 747, 153]
id:1 seq:[6023, 11, 358, 2776, 595, 2143, 88, 10386, 831, 37, 736, 317, 427, 696, 940]
id:0 seq:[5404, 498, 17963, 14921, 956, 34097, 30, 100, 58, 205, 241, 320, 747, 153, 473]
id:1 seq:[6023, 11, 358, 2776, 595, 2143, 88, 10386, 831, 37, 736, 317, 427, 696, 940, -1]
id:0 seq:[5404, 498, 17963, 14921, 956, 34097, 30, 100, 58, 205, 241, 320, 747, 153, 473, -1]
```

### 1.初始化

scheduler = Scheduler(config)

创建一个 Scheduler 实例，执行配置文件，并且初始化。生成结果如下：

```
scheduler
 ├── block_manager  一个 BlockManager 实例
 ├── waiting        空队列
 ├── running        空队列
 ├── max_num_seqs
 └── max_num_batched_tokens
```

self.waiting: deque[Sequence] = deque()
self.running: deque[Sequence] = deque()

创建两个队列，区分seq当前请求状态。

### 2.perfill

重点在于perfill阶段：

```
1. 从 waiting 队首取请求
2. 检查 batch 限制
3. 检查 KV cache block 是否够
4. 分配 KV cache
5. 把请求从 waiting 移到 running
6. 加入本轮要执行的 scheduled_seqs
```

### 3.decode

然后是decode阶段：

作用是对已经 prefill 过的请求，每轮继续生成 1 个 token。

```
1. 从 running 队列取一个正在运行的请求
2. 检查它还能不能继续追加 KV cache
3. 如果可以，就安排它本轮继续生成一个 token
4. 如果 KV cache 不够，就可能 preempt 抢占请求
```

### 4.postprocess

模型生成完 token 后，需要把新 token 加回到 Sequence 里。

代码：

```
seq.append_token(token_id)
```

然后判断请求是否结束：

```
if token_id == self.eos or seq.num_completion_tokens == seq.max_tokens:
```

如果结束，就：

```
seq.status = SequenceStatus.FINISHED
self.block_manager.deallocate(seq)
self.running.remove(seq)
```

意思是：

```
1. 标记请求结束
2. 释放它占用的 KV cache block
3. 从 running 队列移除
```

所以 postprocess 负责：

```
模型生成完之后的收尾工作
```

