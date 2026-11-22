---
title: Build a home lab with virtual machines
description: Install a free hypervisor, create two virtual machines, and connect them on a private network that cannot reach your real one.
lesson: "14.1"
time: 25 min
sidebar:
  order: 1
---

Sooner or later you will want to break something on purpose: run a scanner, misconfigure a firewall, install a deliberately weak web app. Your own laptop is the wrong place for that, and the school network is a much worse one. What you want is a small, private network of computers that belong to you, that you can wreck and rebuild as often as you like. That is a **home lab**, and with virtual machines it costs nothing but disk space.

## Goal

After this lesson you can:

- Install a free hypervisor and create two virtual machines from a checked ISO image.
- Choose a network mode that keeps a lab away from your real network.
- Give two machines addresses on the same private network and test that they see each other, and nothing else.

## Why it matters

Module 9 gave you the rule: only test systems you own or have written permission to test. A home lab is how you follow that rule and still practice for real, from scanning ports to reading attack logs. And because a virtual machine can be reset in seconds, you can try a risky idea, watch it fail, and roll back, which is how people actually learn this work.

## The idea

You met virtual machines and hypervisors in [lesson 5.6](../computers/virtual-machines-and-containers/). For a home lab you install a **type 2 hypervisor**: a hypervisor that runs as a normal program on top of your usual operating system, such as **VirtualBox** (free, for Windows, Linux and macOS) or **UTM** (free, for Macs with Apple chips). Each guest gets a virtual network card, and the hypervisor decides what that card is plugged into. That choice is what makes a lab safe or dangerous.

| VirtualBox mode | Who the VM can reach | Use it for |
|---|---|---|
| NAT | The internet, through the host. Nothing outside can start a connection to the VM, unless you add a port forwarding rule. | Installing the system and updates |
| Bridged | Your real network, as if the VM were another laptop on your Wi-Fi | Not for a lab: a weak VM becomes a weak machine on your real network |
| Host-only | The host and other host-only VMs. No internet. | Reaching lab VMs from your own computer |
| Internal network | Only VMs on the same named internal network. Not even the host. | The most isolated lab |

Think of an internal network as a network switch in a locked room. You carry the machines in, plug them into the switch, and the switch has no cable leading out of the room. Whatever happens inside, your house network never sees it.

The plan for this lesson is two Ubuntu Server VMs on an internal network called `labnet`: `vm1` with the address `10.10.10.1/24` and `vm2` with `10.10.10.2/24`. These are private addresses from [lesson 6.2](../networking/ip-addresses-and-subnetting/), never used on the internet. Both sit in the same `/24` network, which matters, as you will see.

## Try it

Steps 1, 2 and 5 run in your Ubuntu terminal. Steps 3, 4 and 6 happen in VirtualBox on your own computer; keep about an hour and 50 GB of free disk for them. A computer with 8 GB of memory runs two small server VMs comfortably.

### 1. Check that your processor can run VMs

```bash
lscpu | grep -i virtualization
```

```output
Virtualization:                          AMD-V
```

Modern processors have special features for virtual machines: **AMD-V** on AMD chips, **VT-x** on Intel chips. Without them, VMs are painfully slow or do not start. If the line is missing on a Linux computer, or Windows Task Manager shows "Virtualization: Disabled" under Performance, then CPU, the feature is off in the firmware settings (UEFI or BIOS), and you switch it on there. On an Intel computer your line says `VT-x`. In WSL, or inside any other VM, `lscpu` describes the virtual processor, not the real one, so on Windows trust Task Manager instead.

### 2. Check the ISO before you trust it

An **ISO image** is one file that holds a whole installation disc. You download the Ubuntu Server ISO from ubuntu.com, together with the file `SHA256SUMS` from the same release folder. A 3 GB download does not fit in this lesson, so practice the check on a small stand-in file:

```bash
mkdir -p ~/homelab && cd ~/homelab
echo "pretend this is a whole operating system" > ubuntu-server.iso
echo "pretend this is another one" > ubuntu-desktop.iso
sha256sum ubuntu-server.iso ubuntu-desktop.iso > SHA256SUMS
rm ubuntu-desktop.iso
sha256sum -c --ignore-missing SHA256SUMS
```

```output
ubuntu-server.iso: OK
```

Every line before the last one only builds the practice: a "publisher" writes the checksums of two files, and you end up with just one of them. A real `SHA256SUMS` also lists every file of the release, and you download only one. `--ignore-missing` skips the files you do not have, so the check speaks only about yours. You used `sha256sum -c` in Module 9; here it protects you from a broken download or a tampered mirror before you install anything.

```bash
echo "one extra line" >> ubuntu-server.iso
sha256sum -c --ignore-missing SHA256SUMS
```

```output
ubuntu-server.iso: FAILED
sha256sum: WARNING: 1 computed checksum did NOT match
sha256sum: SHA256SUMS: no file was verified
```

