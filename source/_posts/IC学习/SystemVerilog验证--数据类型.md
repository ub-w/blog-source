---
title: SystemVerilog验证---数据类型
date: 2026-03-30
categories: IC
tags: SystemVerilog验证
---

# SystemVerilog验证---数据类型

## 一、内建数据类型

### 1.1 四状态数据类型--logic

logic是 SystemVerilog 中引入的四状态数据类型，可以存储 **0、1、X（未知）、Z（高阻）** 四种状态。

logic是SV对reg数据类型进行的改进，不仅可以在过程块中赋值，也可以使用连续赋值。

**限制：**

1.logic 不能用于双向信号（inout），inout 必须用 wire

2.logic 不能有多个结构性的驱动

### 2.2 双状态数据类型

SV引入双状态数据类型有利于提高仿真器的性能并减少内存的使用量，主要有下列类型：

| 类型     | 位数 | 范围         |
| -------- | ---- | ------------ |
| bit      | 1    | 0, 1         |
| byte     | 8    | -128~127     |
| shortint | 16   | -2^15~2^15-1 |
| int      | 32   | -2^31~2^31-1 |
| longint  | 64   | -2^63~2^63-1 |

在把双状态变量连接到被测设计时，要小心被测设计试图产生X或Z，可以使用`$isunknown`操作符，若返回值为1，表示表达式某位为X或Z；返回值为0，则无X或Z。

## 二、定宽数组

### 2.1 基本数组

#### 2.1.1 声明

```verilog
int a[0:15];
int b[15]; //可以只给出数组宽度声明
int array[0:7][0:3]; //多维数组
int array1[7][3]; //紧凑格式
bit [7:0] b_unpack[3]; //前面表示位宽，后面表示数组个数
```

上面的数组也称为非合并数组，用来与合并数组区分。

在SV的仿真器中，存放数组使用的是**32比特的字边界**，也就是说每32位我们称为一个字，而一个字节是8位，故一个字即为4个字节。那么，bit、byte、shortint、int都是存放在一个字中，而longint存放在两个字。

非合并数组则表示这三个元素哪怕每一个只有8位，但是仍然占据3个字，不作合并。即字的低位存放数据，高位不使用。

#### 2.1.2 初始化

```verilog
initial begin
    static int ascend[4] = '{0 ,1, 2, 3};
    int descend[5];
    descend = '{4, 3, 2, 1, 0};
    descend[0:2] = '{7, 6, 5};
    ascend = '{4{8}}; //四个值全部为8
    ascend = '{default:42}; //所有元素赋值位42
end
```

#### 2.1.3 基本数组操作--for和foreach

**for - 通用循环控制**

**foreach - 专门用于数组遍历**

**语法：**

systemverilog

```verilog
foreach(array_name[index])  
```

**特点：**

- 自动遍历所有元素，无需知道数组大小
- 自动处理非连续索引（如 `[9:0]` 从9到0）
- 支持多维数组：`foreach(arr[i,j])`
- 代码简洁，不易出错

#### 2.1.4 基本数组操作--复制和比较

聚合比较和复制，指对整个数组的比较和复制，比较只限于等于或不等于。

#### 2.1.5 同时使用数组下标和位下标

```verilog
initial begin
    bit [31:0] src[5] = '{5{5}};
    bit [31:0] src1[5][2] = '{'{2{5}},'{2{4}},'{2{3}},'{2{2}},'{2{1}}};
    $display(src[0],,		//'b101
             src[0][0],,	//'b1
             src[0][2:1]);	//'b10, 第一个是数组下标，第二个是位下标
    $display(src1[0][0],,	//'b101, 第0行第0列元素
             src1[0][0][1]);//'b0, 第0行第0列元素的第1位
end
```

### 2.2 合并数组

合并数组（Packed Array）是将所有元素**连续存储**在一起的数组，可以作为一个整体进行操作。

```verilog
// 合并数组：维度在变量名左边
bit [3:0] packed1;           // 4位合并（实际是向量）
bit [1:0][3:0] packed2;      // 2x4=8位合并
bit [3:0][7:0] packed3 [5]; // 合并与非合并混合使用，5个元素合并后4个字节

initial begin
    packed1 = 4'b1010;      // 整体赋值
    packed1[3] = 1;             // 位选择
    packed1[2:1] = 2'b01;     // 位片选择
    
    packed2 = 8'b1010_1100;     // 整体赋值
    packed2[1] = 4'b1010;       // 左边第一个4位元素
    packed2[0] = 4'b1100;       // 左边第二个4位元素
    packed2[0][2] = 1;          // 左边第二个元素的第2位
    
    packed3[0] = 32'h0123_4567; //第一个元素整体赋值
    packed3[0][3] = 8'h01;		//第一个元素左边第一个字节，packed3[0] = 01_23_45_67
    packed3[0][1][6] = 1'b1;	//第三个字节8’h45 = 8'b0100_0101第6位为1
end
```

