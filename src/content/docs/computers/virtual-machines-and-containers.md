---
title: Virtual machines and containers
description: What a virtual machine and a container each isolate, how containers are built from namespaces and cgroups, and when to use which.
lesson: "5.6"
time: 20 min
sidebar:
  order: 6
---

Every command in this course was tested on a computer that does not exist. It is a program running on a Windows laptop, pretending to be a whole PC with its own processor, memory and disk, and Ubuntu has no idea. In this lesson you ask your own machine whether it is real, and then you build the main pieces of a container by hand, with two commands that come with every Ubuntu.

## Goal

After this lesson you can:

- Explain what a virtual machine is and what a hypervisor does.
- Explain what a container is, and build its main parts yourself with namespaces and cgroups.
- Choose between a virtual machine and a container for a given job.

## Why it matters

Almost all software today runs in one of the two. Most cloud servers are virtual machines; most web apps are shipped as containers; the security labs in Module 14 are virtual machines you can break and throw away. Knowing what each one really isolates also tells you how far you can trust it: a container that shares a kernel with its neighbours is a much thinner wall than a virtual machine.

## The idea

### Virtual machines

A **virtual machine** (VM) is a complete computer made of software. It has virtual processors, virtual memory, a virtual disk (usually one big file on the real disk) and a virtual network card. You install a normal operating system in it, kernel and all, and that system believes it owns the hardware.

The program that creates and runs virtual machines is the **hypervisor**. It hands out slices of the real CPU, RAM and disk, and keeps each VM inside its own box. The real computer is the **host**; each VM is a **guest**. Modern CPUs have special features that let guest instructions run directly on the real processor, so a VM is almost as fast as the bare machine. Examples: KVM (built into Linux), Hyper-V (Windows, also behind WSL 2), VirtualBox and QEMU.

### Containers

A **container** is not a computer at all. It is a group of ordinary processes on the host, running on the host's kernel, that the kernel shows a restricted view of the system. Three kernel features build it:

- **Namespaces** limit what a process can see: its own process list, its own hostname, its own network, its own view of the file system.
- **cgroups** (control groups) limit how much it can use: memory, CPU time, number of processes.
- An **image** gives it its own files: a packed directory tree with the program and everything it needs, used as the container's root directory.

Docker and Podman are tools that put these three together for you with one command.

Think of a VM as a separate house on the same street: its own walls, its own plumbing, its own front door. A container is a flat in an apartment building: its own door and its own rooms, but the foundations, the water pipes and the caretaker (the kernel) are shared with every other flat.

| | Virtual machine | Container |
|---|---|---|
| Has its own kernel | Yes | No, shares the host's |
| Can run another OS | Yes (Windows on Linux, for example) | Only programs for the host's kernel |
| Starts in | seconds to minutes (it boots a whole OS) | well under a second |
| Typical size | gigabytes | megabytes |
| Isolation | strong: a whole machine in between | thinner: one shared kernel |
| Typical use | a lab to break, another OS, strong separation | shipping an app with its exact libraries |

## Try it

These steps need `sudo`. They change nothing permanent: every namespace and every limit disappears when its command ends.

### 1. Ask the machine where it is running

```bash
systemd-detect-virt
grep -c hypervisor /proc/cpuinfo
```

```output
qemu
2
```

`systemd-detect-virt` names the hypervisor it detects. The test machine runs on QEMU. On WSL you see `wsl`, on many cloud servers `kvm` or `amazon`, and on a computer with Ubuntu installed directly, `none`. The second line counts the cores whose CPU flags include `hypervisor`, a flag that virtual CPUs carry: here both. On a real machine the count is 0.

### 2. See your namespaces

```bash
ls /proc/self/ns
```

```output
cgroup  mnt  pid               time               user
ipc     net  pid_for_children  time_for_children  uts
```