The file changed, so the check fails, and the last line adds that not a single file passed. A change of one byte would fail in the same way. With a real ISO you would delete it and download it again.

### 3. Install VirtualBox and create the first VM

Download VirtualBox from virtualbox.org and install it with the default options. You do not need the extension pack. On Windows with WSL installed, VirtualBox has to share the processor with Windows' own hypervisor, so its VMs may run slower; they still work. Then click **New** and fill in:

| Setting | Value |
|---|---|
| Name | `vm1` |
| ISO image | the Ubuntu Server ISO you checked |
| Memory | 2048 MB |
| Processors | 2 |
| Hard disk | 25 GB, dynamically allocated (the file grows only as it fills) |

If the wizard offers an unattended (automatic) installation, turn it off, so that you go through the installer yourself and choose your own username and password. Start the VM and follow the Ubuntu installer. Call the server `vm1` when it asks for a name. Keep the network on NAT for now, so the installer can fetch updates, and tick "Install OpenSSH server" when it asks. After the first login, run `sudo apt update && sudo apt upgrade -y` and install the tools you want in the lab while the VM still has internet.

### 4. Clone it into a second VM

Shut `vm1` down. Right-click it, choose **Clone**, name the copy `vm2`, pick "Full clone", and set the MAC address policy to "Generate new MAC addresses for all network adapters". Two machines with the same MAC address on one network confuse each other. Inside `vm2`, give it its own name with `sudo hostnamectl set-hostname vm2`.

Now isolate both. In **Settings**, then **Network**, set Adapter 1 to "Internal Network" and type the name `labnet` for both VMs. From here on they cannot reach the internet, your Wi-Fi, or your host.

### 5. Build a model of the lab network in your terminal

Before you touch the real VMs, build the same network in miniature. A **network namespace** gives processes their own private network stack: their own interfaces, addresses and routes. Two of them, joined by a virtual cable, behave like two machines on a switch with no way out.

```bash
sudo ip netns add vm1
sudo ip netns add vm2
sudo ip link add eth0 netns vm1 type veth peer name eth0 netns vm2
sudo ip -n vm1 addr add 10.10.10.1/24 dev eth0
sudo ip -n vm2 addr add 10.10.10.2/24 dev eth0
sudo ip -n vm1 link set eth0 up
sudo ip -n vm2 link set eth0 up
sudo ip -n vm1 -4 -br addr show eth0
```

```output
eth0@if2         UP             10.10.10.1/24
```

`ip netns add` creates the two "machines". A **veth pair** is a virtual network cable: whatever goes into one end comes out of the other. The third line puts one end into each namespace, both named `eth0`. `ip -n vm1` runs an `ip` command inside `vm1`. The rest gives each end an address and switches it on, exactly as you will in the real VMs.

<!-- lab: nocheck -->
```bash
sudo ip netns exec vm1 ping -c 2 10.10.10.2
```

```output
PING 10.10.10.2 (10.10.10.2) 56(84) bytes of data.
64 bytes from 10.10.10.2: icmp_seq=1 ttl=64 time=19.7 ms
64 bytes from 10.10.10.2: icmp_seq=2 ttl=64 time=1.34 ms

--- 10.10.10.2 ping statistics ---
2 packets transmitted, 2 received, 0% packet loss, time 1008ms
rtt min/avg/max/mdev = 1.341/10.532/19.723/9.191 ms
```

`ip netns exec vm1` runs any program inside `vm1`. The two machines hear each other. Your times will differ.

```bash
sudo ip -n vm1 route
sudo ip -n vm1 route get 1.1.1.1
```

```output
10.10.10.0/24 dev eth0 proto kernel scope link src 10.10.10.1
RTNETLINK answers: Network is unreachable
```

This is the proof of isolation. `vm1` knows one route, to its own `/24` network, and no default route, so there is no way out at all. `ip route get` only asks the routing table; no packet was sent. Now clean up:

```bash
sudo ip netns del vm1
sudo ip netns del vm2
ip netns list
```

Deleting a namespace also deletes its end of the cable, and with it the whole pair. The empty list means the model is gone. In GitHub Codespaces these commands may stop with `Operation not permitted`, because the Codespace is a container without that right; use WSL or a Linux computer for this step.

### 6. Wire the real VMs

Start both VMs. The first boot on the internal network may pause for a minute or two, because Ubuntu waits for an address from DHCP ([lesson 6.6](../networking/dhcp-nat-and-routing-basics/)) and nothing on `labnet` hands one out; that is normal. Inside each one, find the interface name with `ip -br link` (in VirtualBox it is usually `enp0s3`), then give it the address from the plan. In `vm1`:

<!-- lab: skip -->
```bash
sudo ip link set enp0s3 up
sudo ip addr add 10.10.10.1/24 dev enp0s3
```

