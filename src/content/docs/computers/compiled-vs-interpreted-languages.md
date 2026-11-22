---
title: Compiled vs interpreted languages
description: Compile a tiny C program, compare it with the same program in Python, and look inside the binary to see what a compiler really produces.
lesson: "5.5"
time: 25 min
sidebar:
  order: 5
---

You can send a friend your Python script and it runs on their laptop, whatever it is. Send them a program you compiled on your Ubuntu machine, and on a Mac it will not even start. Both began as text you typed. The difference is what happened to that text before it ran, and that is the subject of this lesson.

## Goal

After this lesson you can:

- Explain what a compiler and an interpreter do, and where Python fits.
- Compile and run a small C program, and look at the machine code inside the binary.
- Compare when each kind of language finds errors, how fast it runs and where it can run.

## Why it matters

The choice between compiled and interpreted code decides how fast a program is, how you ship it and which mistakes are caught before your users see them. It matters for security too: malware analysts spend their days reading compiled binaries without the source code, and many classic vulnerabilities, such as buffer overflows, exist mainly in compiled languages like C. Knowing what a binary is takes some of the mystery out of all of that.

## The idea

You write **source code**: text that people can read, such as `print("hi")`. The CPU cannot read it. From Lesson 5.3 you know it only runs **machine code**, instructions stored as bytes for one architecture, such as `x86_64`. Something has to bridge the gap, and there are two main ways.

A **compiler** translates the whole program into machine code before it runs. The result is a **binary file**, usually just called a binary or an executable: a file of machine code that the operating system can load and the CPU can run directly. C, C++, Go and Rust work this way. You compile once, then run the binary as often as you like, without the compiler.

An **interpreter** is a program that reads your source code and carries it out step by step, every time you run it. You need the interpreter on every machine that runs the program, but the same source file works on any machine that has one.

Think of a book and a conference. A translator can translate the whole book before it is printed: the readers then get a book in their own language, fast to read, but only in that language. At a conference, an interpreter translates each sentence while the speaker talks: slower, and the interpreter must be in the room every time, but the speaker can talk to any audience that has one.

### Where Python fits

Python is usually called interpreted, and that is close enough, but the real picture has one more step. When you run a script, Python first compiles it into **bytecode**: simple instructions for an imaginary machine, not for your real CPU. Then the Python interpreter, a program written in C, runs that bytecode one instruction at a time. Java and C# also compile to bytecode, and their runtimes add a **JIT compiler** (just in time) that turns the busiest parts into real machine code while the program runs.

| | Compiled (C) | Interpreted (Python) |
|---|---|---|
| What you ship | a binary for one OS and architecture | the source file |
| What the user needs | nothing extra | the Python interpreter |
| Errors in the code | many found when compiling, before anything runs | found only when that line runs |
| Speed | fast: the CPU runs the machine code directly | slower: every step goes through the interpreter |
| Change and run again | compile, then run | just run |

## Try it

```bash
mkdir ~/langs
cd ~/langs
```

### 1. Install a C compiler

The C compiler on Linux is **gcc** (the GNU Compiler Collection). Install it with apt, as in Lesson 1.6. It prints many lines; wait for the prompt to come back.

<!-- lab: nocheck -->
```bash
sudo apt update
sudo apt install -y gcc
```

<!-- lab: nocheck -->
```bash
gcc --version | head -n 1
```

```output
gcc (Ubuntu 13.3.0-6ubuntu2~24.04.1) 13.3.0
```

Your version number may differ. Any recent version works for this lesson.

### 2. Write and compile a C program

```c title="hello.c"
#include <stdio.h>

int main(void) {
    printf("Hello from C\n");
    return 0;
}
```

`#include <stdio.h>` brings in the standard input and output functions, including `printf`. Every C program starts in the function `main`. `return 0` gives the exit code 0, which means success.

```bash
gcc hello.c -o hello
./hello
```

```output
Hello from C
```

