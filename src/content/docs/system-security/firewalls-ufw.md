---
title: Firewalls (ufw)
description: Turn on Ubuntu's firewall with ufw, start from "deny incoming by default", and open only the ports you choose, then test the rules from a second network.
lesson: "11.3"
time: 25 min
sidebar:
  order: 3
---

<!-- lab: run
sudo ufw --force reset > /dev/null
sudo ip netns del visitor 2>/dev/null
pkill -f http.server
true
-->

In lesson 11.1 you closed a door by removing the FTP server. But tomorrow you, or a package you install, may open another one without noticing. A firewall is the second line: even when a program listens on a port, the firewall decides whether anyone outside may reach it. In this lesson you build a small test network inside your own machine and watch the firewall drop traffic in real time.

## Goal

After this lesson you can:

- Turn on the firewall with "deny incoming" as the default, without locking out SSH.
- Allow one port, for everyone or for a single address, and remove the rule again.
- Test a rule from a second network, and explain why a test from the machine itself proves nothing.

## Why it matters

Services get installed by accident, test servers get started on `0.0.0.0` and forgotten, and updates sometimes add listeners. A firewall with a default of "deny" turns each of these from an open door into a closed one, until you decide otherwise. It is also how you say "this database may be reached by the web server, and by nobody else", which no setting inside the database can say as clearly.

## The idea

A **firewall** is a set of rules that the kernel checks for every packet that arrives or leaves. Each rule says which packets it matches (port, protocol, source address) and what to do with them. A packet that matches no rule gets the **default policy**.

The safe way to build rules is **deny by default**: incoming traffic is refused unless a rule allows it. You then write one allow rule per service that must be reachable. It is a guest list at a door: the bouncer does not keep a list of everyone who may not come in, only of the few who may. A new service that you forgot about is simply not on the list.

Linux's firewall lives in the kernel, and its rules are written with tools called `iptables` or `nftables`. Their syntax is powerful but long. **ufw**, the Uncomplicated Firewall, is Ubuntu's front end for them: you say `ufw allow 22/tcp` and it writes the kernel rules for you.

A firewall can refuse a packet in two ways:

| Action | What the firewall does | What the sender sees |
|---|---|---|
| `deny` | Drops the packet silently | Nothing: the connection times out after a while |
| `reject` | Drops it and sends back a refusal | `Connection refused` at once |
| `allow` | Lets it through | The service answers (or `Connection refused` if nothing listens) |

To test rules you need traffic that comes from outside. Traffic from the machine to itself travels over the loopback interface, and ufw always allows loopback, so it never meets your rules. Here you build a second "computer" inside your machine: a network namespace (Module 5) called `visitor`, with its own network card, joined to your machine by a virtual cable.

<figure class="diagram">
<svg viewBox="0 0 560 190" role="img" aria-labelledby="fw-title fw-desc">
<title id="fw-title">The test network of this lesson</title>
<desc id="fw-desc">On the left, the visitor namespace with the address 10.99.0.2. A line, the virtual cable, joins it to the lab machine on the right, whose address on that cable is 10.99.0.1. Inside the lab machine, the firewall ufw stands between the cable and the services: the SSH server on port 22 and a test web server on port 8080. Traffic from the machine to itself uses the loopback interface and does not pass the firewall rules.</desc>
<rect class="d-box" x="10" y="55" width="140" height="80"/>
<text x="80" y="88">visitor</text>
<text x="80" y="112">10.99.0.2</text>
<path class="d-line d-hot" d="M150 95 H250"/>
<text x="200" y="82">virtual cable</text>
<rect class="d-box" x="250" y="10" width="300" height="170"/>
<text x="400" y="34">lab machine, 10.99.0.1</text>
<rect class="d-box d-hot" x="265" y="55" width="60" height="80"/>
<text x="295" y="100">ufw</text>
<path class="d-line" d="M325 75 H390 M325 115 H390"/>
<rect class="d-box" x="390" y="55" width="145" height="34"/>
<text x="462" y="77">sshd :22</text>
<rect class="d-box" x="390" y="101" width="145" height="34"/>
<text x="462" y="123">web server :8080</text>
<text x="400" y="165">loopback skips the rules</text>
</svg>
<figcaption>Packets from <code>visitor</code> must pass ufw. Packets the machine sends to itself never meet the rules.</figcaption>
</figure>

