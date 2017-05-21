#在Ubuntu下搭建VPN服务器
VPN是什么?中文翻译叫做：虚拟专用网络。功能是，在公用网络上建立专用网络，进行加密通讯。

### 适用的场合：
1. 你的公司网络在一个局域网，不能外部访问。有一天你外出度假了，想访问一下公司的内部网络，外网是不能直接访问的。如果公司的网络有一台主机设置了VPN，你就可以通过连上这台VPN主机，来访问公司内部网络啦。

2. 如果你的主机是在国外，你可以在这台主机上配置VPN，然后你的电脑连上VPN之后就可以翻墙啦。

3. 某台服务器(如游戏服务器)限制了一些IP连接到它上面，这时你配置VPN，连上VPN之后，就可以继续访问那台服务器。

### 我们以Ubuntu为例，说一下怎样配置VPN服务器。

1. 查看ec2连接服务器中的帮助信息，用root账户登陆服务器

2. 安装PPTPD

    `sudo apt-get install pptpd`

3. 编辑pptpd.conf文件

    `sudo vi /etc/pptpd.conf`

    取消注释下面内容

    `localip 192.168.0.1`

    `remoteip 192.168.0.234-238,192.168.0.245`

    这几句的意思是：当外部计算机通过pptp联接到vpn后所能拿到的ip地址范围和服务器的ip地址设置。IP就是用上面的就OK

4. 添加用于登陆的账户

    `sudo vi /etc/ppp/chap-secrets`

    格式如下：

    \#client server secret IP addresses

    `cqc pptpd 123456 *`

    从左到右依次是用户名，自己指定。服务器，填写pptpd，密码，自己指定。IP，填*即可。中间用空格分别隔开。

5. 设置DNS解析，编辑pptpd-options文件

    `sudo vi /etc/ppp/pptpd-options`

    找到ms-dns，取消掉注释，并修改DNS地址，这里我推荐大家用:

    Google DNS 8.8.8.8 和 8.8.4.4

    更改为如下内容

    `ms-dns 8.8.8.8`

    `ms-dns 8.8.4.4`

6. 开启转发

    `sudo vi /etc/sysctl.conf`

    取消注释以下内容

    `net.ipv4.ip_forward=1`

    这句话意思是：打开内核IP转发
    更新一下配置

    `sudo sysctl -p`

7. 安装iptables并设置

    `sudo apt-get install iptables`

    `sudo iptables -t nat -A POSTROUTING -s 192.168.0.0/24 -o eth0 -j MASQUERADE`


    后面这句话作用是：立刻让LINUX支持NAT(platinum)

    执行完以上的语句过后，手动打开/etc/sysconfig/iptables进行编辑

    `vim /etc/sysconfig/iptables`
    
    打开之后在`-A INPUT -j REJECT --reject-with icmp-host-prohibited`这条规则之前插入

    `-A INPUT -p gre -j ACCEPT`

    `-A INPUT -p tcp -m tcp --dport 1723 -j ACCEPT`

8. 重新启动服务

    `sudo /etc/init.d/pptpd restart`

    在ubuntu中不存在 /etc/init.d/iptales文件，所以无法使用service等命令来启动iptables，需要用modprobe命令。

    `sudo modprobe ip_tables`

9. 大功告成，VPN服务器就这么配置好啦。
    接下来，利用IP地址，刚才设置的VPN账号和密码，就可以连你的VPN啦。


### 807

PPTP穿透能力本身比较低，很容易被ISP封掉，可以试用不同的电脑或手机等试试连接看看是否ISP问题，还是WIN7问题
如果确认是windows问题，注意win7 home(家庭版)使用PPTP会出现807 或者619错误，但win7pro不会，有关这个问题原因目前无重稽考，连微软官方也没有正面回应，所以给你的建议
1.) 重装一个win 7 pro (但这个不敢保证)
2.) 改用L2TP或open VPN代替
我是改用了open VPN, 选择他的原因是安全性和穿透能力都极高，是目前最理想的VPN协议！