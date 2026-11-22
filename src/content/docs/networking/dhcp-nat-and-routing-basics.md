---
title: DHCP, NAT and routing basics
description: See how a machine receives its network settings from DHCP, how the routing table decides where each packet goes, and how NAT lets a whole home share one public address.
lesson: "6.6"
time: 20 min
sidebar:
  order: 6
---

You sit down in a café, open your laptop, pick the Wi-Fi, and ten seconds later a web page loads. Nobody asked you for an IP address, a mask or a router, and your laptop had never seen this network before. Three quiet mechanisms did the work: one handed your laptop its settings, one decided where to send each packet, and one let the whole café share a single address on the internet.

## Goal

After this lesson you can:

- Name the four settings a machine needs on a network and explain how DHCP provides them.
- Read a routing table and say where a packet for a given address will be sent.
- Explain what NAT changes in a packet and why home networks need it.

## Why it matters

"I am connected to the Wi-Fi but nothing works" is nearly always one of these three: no address, no route, or no translation. For security work the picture is just as useful: what sits behind a home router, what a server can and cannot see about its visitors, and why a machine with a private address is not directly reachable from outside.

## The idea

### DHCP: getting your settings

To use a network, a machine needs four settings: an IP address, a prefix or mask, the address of the router that leads out, and the address of a DNS resolver. **DHCP** (Dynamic Host Configuration Protocol) hands out all four automatically.

It works like the reception of a hotel. You arrive with no room. The reception gives you a room number, tells you where the exit is and where the information desk is, and notes how long you are staying. Before the stay ends, you can extend it.

The real exchange has four messages, sent over UDP:

1. **Discover**: your machine shouts to the whole local network, "Is there a DHCP server here?"
2. **Offer**: the server answers, "You can have `192.168.1.37`."
3. **Request**: your machine says, "I will take it."
4. **Acknowledge**: the server confirms and adds the mask, the router and the DNS resolver.

The address is not yours forever. It is a **lease** with a lifetime, often one day, and your machine renews it in the background. At home, the DHCP server is a small program inside your internet box.

If no DHCP server answers, the machine has none of the four settings and cannot talk to anyone. Windows and macOS then give themselves an address that starts with `169.254`, which is a clear sign that DHCP failed.

### Routing: choosing the next step

A **router** is a device connected to two or more networks that passes packets from one to the other. The router your machine uses to leave its own network is its **default gateway**.

Every machine, and every router, keeps a **routing table**: a short list of rules that say "packets for this range of addresses go out this way". For each packet the system picks the rule with the longest prefix that matches the destination. The rule called `default` matches everything, so it is used when nothing more specific fits.

Nobody plans the whole trip. Your machine only decides the first step: deliver directly, or hand over to the gateway. The gateway looks at its own table and decides the next step, and so on. Each step from one router to the next is called a **hop**.

### NAT: sharing one public address

Your internet provider gives your home one public address. Your devices use private addresses, which cannot travel on the internet (lesson 6.2). **NAT** (Network Address Translation) connects the two worlds, and it runs on your home router.

<figure class="diagram">
<svg viewBox="0 0 600 200" role="img" aria-labelledby="nat-title nat-desc">
<title id="nat-title">NAT on a home router</title>
<desc id="nat-desc">Three boxes in a row joined by lines. On the left a laptop with the private address 192.168.1.37. In the middle, highlighted, the home router doing NAT. On the right a web server with the address 198.51.100.7. The left side is labelled private network and the right side is labelled the internet. Under the left line the packet has the source 192.168.1.37 port 51514. Under the right line the same packet has the source 203.0.113.5 port 40001. A line at the bottom says that the router remembers that port 40001 belongs to 192.168.1.37 port 51514.</desc>
<path class="d-line" d="M160 80 H225 M375 80 H440"/>
<rect class="d-box" x="10" y="50" width="150" height="60"/>
<rect class="d-box d-hot" x="225" y="50" width="150" height="60"/>
<rect class="d-box" x="440" y="50" width="150" height="60"/>
<text x="150" y="28">Private network</text>
<text x="450" y="28">The internet</text>
<text x="85" y="76">Laptop</text>
<text x="85" y="96">192.168.1.37</text>
<text x="300" y="76">Home router</text>
<text x="300" y="96">NAT</text>
<text x="515" y="76">Web server</text>
<text x="515" y="96">198.51.100.7</text>
<text x="150" y="140">source 192.168.1.37:51514</text>
<text x="450" y="140">source 203.0.113.5:40001</text>
<text x="300" y="182">Router's note: 40001 = 192.168.1.37:51514</text>
</svg>
<figcaption>The router has two addresses: 192.168.1.1 on the private side and the public address 203.0.113.5 on the internet side.</figcaption>
</figure>