任何数据类型都可以合并，包括动态数组，队列和关联数组。

如果你需要等待数组中的变化，则必须使用合并数组，比如@操作符，括号里为敏感信号。

## 三、动态数组

动态数组是**可以在运行时改变大小**的数组，**使用 `[]` 声明，`new[]` 分配空间，`delete()` 释放。**

```verilog
int dyn_arr[];        // 声明，初始大小为0
dyn_arr = new[10];    // 分配10个元素
dyn_arr = new[20];    // 重新分配20个元素（原数据丢失）
dyn_arr = new[20](dyn_arr);  // 重新分配20个，并复制原数据
dyn_arr.size();            // 返回20
dyn_arr.delete();          // 删除所有元素，size=0

int d[][];		//构造多维数组
initial begin
    d = new[4];		//构造第一个或最左面的维度
    foreach (d[i])
        d[i] = new[i+1];
    foreach (d[i,j])
        d[i][j] = i*10 + j;
end
```

## 四、队列

队列是**可以在前后端动态增删元素**的数据结构，使用 `[$]` 声明。

```verilog
int queue[$];        // 声明队列，初始为空
int q[$] = {1,2,3};  // 声明并初始化,只有大括号没有单引号
```

### **核心操作**

| 操作     | 语法               | 说明               |
| :------- | :----------------- | :----------------- |
| 尾部插入 | `q.push_back(5);`  | 在末尾添加元素     |
| 头部插入 | `q.push_front(0);` | 在开头添加元素     |
| 尾部删除 | `q.pop_back();`    | 删除并返回末尾元素 |
| 头部删除 | `q.pop_front();`   | 删除并返回开头元素 |
| 插入     | `q.insert(i, 5);`  | 在索引i处插入      |
| 删除     | `q.delete(i);`     | 删除索引i处元素    |
| 清空     | `q.delete();`      | 删除所有元素       |
| 大小     | `q.size();`        | 返回元素个数       |

## 五、关联数组

关联数组是**使用任意类型作为索引**的数据结构，类似于 Python 的字典或 C++ 的 map。

### 5.1 **基本语法**

```verilog
int assoc[string];     // 用字符串作为索引
int assoc[int];        // 用整数作为索引
int assoc[packet_t];   // 用结构体作为索引
```

### 5.2 **核心操作**

| 操作     | 语法                      | 说明             |
| :------- | :------------------------ | :--------------- |
| 赋值     | `assoc["key"] = value;`   | 插入或修改元素   |
| 读取     | `v = assoc["key"];`       | 访问元素         |
| 存在检查 | `if(assoc.exists("key"))` | 检查索引是否存在 |
| 删除     | `assoc.delete("key");`    | 删除指定索引     |
| 清空     | `assoc.delete();`         | 删除所有元素     |
| 大小     | `assoc.num();`            | 返回元素个数     |
| 遍历     | `foreach(assoc[idx])`     | 遍历所有元素     |

### 5.3 **关联数组 vs 动态数组vs 队列**

| 特性       | 关联数组                      | 动态数组       | 队列           |
| :--------- | :---------------------------- | :------------- | :------------- |
| 索引类型   | 任意类型（int/string/struct） | 整数           | 整数           |
| 索引连续性 | 不连续                        | 连续 0..size-1 | 连续 0..size-1 |
| 内存分配   | 按需分配                      | 连续内存       | 连续内存       |
| 默认值     | 未访问元素返回0               | 无             | 无             |
| 适用场景   | 稀疏存储、查找表              | 密集存储       | FIFO/LIFO      |

### 5.4 **常用方法**

```verilog
int map[string];

map["apple"] = 5;
map["banana"] = 3;

map.exists("apple");   // 返回1
map.num();             // 返回2
map.first(idx);        // 获取第一个索引，返回1或者0
map.next(idx);         // 获取下一个索引
map.delete("apple");   // 删除apple

int power_of_2[int] = '{0:1, 1:2, 2:4};		//使用索引：元素对形式的数组常量初始化关联数组
```