`gcc hello.c -o hello` compiled the source into a binary called `hello` (`-o` names the output). It printed nothing, which means it worked. `./hello` runs the binary. The `./` is needed because the current directory is not in your `PATH`.

### 3. Look at what a binary is

```bash
ls -l hello
file hello
```

```output
-rwxrwxr-x 1 sam sam 15960 Nov 21 21:26 hello
hello: ELF 64-bit LSB pie executable, x86-64, version 1 (SYSV), dynamically linked, interpreter /lib64/ld-linux-x86-64.so.2, BuildID[sha1]=a9f8e5ca76732d498996bfbb15f0ccfcfa7e66cd, for GNU/Linux 3.2.0, not stripped
```

Almost 16,000 bytes for one line of text, and the compiler already set the `x` permission. `file` reads the content to tell you what kind of file it is: **ELF**, the format of programs on Linux, 64-bit, for `x86-64`, and "dynamically linked": it uses `printf` from the shared C library on the system instead of carrying its own copy. The word `interpreter` in that line does not mean a language interpreter: it names the small system program that loads the shared libraries before your program starts. (The `BuildID` is a fingerprint of this build, and yours can differ.)

How did `file` know? Look at the first four bytes:

```bash
head -c 4 hello | hexdump -C
```

```output
00000000  7f 45 4c 46                                       |.ELF|
00000004
```

Every compiled program on Linux is an ELF file, and every ELF file starts with the byte `7f` followed by the letters `ELF`. A fixed pattern like this at the start of a file is called a **magic number**. PNG images, PDF files and ZIP archives all have their own, and `file` knows hundreds of them.

### 4. Read the machine code

`objdump -d` (disassemble) turns the machine code in a binary back into readable instructions. It is part of a package called binutils, which apt installed together with gcc. Show the function `main` and the lines after it:

```bash
objdump -d hello | grep -A 9 '<main>:'
```

```output
0000000000001149 <main>:
    1149:	f3 0f 1e fa          	endbr64
    114d:	55                   	push   %rbp
    114e:	48 89 e5             	mov    %rsp,%rbp
    1151:	48 8d 05 ac 0e 00 00 	lea    0xeac(%rip),%rax        # 2004 <_IO_stdin_used+0x4>
    1158:	48 89 c7             	mov    %rax,%rdi
    115b:	e8 f0 fe ff ff       	call   1050 <puts@plt>
    1160:	b8 00 00 00 00       	mov    $0x0,%eax
    1165:	5d                   	pop    %rbp
    1166:	c3                   	ret
```

Each line is one instruction for the CPU, and you can read it with what you know from this module. On the left is the address in hex. In the middle are the bytes of the instruction: what the CPU really fetches. On the right is the same instruction in **assembly language**, a readable name for it. `%rax`, `%rdi` and `%rbp` are registers. `lea` puts the address of your text into a register, `call` jumps to the function that prints it, and `mov $0x0,%eax` is your `return 0`.

Notice `puts`, not `printf`. The compiler saw that `printf` only printed fixed text ending in a newline, and replaced it with the simpler function `puts`, which does exactly that. Compilers improve your code like this all the time.

### 5. Do the same in Python

```python title="hello.py"
print("Hello from Python")
```

```bash
python3 hello.py
```

```output
Hello from Python
```

No compile step, no binary: `python3` is the interpreter, and `hello.py` is its input. You can still see the bytecode Python makes from it before running it:

```bash
python3 -m dis hello.py
```

```output
  0           0 RESUME                   0

  1           2 PUSH_NULL
              4 LOAD_NAME                0 (print)
              6 LOAD_CONST               0 ('Hello from Python')
              8 CALL                     1
             16 POP_TOP
             18 RETURN_CONST             1 (None)
```

`dis` is the disassembler for Python bytecode. These instructions are for Python's own imaginary machine: find `print`, load the text, call the function. The interpreter carries them out one by one, the same way your `cpu.py` did in Lesson 5.3. The exact instructions change between Python versions; this is Python 3.12.

### 6. See when each one finds a mistake

