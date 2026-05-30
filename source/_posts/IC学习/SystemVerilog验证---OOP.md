---
title: SystemVerilog验证---OOP
date: 2026-05-09
categories: IC学习
tags: SystemVerilog验证
---
# SystemVerilog验证---OOP

## 一、类的构造

类，跟大部分语言定义一样，用Class + 类名定义。如下：

```verilog
class transaction;
    bit [31:0] addr, csm, data[8];
    function void display();
        $display("Tranction: %h", addr);
    endfunction: display
    function void calc_csm();
        csm = addr ^ data.xor;
    endfunction: calc_csm
endclass: transaction
```

这里为了更好的**对齐**一个块的开始和结束，**通过在块的最后使用label作为一个标签**，从而更好的匹配每一个块。

在SV中，我们通过可以在program，module，package等地方去定义个类，或者使用类，一般是在package中定义。

那上述的操作实际都在定义一个类，没有具体的对象，即类的实例，接下来我们来看如何创建一个对象。

**声明句柄**，即指向对象的指针，表示一个对象的地址：

```verilog
transaction tr;
```

**分配空间**，使用new()函数，比如transaction这个类，有一个4个字节的addr，4个字节的csm，还有32个字节的data，故使用new时分配40个字节的存储空间：

```verilog
tr = new();
```

new函数称为**构造函数**，对于一个类，sv会自动创建一个默认的new函数来分配并初始化对象，当然这个new函数也可以自己定制，只不过不需要写返回值。

句柄是对象的引用（类似指针），而非对象本身，同一句柄变量在**不同时间**可以**先后指向不同的对象**。

**解除分配**：

```verilog
transaction tr;
tr = new();		//分配第一个对象
tr = new();		//分配第二个对象，并且释放第一个
tr = null;		//解除分配第二个
```

## 二、类的方法

这里方法指的是类中定义的程序，常见的就是**类内定义**，比如上面我们定义的transaction类，内部就有display方法，那如何使用呢？可以通过句柄加“.”的方式，比如tr.display()。另外一个，需要注意的就是**类外定义**。

```verilog
class Tranction；
    extern function void display();
endclass

function void Tranction::display();
endfunction
```

也就是说，我们可以通过在类内加关键词extern的方式，将整个方法移到类外定义，并在方法名前加上类名和两个冒号（：：作用域操作符）。

## 三、静态变量

## 四、作用域