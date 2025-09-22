# 记一次 curl 证书无法信任的问题和解决过程

:::subtitle
archlinux 上 curl 自己部署在 vercel 上的博客网站居然无法信任证书, 调查过程和解决方法
:::

:::date
2025-09-22 11:02:00
:::

:::cover
path="/assets-local/covers/evening-traffic.webp"
url="https://fvatprawuixmpa1x.public.blob.vercel-storage.com/images/145c466c166d272ddf922768ecb381e9bfef5722be864eb5ca9d57b039a0982f.webp"
:::

:::category
网络
:::

:::tag
错误排查, SSL 证书, cloudflare
:::

## 事情的起因

在这篇文章编写的时候, Apry 的笔记本还处于很早期, 刚上线的阶段。(SEO 都没怎么做好 🙃)
在开发过程中，由于要做缓存测试看返回的`headers`, 我决定使用`curl`指令来做:

```bash
curl -I https://blog.irise.top
```

让人震惊的是, 输出:

```txt
curl: (60) SSL certificate problem: unable to get local issuer certificate
More details here: https://curl.se/docs/sslcerts.html

curl failed to verify the legitimacy of the server and therefore could not
establish a secure connection to it. To learn more about this situation and
how to fix it, please visit the webpage mentioned above.
```

居然显示无法在本地找到颁发者的证书。这给测试带来了很大的麻烦, 所以我(又一次)研究了一番解决问题的方法, 在这里也分享给大家, 方便给咱们参考。

## 解决过程

这个网站在文章编写的时候使用的方案是: `vercel`做部署, `cloudflare`做前置代理(方便缓存省流和其他爬虫策略管理等)和 自定义域名的 DNS 解析。现在的问题是: 如果直接`curl`原站, 返回`HTTP 200`没问题; 但是`curl`现在的公开域名, 就会出上面的问题。

### 试下其他系统?

在`Windows`下使用`curl`和`Android`上用`termux`进行`curl`都是正常的。

### curl 表示在本地找不到: 先看看本地库版本

既然其他系统正常, 那多半是我的本地有问题。Apry 用 Archlinux 一年了, 开发这个网站也是在 Arch 上, 于是先看本地`ca`相关包的情况:

```bash
pacman -Qi ca-certificates
```

输出显示版本`20240618-1`, 居然这么老?

经过搜索发现还有两个相关库:

```bash
pacman -Qi ca-certificates-mozilla
pacman -Qi ca-certificates-utils
```

`mozilla`的版本比较新, 是`3.116-1`, 此时在 arch 官方 repo 查询是`2025-09-12`更新的, `ca-certificates-utils`和`ca-certificates`一样, `20240618-1`。

两个`20240618-1`的已经在文章编写一个星期前被标记过时了。

### 尝试更新本地库

看着这么老的版本, 虽然多半不是系统没更新的问题(Arch 咱也不敢超过一周不滚阿怕下次就挂了), 不过还是`-S`一下:

```bash
pacman -Syu ca-certificates ca-certificates-mozilla ca-certificates-utils
```

发现全是**重新安装**, 那就是最新的了。此时开始怀疑是库的问题。网上查到更新本地证书存储的指令, 运行:

```bash
sudo update-ca-trust
sudo trust extract-compat
```

重启, 发现`curl`仍然报`(60)`错误(就是上面那个), 于是基本确定是库的问题了。

### 看看 wiki: Arch wiki, 我的伙伴