:::note[Where this works]
ufw needs a full Linux that may change its own network rules: WSL, a virtual machine, or Linux on a real computer. In GitHub Codespaces these commands will most likely fail, because a Codespace is a container, and containers are normally not allowed to change the network rules of the machine.
:::

## Try it

The outputs come from a lab machine called `lab` with the user `sam`. If your machine already uses addresses starting with `10.99.0.`, which is rare, pick another number such as `10.98.0.` everywhere in this lesson.

### 1. Check the firewall

```bash
sudo ufw status
```

```output
Status: inactive
```

On a fresh Ubuntu the firewall is installed but switched off: everything that listens can be reached.

### 2. Build the visitor

```bash
mkdir -p ~/netlab
cd ~/netlab
```

```bash title="make-visitor.sh"
#!/bin/bash
# Builds a pretend second computer called "visitor" (lesson 11.3).
# Run it with sudo. It is safe to run again.
ip netns del visitor 2>/dev/null
ip netns add visitor
ip link add veth-host type veth peer name veth-visitor
ip link set veth-visitor netns visitor
ip addr add 10.99.0.1/24 dev veth-host
ip link set veth-host up
ip netns exec visitor ip addr add 10.99.0.2/24 dev veth-visitor
ip netns exec visitor ip link set veth-visitor up
ip netns exec visitor ip link set lo up
```

Save this file as `~/netlab/make-visitor.sh`. You do not need to remember these commands. In short: it creates the namespace, creates a virtual cable with two ends (a **veth pair**), pushes one end into the namespace, and gives each end an address.

```bash
sudo bash make-visitor.sh
ip -4 addr show veth-host | grep inet
```

```output
    inet 10.99.0.1/24 scope global veth-host
```

Your machine now has a new network card, `veth-host`, with the address `10.99.0.1`. `sudo ip netns exec visitor command` runs a command inside the visitor, as if you sat at that other computer:

<!-- lab: nocheck -->
```bash
sudo ip netns exec visitor ping -c 1 10.99.0.1
```

```output
PING 10.99.0.1 (10.99.0.1) 56(84) bytes of data.
64 bytes from 10.99.0.1: icmp_seq=1 ttl=64 time=2.29 ms

--- 10.99.0.1 ping statistics ---
1 packets transmitted, 1 received, 0% packet loss, time 0ms
rtt min/avg/max/mdev = 2.287/2.287/2.287/0.000 ms
```

The cable works. The namespace disappears when you restart your computer: just run the script again.

### 3. Start a test server and reach it from the visitor

```bash
python3 -m http.server 8080 > server.log 2>&1 &
```

<!-- lab: run
for i in $(seq 100); do ss -ltn | grep -q ':8080 ' && break; sleep 0.2; done
-->

```bash
sudo ip netns exec visitor curl -s -o /dev/null -w '%{http_code}\n' http://10.99.0.1:8080/
```

```output
200
```

This server listens on every address, the classic forgotten test server. `-w '%{http_code}\n'` makes `curl` print only the HTTP status code, and `200` means the visitor got the page. Right now, anyone who can reach your machine can read the files in `~/netlab`.

### 4. Set the defaults and allow SSH

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
```

```output
Default incoming policy changed to 'deny'
(be sure to update your rules accordingly)
Default outgoing policy changed to 'allow'
(be sure to update your rules accordingly)
```

Nothing is blocked yet, because the firewall is still off. Before you switch it on, allow SSH. On a remote server this is the rule that keeps you connected.

```bash
sudo ufw app list
sudo ufw allow OpenSSH
```

```output
Available applications:
  OpenSSH