Here is a typo, `totl` instead of `total`, hidden in a branch that runs only when you pass more than three arguments:

```c title="late.c"
#include <stdio.h>

int main(int argc, char *argv[]) {
    if (argc > 3) {
        printf("%d\n", totl);
    }
    printf("all fine\n");
    return 0;
}
```

```bash
gcc late.c -o late
```

```output
late.c: In function ‘main’:
late.c:5:24: error: ‘totl’ undeclared (first use in this function)
    5 |         printf("%d\n", totl);
      |                        ^~~~
late.c:5:24: note: each undeclared identifier is reported only once for each function it appears in
```

The compiler refused: it read the whole program, found a name that does not exist at line 5, column 24, and made no binary at all. The mistake was caught before anything ran.

Now the same mistake in Python:

```python title="late.py"
import sys

if len(sys.argv) > 3:
    print(totl)
print("all fine")
```

```bash
python3 late.py
python3 late.py a b c
```

```output
all fine
Traceback (most recent call last):
  File "/home/sam/langs/late.py", line 4, in <module>
    print(totl)
          ^^^^
NameError: name 'totl' is not defined
```

The first run looks perfectly fine, because the broken line never ran. Only the second run, with three arguments, reaches it and crashes. This is why Python programs need tests that run every branch, as you did with pytest in Module 3.

### 7. Compare the speed

The same loop in both languages: add up `i % 7` for a million numbers.

```c title="sum.c"
#include <stdio.h>

int main(void) {
    long total = 0;
    for (long i = 0; i < 1000000; i++) {
        total += i % 7;
    }
    printf("%ld\n", total);
    return 0;
}
```

```python title="sum.py"
total = 0
for i in range(1_000_000):
    total += i % 7
print(total)
```

`time` in front of a command measures how long it takes:

<!-- lab: nocheck -->
```bash
gcc sum.c -o sum
time ./sum
time python3 sum.py
```

```output
2999997

real	0m0.079s
user	0m0.032s
sys	0m0.046s
2999997

real	0m12.468s
user	0m11.923s
sys	0m0.512s
```

Same answer, very different times. `real` is the time on the clock. These numbers come from the course's slow test machine, which imitates its CPU in software; on a normal computer both are much faster, but the C version still wins by a factor of about 30 to 100. Every Python step goes through the interpreter, while the C loop is a few machine instructions repeated.

That does not make Python a bad choice. For most scripts, a fraction of a second does not matter, and Python saves you hours of writing. When speed does matter, Python calls code written in C: that is what libraries such as NumPy do.

### 8. Check where the binary can run

```bash
uname -m
```

```output
x86_64
```

`uname -m` prints the machine's architecture. Your `hello` binary contains `x86-64` machine code for Linux, so it runs only on a Linux machine with this kind of CPU. A Mac with an ARM chip, or Windows, would refuse it. `hello.py` runs anywhere Python is installed. To run the C program elsewhere, you compile the same source again on, or for, the other system.

## Exercise

Write `square.c`: a C program that prints the squares of the numbers 1 to 5, one per line, in the form `3 x 3 = 9`. Compile it, run it, and check with `file` that you made an ELF binary. Then write `square.py`, which prints exactly the same lines.

A C `for` loop looks like the one in `sum.c`. In `printf`, `%d` stands for an `int` value, and the values follow the text, separated by commas.

<details>
<summary>Show the solution</summary>

```c title="square.c"
#include <stdio.h>

int main(void) {
    for (int i = 1; i <= 5; i++) {
        printf("%d x %d = %d\n", i, i, i * i);
    }
    return 0;
}
```

```bash
gcc square.c -o square
./square
file square | cut -d, -f1
```

```output
1 x 1 = 1
2 x 2 = 4
3 x 3 = 9
4 x 4 = 16
5 x 5 = 25
square: ELF 64-bit LSB pie executable
```

`cut -d, -f1` keeps the text up to the first comma, so the long `file` line stays short.

```python title="square.py"
for i in range(1, 6):
    print(f"{i} x {i} = {i * i}")
```

