---
title: Verilator+Vscode工具使用介绍
date: 2026-03-31
categories: IC学习
tags: SystemVerilog验证
---

# Verilator+Vscode工具使用介绍

Verilator 是一款开源的 SystemVerilog 仿真工具，通过将硬件描述语言编译成 C++ 模型来实现高速仿真。

## 1.Verilator安装

推荐使用wsl

```shell
wsl.exe --update
wsl --version
wsl --install
```

上述操作完成后会成功进入Ubuntu系统

显示`Provisioning the new WSL instance Ubuntu`

安装 Verilator 编译所需的**依赖工具**

```shell
sudo apt-get update
sudo apt-get install -y git make autoconf g++ flex bison
```

安装Verilator

```shell
sudo apt install verilator
```

通过`verilator --version`显示版本信息，确认安装成功

## 2.Vscode插件安装

推荐安装插件:

![image-20260331225811071](https://raw.githubusercontent.com/ub-w/Article-images/main/Typora20260331225819671.png)

在设置中搜索verilator，勾选图片中的选项，就可以通过WSL使用Verilator进行编译了

![image-20260331225940902](https://raw.githubusercontent.com/ub-w/Article-images/main/Typora20260331225940936.png)

## 3.编译运行命令

```shell
verilator --binary -j 0 -Wall assoc_array_test.sv
./obj_dir/Vassoc_array_test
```

通过使用第一个命令进行编译，verilator要先把sv文件转换成C++模型，然后再通过make编译成可运行文件，所以--binary必不可少。
可以使用简化的命令：
```shell
verilator --binary file.sv #直接生成可执行文件
verilator --binary -Wno-fatal #显示所有警告但不停止编译
```

编译完成后，会自动生成obj_dir文件存放所有编译生成的中间文件和最终可执行文件，通过`./obj_dir/Vassoc_array_test`运行。

