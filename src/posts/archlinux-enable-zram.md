# 折腾--比 swap 更不伤硬盘: 在 Archlinux 上启用 ZRAM

:::subtitle
高速的内存, 像快节奏的, 大大小小的方形建筑组成的城市吗?
:::

:::date
2025-09-20 15:11:00
:::

:::category
Archlinux 折腾
:::

:::tag
Linux, 系统优化
:::

:::cover
path="/assets-local/covers/city-night.webp"
url="https://fvatprawuixmpa1x.public.blob.vercel-storage.com/images/c992340864eb1113594196b26115ec63300dbea60f9712f42d0b82bd6fcdf659.webp"
alt="A girl standing under a sakura tree in the night"
:::

> 注: 这是真正意义上的第一篇博客! 测试文章也可以看看(里面有心路历程~)

## 序言

刚开始用 Linux 的时候, 感觉比 Windows 占用的虚拟内存小得太多了(我只划了一块 4G 大小的分区做 swap 分区)。不过, 随着 Apry 的`vscodium`的语言插件越来越多(语言服务器等等, 比如 clangd), 某天在毫无防备的情况下, OOM 了。

没有意识到问题的我选择让 OOM 执行结束, 虚拟内存直接空出了 3G, 结果也不出意外, `vscodium` 窗口被干掉了。由于实在受不了每次都是最重要的代码工具被结束, 经过一番研究, 我决定从 swap 分区转移到 `ZRAM` 这个 Linux/Android 等等的特色技术上, 直接给到物理内存的 75%的容量。 `ZRAM` 效率比 `swap` 分区高, 最重要的是, 分大空间也不用担心伤硬盘，尤其是傲娇的固态 SSD。

> ⚠️ 作者的操作系统是 Archlinux, 其他系统可能有区别

于是我又愉快地开始折腾了, 殊不知等待我的又是一次大型事故抢救现场。为了方便日后使用, 同时践行我的博客方便(养)大(懒)家(人)的原则, 写下这篇记录贴。

## 开始折腾: 无脑进官方 wiki

众所周知, Archlinux 拥有世界上最完善的给 linux 桌面用户的 wiki。这是系统的配置, 按照习惯, 第一时间无脑进去搜了`ZRAM`。

### 一顿操作猛如虎: 只是临时启用而已

