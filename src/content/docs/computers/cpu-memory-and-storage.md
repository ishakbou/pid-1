---
title: CPU, memory and storage
description: What the processor, RAM and disk each do when a program runs, how the fetch-execute cycle works, and how to read your machine's numbers in the terminal.
lesson: "5.3"
time: 20 min
sidebar:
  order: 3
---

You type `python3 count.py` and press Enter. Before the first line of output appears, the program has been copied from the disk into memory, and the processor has worked through millions of tiny instructions, one after the other, each one so simple that it seems useless on its own. This lesson follows that trip, and then you build a pretend processor in Python and watch it do the same thing slowly enough to see.

## Goal

After this lesson you can:

- Say what the CPU, RAM and storage each do, and why a computer needs all three.
- Explain the fetch-execute cycle with the program counter.
- Read the number of cores, the memory and the disk space of a Linux machine, and tell GB from GiB.

## Why it matters

"The program is slow" can mean the processor is busy, memory is full, or the disk is the bottleneck, and the fix is different for each. Knowing the parts lets you ask the right question before you spend money or hours. It also matters for security: a password typed into a program lives in RAM, a file you "deleted" may still sit on the disk, and many attacks work by making a processor run instructions that came from the wrong place.

## The idea

Three parts work together every time a program runs.

The **CPU** (central processing unit, or processor) runs instructions. Modern CPUs have several **cores**, and each core is a complete processor that can run its own stream of instructions. Inside each core is a small set of **registers**: tiny storage spaces, each holding one number, that the core can use instantly.

**RAM** (random access memory), also just called memory, holds the programs that are running and the data they are working on. It is a long row of bytes, and each byte has a number, its **address**. RAM is fast, but it forgets everything when the power goes off: it is **volatile**.

**Storage** (an SSD or a hard disk) keeps files when the power is off. It is much bigger and cheaper than RAM, and much slower. A program on the disk cannot run from there: the operating system first copies it into RAM.

Think of a cook in a kitchen. The cook is the CPU, and the few things in their hands are the registers. The kitchen counter is RAM: room for the recipes and ingredients in use, cleared at the end of the day. The storeroom down the corridor is the disk: everything is kept there, but every trip takes time. A good cook brings what they need to the counter first, and so does a computer.

### The fetch-execute cycle

A program in memory is a list of **instructions**, each one a few bytes of machine code: "load the number at address 8", "add 1", "if the result is not zero, go back to step 1". One register, the **program counter**, holds the address of the next instruction. Then the core repeats one loop for as long as the machine is on:

1. **Fetch** the instruction at the address in the program counter, and move the counter on to the next one.
2. **Decode** it: work out which operation it is and what it needs.
3. **Execute** it: do the arithmetic, move the data, or change the program counter to jump somewhere else.

That is the **fetch-execute cycle**. A core at 3 GHz goes round it billions of times a second. Every program you will ever run, from `ls` to a web browser, is this loop working through a long list of very small steps.

### Fast and small, slow and big

| Where | Typical size | Time to read | Kept without power? |
|---|---|---|---|
| Register | a few hundred bytes to a few kilobytes per core | under 1 nanosecond | No |
| Cache (inside the CPU) | a few to a few dozen megabytes | 1 to 10 nanoseconds | No |
| RAM | 8 to 64 gigabytes | about 100 nanoseconds | No |
| SSD | 250 gigabytes to a few terabytes | tens of microseconds | Yes |
| Hard disk | up to many terabytes | several milliseconds | Yes |

These are orders of magnitude, not exact values. A **cache** is a small, fast copy of data that is used often, kept close to whoever needs it. A nanosecond is a billionth of a second, so reading from a hard disk can take 100,000 times longer than reading from RAM. That gap explains much of how computers are built: everything tries to keep the data it needs in the faster layers.

## Try it

The numbers in the first three steps describe the test machine used for this course: a small virtual machine with 2 cores and 3 GB of memory. Yours are different, and that is the point: these commands describe your machine.

### 1. Count the cores

<!-- lab: nocheck -->
```bash
nproc
lscpu | grep -E '^(Architecture|CPU\(s\)|Model name)'
```

```output
2
Architecture:                            x86_64
CPU(s):                                  2
Model name:                              QEMU TCG CPU version 2.5+
```

`nproc` prints the number of cores that programs may use. `lscpu` describes the CPU in detail, and `grep -E` keeps three lines. `x86_64` is the **architecture**: the family of machine code this CPU understands. Most laptops and servers use `x86_64`; phones, Raspberry Pis and recent Macs use ARM (`aarch64`). The model name on a real computer looks like `Intel(R) Core(TM) i5-...` or `AMD Ryzen ...`.

### 2. Look at the memory

<!-- lab: nocheck -->
```bash
free -h
```

```output
               total        used        free      shared  buff/cache   available
Mem:           2.8Gi       362Mi       2.4Gi       1.0Mi       322Mi       2.5Gi
Swap:             0B          0B          0B
```

