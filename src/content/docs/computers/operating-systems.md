---
title: Operating systems
description: What the operating system does for every program, with processes, threads, virtual memory, system calls and file systems seen from the terminal and from Python.
lesson: "5.4"
time: 25 min
sidebar:
  order: 4
---

The machine this course was tested on has two cores. Right now it is running more than a hundred processes. Every one of them believes it has the processor to itself, has its own private memory, and can open files by name without knowing anything about disks. None of that is true, and the program that keeps up the illusion is the operating system.

## Goal

After this lesson you can:

- Say what the kernel does, and how a program asks it for something with a system call.
- Explain the difference between a process and a thread, and show it with a small Python program.
- Describe virtual memory and how a file system finds a file, using `strace`, `/proc` and inodes.

## Why it matters

Almost every bug report that says "it works on my machine" ends up at the operating system: a file that is locked, memory that runs out, two threads that change the same data. Security is built on the same ground. The wall between your processes and someone else's, between your files and root's, is the operating system's work, and most serious attacks try to get through that wall.

## The idea

An **operating system** (OS) is the software that manages the hardware and gives programs a simpler, safer machine to run on. Its core is the **kernel**: the one program that may touch the hardware directly. Linux is a kernel; Ubuntu is a full operating system built around it.

Everything else runs in **user space**, with fewer rights. A user program cannot read the disk or talk to the network card itself. It asks the kernel with a **system call**, a request such as "open this file", "read 100 bytes" or "start a new process". The kernel checks that the request is allowed, does the work and hands back the result.

The kernel has four big jobs.

**Processes.** You met processes in Lesson 1.5: a running program with its own PID. With more processes than cores, the kernel's **scheduler** gives each one a short slice of time on a core, then switches to the next, many times a second. A cook with two hands can keep ten pans going by moving between them quickly; nothing is cooked at the very same moment, but every pan makes progress.

**Threads.** A **thread** is one stream of instructions inside a process. A process starts with one thread and may start more. All the threads of a process share its memory, so they can work on the same data, and they can run on different cores at the same time.

**Memory.** Each process gets its own **virtual memory**: a private range of addresses that the kernel maps onto real RAM behind the scenes. Address 1000 in one process and address 1000 in another are two different places. Unless the kernel allows it on purpose (for example to a debugger), a process cannot even reach the memory of another one, and that is the main wall between programs.

**Files.** A **file system** is the way files are laid out on a disk. On Linux, each file's details (size, owner, permissions, where its data is) live in a record called an **inode**, identified by a number. A file name is just an entry in a directory that points to an inode.

## Try it

```bash
mkdir ~/os
cd ~/os
```

### 1. Count what the scheduler juggles

<!-- lab: nocheck -->
```bash
nproc
ps -e --no-headers | wc -l
```

```output
2
112
```

`ps -e` lists every process on the machine, `--no-headers` drops the title line, and `wc -l` counts the lines. 112 processes, 2 cores: the scheduler takes turns between them. Most of them are asleep, waiting for something to happen, and use no processor time at all.

### 2. Watch a program make system calls

`strace` runs a program and prints every system call it makes. If it is missing on your system, install it with `sudo apt install strace`.

```bash
printf 'hello\n' > hello.txt
strace -e trace=openat,read,write,close -o trace.txt cat hello.txt
```

```output
hello
```

`cat` ran as usual, and `strace` wrote its notes to `trace.txt` (`-o` for output). `-e trace=` keeps only four kinds of calls, to open, read, write and close files. Even so the file is long, because a program makes dozens of calls just to start: loading libraries, reading language settings. Find the line where `cat` opens your file, and show it with the 4 lines after it (`-A 4`):

```bash
grep -A 4 'openat.*hello.txt' trace.txt
```

```output
openat(AT_FDCWD, "hello.txt", O_RDONLY) = 3
read(3, "hello\n", 131072)              = 6
write(1, "hello\n", 6)                  = 6
read(3, "", 131072)                     = 0
close(3)                                = 0
```