```verilog
/*输入文件的内容如下：
42 min_address
1492 max_address
*/

module string_index;
    int switch[string], min_address, max_address, i, file;
    initial begin
        string s;
        file = $fopen("switch.txt","r");
        while(!$feof(file))begin			//检测文件是否达到末尾
            $fscanf(file, "%d %s", i, s);
            switch[s] = i;
        end
        $fclose(file);

        foreach(switch[s])
            $display("switch['%s'] = %0d", s, switch[s]);
        $finish;
    end
endmodule
```

## 六、数组的方法

```verilog
module array_method;
    //数组缩减方法
    byte b[$] = {2, 3, 4, 5};
    initial begin
        $display("b数组总和:%0d", b.sum());
        $display("b数组内元素连乘:%0d", b.product());
        $display("b数组元素相与:%b", b.and());
        $display("b数组元素随机选取:%0d", b[$urandom_range(b.size()-1)]);	//$urandom_range()用于生成指定范围的随机整数
    end
    int aa[int] = '{0:1, 5:2, 10:4, 15:8, 20:16,25:32, 30:64};
    int idx, element, count;

    initial begin
        element = $urandom_range(aa.size()-1);
        foreach(aa[i]) begin
            $display("aa[%0d] = %0d", i, aa[i]);
            if(count++ == element) begin
                idx = i;
                //break;
            end
        end
        $display("element#%0d aa[%0d] = %0d",element, idx, aa[idx]);
        $display("aa数组元素:%p", aa);
        $finish;
    end
    //数组定位方法
    int q[$] = '{1, 3, 5, 7};
    int f[6] = '{1, 6, 2, 6, 8, 6};
    int d[] = '{2, 4, 6, 8, 10};
    int tq[$];										//用来保存结果的临时队列
    initial begin
        tq = q.min();
        $display("队列p的最小元素：%0d", tq[0]);
        $display("d的最大元素：%p", d.max());
        $display("f去重后的元素：%p", f.unique());		//unique()去重
        tq = d.find with(item >5);					//返回满足条件的队列（包含所有匹配的元素）
        $display("d中大于5的元素：%p", tq);
        tq = d.find_index with(item >5);			//返回满足条件的队列（包含所有匹配的索引）
        $display("d中大于5的元素索引：%p", tq);
        tq = d.find_first with(item >5);
        $display("d中第一个大于5的元素：%p", tq);
        tq = d.find_first_index with(item >5);
        $display("d中第一个大于5的元素索引：%p", tq);
        tq = d.find_last with(item >5);
        $display("d中最后一个大于5的元素：%p", tq);
        tq = d.find_last_index with(item >5);
        $display("d中最后一个大于5的元素索引：%p", tq);
    end
    //单比特
    bit one[6];
    int total;
    initial begin
        foreach(one[i])
            one[i] = i;								//i表示索引，为32位，赋值给1位后产生高位截断
        $display("one数组元素：%p", one);
        total = one.sum(); 
        $display("one数组元素总和：%0d", total);
        //total = one.sum() with(int'(item));
        //$display("one数组元素总和（转换为int类型）：%0d", total);
    end
    //数组排序方法
    int sort_array[] = '{5, 2, 9, 1, 5, 6};
    initial begin
        $display("原数组：%p", sort_array);
        sort_array.reverse();
        $display("反转后：%p", sort_array);
        sort_array.sort();
        $display("升序排序后：%p", sort_array);
        sort_array.rsort;
        $display("降序排序后：%p", sort_array);
        sort_array.shuffle();
        $display("随机打乱后：%p", sort_array);
    end
    //数组计分板
    typedef struct packed {bit[7:0] addr; bit[7:0] pr; bit[15:0] data;} Packet;
    Packet scb[$];
    
    function void check_addr(bit [7:0] addr);
        int intq[$];
        intq = scb.find_index with(item.addr == addr);
        case(intq.size())
        0:$display("地址%0h未找到", addr);
        1:scb.delete(intq[0]);
        default:
            $display("ERROR: 地址%0h出现重复", addr);
        endcase
    endfunction:check_addr

endmodule
```

## 七、使用typedef创建新的类型

`typedef` 用于**创建自定义类型别名**，提高代码可读性和可维护性，用户自定义类型都带后缀 "_t"

```verilog
typedef int array_t[10];      // 10个int的数组类型
typedef byte_t buffer_t[256]; // 256字节的缓冲区类型
```

## 八、创建用户自定义结构

### 8.1 使用struct创建新类型 

SV提供了struct语句创建结构，并且可综合。

```verilog
//创建变量
struct {bit[7:0] r, g, b;} pixel;

//创建新的类型,sturct声明的使用后缀 '_s'
typedef struct {bit[7:0] r, g, b;} pixel_s;
pixel_s my_pixel

//初始化
initial begin
    my_pixel = '{8'd10, 8'd255, 8'd166};
    // 使用成员名访问
    my_pixel.r    // 访问红色分量，值是 10
    my_pixel.g    // 访问绿色分量，值是 255
    my_pixel.b    // 访问蓝色分量，值是 166
end
```