`-h` means "human-readable": sizes with units instead of raw bytes. `total` is all the RAM. `used` is what programs hold. `buff/cache` is RAM that Linux fills with copies of disk data, so a second read of the same file comes from RAM. Linux gives it back the moment a program needs it, which is why `available`, not `free`, is the number to watch. **Swap** is disk space used as overflow when RAM is full; this machine has none.

### 3. Look at the storage

<!-- lab: nocheck -->
```bash
df -h /
df -H /
```

```output
Filesystem      Size  Used Avail Use% Mounted on
/dev/vda1        19G  1.7G   17G   9% /
Filesystem      Size  Used Avail Use% Mounted on
/dev/vda1        20G  1.8G   18G   9% /
```

`df` shows the space on a disk, and `/` asks about the disk that holds the root directory. The two lines describe the same disk, yet the sizes differ. `-h` counts in powers of 1024, and `-H` in powers of 1000. The next step explains the difference.

### 4. Tell GB from GiB

```python title="units.py"
print(2**10, 2**20, 2**30)
print(round(500 * 10**9 / 2**30, 1))
```

```bash
python3 units.py
```

```output
1024 1048576 1073741824
465.7
```

There are two ways to count big numbers of bytes. Disk makers use powers of 1000: 1 **GB** (gigabyte) is 1,000,000,000 bytes. Memory is built in powers of two, so 1 **GiB** (gibibyte) is 2³⁰ = 1,073,741,824 bytes, about 7% more. The same goes for KB and KiB, MB and MiB, TB and TiB.

The second line is the classic surprise: a "500 GB" disk shows up as about 465.7 GiB in your system. Nothing is missing; the two numbers just use different units. Watch the labels, because tools are not consistent: `free -h` writes `Gi`, which is clear, but `df -h` writes only `G` while it counts in GiB.

### 5. Build a pretend CPU

This program is a tiny imaginary computer. Its memory is a Python list, and the list holds both the program and the data. It has only one register for numbers, the accumulator `acc`, plus the program counter `pc`.

```python title="cpu.py"
def run(memory, trace=True):
    pc = 0    # program counter: address of the next instruction
    acc = 0   # accumulator: the one register for numbers
    while True:
        op, arg = memory[pc]              # fetch
        address = pc
        pc += 1
        if op == "LOAD":                  # decode and execute
            acc = memory[arg]
        elif op == "ADD":
            acc = acc + memory[arg]
        elif op == "SUB":
            acc = acc - memory[arg]
        elif op == "STORE":
            memory[arg] = acc
        elif op == "JUMPNZ":              # jump if acc is not zero
            if acc != 0:
                pc = arg
        elif op == "PRINT":
            print("  output:", acc)
        elif op == "HALT":
            return
        if trace:
            print(f"{address}: {op:<6} {arg}  acc={acc} pc={pc}")


if __name__ == "__main__":
    countdown = [
        ("LOAD", 8),     # 0: acc = memory[8]
        ("PRINT", 0),    # 1: show acc
        ("SUB", 9),      # 2: acc = acc - memory[9]
        ("JUMPNZ", 1),   # 3: if acc is not 0, go to 1
        ("HALT", 0),     # 4: stop
        None, None, None,
        3,               # 8: the starting number
        1,               # 9: the step
    ]
    run(countdown)
```

The program lives at addresses 0 to 4, the data at addresses 8 and 9. The block under `if __name__ == "__main__":` runs only when you start `cpu.py` itself, not when another file imports it, as you saw in Module 3; the exercise needs that. Each turn of the `while` loop is one fetch-execute cycle: read the instruction at `pc`, move `pc` on, then do what the instruction says.

```bash
python3 cpu.py
```

```output
0: LOAD   8  acc=3 pc=1
  output: 3
1: PRINT  0  acc=3 pc=2
2: SUB    9  acc=2 pc=3
3: JUMPNZ 1  acc=2 pc=1
  output: 2
1: PRINT  0  acc=2 pc=2
2: SUB    9  acc=1 pc=3
3: JUMPNZ 1  acc=1 pc=1
  output: 1
1: PRINT  0  acc=1 pc=2
2: SUB    9  acc=0 pc=3
3: JUMPNZ 1  acc=0 pc=4
```

Follow the `pc` column. It counts up by one after each instruction, except after `JUMPNZ`, which sets it back to 1 while `acc` is not zero. That single trick is how every loop and every `if` in every language ends up in machine code: a test and a jump. On the last line `acc` is 0, so the jump does not happen, `pc` moves on to 4, and the machine stops at `HALT`.

A real CPU does the same, with instructions stored as bytes instead of Python tuples, a few dozen registers instead of one, and billions of cycles a second.

:::note[Programs are data]
In `cpu.py`, instructions and numbers sit in the same memory. Real computers work this way too. It is what lets the operating system load any program you like, and it is also why a bug that lets an attacker write into memory can be so dangerous: the CPU cannot tell an instruction it was meant to run from one that was planted.
:::

## Exercise

Write `times.py` next to `cpu.py`. It imports `run` and gives it a program that computes 4 × 3 by adding 4 three times, then prints 12. Run it with `trace=False` so only the output shows.

