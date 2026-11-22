---
title: IP addresses and subnetting
description: Read an IPv4 address and its mask, work out which network it belongs to and which addresses that network contains, and recognise private, loopback and IPv6 addresses.
lesson: "6.2"
time: 25 min
sidebar:
  order: 2
---

Your laptop says its address is `192.168.1.37/24`. Your phone, on the same Wi-Fi, has `192.168.1.52`. A server on the internet has `8.8.8.8`. Two of these three can talk to each other directly, and one can only be reached through a router. The `/24` is what decides it, and by the end of this lesson you can work that out with a pencil.

## Goal

After this lesson you can:

- Split an IPv4 address into its network part and its host part.
- Work out the network address, the broadcast address and the usable host range of a network.
- Recognise private, loopback and IPv6 addresses when you see them.

## Why it matters

Every packet carries two IP addresses, and every machine decides where to send a packet by comparing addresses with masks. Firewall rules, cloud networks, VPNs and router settings are all written as ranges such as `10.0.0.0/8`. If you cannot read that notation, you cannot tell what a rule allows. One wrong prefix length can open a server to the whole internet instead of one office.

## The idea

An **IP address** identifies one network interface on a network. The version you meet most, **IPv4**, uses 32 bits. Nobody wants to read 32 bits, so they are written as four decimal numbers separated by dots. Each number stands for 8 bits, called an **octet**, so each one is between 0 and 255.

An address has two parts, like a postal address has a street and a house number. The **network part** says which network the machine is on. The **host part** says which machine it is on that network. The **prefix length**, the number after the slash, tells you where the cut is: `/24` means "the first 24 bits are the network part".

```text
address    192      .168      .1        .37
in bits    11000000  10101000  00000001  00100101
/24        |------- network part -----|  | host |
mask       11111111  11111111  11111111  00000000
           255      .255      .255      .0
```

The **subnet mask** says the same thing as the prefix length, in the older dotted form: a 1 for every network bit, a 0 for every host bit. So `/24` and `255.255.255.0` are two ways to write one fact. The slash form is called **CIDR notation**.

From an address and a prefix you can work out the whole network:

- Set every host bit to 0 and you get the **network address**, the name of the network itself: `192.168.1.0`.
- Set every host bit to 1 and you get the **broadcast address**, which means "everyone on this network": `192.168.1.255`.
- Everything in between can be given to machines: `192.168.1.1` to `192.168.1.254`.

With 8 host bits there are 2<sup>8</sup> = 256 addresses, and 256 − 2 = 254 of them are usable. That answers the opening question. The phone at `192.168.1.52` is inside this range, so the laptop sends to it directly. `8.8.8.8` is outside, so the laptop hands the packet to its router, the device that connects the home network to the internet (lesson 6.6 explains how).

### Cutting a network into subnets

A **subnet** is a smaller network cut out of a bigger one. Move the cut two bits to the right, to `/26`, and the last octet has 2 network bits and 6 host bits. Each subnet now has 2<sup>6</sup> = 64 addresses, so `192.168.1.0/24` splits into four subnets that start at 0, 64, 128 and 192.

Take `192.168.1.37/26`. The number 37 is between 0 and 63, so the network address is `192.168.1.0`, the broadcast address is `192.168.1.63`, and the usable hosts are `.1` to `.62`.

| Prefix | Mask | Addresses | Usable hosts |
|---|---|---|---|
| `/8` | `255.0.0.0` | 16,777,216 | 16,777,214 |
| `/16` | `255.255.0.0` | 65,536 | 65,534 |
| `/24` | `255.255.255.0` | 256 | 254 |
| `/25` | `255.255.255.128` | 128 | 126 |
| `/26` | `255.255.255.192` | 64 | 62 |
| `/28` | `255.255.255.240` | 16 | 14 |
| `/30` | `255.255.255.252` | 4 | 2 |
| `/32` | `255.255.255.255` | 1 | one single address |