When a packet leaves, the router replaces the private source address and port with its own public address and a port it chooses, and writes the pair down. The web server only ever sees the public address. When the answer comes back, the router looks up its note, puts the private address back, and delivers the packet to the laptop.

One consequence: a packet that arrives from the internet without a matching note has nowhere to go, and the router drops it. Machines behind NAT can start conversations, but outsiders cannot start one with them unless the router is told to forward a port.

## Try it

You will read the settings of your own machine. The outputs come from a small virtual machine, so its network is tiny: `10.0.2.0/24`, with the gateway at `10.0.2.2`. Yours will have other addresses.

### 1. Read the four settings

<!-- lab: nocheck -->
```bash
ip -4 -br addr
```

```output
lo               UNKNOWN        127.0.0.1/8
enp0s2           UP             10.0.2.15/24 metric 100
```

Settings one and two: the address `10.0.2.15` and the prefix `/24`.

<!-- lab: nocheck -->
```bash
ip route
```

```output
default via 10.0.2.2 dev enp0s2 proto dhcp src 10.0.2.15 metric 100
10.0.2.0/24 dev enp0s2 proto kernel scope link src 10.0.2.15 metric 100
10.0.2.2 dev enp0s2 proto dhcp scope link src 10.0.2.15 metric 100
10.0.2.3 dev enp0s2 proto dhcp scope link src 10.0.2.15 metric 100
```

Setting three is in the line that starts with `default`: the gateway is `10.0.2.2`. The words `proto dhcp` say where this route came from.

<!-- lab: nocheck -->
```bash
resolvectl dns
```

```output
Global:
Link 2 (enp0s2): 10.0.2.3
```

Setting four: the DNS resolver, `10.0.2.3`. On WSL this command may answer that the service is not running. In that case, look at the `nameserver` line of `/etc/resolv.conf`.

### 2. Look at the DHCP lease

<!-- lab: nocheck -->
```bash
cat /run/systemd/netif/leases/*
```

```output
# This is private data. Do not parse.
ADDRESS=10.0.2.15
NETMASK=255.255.255.0
ROUTER=10.0.2.2
SERVER_ADDRESS=10.0.2.2
NEXT_SERVER=10.0.2.2
T1=12h
T2=21h
LIFETIME=1d
DNS=10.0.2.3
CLIENTID=ff5cbbeb5e00020000ab115465bf0c0eeff24c
```

This is the note your machine keeps about its lease, and the four settings are all there: `ADDRESS`, `NETMASK`, `ROUTER` and `DNS`. `LIFETIME=1d` says the lease is valid for one day. `SERVER_ADDRESS` is the DHCP server that gave it.

:::note[No such file?]
This file exists on Ubuntu machines that manage their own network, such as a server or a virtual machine. On WSL and in Codespaces the address is set from outside, by Windows or by the container system, so there is no lease to show. Read the output above instead, and keep going: every other step works everywhere.
:::

### 3. Read the routing table

Look again at the output of `ip route` from step 1. Each line is one rule:

- `default via 10.0.2.2 dev enp0s2`: for any destination with no better rule, hand the packet to the gateway `10.0.2.2`, through the interface `enp0s2`.
- `10.0.2.0/24 dev enp0s2 ... scope link`: addresses in `10.0.2.0/24` are on the network this interface is plugged into. Deliver directly, no router needed.
- The last two lines are single-address rules for the gateway and the DNS resolver themselves. DHCP added them, and they say the same thing: deliver directly.

### 4. Ask where a packet would go

`ip route get` asks the system which rule it would use for one destination. It sends nothing.

<!-- lab: nocheck -->
```bash
ip route get 10.0.2.3
```

```output
10.0.2.3 dev enp0s2 src 10.0.2.15 uid 1000
    cache
```

An address inside the local network: there is no `via`, so the packet would be delivered directly.

<!-- lab: nocheck -->
```bash
ip route get 1.1.1.1
```

```output
1.1.1.1 via 10.0.2.2 dev enp0s2 src 10.0.2.15 uid 1000
    cache
```

An address somewhere on the internet: `via 10.0.2.2`. Only the `default` rule matched, so the packet would be handed to the gateway.

<!-- lab: nocheck -->
```bash
ip route get 127.0.0.1
```

```output
local 127.0.0.1 dev lo src 127.0.0.1 uid 1000
    cache <local>
```

The word `local` and `dev lo` mean the packet never leaves the machine. It goes through the loopback interface.

### 5. Find the gateway on the link layer

<!-- lab: run
ping -c 1 -W 2 10.0.2.2 > /dev/null 2>&1
-->

<!-- lab: nocheck -->
```bash
ip neigh
```

```output
10.0.2.3 dev enp0s2 lladdr 52:55:0a:00:02:03 STALE
10.0.2.2 dev enp0s2 lladdr 52:55:0a:00:02:02 REACHABLE
fe80::2 dev enp0s2 lladdr 52:56:00:00:00:02 router STALE
fec0::2 dev enp0s2 lladdr 52:56:00:00:00:02 router STALE
```

This is the neighbour table: the IP addresses your machine has talked to on its own network, and the MAC address of each one. When you send a packet to `1.1.1.1`, the IP header says `1.1.1.1`, but the frame around it is addressed to the MAC address of the gateway `10.0.2.2`. The link layer only carries the packet for one hop, as lesson 6.1 promised.

### 6. Check whether your address needs NAT

```python
import ipaddress

print(ipaddress.ip_address("10.0.2.15").is_private)
```

```output
True
```

Put your own address in the quotes. `True` means the address is private. It cannot appear on the internet, so somewhere between you and the websites you visit, a router replaces it with a public one. For this virtual machine, the program that runs it does the translation. At home, it is your internet box.

### 7. Check whether your machine is a router

```bash
cat /proc/sys/net/ipv4/ip_forward
```

```output
0
```

`0` means "no": if this machine receives a packet that is addressed to someone else, it drops it. A router is a machine where this setting is `1`, so it passes such packets on. If you see `1` on your own machine, a program has probably turned it on, for example Docker to connect its containers.

## Exercise

A laptop has this routing table:

```text
default via 192.168.1.1 dev wlan0
192.168.1.0/24 dev wlan0 scope link
172.17.0.0/16 dev docker0 scope link
```

1. For each destination, say which rule is used and whether the packet goes through the gateway: `192.168.1.50`, `172.17.0.2`, `8.8.8.8`.
2. The laptop has the address `192.168.1.37`, and the home router has the public address `203.0.113.5`. The laptop requests a page from the web server `198.51.100.7`. Which source address does the server see? To which address does it send its answer?
3. On your own machine, find the address of your default gateway. Then run `ip route get` for the gateway and for `9.9.9.9`, and explain the difference between the two answers.

<details>
<summary>Show the solution</summary>