Hint: you need memory cells for the number 4, a counter that starts at 3, the running total, and the constant 1. With only one register, you have to `STORE` the total and the counter back into memory before you work on the other one.

<details>
<summary>Show the solution</summary>

```python title="times.py"
from cpu import run

times = [
    ("LOAD", 12),    # 0: acc = total
    ("ADD", 10),     # 1: acc = acc + 4
    ("STORE", 12),   # 2: total = acc
    ("LOAD", 11),    # 3: acc = counter
    ("SUB", 13),     # 4: acc = acc - 1
    ("STORE", 11),   # 5: counter = acc
    ("JUMPNZ", 0),   # 6: if counter is not 0, go to 0
    ("LOAD", 12),    # 7: acc = total
    ("PRINT", 0),    # 8: show it
    ("HALT", 0),     # 9: stop
    4,               # 10: the number to add
    3,               # 11: the counter
    0,               # 12: the total
    1,               # 13: the constant 1
]
run(times, trace=False)
```

```bash
python3 times.py
```

```output
  output: 12
```

The loop body adds 4 to the total and takes 1 from the counter. `JUMPNZ` sends the machine back to address 0 until the counter reaches 0, which happens after three rounds. Your addresses may differ; what matters is that the output is 12. Try `trace=True` to watch every cycle.

</details>

## Check yourself

**1. Why can a program not run straight from the disk?**

<details>
<summary>Answer</summary>

The CPU fetches instructions from RAM. The disk is far too slow to feed it, so the operating system copies the program into RAM first, and the CPU runs it from there.

</details>

**2. What does the program counter hold, and what changes it besides moving on by one?**

<details>
<summary>Answer</summary>

The address of the next instruction to fetch. A jump instruction, such as `JUMPNZ` in `cpu.py`, sets it to another address. That is how loops and `if` work in machine code.

</details>

**3. You save a file and then the power fails. Is the file safe? What about the text you typed in an unsaved document?**

<details>
<summary>Answer</summary>

The saved file is on the disk, which keeps data without power, so it is safe. The unsaved text existed only in RAM, which is volatile, so it is lost.

</details>

**4. A laptop is sold with a "1 TB" disk. Roughly how big does Linux say it is with `df -h`?**

<details>
<summary>Answer</summary>

Around 930G. The maker counts 1 TB as 10¹² bytes, and `df -h` counts in powers of 1024: 10¹² / 2³⁰ is about 931 GiB. The exact number shown is a little lower, because the file system itself takes some space.

</details>

**5. In `free -h`, why is `available` a better number to watch than `free`?**

<details>
<summary>Answer</summary>

Linux fills unused RAM with a cache of disk data (`buff/cache`) and hands that RAM back as soon as a program needs it. `available` counts that reusable RAM; `free` does not.

</details>

## Common mistakes

- **Thinking "free" memory is wasted or missing.** Linux uses idle RAM as a disk cache on purpose. Low `free` with high `available` is healthy.
- **Comparing GB with GiB.** A disk is not smaller than advertised; the units differ. Check whether a tool counts in powers of 1000 or 1024 before you compare numbers.
- **Mixing up memory and storage.** "My computer has 512 GB of memory" usually means storage. RAM is the fast, temporary one, and it is much smaller.
- **Expecting more cores to speed up everything.** A program that runs as one stream of instructions uses one core, however many you have. The next lesson shows how programs use several at once.

## Key terms

- **CPU**: the central processing unit, or processor: the part that runs instructions.
- **Core**: one complete processor inside a CPU. A CPU with 4 cores can run 4 streams of instructions at the same moment.
- **Register**: a tiny storage space inside a core, holding one value, that the core can use instantly.
- **RAM**: random access memory, the fast memory that holds running programs and their data. It is volatile.
- **Address**: the number of one byte in memory.
- **Volatile**: losing its content when the power goes off. RAM is volatile; disks are not.
- **Storage**: an SSD or hard disk that keeps files without power. Bigger and much slower than RAM.
- **Instruction**: one small operation in machine code, such as "add" or "jump".
- **Program counter**: the register that holds the address of the next instruction.
- **Fetch-execute cycle**: the loop every core repeats: fetch the next instruction, decode it, execute it.
- **Cache**: a small, fast copy of data that is used often, kept close to where it is needed.
- **Architecture**: the family of machine code a CPU understands, for example `x86_64` or ARM (`aarch64`).
- **Swap**: disk space used as extra memory when RAM is full. Much slower than RAM.
- **GiB**: gibibyte, 2³⁰ bytes (1,073,741,824). A **GB** (gigabyte) is 10⁹ bytes.

## Go further

- [Ubuntu manpage: free](https://manpages.ubuntu.com/manpages/noble/man1/free.1.html): what every column of `free` means, from the official manual.
- [Ubuntu manpage: lscpu](https://manpages.ubuntu.com/manpages/noble/man1/lscpu.1.html): every field `lscpu` can show about your processor.
- [The Linux kernel documentation: /proc/meminfo](https://docs.kernel.org/filesystems/proc.html#meminfo): the raw memory numbers that `free` reads, explained by the kernel developers.
