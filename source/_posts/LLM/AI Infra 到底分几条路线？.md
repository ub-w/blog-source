---
title: AI Infra路线分类
date: 2026-5-30
categories: 大模型
tags: 基础
---

# AI Infra 到底分几条路线？

你以后可以选方向，不是所有都要精通。

## 路线 A：LLM Inference / Serving Engineer

最适合你当前切入。

核心技能：

```
PyTorch 推理
Transformers
vLLM
SGLang
KV Cache
continuous batching
quantization
FastAPI
OpenAI-compatible API
benchmark
Docker
```

项目形态：

```
LLM 推理服务平台
vLLM + FastAPI 模型网关
多模型推理压测平台
RAG + 本地推理服务
```

这是你现在最该走的。

------

## 路线 B：AI Platform / MLOps Engineer

偏平台工程。

核心技能：

```
Docker
Kubernetes
KServe
Ray
CI/CD
Prometheus/Grafana
模型注册
模型发布
自动扩缩容
日志监控
```

这条需要后端和云原生基础，对你也可以，但短期不如 vLLM serving 容易和你已有 RAG/Agent 项目结合。

------

## 路线 C：GPU / Kernel / Performance Engineer

最底层，薪资高但门槛高。

核心技能：

```
CUDA
Triton
Tensor Core
FlashAttention
矩阵乘法优化
TensorRT-LLM
算子融合
NCCL
多 GPU 通信
```

你有电子信息背景，长期可以往这边靠，但短期不应该先主攻。

------

## 路线 D：Distributed Training / Large-scale Training Infra

偏训练系统。

核心技能：

```
DeepSpeed
Megatron-LM
FSDP
ZeRO
Tensor Parallel
Pipeline Parallel
Data Parallel
NCCL
checkpoint
cluster scheduling
```

这个方向更难，也更偏大厂内部训练平台。你短期可以了解，不作为第一主线。