Rules updated
Rules updated (v6)
```

Packages can bring an **application profile**, a named list of ports, so you can allow `OpenSSH` instead of remembering `22/tcp`. ufw wrote the rule twice: once for IPv4 and once for IPv6.

### 5. Switch the firewall on

<!-- lab: skip -->
```bash
sudo ufw enable
```

```output
Command may disrupt existing ssh connections. Proceed with operation (y|n)? y
Firewall is active and enabled on system startup
```

<!-- lab: run
sudo ufw --force enable > /dev/null
-->

ufw warns you about SSH, because enabling a firewall without an SSH rule is the classic way to lock yourself out of a server. You allowed SSH in step 4, so type `y`. The firewall now starts at every boot too.

```bash
sudo ufw status verbose
```

```output
Status: active
Logging: on (low)
Default: deny (incoming), allow (outgoing), disabled (routed)
New profiles: skip

To                         Action      From
--                         ------      ----
22/tcp (OpenSSH)           ALLOW IN    Anywhere
22/tcp (OpenSSH (v6))      ALLOW IN    Anywhere (v6)
```

Read it from the top: the firewall is on, it logs blocked packets (lesson 11.6 reads that log), incoming traffic is denied unless a rule says otherwise, and the only rule allows port 22. `routed` is about traffic that passes through the machine to somewhere else, which a normal computer does not do.

### 6. Test from the visitor, then from the machine itself

```bash
sudo ip netns exec visitor curl -s -m 3 -o /dev/null -w '%{http_code}\n' http://10.99.0.1:8080/
```

```output
000
```

`-m 3` tells `curl` to give up after 3 seconds. It waited, got nothing, and printed `000`, which means "no HTTP answer at all". The server is still running, but the firewall dropped the visitor's packets: this is `deny` in action. SSH, which has a rule, still works from the visitor:

```bash
sudo ip netns exec visitor nc -zv -w 3 10.99.0.1 22
```

```output
Connection to 10.99.0.1 22 port [tcp/ssh] succeeded!
```

Now the same web request from the machine itself:

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://10.99.0.1:8080/
```

```output
200
```

It works, although it uses the same address. Traffic from the machine to itself goes over loopback, which ufw always allows. A firewall test from the machine you are protecting tells you nothing about what others see.

### 7. Allow one port for one address

```bash
sudo ufw allow from 10.99.0.2 to any port 8080 proto tcp
sudo ip netns exec visitor curl -s -m 3 -o /dev/null -w '%{http_code}\n' http://10.99.0.1:8080/
```

```output
Rule added
200
```

Read the rule as a sentence: allow traffic from `10.99.0.2` to any of my addresses, on port 8080, for TCP. Only the visitor gets in. Any other machine would still be dropped. This is how real servers open a database to the web server and to nobody else.

```bash
sudo ufw status numbered
```

```output
Status: active

     To                         Action      From
     --                         ------      ----
[ 1] OpenSSH                    ALLOW IN    Anywhere
[ 2] 8080/tcp                   ALLOW IN    10.99.0.2
[ 3] OpenSSH (v6)               ALLOW IN    Anywhere (v6)
```

`numbered` adds a number to each rule. ufw checks rules from the top and stops at the first one that matches, so order matters when rules overlap.

### 8. Remove the rule

```bash
sudo ufw delete allow from 10.99.0.2 to any port 8080 proto tcp
sudo ip netns exec visitor curl -s -m 3 -o /dev/null -w '%{http_code}\n' http://10.99.0.1:8080/
```

```output
Rule deleted
000
```

To delete a rule, write `delete` in front of the same rule. You can also delete by number with `sudo ufw delete 2`, which asks for confirmation first. The visitor is shut out again.

:::caution[Keep SSH allowed]
On a remote machine, never delete the SSH rule or run `sudo ufw reset` while the firewall is on and you are logged in over SSH. Check `sudo ufw status` before you log out. Your firewall stays on for the rest of this module, with SSH allowed.
:::

## Exercise

Port 8080 now times out for the visitor, which is `deny`. For a service inside a company network, a quick "refused" can be friendlier than a long wait.

1. Make the firewall reject, instead of drop, TCP traffic to port 8080.
2. Show the difference from the visitor with `nc -zv -w 3 10.99.0.1 8080`.
3. Remove the rule, then stop the test server.