1. `192.168.1.50` matches `192.168.1.0/24`: delivered directly through `wlan0`. `172.17.0.2` matches `172.17.0.0/16`: delivered directly through `docker0`. `8.8.8.8` matches only `default`: handed to the gateway `192.168.1.1`.
2. The server sees the source address `203.0.113.5`, the public address of the router, and sends its answer there. The router then uses its NAT note to pass the answer on to `192.168.1.37`.
3. On the machine used in this lesson:

   <!-- lab: nocheck -->
   ```bash
   ip route | grep default
   ip route get 10.0.2.2
   ip route get 9.9.9.9
   ```

   ```output
   default via 10.0.2.2 dev enp0s2 proto dhcp src 10.0.2.15 metric 100
   10.0.2.2 dev enp0s2 src 10.0.2.15 uid 1000
       cache
   9.9.9.9 via 10.0.2.2 dev enp0s2 src 10.0.2.15 uid 1000
       cache
   ```

   The gateway itself is on the local network, so its answer has no `via`: direct delivery. `9.9.9.9` is outside, so its answer says `via` the gateway.

</details>

## Check yourself

**1. Which four settings does DHCP give a machine?**

<details>
<summary>Answer</summary>

An IP address, the mask or prefix, the default gateway, and the address of a DNS resolver. They come with a lease time.

</details>

**2. A routing table has a rule for `10.0.2.0/24` and a `default` rule. Which one is used for `10.0.2.77`, and why?**

<details>
<summary>Answer</summary>

The rule for `10.0.2.0/24`. Both rules match, and the one with the longest prefix wins. `default` is only used when nothing more specific matches.

</details>

**3. What does a NAT router change in a packet that leaves your home?**

<details>
<summary>Answer</summary>

It replaces the private source address and port with its own public address and a port it chooses, and remembers the pair, so that it can undo the change when the answer comes back.

</details>

**4. Why can a server on the internet not start a connection to your laptop at home?**

<details>
<summary>Answer</summary>

The laptop has a private address, which is not routed on the internet. The only reachable address is the router's public one, and the router has no NAT note for a conversation that the laptop did not start, so it drops the packet.

</details>

**5. A Windows laptop shows the address `169.254.12.7`, and nothing works. Which of the three mechanisms failed?**

<details>
<summary>Answer</summary>

DHCP. An address that starts with `169.254` is one the machine gave itself because no DHCP server answered. Without a lease it has no usable address, no gateway and no resolver.

</details>

## Common mistakes

- **Looking for the problem on the internet when the gateway is missing.** If `ip route` shows no `default` line, nothing outside your own network can work. Fix the local network first.
- **Believing a private address is your address on the internet.** Websites see the public address of your router, which is shared by everyone in your home.
- **Treating NAT as a firewall.** NAT blocks unexpected incoming packets only as a side effect. It was designed to save addresses, not to protect you. A real firewall is a separate thing, covered in Module 11.
- **Assuming your address never changes.** A DHCP lease can end, and the next one may be a different address. Servers that must keep their address are configured with a fixed one.
- **Thinking your machine knows the whole route.** It knows one step: direct delivery or the gateway. Every router after that decides its own next hop.

## Key terms

- **DHCP**: the protocol that automatically gives a machine its IP address, mask, default gateway and DNS resolver.
- **Lease**: the permission to use an address for a limited time, given by a DHCP server.
- **Router**: a device connected to several networks that forwards packets between them.
- **Default gateway**: the router a machine sends packets to when the destination is not on its own network.
- **Routing table**: the list of rules a machine or router uses to choose where to send each packet.
- **Hop**: one step of a packet's trip, from one router to the next.
- **NAT**: Network Address Translation. A router rewrites addresses in packets so that many machines with private addresses can share one public address.

## Go further

- [RFC 2131: Dynamic Host Configuration Protocol](https://www.rfc-editor.org/rfc/rfc2131): the DHCP standard. Section 3.1 walks through the four messages.
- [RFC 3022: Traditional IP Network Address Translator](https://www.rfc-editor.org/rfc/rfc3022): how NAT works, written by the people who standardised it.
- [ip-route(8) manual page](https://manpages.ubuntu.com/manpages/noble/man8/ip-route.8.html): the reference for `ip route` and `ip route get`.