```bash
python3 square.py
```

```output
1 x 1 = 1
2 x 2 = 4
3 x 3 = 9
4 x 4 = 16
5 x 5 = 25
```

The C version needs types (`int`), braces, semicolons and a compile step. The Python version is shorter, and runs straight away.

</details>

## Check yourself

**1. What does a compiler produce, and what does the user need to run it?**

<details>
<summary>Answer</summary>

A binary: a file of machine code for one operating system and architecture. The user needs nothing extra to run it, just a matching system. No compiler and no interpreter are needed.

</details>

**2. Is Python compiled or interpreted?**

<details>
<summary>Answer</summary>

Both, in a way. Python compiles your source into bytecode, and then the Python interpreter runs that bytecode step by step. Standard Python does not turn your program into machine code for your CPU, which is why people call it interpreted.

</details>

**3. In step 6, why did `late.py` print `all fine` the first time, while `late.c` would not even compile?**

<details>
<summary>Answer</summary>

The C compiler checks the whole program before making a binary, and found the unknown name `totl`. Python only discovers that a name does not exist when it runs that line, and the first time the branch did not run.

</details>

**4. What are the first four bytes of every compiled Linux program, and what is such a pattern called?**

<details>
<summary>Answer</summary>

`7f 45 4c 46`, which is the byte `7f` followed by `ELF`. A fixed pattern at the start of a file that tells what kind of file it is, is called a magic number.

</details>

**5. You compiled `hello` on Ubuntu with an x86-64 processor. Why does it not run on a Mac with an ARM chip?**

<details>
<summary>Answer</summary>

The binary contains machine code for x86-64, which an ARM CPU does not understand, and it is in Linux's ELF format, which macOS does not load. You have to compile the source again for that system.

</details>

## Common mistakes

- **Running the source instead of the binary.** `./hello.c` does not work: the `.c` file is text for the compiler. Compile first, then run `./hello`.
- **Forgetting to compile again after a change.** The binary does not update itself. Edit `hello.c`, and `./hello` still runs the old version until you run `gcc` again.
- **Forgetting `-o`.** Without it, gcc names the binary `a.out`. That works, but with several programs you lose track. Always name the output.
- **Reading only the last compiler error.** Compilers report errors in order, and one early mistake often causes several later ones. Fix the first error, compile again, and repeat.
- **Thinking an interpreted language has no errors before running.** Python still refuses to start a file with a syntax error, such as a missing bracket. What it cannot catch in advance are mistakes like unknown names, which only show up when the line runs.

## Key terms

- **Source code**: a program written as text that people can read, such as a `.c` or `.py` file.
- **Machine code**: instructions stored as bytes, for one architecture, that a CPU can run directly.
- **Compiler**: a program that translates source code into machine code before the program runs.
- **Binary file**: a file of machine code that the operating system can load and run. Also called a binary or an executable.
- **Interpreter**: a program that reads code and carries it out step by step while it runs.
- **Bytecode**: simple instructions for an imaginary machine, produced from source code and run by an interpreter, as in Python or Java.
- **JIT compiler**: a "just in time" compiler that turns the busiest parts of a running program into machine code while it runs.
- **gcc**: the GNU Compiler Collection, the standard C compiler on Linux.
- **ELF**: Executable and Linkable Format, the file format of programs and libraries on Linux.
- **Magic number**: a fixed sequence of bytes at the start of a file that tells what kind of file it is.
- **Assembly language**: a readable way of writing machine code, one instruction per line, such as `mov` or `call`.

## Go further

- [Python: dis, the disassembler for Python bytecode](https://docs.python.org/3/library/dis.html): the official list of bytecode instructions and how to read them.
- [GCC online documentation](https://gcc.gnu.org/onlinedocs/): the manual of the compiler you used, including all its options.
- [Ubuntu manpage: elf](https://manpages.ubuntu.com/manpages/noble/man5/elf.5.html): the structure of an ELF file, starting with its magic number.