<details>
<summary>Show the solution</summary>

```bash
sudo ufw reject 8080/tcp
sudo ip netns exec visitor nc -zv -w 3 10.99.0.1 8080
```

```output
Rule added
Rule added (v6)
nc: connect to 10.99.0.1 port 8080 (tcp) failed: Connection refused
```

The answer comes at once: the firewall sent back a refusal. With `deny`, `nc` would wait 3 seconds and report `timed out` instead. The refusal looks the same as a closed port, so the visitor cannot tell that a server is there.

```bash
sudo ufw delete reject 8080/tcp
pkill -f http.server
```

```output
Rule deleted
Rule deleted (v6)
```

</details>

## Check yourself

**1. What does "deny by default" mean, and why is it safer than writing a rule for each thing you want to block?**

<details>
<summary>Answer</summary>

Incoming traffic is refused unless a rule allows it. You only list the few services that must be reachable, so a service you forgot about, or one a package started, is blocked without any work from you. A list of things to block is never complete.

</details>

**2. Why do you run `sudo ufw allow OpenSSH` before `sudo ufw enable` on a server?**

<details>
<summary>Answer</summary>

With the default set to deny, enabling the firewall without an SSH rule would block new SSH connections, and you could lock yourself out of a remote machine.

</details>

**3. `curl http://10.99.0.1:8080/` works on the machine itself but times out from the visitor. Why?**

<details>
<summary>Answer</summary>

Traffic from the machine to itself goes over the loopback interface, which ufw always allows, so it never meets the rules. The visitor's packets arrive on a real network interface and are dropped by the default deny.

</details>

**4. What does the visitor see with a `deny` rule, and what does it see with a `reject` rule?**

<details>
<summary>Answer</summary>

With `deny` the packets are dropped silently, so the connection waits and times out. With `reject` the firewall sends back a refusal, so the visitor sees `Connection refused` at once.

</details>

**5. What does `sudo ufw allow from 10.99.0.2 to any port 8080 proto tcp` allow, and what does it still block?**

<details>
<summary>Answer</summary>

It allows TCP connections to port 8080 from the address `10.99.0.2` only. Traffic to port 8080 from every other address is still dropped by the default policy.

</details>

## Common mistakes

- **Enabling the firewall before allowing SSH.** On a remote server that can cut you off. Always run `sudo ufw allow OpenSSH` first and read `sudo ufw status` before you log out.
- **Testing the firewall from the machine itself.** Loopback skips the rules, so everything looks open. Test from another machine, or from a namespace as in this lesson.
- **Opening a port "for a minute" and forgetting it.** Use `sudo ufw status numbered` and delete the rules you no longer need.
- **Allowing a port to everyone when one address is enough.** `allow from ADDRESS to any port N` is as easy to type and keeps everyone else out.
- **Thinking a firewall fixes a weak service.** Whoever is allowed in still reaches the service as it is. The firewall decides who may knock, not what happens after the door opens.

## Key terms

- **Firewall**: a set of rules, checked by the kernel, that decides which network packets may come in or go out.
- **Default policy**: what the firewall does with a packet that matches no rule.
- **Deny by default**: a firewall setup where incoming traffic is refused unless a rule allows it.
- **ufw**: the Uncomplicated Firewall, Ubuntu's simple front end to the Linux kernel's firewall.
- **Application profile**: a named list of ports that a package gives ufw, such as `OpenSSH` for port 22/tcp.
- **veth pair**: two virtual network cards joined like the two ends of one cable.

## Go further

- [Ubuntu Server documentation: Firewall](https://ubuntu.com/server/docs/firewalls): ufw from the people who make Ubuntu, including logging and application profiles.
- [ufw manual page](https://manpages.ubuntu.com/manpages/noble/man8/ufw.8.html): every ufw command and rule form, with examples.
- [ip-netns manual page](https://manpages.ubuntu.com/manpages/noble/man8/ip-netns.8.html): how network namespaces work, if you want to build bigger test networks.