A longer prefix means a smaller network. Beginners often read it the other way round.

### Addresses with a special meaning

| Range | Meaning |
|---|---|
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16` | **Private addresses**: free to use inside any home or company network, never routed on the public internet |
| `127.0.0.0/8` | Loopback: your own machine. `127.0.0.1` is the one everybody uses |
| `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24` | Reserved for examples in books and courses, like this one |

Almost everything else is a **public address**: unique in the world and reachable across the internet.

### IPv6 in two minutes

IPv4 has about 4.3 billion addresses, fewer than there are phones. **IPv6** fixes that with 128 bits. An IPv6 address is written as eight groups of four hexadecimal digits, separated by colons: `2001:0db8:0000:0000:0000:8a2e:0370:7334`.

Two rules make it shorter. Leading zeros in a group can be dropped, and one run of all-zero groups can be replaced by `::`. The address above becomes `2001:db8::8a2e:370:7334`. The prefix idea is the same as in IPv4, and most networks are a `/64`. The loopback address is `::1`, and addresses that start with `fe80` only work on the local link.

## Try it

You need Python 3 and the `ip` command. Your own addresses will differ from the ones shown.

### 1. Find your own address

<!-- lab: nocheck -->
```bash
ip -4 -br addr
```

```output
lo               UNKNOWN        127.0.0.1/8
enp0s2           UP             10.0.2.15/24 metric 100
```

The `-4` keeps only IPv4. This machine has `10.0.2.15/24` on its network interface, a private address. At home you will probably see one that starts with `192.168.`, and in WSL one that starts with `172.`.

### 2. See the bits of an address

```python
address = "192.168.1.37"
for part in address.split("."):
    print(part.rjust(3), format(int(part), "08b"))
```

```output
192 11000000
168 10101000
  1 00000001
 37 00100101
```

`format(number, "08b")` writes a number in binary, padded with zeros to 8 digits. Each line is one octet. Put the four lines side by side and you have the 32 bits from the drawing above.

### 3. Let Python work out a network

Python's standard library has a module called `ipaddress` that knows all these rules.

```python
import ipaddress

net = ipaddress.ip_interface("192.168.1.37/24").network
print("network:  ", net)
print("mask:     ", net.netmask)
print("broadcast:", net.broadcast_address)
print("addresses:", net.num_addresses)
```

```output
network:   192.168.1.0/24
mask:      255.255.255.0
broadcast: 192.168.1.255
addresses: 256
```

Compare with what you read in "The idea": same network address, same mask, same broadcast address, 256 addresses.

### 4. Write a small subnet calculator

Make a practice folder and save this file in it.

```bash
mkdir ~/netlab
cd ~/netlab
```

```python title="subnet.py"
import ipaddress
import sys

interface = ipaddress.ip_interface(sys.argv[1])
net = interface.network
first = net.network_address + 1
last = net.broadcast_address - 1

print("address:  ", interface.ip)
print("network:  ", net)
print("mask:     ", net.netmask)
print("broadcast:", net.broadcast_address)
print("hosts:    ", first, "to", last, f"({net.num_addresses - 2} usable)")
```

```bash
python3 subnet.py 192.168.1.37/26
```

```output
address:   192.168.1.37
network:   192.168.1.0/26
mask:      255.255.255.192
broadcast: 192.168.1.63
hosts:     192.168.1.1 to 192.168.1.62 (62 usable)
```

`sys.argv[1]` is the first word you type after the script name. The result matches the `/26` example worked out by hand: network `.0`, broadcast `.63`, 62 usable hosts.

Now move to another subnet of the same size:

```bash
python3 subnet.py 192.168.1.130/26
```

```output
address:   192.168.1.130
network:   192.168.1.128/26
mask:      255.255.255.192
broadcast: 192.168.1.191
hosts:     192.168.1.129 to 192.168.1.190 (62 usable)
```

130 is between 128 and 191, so this address lives in the third of the four subnets.

### 5. Check whether two machines are on the same network

```python
import ipaddress