Every process belongs to one namespace of each kind. `pid` is the process list, `net` the network, `mnt` the mounted file systems, and `uts` the hostname (the name is historical). Normally every process on the machine shares the same ones.

### 3. Give a shell its own hostname

```bash
sudo unshare --uts sh -c 'hostname box; hostname'
hostname
```

```output
box
lab
```

`unshare` runs a command in new namespaces; `--uts` asks for a new hostname namespace. The command here is `sh -c '...'`, which starts a shell that runs the commands inside the quotes. Inside the namespace, `hostname box` renames the machine, and `hostname` confirms it. Then the command ends, and outside, the real hostname is untouched. (The test machine is called `lab`; you see your own machine's name.)

### 4. Give a shell its own process list

```bash
sudo unshare --pid --fork --mount-proc sh -c 'sleep 30 & ps -e -o pid,comm'
```

```output
    PID COMMAND
      1 sh
      2 sleep
      3 ps
```

`--pid` creates a new process namespace, `--fork` starts the command as a new process inside it, and `--mount-proc` gives it its own `/proc`, so that `ps` reads the new process list. The machine runs over a hundred processes, but this shell sees three, and it is PID 1, the first process of its own little world. Seen from outside, the same three processes have ordinary, large PIDs. When PID 1 of a namespace ends, the kernel stops everything left inside it, so the `sleep` ends too.

### 5. Check whose kernel it is

<!-- lab: nocheck -->
```bash
uname -r
sudo unshare --uts --pid --fork --mount-proc uname -r
```

```output
6.8.0-147-generic
6.8.0-147-generic
```

`uname -r` prints the version of the running kernel. Inside and outside the namespaces, the answer is the same, because there is only one kernel. A VM would show its own. This is the key difference between the two.

### 6. Put a limit on memory

`systemd-run` asks systemd, the PID 1 of Ubuntu, to start a command in a new cgroup of its own. `-p MemoryMax=50M` limits that cgroup to 50 MiB of RAM, `--wait` waits for the command to end, `--pipe` connects its output to your terminal, and `--quiet` hides systemd's own messages. Inside the limit, this Python line asks for 20 MiB:

```bash
sudo systemd-run --quiet --wait --pipe -p MemoryMax=50M python3 -c 'x = bytearray(20 * 1024 * 1024); print("got 20 MiB")'
```

```output
got 20 MiB
```

That fits. Now ask for 100 MiB, and this time let systemd report what happened (no `--quiet`):

<!-- lab: nocheck -->
```bash
sudo systemd-run --wait --pipe -p MemoryMax=50M python3 -c 'x = bytearray(100 * 1024 * 1024); print("got 100 MiB")'
```

```output
Running as unit: run-u90.service
Finished with result: oom-kill
Main processes terminated with: code=killed/status=KILL
Service runtime: 7.295s
CPU time consumed: 4.846s
Memory peak: 50.0M
Memory swap peak: 0B
```

The message `got 100 MiB` never appears. When the program went over the limit, the kernel's **OOM killer** (out of memory) stopped it with the signal `KILL`, and systemd reports the result as `oom-kill`. Memory peaked at exactly the 50 MiB allowed. The rest of the machine did not notice anything. This is what stops one container from eating all the memory of the server. (The unit name and the times are different on every run.)

:::note[What Docker adds]
`docker run` does what you just did, in one go: new namespaces of every kind, cgroup limits, and an image unpacked as the root directory, plus networking and a library of ready images. You will use real containers later in the course; now you know they are processes, not machines.
:::

## Exercise

Build a "mini container" in one command: a shell with its own hostname, `myapp`, and its own process list. Inside it, print the hostname and the process list. Then answer: if a program inside it found a bug in the kernel, would the host be at risk? Would it be if the same program ran in a VM?

<details>
<summary>Show the solution</summary>

```bash
sudo unshare --uts --pid --fork --mount-proc sh -c 'hostname myapp; hostname; ps -e -o pid,comm'
```

```output
myapp
    PID COMMAND
      1 sh
      4 ps
```

Several `--` options combine, one per namespace. `ps` is PID 4, not 2, because `sh` had already started two short-lived processes before it: `hostname myapp` was PID 2 and `hostname` was PID 3. Numbers in a new namespace start at 1 and only go up.

In the container, yes: it runs on the host's kernel, so a kernel bug is a bug in the host. In a VM, the program would first break the guest's own kernel, and it would still need a second flaw, in the hypervisor, to reach the host. That extra wall is why untrusted code and security labs go into VMs.

</details>

## Check yourself

**1. What does the hypervisor do?**

<details>
<summary>Answer</summary>

It creates and runs virtual machines: it hands out slices of the real CPU, memory and disk to each one, and keeps each VM inside its own boundaries.

</details>

**2. Can a Linux container run a Windows program directly? Can a VM?**

<details>
<summary>Answer</summary>

A container cannot, because it shares the host's Linux kernel and can only run programs made for that kernel. A VM can, because you can install Windows itself in it, with its own kernel.

</details>

**3. Which kernel feature limits what a container can see, and which one limits how much it can use?**

<details>
<summary>Answer</summary>

Namespaces limit what it can see (processes, hostname, network, mounts). cgroups limit what it can use (memory, CPU, number of processes).

</details>

**4. Inside a new PID namespace, `ps` shows a process with PID 1. Is it the same as the machine's real PID 1, systemd?**

<details>
<summary>Answer</summary>

No. It is the first process of that namespace, here `sh`. Outside the namespace the same process has an ordinary PID, and the real PID 1 is still systemd.

</details>

**5. You need to ship a small web app with its exact Python version and libraries to a Linux server. VM or container?**

<details>
<summary>Answer</summary>

A container. It packs the app with its files, starts in under a second and uses little space. A VM would work too, but it carries a whole operating system you do not need.

</details>

## Common mistakes

- **Treating a container as a security boundary as strong as a VM.** All containers on a host share one kernel. Run code you do not trust in a VM, not just in a container.
- **Running containers as root "because it is isolated".** Unless the container uses a user namespace, root inside it is the same root user as on the host, held back only by the other namespaces and restrictions. Run the app as an ordinary user inside the container too.
- **Expecting changes inside a container to last.** Files written inside a container are lost when it is removed, unless you keep them on a volume or in the image. Keep data outside, and treat the container as throwaway.
- **Thinking a VM is always slow.** With the CPU's virtualization features turned on, a VM runs close to native speed. Without them, as on the course's test machine, the hypervisor has to imitate every instruction in software, and that is slow.

## Key terms

- **Virtual machine**: a complete computer made of software, with its own virtual hardware and its own operating system.
- **Hypervisor**: the program that creates and runs virtual machines and shares the real hardware between them.
- **Host**: the real machine that runs virtual machines or containers.
- **Guest**: the operating system running inside a virtual machine.
- **Container**: a group of processes on a shared kernel, with their own view of the system (namespaces), their own limits (cgroups) and their own files (an image).
- **Namespace**: a kernel feature that gives processes their own view of one part of the system, such as the process list or the hostname.
- **cgroup**: a control group, a kernel feature that limits how much memory, CPU and other resources a group of processes can use.
- **OOM killer**: the part of the kernel that stops a process when memory runs out, or when a cgroup goes over its memory limit.
- **Image**: a packed directory tree with a program and everything it needs, used as the files of a container.

## Go further

- [Ubuntu manpage: unshare](https://manpages.ubuntu.com/manpages/noble/man1/unshare.1.html): every namespace `unshare` can create, with examples.
- [The Linux kernel documentation: Control Group v2](https://docs.kernel.org/admin-guide/cgroup-v2.html): how cgroups work and every limit they offer. Read the first sections only.
- [Docker documentation: What is a container?](https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/): the official introduction, for when you start using Docker itself.
