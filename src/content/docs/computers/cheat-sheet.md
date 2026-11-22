---
title: "Cheat sheet: Number systems and units"
description: Binary, hex, text encodings, bitwise operators, units, and the commands of Module 5 for looking inside files, processes, binaries and containers, on one printable page.
cheatSheet: true
sidebar:
  order: 99
  label: Cheat sheet
---

## Number systems

| Decimal | Binary | Hex | | Decimal | Binary | Hex |
|---|---|---|---|---|---|---|
| 0 | `0000` | `0` | | 8 | `1000` | `8` |
| 1 | `0001` | `1` | | 9 | `1001` | `9` |
| 2 | `0010` | `2` | | 10 | `1010` | `a` |
| 3 | `0011` | `3` | | 11 | `1011` | `b` |
| 4 | `0100` | `4` | | 12 | `1100` | `c` |
| 5 | `0101` | `5` | | 13 | `1101` | `d` |
| 6 | `0110` | `6` | | 14 | `1110` | `e` |
| 7 | `0111` | `7` | | 15 | `1111` | `f` |

- Binary place values: 128, 64, 32, 16, 8, 4, 2, 1. A byte is 8 bits: 0 to 255 (`0xff`).
- One hex digit = 4 bits, so one byte = 2 hex digits. One octal digit = 3 bits.
- Prefixes: `0b` binary, `0x` hex, `0o` octal (Python).

| Convert | Python | Bash |
|---|---|---|
| binary text to number | `int("1011", 2)` gives 11 | `echo $((2#1011))` |
| hex text to number | `int("ff", 16)` gives 255 | `echo $((16#ff))` |
| number to binary / hex / octal | `bin(200)`, `hex(200)`, `oct(0o755)` | `printf '%x\n' 200` |
| in an f-string | `f"{n:05b}"`, `f"{n:x}"` | |

## Units

| Name | Bytes | | Name | Bytes |
|---|---|---|---|---|
| KB (kilobyte) | 1,000 | | KiB (kibibyte) | 1,024 (2¹⁰) |
| MB | 1,000,000 | | MiB | 1,048,576 (2²⁰) |
| GB | 10⁹ | | GiB | 1,073,741,824 (2³⁰) |

- A "500 GB" disk is about 465.7 GiB. `df -h` and `free -h` count in powers of 1024 (`df -h` writes `G`, `free -h` writes `Gi`); `df -H` counts in powers of 1000.

## Text

| Character | Decimal | Hex | | Character | Decimal | Hex |
|---|---|---|---|---|---|---|
| `0` | 48 | `30` | | newline (LF) | 10 | `0a` |
| `A` | 65 | `41` | | carriage return (CR) | 13 | `0d` |
| `a` | 97 | `61` | | `!` | 33 | `21` |

- Lower case = upper case + 32 (one bit: `chr(ord("a") ^ 32)` is `A`).
- UTF-8: ASCII characters 1 byte, others 2 to 4. `é` (U+00E9) is `c3 a9`, `€` is `e2 82 ac`.
- Python: `ord("A")`, `chr(72)`, `"é".encode("utf-8")`, `b.decode("utf-8")`, `bytes.fromhex("48 69")`.
- UTF-8 bytes read as Latin-1 give `Ã©` instead of `é`. Always name the encoding: `open(path, encoding="utf-8")`.
- `hexdump -C file`: offset, bytes in hex, text. `wc -c` counts bytes, `wc -m` characters.

## Logic and bits

| a | b | `a & b` AND | `a \| b` OR | `a ^ b` XOR |
|---|---|---|---|---|
| 0 | 0 | 0 | 0 | 0 |
| 0 | 1 | 0 | 1 | 1 |
| 1 | 0 | 0 | 1 | 1 |
| 1 | 1 | 1 | 1 | 0 |

| Job | Expression | Example |
|---|---|---|
| test a bit | `value & mask` | `bool(0o755 & 0o200)` is `True` |
| set a bit | `value \| mask` | `0o755 \| 0o020` is `0o775` |
| clear a bit | `value & ~mask` | `0o755 & ~0o005` is `0o750` |
| flip bits, flip back | `x ^ key ^ key` | gives `x` again |
| times / divided by 2ⁿ | `x << n`, `x >> n` | `1 << 4` is 16 |