net = ipaddress.ip_network("192.168.1.0/24")
for address in ["192.168.1.52", "192.168.2.52", "8.8.8.8"]:
    print(address, ipaddress.ip_address(address) in net)
```

```output
192.168.1.52 True
192.168.2.52 False
8.8.8.8 False
```

Your machine does this test for every packet it sends. `True` means "deliver it directly". `False` means "give it to the router". Look at the second line: `192.168.2.52` looks close to `192.168.1.x`, but with a `/24` the third number is part of the network, so it is a different network.

### 6. Tell private from public

```python
import ipaddress

for address in ["10.0.2.15", "172.20.0.5", "192.168.1.37", "8.8.8.8"]:
    print(address, ipaddress.ip_address(address).is_private)
```

```output
10.0.2.15 True
172.20.0.5 True
192.168.1.37 True
8.8.8.8 False
```

The first three fall inside the private ranges from the table. `8.8.8.8` is a public address.

### 7. Meet IPv6

<!-- lab: nocheck -->
```bash
ip -6 -br addr
```

```output
lo               UNKNOWN        ::1/128
enp0s2           UP             fec0::5054:ff:fe12:3456/64 fe80::5054:ff:fe12:3456/64
```

`::1/128` is the IPv6 loopback address. The address that starts with `fe80` is a link-local address: every interface gives itself one. The machine used for these outputs also received an address that starts with `fec0` from its virtual network. On a real network with IPv6 you get a public address instead, and it usually starts with `2`.

```python
import ipaddress

ip = ipaddress.ip_address("2001:db8::8a2e:370:7334")
print(ip.exploded)
print(ip.compressed)
```

```output
2001:0db8:0000:0000:0000:8a2e:0370:7334
2001:db8::8a2e:370:7334
```

`exploded` writes all eight groups in full, and `compressed` applies the two shortening rules. Both are the same 128 bits.

## Exercise

Work these out on paper first, then check with `subnet.py`.

1. For `192.168.10.77/26`: what are the network address, the broadcast address, the first and last usable host, and the number of usable hosts?
2. Are `10.1.2.3` and `10.1.3.3` on the same network if the prefix is `/24`? And if it is `/16`?
3. Harder: for `172.16.5.200/20`, what are the network address and the broadcast address? The cut is inside the third octet this time.

<details>
<summary>Show the solution</summary>

1. A `/26` has blocks of 64 addresses that start at 0, 64, 128 and 192. 77 is in the block that starts at 64, so the network is `192.168.10.64`, the broadcast address is `192.168.10.127`, and the hosts go from `.65` to `.126`: 62 usable hosts.

   ```bash
   cd ~/netlab
   python3 subnet.py 192.168.10.77/26
   ```

   ```output
   address:   192.168.10.77
   network:   192.168.10.64/26
   mask:      255.255.255.192
   broadcast: 192.168.10.127
   hosts:     192.168.10.65 to 192.168.10.126 (62 usable)
   ```

2. With `/24` the first three numbers are the network part: `10.1.2` and `10.1.3` differ, so they are on different networks. With `/16` only `10.1` is the network part, so they are on the same network.

3. `/20` means 16 bits for the first two octets, plus the first 4 bits of the third octet. In binary, 5 is `00000101`. Keep its first 4 bits and set the rest to 0: `00000000`, which is 0. Set the rest to 1 instead: `00001111`, which is 15. So the network address is `172.16.0.0` and the broadcast address is `172.16.15.255`.

   ```bash
   python3 subnet.py 172.16.5.200/20
   ```

   ```output
   address:   172.16.5.200
   network:   172.16.0.0/20
   mask:      255.255.240.0
   broadcast: 172.16.15.255
   hosts:     172.16.0.1 to 172.16.15.254 (4094 usable)
   ```

</details>

## Check yourself

**1. What does the `/24` in `10.0.2.15/24` mean?**

<details>
<summary>Answer</summary>

The first 24 bits of the address are the network part, and the remaining 8 bits are the host part. Written as a mask, it is `255.255.255.0`.

</details>

**2. How many usable host addresses does a `/28` network have, and why not 16?**

<details>
<summary>Answer</summary>

14. A `/28` leaves 4 host bits, so 2<sup>4</sup> = 16 addresses. Two are reserved: the network address (host bits all 0) and the broadcast address (host bits all 1).

</details>

**3. Which network is bigger, a `/16` or a `/24`?**

<details>
<summary>Answer</summary>

The `/16`. A shorter prefix leaves more bits for hosts: 65,536 addresses against 256.

</details>

**4. Which of these are private addresses: `172.16.4.1`, `192.168.0.10`, `8.8.8.8`, `10.200.3.4`?**

<details>
<summary>Answer</summary>

`172.16.4.1`, `192.168.0.10` and `10.200.3.4`. They fall inside `172.16.0.0/12`, `192.168.0.0/16` and `10.0.0.0/8`. `8.8.8.8` is a public address.

</details>

**5. Write `2001:0db8:0000:0000:0000:0000:0000:0001` in its short form.**

<details>
<summary>Answer</summary>

`2001:db8::1`. Drop the leading zeros in each group, and replace the run of all-zero groups with `::`.

</details>

## Lesson map

```mindmap
IP addresses
  IPv4 address
    32 bits
    four octets
    network part
    host part
  Prefix and mask
    CIDR notation
    network address
    broadcast address
    usable hosts
  Special ranges
    private
    loopback
    public
  IPv6
    128 bits
    hexadecimal groups
    :: shortening