In `vm2`, use `10.10.10.2/24`. Then `ping -c 2 10.10.10.2` from `vm1` answers just like the model did, and `ip route get 1.1.1.1` says `Network is unreachable`. An address added with `ip addr add` disappears when the VM restarts, which is fine for a first lab. Making it permanent is the job of netplan, Ubuntu's network settings tool, which you can learn when you need it.

Last, take a **snapshot** of each VM: a saved copy of its disk and settings at this moment. In VirtualBox, select the VM, open **Snapshots**, click **Take**, and call it `clean`. Whatever you break later, **Restore** brings you back here in seconds.

## Exercise

Rebuild the two-machine model from step 5, but make a typical home-lab mistake on purpose: give `vm2` the address `10.10.20.2/24` instead of `10.10.10.2/24`. Before you run anything, predict what `ping -c 1 10.10.20.2` from `vm1` will print. Then test, fix the address, test again, and clean up.

<details>
<summary>Show the solution</summary>

```bash
sudo ip netns add vm1
sudo ip netns add vm2
sudo ip link add eth0 netns vm1 type veth peer name eth0 netns vm2
sudo ip -n vm1 addr add 10.10.10.1/24 dev eth0
sudo ip -n vm2 addr add 10.10.20.2/24 dev eth0
sudo ip -n vm1 link set eth0 up
sudo ip -n vm2 link set eth0 up
sudo ip netns exec vm1 ping -c 1 10.10.20.2
```

```output
ping: connect: Network is unreachable
```

The cable is fine, but `vm1` has a route only for `10.10.10.0/24`. To `vm1`, the address `10.10.20.2` is on another network, and it knows no router to get there, so the packet is never sent. Move `vm2` to the right network:

```bash
sudo ip -n vm2 addr del 10.10.20.2/24 dev eth0
sudo ip -n vm2 addr add 10.10.10.2/24 dev eth0
sudo ip netns exec vm1 ping -c 1 10.10.10.2 | grep received
sudo ip netns del vm1
sudo ip netns del vm2
```

```output
1 packets transmitted, 1 received, 0% packet loss, time 0ms
```

The rule for a flat lab: every machine on one internal network needs an address in the same network, here the same first three numbers with `/24`.

</details>

## Check yourself

**1. You want to install a deliberately vulnerable web app in a VM. Which network mode do you pick, and which one do you avoid?**

<details>
<summary>Answer</summary>

Internal network (or host-only, if you want to reach it from your own computer). Avoid bridged: it puts the weak VM on your real network, where any other device could attack it.

</details>

**2. Why do you check the SHA-256 of the ISO before installing it?**

<details>
<summary>Answer</summary>

To be sure the file is exactly the one Ubuntu published: not broken by the download and not changed on a mirror. If even one byte differs, `sha256sum -c` prints `FAILED`.

</details>

**3. `vm1` has `10.10.10.1/24` and `vm2` has `10.10.20.2/24`, both on `labnet`. Ping fails with `Network is unreachable`. Why?**

<details>
<summary>Answer</summary>

They are on different networks. `vm1` only has a route for `10.10.10.0/24` and no router for anything else, so it does not even send the packet. Put both in the same `/24`.

</details>

**4. What is a snapshot, and when should you take one?**

<details>
<summary>Answer</summary>

A saved state of a VM's disk and settings that you can return to later. Take one when the VM is clean and working, before you try anything risky.

</details>

## Common mistakes

- **Using bridged mode for a weak VM.** It puts the VM on your real network, next to your phone and your family's laptops. Check every VM's network setting before you install anything vulnerable.
- **Cloning without new MAC addresses.** Two VMs with the same MAC address on one network fight over it, and connections drop at random. Choose "Generate new MAC addresses" when you clone.
- **Addresses on different networks.** `10.10.10.1/24` and `10.10.20.2/24` cannot talk without a router. Keep the first three numbers the same in a `/24` lab.
- **No snapshot before the experiment.** Without one, a broken VM means a new installation. Take the `clean` snapshot first.

## Key terms

- **Home lab**: a small set of computers, usually virtual machines, that you own and use for practice.
- **Type 2 hypervisor**: a hypervisor that runs as a normal program on top of an ordinary operating system, such as VirtualBox.
- **ISO image**: one file that holds the full content of an installation disc.
- **Internal network**: a VirtualBox network mode that connects only the VMs given the same network name, with no way to the host or the internet.
- **Network namespace**: a namespace with its own network interfaces, addresses and routes, like a separate machine's network inside one Linux system.
- **veth pair**: two virtual network interfaces joined like the two ends of a cable.
- **Snapshot**: a saved state of a virtual machine that you can restore later.

## Go further

- [Oracle VirtualBox User Guide](https://www.virtualbox.org/manual/): the official manual, including a full chapter on the network modes.
- [Install Ubuntu Server](https://ubuntu.com/tutorials/install-ubuntu-server): Ubuntu's own step-by-step guide to the installer used in step 3.
- [ip-netns manual page](https://man7.org/linux/man-pages/man8/ip-netns.8.html): every option of the namespace commands from step 5.