### 8.2 创建可容纳不同类型的联合

联合体是一种**让多个不同类型变量共享同一块内存**的数据结构。

#### 8.2.1 基本语法

```verilog
// 定义联合体类型
typedef union {
    bit [31:0] b;   // 无符号整数视角
    int i;          // 有符号整数视角
    real r;         // 浮点数视角
} word_u;

// 使用联合体
word_u data;
```

#### 8.2.2 工作原理

```txt
内存地址 0x1000：
┌────────────────────────────────────┐
│        32位内存空间                 │
│        0xFFFFFFFF                   │
└────────────────────────────────────┘
         ↑         ↑         ↑
         |         |         |
      data.b    data.i    data.r
    (无符号)   (有符号)    (浮点)
         ↓         ↓         ↓
    4294967295    -1       -1.0
```

#### 8.2.3 协议解析

```verilog
typedef union {
    bit [63:0] raw;              // 原始数据流
    struct packed {
        bit [7:0]  dest;         // 目的地址
        bit [7:0]  src;          // 源地址
        bit [15:0] length;       // 长度
        bit [31:0] payload;      // 负载
    } field;
} ethernet_frame_u;

ethernet_frame_u frame;
frame.raw = receive_data();      // 接收原始数据
$display("目的地址：%h", frame.field.dest);  // 解析字段
```

### 8.3 合并结构

```verilog
typedef struct packed {bit [7:0] r, g, b;} pixel_p_s;
pixel_p_s my_pixel;
```

同合并数组相同，只不过索引变成了字段名，可读性较高。

## 九、包

**包 = 可重用代码的容器**，用于存放类型定义、常量、函数等，可以在多个模块中共享。

### 9.1 包的声明

```verilog
package 包名;
    // 可以包含的内容
    typedef ...;      // 类型定义
    parameter ...;    // 参数常量
    const ...;        // 常量
    function ...;     // 函数
    task ...;         // 任务
endpackage
```

### 9.2 包的导入

#### 9.2.1 导入方式对比

| 方式           | 语法                | 说明                       |
| :------------- | :------------------ | :------------------------- |
| **通配符导入** | `import pkg::*;`    | 导入所有内容，可能命名冲突 |
| **选择性导入** | `import pkg::item;` | 只导入指定项，推荐         |

#### 9.2.2 直接引用（不导入）

```verilog
pkg::item  // 每次使用时加包名前缀
```

### 9.3 完整示例

```verilog
// ========== 1. 声明包 ==========
package common_pkg;
    // 类型定义
    typedef enum {IDLE, RUN, STOP} state_e;
    
    // 结构体定义
    typedef struct {
        bit [7:0] addr;
        bit [31:0] data;
    } packet_t;
    
    // 常量
    parameter int VERSION = 1;
    const int MAX_SIZE = 256;
    
    // 函数
    function int add(int a, int b);
        return a + b;
    endfunction
endpackage

// ========== 2. 使用包 ==========
module top;
    // 方式1：选择性导入（推荐）
    import common_pkg::state_e;
    import common_pkg::packet_t;
    import common_pkg::add;
    
    state_e current_state;
    packet_t my_packet;
    int result;
    
    initial begin
        current_state = IDLE;
        my_packet = '{8'h10, 32'h1234};
        result = add(5, 3);
        
        $display("state = %s", current_state.name());
        $display("packet addr = %h", my_packet.addr);
        $display("add result = %0d", result);
    end
endmodule

// ========== 3. 另一种模块：通配符导入 ==========
module another_module;
    import common_pkg::*;  // 导入所有
    
    state_e s = RUN;
    packet_t p;
    
    initial begin
        $display("state = %s", s.name());
    end
endmodule

// ========== 4. 直接引用（不导入） ==========
module direct_ref;
    initial begin
        common_pkg::state_e s = common_pkg::IDLE;
        $display("直接引用：%s", s.name());
    end
endmodule
```

## 十、类型转换

### 10.1 静态转换

```verilog
int i;
real r;
i = '(10.0 - 0.1);
r = real'(42);
```

### 10.2 动态转换

动态转换函数$cast允许对越界的数值进行检查。

```verilog
// 函数形式：返回 int，成功返回1，失败返回0
success = $cast(variable, expression);

// 任务形式：失败时产生运行时错误
$cast(variable, expression);
```

## 十一、流操作符