鉴于我十分相信官方的说明, 对于[Wiki 页面](https://wiki.archlinux.org/title/Zram)里面的`Manually`部分的代码直接粘贴了:

```bash
modprobe zram
zramctl /dev/zram0 --algorithm zstd --size "$(($(grep -Po 'MemTotal:\s*\K\d+' /proc/meminfo)/2))KiB"
mkswap -U clear /dev/zram0
swapon --discard --priority 100 /dev/zram0
```

同时记下了关闭的方法:

```bash
swapoff /dev/zram0
modprobe -r zram
```

设置完成。 ZRAM 加上我的 swap 成功变成一共 16G。今日无事, 又愉快地干活去了。(此时尚未意识到虽然加起来很大，但他们是冲突的，并且这只是临时启用了)

### 出现问题: zram 和/swap 分区冲突

当天一直比较忙，没有关机，中途合上了一次笔记本，也只是进入了睡眠模式。此时已经完全忘掉修改任何系统配置需要重启这个原则了。 😅
当晚关机，第二天重启，完蛋，卡在文件系统检查了(具体数字当时没记录):

```txt
/dev/nvmen1p6: clean, 583661/18911232 files, 19818200/75497472 blocks
_ <- (光标卡住了)
```

遂意识到我当时安装`Archlinux`时是纯小白状态, 没有注意是不是`quiet`模式(是在看到有朋友的开机有滚屏才意识到我没有滚屏这个问题), 导致我开机时基本上看不到报错信息。**对于排查可能出问题的地方，没有什么比日志更可靠**，于是重启，进到`grub`之后，临时按`e`修改了`grub`的启动参数，把`quiet`参数删掉了，`F10`继续引导，果不其然，滚屏卡在了一个地方:

```txt
[  *** ] A start job is running for ... /swapfile-lock (15s / 1min 30s)
```

等到 1min30s 结束后，成功开机进到 gnome 锁屏。

### 禁掉以前的 swap

首先送了一口气，硬件没有损坏，只是需要等很久启动。

经过一番查找, 发现是以前的`swap`分区没有禁用，导致`swap`和新的`zram`冲突的问题。了解到当时我创建的是`swap`分区而不是文件(当时很的太小白了，这个都分不清 🙃)，于是进到`fstab`修改配置:

```bash
sudo vscodium /etc/fstab
```

找到这一行:

```bash
# /dev/nvme0n1p4
# UUID=0df7c3ef-efc8-4e9a-b23e-8ad8ba30cd1e	none      	swap      	defaults  	0 0
```

注释掉了这个`swap`分区。

### 配置 zram

但问题还没解决, 既然我配了`zram`, 为什么还是`swap`先生的效, 还是只有`4G`虚拟内存。此时回到`wiki`, 发现:

> To disable it again, either reboot or run:
> ...

重启之后会 disable..., 原来这个只是临时的配置... 遂怀着沉重的心情继续下翻，发现一个叫`zram-generator`的程序，只需写一个配置文件就可以在开机的时候自动启用。

接下来开始捣鼓。

1. 安装 `zram-generator`

在 arch 上:

```bash
sudo pacman -S zram-generator
```

或者(应该都有`yay`吧)

```bash
yay -S zram-generator
```

2. 查找一些最适合自己的设置，创建`/etc/systemd/zram-generator.conf`文件:

```conf
# 设备名称, 一般只用第一台, 即zram0
[zram0]
# 设置大小为物理内存的75% ( Arpy这边是15.5G * 0.75 ≈ 11.6G )
zram-size = ram * 0.75

# lz4速度更快, zstd压缩率更高
compression-algorithm = zstd

# 优先级设置到100, 比swap高
swap-priority = 100

```

重启, 以为万事大吉。

### 还有一个坑

重启成功了，不卡在文件系统检查了，但是开机后赫然发现交换空间足足有`15.6G`。这不就是`swap`+`zram` = 4 + 11.6 = 15.6G 嘛。我的`swap`怎么还没禁掉?

经过一番排查(前面忘了，中间忘了)，发现`swap`分区记录虽然被禁用了，但我的某个机制使得这个分区仍然有效。此处遂采用简单粗暴的方法: 直接进`gparted`把`swap`分区删掉，再合并到`/home`。

## 解决问题

刚好之前为了在我的 Archlinux 下实现无损扩容`/`分区, 在常年插在电脑上的移动硬盘中做了一个`gparted`的 live iso, 并且往`grub`
写了记录。遂启动进入，使用`gparted`删除`/swap`分区，合进了`/home`。再次重启，发现交换空间只有 11.6G 了, `/swap`分区也消失了。最后检查`zram`是否启用:

```bash
swapon --show
```

输出:

```txt
NAME       TYPE       SIZE USED PRIO
/dev/zram0 partition 11.6G 2.8G  100
```

大功告成。

> 关于无损扩容分区(尤其是"/"分区), 后面可以开一篇新帖来详细说明。理论上可以实现不依赖外部存储介质启动 live 镜像。

## 最后说明

如果没有开过`/swap`这样的虚拟内存交换空间，那么在配置好`zram-generator`那里就可以了(推荐在刚装系统的时候用)。但大多数人应该和咱一样，肯定是有虚拟内存的吧。因此后面几步大概率免不了，只需要想办法禁用/删除`/swap`分区就好，根据自己的实际情况操作哦。如果你用的是`swapfile`(文件形式的交换空间)，那也应该有对应的禁用方法，也是按照它的方法操作就好了。

自此，我们收获了一个完全运行在内存中的"虚拟内存"机制(本质是把不常用的内存进行压缩), 节省了磁盘 I/O 和寿命又带来速度的大幅提升，一举两得。
联想到计算机组成原理中学到的缓存机制设计(比如 CPU 的 Cache 将内存里的东西放到离 CPU 更近的地方)和城市的构造，不禁感慨生活便利的地方一定是必需设施离自己都很近的地方，城市的高效率必然离不开高效的物流。

---

如果觉得有用，欢迎分享给其他需要帮助的人啦。