This is `cat` from the kernel's point of view. Each line is one system call, its arguments, and after the `=` the kernel's answer. `openat` opens `hello.txt`, and the kernel answers `3`: a **file descriptor**, the small number the process uses from now on to mean "that open file". `read` asks for up to 131,072 bytes from descriptor 3 and gets 6. `write` sends those 6 bytes to descriptor 1, which is standard output, your terminal. The second `read` gets 0 bytes, which means the end of the file, so `cat` closes it. Every program, in every language, does its work through calls like these.

### 3. Start threads that share memory

```python title="threads.py"
import threading
import time

shared = []

def worker(n):
    shared.append(n)    # every thread changes the same list
    time.sleep(0.5)     # stay alive for a moment

threads = [threading.Thread(target=worker, args=(n,)) for n in range(3)]
for t in threads:
    t.start()

with open("/proc/self/status") as f:
    for line in f:
        if line.startswith("Threads:"):
            print("threads in this process:", line.split()[1])

for t in threads:
    t.join()
print("shared list:", sorted(shared))
```

```bash
python3 threads.py
```

```output
threads in this process: 4
shared list: [0, 1, 2]
```

`threading.Thread` creates a thread, `start()` runs it, and `join()` waits for it to finish. While the three workers sleep, the program reads `/proc/self/status`, a file the kernel writes on the fly about the process that reads it: four threads, the main one plus three workers. When they are done, the list holds what all three put into it, because threads share the memory of their process.

### 4. Start a process that does not share memory

```python title="fork.py"
import os

data = [1]
address = id(data)        # where the list lives in this process's memory

child = os.fork()         # make a copy of this process
if child == 0:            # this branch runs in the copy
    data[0] = 99
    print("child: ", data, "same address:", id(data) == address, flush=True)
    os._exit(0)

os.waitpid(child, 0)      # the parent waits for the child to end
print("parent:", data, "same address:", id(data) == address)
```

```bash
python3 fork.py
```

```output
child:  [99] same address: True
parent: [1] same address: True
```

`os.fork()` asks the kernel for a new process that is a copy of the current one. It returns 0 in the child and the child's PID in the parent, which is how the two copies know which branch to take. In CPython, `id()` gives the object's address in memory. `flush=True` prints the child's line at once, and `os._exit(0)` ends the child right there, so it never runs the parent's lines below.

Read the result carefully. Both processes have the list at the same address, and yet the child sees 99 and the parent still sees 1. That is virtual memory: the same address in two processes leads to two different places in real RAM. Threads share memory; processes do not.

### 5. Compare virtual and real memory

<!-- lab: nocheck -->
```bash
grep -E '^(VmSize|VmRSS)' /proc/self/status
```

```output
VmSize:	    7088 kB
VmRSS:	    2168 kB
```

Here `/proc/self` is the `grep` process itself. `VmSize` is all the virtual memory it has reserved; `VmRSS` (resident set size) is the part that sits in RAM right now. The kernel only gives real RAM to pages a program actually uses, so the first number is usually much bigger than the second.

### 6. Look under a file name

<!-- lab: nocheck -->
```bash
df -T /
```

```output
Filesystem     Type 1K-blocks    Used Available Use% Mounted on
/dev/vda1      ext4  19221248 1700060  17504804   9% /
```

`-T` adds the file system type. Ubuntu uses **ext4** by default. (On WSL the type can differ.) Now give one file a second name with `ln`, which makes a **hard link**:

```bash
echo "first line" > note.txt
ln note.txt other-name.txt
stat -c '%h %n' note.txt other-name.txt
```

```output
2 note.txt
2 other-name.txt
```

`stat -c '%h %n'` prints the link count (how many names point to the inode) and the name. Both names say 2, because they are two directory entries for one inode. `ls -i` shows the inode numbers:

<!-- lab: nocheck -->
```bash
ls -i note.txt other-name.txt
```

```output
262197 note.txt  262197 other-name.txt
```

Your numbers will be different, but the two numbers are the same. Change the file through one name and read it through the other:

```bash
echo "second line" >> other-name.txt
cat note.txt
```

```output
first line
second line
```

There is only one file. The name is a label in a directory, the inode is the file.

## Exercise

Continue in `~/os`. Delete the name `note.txt`. Is the text gone? Find out with `cat`, and check the link count of `other-name.txt` with `stat`. Then explain in one sentence when the kernel really frees the data of a file.

<details>
<summary>Show the solution</summary>