其实是看`Issue`。经过一番搜索, 确实在`ca-cerificates-mozilla`仓库里面发现了不得了的东西: [ca-certificates-mozilla does not trust sites behind cloudflare / SSL.COM certification](https://gitlab.archlinux.org/archlinux/packaging/packages/nss/-/issues/1)

文中提到:

> Please see 'unable to get local issuer certificate' on connect t specific website. It is intended by Mozilla and Cloudflare is aware of the issue.

[链接](https://gitlab.archlinux.org/archlinux/packaging/packages/nss/-/issues/1#note_272457)

也就是说, `ca-certificate-mozilla`包中大概率移除了我需要的证书。

#### 查看证书链

有了线索的我赶紧去看证书链:

```bash
openssl s_client -connect irise.top:443 -showcerts
```

输出的`root`(二级证书):

```txt
depth=2 C=US, O=SSL Corporation, CN=SSL.com TLS Transit ECC CA R2
verify error:num =20:unable to get local issuer certificate
verify return:1

...

2 s:C =US, O=SSL Corporation, CN=SSL.com TLS Transit ECC CA R2
i:C =GB, ST=Greater Manchester, L=Salford, O=Comodo CA Limited, CN=AAA Certificate Services
a:PKEY: EC, (secp384r1); sigalg: sha256WithRSAEncryption
```

果不其然, 链条在这里断了。看到颁发者是`AAA Certificate Services`, 询问大模型, 得到的回复是:

> AAA Certificate Services 是一个来自 Comodo (现在是 Sectigo) 的比较老的根证书，但它仍然被广泛用于提供向后兼容性。很可能 Arch Linux 在某次 ca-certificates 包的更新中，认为这个根证书过于老旧或有替代品，就将其移除了，而 Cloudflare 为了兼容更多的客户端，依然提供了这条证书链。这就解释了为什么在其他系统（如 Android）上正常，但在你的 Arch 系统上出了问题。

于是前往[`Sectigo`官网](https://www.sectigo.com/resource-library/sectigo-root-intermediate-certificate-files)下载`AAACertificateServices`证书, 看到日期的时候眼前一亮:

> Oct. 12, 2006

19 年前的老证书。。。不管怎样, 下载下来看看。安装:

```bash
cp sudo cp AAACertificateServices.cer /etc/ca-certificates/trust-source/anchors/
```

> ⚠️ 安装证书有风险, 请一定在安装之前验证证书的签发者和来源! 这里 Apry 因为找到的官网并且先用系统的查看器验证了证书能确保没问题, 如果是其他的证书, 请一定要验证, 证书太敏感了 🙏

再次生成:

```bash
sudo trust extract-compat
```

重试`curl`, 输出 `HTTP 200`。

## 继续研究

到这里事情本身结束了。但我的好奇心告诉我一定要搞清楚这件事, 于是接着在`mozilla`的仓库里面排查。

### 真相大白: 被移除的证书

在`bugzilla`中([链接](https://bugzilla.mozilla.org/show_bug.cgi?id=1957685)), 有这么几句说明:

> Per Bug #1937338 and https://wiki.mozilla.org/CA/Root_CA_Lifecycles, please remove the websites trust bit from the following root CAs:
>
> ...
>
> AAA Certificate Services D7A7A0FB5D7E2731D771E9484EBCDEF71D5F0C3E0A2948782BC83EE0EA699EF4 No

查看对应的[政策说明](https://wiki.mozilla.org/CA/Root_CA_Lifecycles):

> For a root CA certificate trusted for server authentication, Mozilla will remove the websites trust bit when the CA key material is more than 15 years old.
> For a root CA certificate trusted for secure email, Mozilla will set the "Distrust for S/MIME After Date" for the CA certificate to 18 years from the CA key material generation date.

这个 issue 的关闭日期是 2025 年 4 月, `sectigo`签发这个证书是 2006 年 10 月, 不对啊? 15 年之后是 2021 年啊? 继续看:

> Key Material Created Removal of Websites Trust Bit Distrust for S/MIME After Date
>
> Before 2006 April 15 | 2025 April 15 | 2028

哦, 应该是给了一个过渡期限。种种证据表明, 证书就是被移除了。福至心灵, 突然想到能不能通过切换`curl`版本来看看是不是确实是这个日期移除的证书。

### 补充验证: 用不同版本的 curl

刚好也可以看看为什么`windows`和`Android`能够`curl`通。于是我用`docker`临时拉取`curl`的不同版本镜像:

| 说明                          | 链接                                     |
| ----------------------------- | ---------------------------------------- |
| `docker` 的 `curl`镜像列表    | https://hub.docker.com/r/curlimages/curl |
| `curl`的发布表(release table) | https://curl.se/docs/releases.html       |

尝试拉取并运行 4 月底以前的版本: `8.13.0`:

```bash
docker run curlimages/curl:8.13.0 -I https://blog.irise.top
```

成功了!!! HTTP 200。

再尝试之后的`8.14.1`:

```bash
docker run curlimages/curl:8.14.1 -I https://blog.irise.top
```

curl (60)报错。

😇 这下彻底明白了。`mozilla`在 4 月底移除了`AAA Services`的证书, 加上`Archlinux`的滚动更新机制始终保持最新，导致我们本地不存在这个证书。再看看`Windows`和我的`Android`手机的版本, 一个是 2024 年的, 一个是 2023 年的, 都很老。

到这里, 本地安装证书解决了问题。当然, 这仅仅是便于我调试用的, 其他用户为了操作还要安装证书太麻烦了, 幸好现在用户还不需要用系统证书来访问, 用浏览器内置的就可以。打算去 Cloudflare 社区看看有没有相关讨论, 没有打算发个工单了。

---

最后: 万能又世界第一善良的 Cloudflare 啊, 更新您下发的代理证书吧 🙏😭
