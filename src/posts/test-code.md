# 测试文章 | 笔记本背后的故事

:::subtitle
用于测试各种元素是否渲染正常的--顺便也可以看看内容, 如果各位看官有兴趣的话
:::

:::date
2025-09-16 14:30:00
:::

:::category
文章测试
:::

:::tag
文章事务
:::

这是一句平白无奇的文字。我们在看着它。时光飞逝, 仅此而已。

这是一句有**强调内容**的文字。很多想法需要形式上的丰富才能准确传达哦。

这是一句有行内代码的文字, 如果设备有键盘, 按下`F12`, 输入`console.log("Hello World")`, 咱们会得到`Hello World`的输出。

```python
# 这是代码块
def hello():
    # 这是注释
    print("Hello World")
```

这是质能转换方程：$E = mc^2$

这是麦克斯韦方程组(微分形式), 我们能看到这篇笔记它功不可没:

$$
\begin{align}
\nabla \times \mathbf{E} &= -\frac{\partial \mathbf{B}}{\partial t} \\
\nabla \times \mathbf{B} &= \mu_0 \mathbf{J} + \mu_0 \varepsilon_0 \frac{\partial \mathbf{E}}{\partial t} \\
\nabla \cdot \mathbf{E} &= \frac{\rho}{\varepsilon_0} \\
\nabla \cdot \mathbf{B} &= 0
\end{align}
$$

其中:

- $\mathbf{E}$ 是电场强度
- $\mathbf{B}$ 是磁感应强度
- $\rho$ 是电荷密度
- $\mathbf{J}$ 是电流密度
- $\varepsilon_0$ 是真空介电常数
- $\mu_0$ 是真空磁导率

下面是各级标题:

# (h1)一个大大的标题, 代表故事的开始

Apry 和计算机的故事缘起 2018 年的秋天。

## (h2)每一个章节的标题, 装着故事的起承转合

## 好看才是最重要的

Apry 接触的第一个领域就是前端。不懂什么`html`, `css`和`javascript`(三件套), 只觉得这个页面画得好好看, 为什么我就只能在黑洞洞的控制台里面输出各种奇奇怪怪的字符呢。于是 Apry 初步尝试了写自己的第一个网页, 然后发现自己的艺术功底确实还是更适合黑洞洞的控制台。

## 后来呢?

但 Apry 不想放弃。因为随着不断的探索, "计算机是为人服务的"这个观点在 Apry 的脑子里越来越成型, 所以后来, 在 Apry 觉得自己的审美有所提升之后, 又回到了前端。非常巧, 发现了一个叫`nwjs`的东西: 哇, 它居然能让我用前端三件套写本地应用, 这不就结合了"好看的界面"和"本地的功能"(当时想法如此)吗? 好, 咱们研究一下。哇, 还有更棒的: `Electron`。
没错, 就是现在被广泛诟病为"浏览器套壳"的`Electron`。 Apry 上大学之后, 不止一次听到身边的人说:

> 为什么我装一个软件就要装一个`Electron`? 我的电脑上运行着一堆`node`和`chromium`, 一个就是大几百 MB, 内存占用也大, 吃不消啊。

(上面是一段引用文字)

但当时的我哪儿懂这个 😂。上手去玩, 学了不少`html`和`css2`基础。没错是`css2`。没有`flex`, 没有`grid`。只有无尽的`absolute`和`relative`, 还有`float`。但当时的我乐此不疲。写`css`如同打地鼠一般, 这里突出了, 那边就凹进去了, 还不知道什么本地服务(`localhost`一类), 每次都要手动刷新。
(甚至用过`dreamweaver`这个软件, 在当时觉得如天兵下凡, 居然有自动刷新, 还能实时预览。)
至于`javascript`, 实在记不清当时学的是什么了。`require`语法, 哦对, 有这个。没有`typescript`, 没有类型检查。有的只是无尽的`undefined`。作用域看不懂(我在这个`js`文件中创建的变量, 为什么在另一个文件里访问不了?), 只有`var`, 不存在`const`和`let`。还有各种教程组成的知识大杂烩:

- 为什么我刚刷新, `document.getElementById()`是`undefined`啊?
- 哦, 要等`DOM`加载完成。那添加事件到底用`addEventListener('load')`还是`window.onload`?
- 哇, 这个`setInterval`好玩。诶? 为什么这个按钮点多了就疯狂弹提示? 我不是间隔了 2 秒吗? 哦, 原来要停止上一个计时器。
- `css`定位到底是个什么东西啊啊啊啊啊 ☹️; 还有, 为什么我的`width: 100%`总是占不满?
- 盒模型是什么 😵, 晕死了...

(上面是无序列表测试)

### (h3)更小的标题, 剧情来到了高潮

就这样(中间搁置了几年), Apry 撑到了`ES6`语法普及的时候, 终于吃到了细糠: `html5`, `css3`和`typescript`。审美也在不断长进, 还认识了`React`, `Vue`等前端框架, 彼时才接触到前端工程化的概念(虽然`webpack`的第一个版本在 2014 年就发布了), 让我真正意义上感受到了原来前端不是一个`index.html`和一个`style.css`和一个`main.js`组成的, 还有`nodejs`这个运行时, `vite`等框架可以让我真正开发能用的网站。到了现在, Apry 已经变成没有下面的东西不会写前端的程度了:

1. `css`要居中, 要响应式? 直接无脑`display: flex`.
2. `React`真的爽。能把数据直接放在`HTML`里面真爽。不用`getElementById`真爽。
3. `css`模块化? 太爽了, `import style from './main.module.css'`, 终于不用费尽心思起`class`名了。
4. `typescript`满足我的代码洁癖了哈哈哈哈, 我就喜欢标一个类型, 把所有东西变得像`C/C++`那样的强类型语言(虽然 ts 只是标记而已, 但这样会感觉自己很严谨 _手动狗头_ )

(上面是有序列表测试)

#### (h4)还有更小的, 是必须突出的重点

就这样, Apry 又接着愉快地写前端了。后来, Apry 喜欢上了`Material Design`(因为干净, 因为返璞归真, 因为会让人想起那个夏天), 又因为日用的原生 Android 而促进这种喜欢。一切的一切汇聚到一起,
现在咱们所在的网站成为了 Apry 前端技术的**集大成者**:

- [x] `Next.js`。最爱的`React`和直观的`App Router`的结合, `SSG`, `SSR`强力驱动。
- [x] `Tailwind css`。Utility first, 不需要额外的`css`文件, 自带一键添加效果的`token`, 比如(`rounded-full`, `ring`)。
- [x] `Material Design`。有幸遇到[Actify](https://actifyjs.com/), 能在我最爱的 MD3 上面用`tailwind css`。
- [x] 还有自己的`markdown`渲染管线, 自己的封面图对象存储管理系统。

我想无需再多言了，在这里随便逛逛吧。感谢听我的胡言乱语。词不达意，深表歉意。

哦，对了，我们还要看看表格是否正常, 放一些个人的其他链接吧, 欢迎来看看哦。

| 名称   | 链接                                        |
| ------ | ------------------------------------------- |
| Github | [Github 主页](https://github.com/creamIcec) |

---

这是测试文章的结尾。