```bash
rm note.txt
cat other-name.txt
stat -c '%h %n' other-name.txt
```

```output
first line
second line
1 other-name.txt
```

The text is still there. `rm` removed one directory entry and lowered the link count from 2 to 1. The kernel frees an inode and its data only when no name points to it any more and no process has the file open. That is why the system call behind `rm` is called `unlinkat`: it removes a link, a name, not the data itself.

</details>

## Check yourself

**1. A Python program calls `open("notes.txt")`. Who actually opens the file, and how is it asked?**

<details>
<summary>Answer</summary>

The kernel. Python makes a system call (`openat`), the kernel checks the permissions, opens the file and returns a file descriptor, a small number the program uses for that file from then on.

</details>

**2. What do two threads of the same process share that two processes do not?**

<details>
<summary>Answer</summary>

Their memory. Threads of one process see the same variables, like the shared list in `threads.py`. Two processes each have their own virtual memory, so a change in one is invisible to the other, as `fork.py` showed.

</details>

**3. A machine has 4 cores and 200 processes. How can they all seem to run at once?**

<details>
<summary>Answer</summary>

The scheduler gives each process that has work to do a short slice of time on a core, then switches, many times a second. Most processes are asleep and waiting anyway, so they need no time at all.

</details>

**4. In `fork.py`, the list has the same address in the parent and the child but holds different values. How is that possible?**

<details>
<summary>Answer</summary>

Each process has its own virtual memory. The kernel maps the same virtual address to different places in real RAM for each process.

</details>

**5. What is stored in an inode, and what is not?**

<details>
<summary>Answer</summary>

The inode holds the file's details: size, owner, permissions, times, the link count and where the data is on the disk. It does not hold the file's name. Names live in directories and point to the inode.

</details>

## Lesson map

```mindmap
Operating system
  Kernel
    system calls
    user space
    strace
  Processes
    scheduler
    PID
    fork
  Threads
    shared memory
    several cores
  Memory
    virtual memory
    VmSize and VmRSS
  Files
    file system
    inode
    hard link
    file descriptor
```

## Common mistakes

- **Thinking a file name is the file.** Renaming, moving within one file system and hard linking only change directory entries. The data stays where it is, which is why `mv` within one file system is instant even for a huge file.
- **Expecting `rm` to free space at once.** If a program still has the file open, the data stays on the disk until that program closes it or ends. A full disk that does not empty after `rm` often means a log file that a running service still holds open.
- **Changing shared data from several threads without care.** Two threads that update the same value at the same moment can lose an update. Python offers `threading.Lock` for this; for now, remember that sharing memory is both the power and the danger of threads.
- **Reading `VmSize` as memory used.** Virtual memory is reserved, not used. Look at `VmRSS`, or at the `RES` column in `top`, to see what a process really holds in RAM.

## Key terms

- **Operating system**: the software that manages the hardware and gives programs a simpler, safer machine to run on.
- **Kernel**: the core of the operating system, the only program with direct access to the hardware.
- **User space**: where ordinary programs run, with limited rights. They must ask the kernel for anything that touches the hardware.
- **System call**: a request from a program to the kernel, such as `openat`, `read` or `write`.
- **Scheduler**: the part of the kernel that decides which process or thread runs on which core, and for how long.
- **Thread**: one stream of instructions inside a process. The threads of a process share its memory.
- **Virtual memory**: a private range of addresses for each process, which the kernel maps onto real RAM.
- **File descriptor**: the small number a process uses to refer to a file it has opened. 0, 1 and 2 are standard input, output and error.
- **File system**: the way files and directories are organised on a disk, for example ext4.
- **ext4**: the default file system on Ubuntu.
- **Inode**: the record that holds a file's details and the location of its data. A file name points to an inode.
- **Hard link**: a second name for the same inode, made with `ln`.

## Go further

- [The Linux kernel documentation: The /proc filesystem](https://docs.kernel.org/filesystems/proc.html): every file in `/proc` and what its fields mean.
- [Python: threading](https://docs.python.org/3/library/threading.html): the official guide to threads in Python, including locks.
- [Ubuntu manpage: strace](https://manpages.ubuntu.com/manpages/noble/man1/strace.1.html): all the options of `strace`, for when you want to trace only certain calls.