```

## Common mistakes

- **Reading a bigger prefix as a bigger network.** It is the opposite: `/30` has 4 addresses, `/8` has more than 16 million.
- **Giving a machine the network or broadcast address.** In a `/24`, `.0` and `.255` are reserved. Use `.1` to `.254`.
- **Assuming the cut is always at a dot.** With `/26` or `/20` the cut is inside an octet. Write that octet in binary and the answer becomes visible.
- **Judging "same network" by eye.** `192.168.1.52` and `192.168.2.52` look like neighbours, but with a `/24` they are on different networks. Compare the network parts, not the look.
- **Using `::` twice in an IPv6 address.** It may appear only once, otherwise nobody could tell how many zero groups each one hides.

## Key terms

- **IP address**: the internet layer address of a network interface.
- **IPv4**: the version of IP with 32-bit addresses, written as four numbers from 0 to 255.
- **Octet**: a group of 8 bits. An IPv4 address has four.
- **Prefix length**: the number of leading bits that form the network part, written after a slash, as in `/24`.
- **Subnet mask**: the prefix length in dotted form, such as `255.255.255.0`.
- **CIDR notation**: writing an address or a network with its prefix length, such as `192.168.1.0/24`.
- **Network address**: the first address of a network, with all host bits set to 0. It names the network.
- **Broadcast address**: the last address of a network, with all host bits set to 1. It means every machine on that network.
- **Subnet**: a smaller network cut out of a larger one by using a longer prefix.
- **Private address**: an address from `10.0.0.0/8`, `172.16.0.0/12` or `192.168.0.0/16`, usable inside any local network and not routed on the internet.
- **Public address**: an address that is unique worldwide and reachable across the internet.
- **IPv6**: the version of IP with 128-bit addresses, written in hexadecimal groups separated by colons.

## Go further

- [Python documentation: ipaddress](https://docs.python.org/3/library/ipaddress.html): the module you used, with every property of addresses and networks.
- [RFC 1918: Address Allocation for Private Internets](https://www.rfc-editor.org/rfc/rfc1918): the short document that defines the three private ranges.
- [RFC 4291: IP Version 6 Addressing Architecture](https://www.rfc-editor.org/rfc/rfc4291): section 2.2 gives the exact rules for writing IPv6 addresses.