流操作符用于**将数据打包成连续的位流**或**从位流中解包数据**，是进行数据格式转换和字节序处理的重要工具。

```verilog
{ >> {data}}      // 右移流：按原顺序打包
{ << {data}}      // 左移流：反转顺序打包
{ >> 4 {data}}    // 按4位切片打包
{ >> byte {data}} // 按字节切片打包
```

## 十二、枚举

枚举是一种**定义一组命名常量**的数据类型，让代码用有意义的名称代替数字。

### 12.1内置方法

| 方法       | 返回值 | 说明               |
| :--------- | :----- | :----------------- |
| `.name()`  | string | 返回枚举值名称     |
| `.next()`  | enum   | 返回下一个枚举值   |
| `.prev()`  | enum   | 返回上一个枚举值   |
| `.first()` | enum   | 返回第一个枚举值   |
| `.last()`  | enum   | 返回最后一个枚举值 |
| `.num()`   | int    | 返回枚举值总数     |

### 12.2 示例

```verilog
module enum_df;
    typedef enum {RED, GREEN, BLUE} color_e;
    color_e color, c2;
    initial begin
        color = color.first;
        do
            begin
                $display("Color = %0d/%s",color, color.name());
                color = color.next;
            end
        while(color != color.first);
    end

    typedef enum {INIT, DECODE, IDLE} fasmstate_e;
    fasmstate_e pastate, nstate;
    initial begin
        case(pastate)
            IDLE: nstate = INIT;
            INIT: nstate = DECODE;
            default: nstate = IDLE; 
        endcase
        $display("当前状态：%s, 下一状态：%s", pastate.name(), nstate.name());
        $finish;
    end

    int c;
    initial begin
        color = GREEN;
        c = color;
        c++;
        if(!$cast(color,c))
            $display("无法将整数%0d转换为color_e枚举类型", c);
        else
            $display("整数%0d成功转换为color_e枚举类型：%s", c, color.name());
        c++;
        c2 = color_e'(c);
        $display("c2 is %0d / %s", c2, c2.name()); 
    end

endmodule
```

## 十三、字符串

字符串是一种**可变长度的字符序列**数据类型，用于存储和处理文本。

### 13.1 基本语法

```verilog
string str;              // 声明字符串变量
str = "Hello";           // 赋值
str = "";                // 空字符串
```

### 13.2 常用操作

| 操作 | 语法       | 说明                  |
| :--- | :--------- | :-------------------- |
| 连接 | `s1 + s2`  | 字符串拼接            |
| 比较 | `s1 == s2` | 相等比较              |
| 长度 | `s.len()`  | 返回字符个数          |
| 索引 | `s[i]`     | 访问第i个字符（byte） |

### 13.3 常用方法

| 方法            | 说明          | 示例             |
| :-------------- | :------------ | :--------------- |
| `.len()`        | 返回长度      | `s.len()`        |
| `.getc(i)`      | 获取第i个字符 | `s.getc(0)`      |
| `.putc(i, c)`   | 设置第i个字符 | `s.putc(0, "A")` |
| `.substr(i, j)` | 提取子串      | `s.substr(1, 3)` |
| `.toupper()`    | 转大写        | `s.toupper()`    |
| `.tolower()`    | 转小写        | `s.tolower()`    |
| `.compare(s2)`  | 比较（0相等） | `s.compare(t)`   |

### 13.4 常用系统函数

| 函数          | 说明             | 示例                         |
| :------------ | :--------------- | :--------------------------- |
| `$sformatf()` | 格式化返回字符串 | `s = $sformatf("%0d", 123);` |
| `$sscanf()`   | 从字符串解析     | `$sscanf(s, "%d", i);`       |

### 13.5 完整示例

```verilog
module test;
    string s1, s2, s3;
    
    initial begin
        // 赋值和连接
        s1 = "Hello";
        s2 = " World";
        s3 = s1 + s2;           // "Hello World"
        
        // 长度
        $display("长度：%0d", s3.len());  // 11
        
        // 索引
        $display("第0个字符：%c", s3[0]);  // H
        
        // 比较
        if (s1 == "Hello")
            $display("相等");
        
        // 方法使用
        $display("大写：%s", s3.toupper());  // HELLO WORLD
        $display("子串：%s", s3.substr(0, 4));  // Hello
        
        // 格式化
        string num_str = $sformatf("数值=%0d", 42);
        $display("%s", num_str);  // 数值=42
    end
endmodule
```





参考：克里斯·斯皮尔 格雷格·图姆布斯[著] 张春[译]。SystemVerilog测试平台编写指南 科学出版社