- Permissions: r = 4, w = 2, x = 1 per digit (owner, group, others). New file = `0o666 & ~umask`: umask `0002` gives 664, `0022` gives 644.
- De Morgan: `not (a and b)` = `(not a) or (not b)`.
- In Python, `^` is XOR; power is `**`. Use `and`/`or`/`not` for conditions, `&`/`|`/`~` for bits.

## Hardware

| Layer | Read time (order of magnitude) | Keeps data without power |
|---|---|---|
| Register | under 1 ns | No |
| Cache | 1 to 10 ns | No |
| RAM | about 100 ns | No |
| SSD | tens of µs | Yes |
| Hard disk | several ms | Yes |

Fetch-execute cycle: fetch the instruction at the program counter, move the counter on, decode, execute. A jump sets the counter.

| Command | Shows |
|---|---|
| `nproc` | number of cores |
| `lscpu` | architecture, CPUs, model |
| `free -h` | RAM: watch `available`, not `free` |
| `df -h /` | disk space of the root file system |
| `uname -m` / `uname -r` | architecture / kernel version |

## Operating system

| Command or file | Shows |
|---|---|
| `strace -e trace=openat,read,write,close -o trace.txt cmd` | the system calls of `cmd` |
| `/proc/self/status`, `/proc/PID/status` | name, state, `Threads`, `VmSize` (virtual), `VmRSS` (in RAM) |
| `readlink /proc/PID/exe /proc/PID/cwd` | program file, working directory |
| `ls /proc/PID/fd` | open file descriptors: 0 stdin, 1 stdout, 2 stderr |
| `hexdump -C /proc/PID/cmdline` | arguments, separated by `00` bytes |
| `cat /proc/$$/comm` | name of your own shell (`$$` is its PID) |
| `ln a b`, `ls -i`, `stat -c '%h %n' a` | hard link, inode numbers, link count |
| `df -T /` | file system type (ext4 on Ubuntu) |

Threads of a process share memory; processes each have their own virtual memory.

## Files and binaries

| Magic number | File |
|---|---|
| `7f 45 4c 46` (`.ELF`) | compiled Linux program (ELF) |
| `23 21` (`#!`) | script: the shebang, then the interpreter path |

- `file name`: what a file really is, from its content. Says `with CRLF line terminators` for Windows endings.
- Fix CRLF: `sed -i 's/\r$//' script.sh`.
- `gcc hello.c -o hello` compiles, `./hello` runs, `objdump -d hello` shows machine code.
- `python3 -m dis script.py` shows Python bytecode. `time cmd` measures a command.
- Compiled: binary for one OS and architecture, errors at compile time, fast. Interpreted: needs the interpreter, errors when the line runs, slower.

## VMs and containers

| | VM | Container |
|---|---|---|
| Own kernel | Yes | No, shares the host's |
| Built from | hypervisor + virtual hardware | namespaces + cgroups + image |
| Starts in | seconds to minutes | under a second |

| Command | Does |
|---|---|
| `systemd-detect-virt` | names the hypervisor (`none` on real hardware) |
| `ls /proc/self/ns` | the namespaces of a process |
| `sudo unshare --uts sh -c 'hostname box; hostname'` | own hostname |
| `sudo unshare --pid --fork --mount-proc sh -c 'ps -e -o pid,comm'` | own process list, starting at PID 1 |
| `sudo systemd-run --wait --pipe -p MemoryMax=50M cmd` | run `cmd` in a cgroup with a memory limit |

## The cloud

| Model | You manage | Example |
|---|---|---|
| IaaS | OS, updates, app, data | a cloud VM with Ubuntu |
| PaaS | code, settings, data | upload a web app, it runs |
| SaaS | data and accounts | web email |

- Region: an area with data centres. Availability zone: a separate location inside a region, with its own data centres, power and cooling.
- Light in fibre: about 200,000 km/s, so at least 1 ms of round trip per 100 km of distance.
- About 730 hours in a month. Elastic: resources follow the load; you pay for what runs.
