---
title: Storing passwords safely
description: See why plain SHA-256 is not enough for passwords, then store them with a random salt and a slow hash, scrypt, from Python's standard library.
lesson: "10.5"
time: 25 min
sidebar:
  order: 5
---

<!-- lab: run
mkdir -p ~/crypto
-->

Sooner or later, some database gets stolen. It happens to large companies with security teams, and it will happen to some app you work on. Nobody can promise it never happens. What you can decide is what the thief finds inside: every password in clear text, as in the `mylab` table in Module 7, or something that takes years to turn back into passwords. This lesson is about building the second kind.

## Goal

After this lesson you can:

- Explain why passwords must be hashed, and why a fast hash such as SHA-256 is still not enough.
- Explain what a salt does, and what a slow hash such as scrypt adds.
- Write and use two Python functions that hash and check passwords safely.

## Why it matters

People reuse passwords. A password stolen from a small hobby site often opens the same person's email or bank account, the credential stuffing of lesson 9.4. So the way you store passwords protects your users far beyond your own app. Storing them badly is one of the most common serious flaws in real applications, and it is exactly what you will fix in `mylab` in the next lesson.

## The idea

A login only needs to answer one question: "is this the right password?". It never needs to know the password itself. So instead of the password, you store its hash. At login you hash what the user typed and compare the two hashes. A thief who steals the table gets hashes, and lesson 10.1 showed that a hash cannot be turned back.

But a thief can do what you did in the exercise of lesson 10.1: guess, hash the guess, compare. Most people choose from a small set of passwords such as `123456`, `password` or `summer2024`, and lists of millions of real passwords from old leaks are public. This is a **dictionary attack**, and with a fast hash it works frighteningly well. SHA-256 was built to be fast: a normal laptop computes millions of hashes per second, a graphics card billions.

Two defenses fix this, and you need both:

1. A **salt**: a random value, different for every user, mixed into the password before hashing and stored next to the hash. The same password now gives a different hash for each user. The thief must attack each user separately, and tables of hashes computed in advance, called **rainbow tables**, become useless.
2. A **slow hash**, also called a password hashing function: a hash designed to take a lot of time and memory on purpose, with a cost setting you can raise as computers get faster. One login check taking a fraction of a second is fine for a user. For a thief who wants to try a billion guesses, it is a wall.

Think of a lock on a bike. A salt means that every bike has its own lock, so one master key no longer opens them all. A slow hash means that every lock takes minutes to try a key in, so trying thousands of keys is hopeless.

The common slow hashes are **Argon2**, **scrypt**, **bcrypt** and PBKDF2. OWASP recommends Argon2id first and scrypt second. Python's standard library has scrypt in `hashlib`, so this lesson uses it. Linux itself stores the passwords in `/etc/shadow` from lesson 1.4 the same way: a salt and a slow hash, yescrypt on current Ubuntu.

## Try it

All files go into `~/crypto`.

### 1. Store passwords with plain SHA-256

```bash
cd ~/crypto
```

This program builds the users table of a badly made app:

```python title="leak.py"
"""Build the users table of a badly made app: plain SHA-256, no salt."""
import hashlib

users = {
    "sam": "sunshine",
    "alex": "Tr0ub4dor&3x",
    "kim": "sunshine",
    "lee": "dragon",
}

for name, password in users.items():
    digest = hashlib.sha256(password.encode()).hexdigest()
    print(f"{name}:{digest}")
```

```bash
python3 leak.py > leaked.txt
cut -c 1-30 leaked.txt
```

```output
sam:a941a4c4fd0c01cddef61b8be9
alex:3ad2bc300323031121315a43c
kim:a941a4c4fd0c01cddef61b8be9
lee:a9c43be948c5cabd56ef2bacff
```

`cut -c 1-30` shows only the first 30 characters of each line, enough to compare. Look at sam and kim: the same hash, so the same password. Without guessing anything, a thief already knows that two users share a password, and that cracking one cracks both.

### 2. Run a dictionary attack against it

A tiny wordlist stands in for the millions of real leaked passwords:

```bash
printf "123456\npassword\nqwerty\nsunshine\ndragon\nletmein\nmonkey\nfootball\n" > wordlist.txt
```

```python title="crack.py"
"""Try every word of the list against the leaked SHA-256 hashes."""
import hashlib

leaked = {}
for line in open("leaked.txt"):
    name, digest = line.strip().split(":")
    leaked[digest] = leaked.get(digest, []) + [name]

for word in open("wordlist.txt"):
    word = word.strip()
    digest = hashlib.sha256(word.encode()).hexdigest()
    for name in leaked.get(digest, []):
        print(f"{name} uses {word!r}")
```

```bash
python3 crack.py
```

```output
sam uses 'sunshine'
kim uses 'sunshine'
lee uses 'dragon'
```

Three of four passwords fell, with eight guesses. The code hashes each word once and looks it up in a dict, so a bigger list costs nothing extra per user. Only alex survived, because her password was not on the list. Now see how fast the guessing can go:

<!-- lab: nocheck -->
```python
import hashlib
import time

start = time.perf_counter()
for i in range(500_000):
    hashlib.sha256(f"guess{i}".encode()).digest()
seconds = time.perf_counter() - start
print(f"{500_000 / seconds:,.0f} SHA-256 guesses per second")
```

```output
32,237 SHA-256 guesses per second
```

That is plain Python on the test machine used to write this course, which is emulated and slow. On your own computer the number is much higher. Cracking tools written for graphics cards are faster again by many thousands of times.

### 3. Add a salt

```python
import hashlib
import secrets

plain = hashlib.sha256(b"sunshine").hexdigest()
salted = []
for name in ["sam", "kim"]:
    salt = secrets.token_bytes(16)
    salted.append(hashlib.sha256(salt + b"sunshine").hexdigest())

print("sam and kim match each other:", salted[0] == salted[1])
print("sam matches the unsalted hash:", salted[0] == plain)
```

```output
sam and kim match each other: False
sam matches the unsalted hash: False
```

`secrets.token_bytes(16)` makes 16 random bytes from a source made for security, unlike the `random` module. Both users have the password `sunshine`, but with their own salts neither hash matches the plain hash of `sunshine` any more, and they do not match each other either. Run it twice and the hashes change, because the salts do. A table of precomputed hashes is now useless, and the thief must hash every guess again for every single user.

But a salt does not slow down a single guess. SHA-256 is still fast, as the exercise shows.

### 4. Make it slow on purpose

<!-- lab: nocheck -->
```python
import hashlib
import secrets
import time

salt = secrets.token_bytes(16)
start = time.perf_counter()
hashlib.scrypt(b"sunshine", salt=salt, n=2**17, r=8, p=1, maxmem=2**28)
seconds = time.perf_counter() - start
print(f"one scrypt hash took {seconds:.2f} seconds")
print(f"{1 / seconds:,.1f} scrypt guesses per second")
```

```output
one scrypt hash took 4.25 seconds
0.2 scrypt guesses per second
```

**scrypt** is slow because it needs a large block of memory, here 128 MiB, and works through it in an order that cannot be skipped. Memory is expensive to multiply, so graphics cards gain much less than with SHA-256. The settings are the cost: `n` sets the memory and time (it must be a power of 2), `r` the block size and `p` how many parts can run in parallel. `n=2**17, r=8, p=1` is the minimum that OWASP recommends at the time of writing. `maxmem` lets Python use up to 256 MiB, because its default limit is 32 MiB.

On the same slow test machine, that is more than a hundred thousand times fewer guesses per second than with SHA-256 in step 2. On a normal computer one scrypt hash with these settings takes well under a second: hardly noticeable when you log in, and the same huge factor for anyone who guesses.

### 5. Put it together

A stored password needs four things: the name of the algorithm, its settings, the salt and the hash. Keep them together in one string, so that you can check it later and raise the cost one day without breaking old entries:

```python title="passwords.py"
"""Hash and check passwords with scrypt, a slow, salted hash."""
import hashlib
import hmac
import secrets

N, R, P = 2**17, 8, 1         # the cost: memory and time
MAXMEM = 256 * 1024 * 1024    # let scrypt use up to 256 MiB


def hash_password(password):
    """Return one string with everything needed to check the password later."""
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(password.encode(), salt=salt, n=N, r=R, p=P, maxmem=MAXMEM)
    return f"scrypt${N}${R}${P}${salt.hex()}${digest.hex()}"


def verify_password(password, stored):
    """Return True if the password matches the stored string."""
    name, n, r, p, salt_hex, digest_hex = stored.split("$")
    if name != "scrypt":
        return False
    digest = hashlib.scrypt(
        password.encode(), salt=bytes.fromhex(salt_hex),
        n=int(n), r=int(r), p=int(p), maxmem=MAXMEM,
    )
    return hmac.compare_digest(digest.hex(), digest_hex)
```

`hash_password` makes a new salt for every call, hashes, and joins all the parts with `$`, the same separator that the password hashes in `/etc/shadow` use. `verify_password` splits the string, hashes the typed password again with the same salt and settings, and compares. `hmac.compare_digest` compares in constant time: a normal `==` stops at the first different character, and the time it takes can leak how much of a guess was right.

Try it:

```python title="try_passwords.py"
from passwords import hash_password, verify_password

stored = hash_password("sunshine")
print(stored[:18])
print(len(stored.split("$")[4]), "hex digits of salt")
print(len(stored.split("$")[5]), "hex digits of hash")
print(verify_password("sunshine", stored))
print(verify_password("sunshine!", stored))
print(hash_password("sunshine") == stored)
```

```bash
python3 try_passwords.py
```

```output
scrypt$131072$8$1$
32 hex digits of salt
128 hex digits of hash
True
False
False
```

The string starts with the algorithm and its settings: `131072` is `2**17`. Then come a 16-byte salt and a 64-byte hash, as hex. The right password checks out, a wrong one does not, and hashing the same password again gives a different string, because the salt is new. You did not invent any cryptography here: scrypt comes from OpenSSL through `hashlib`, and your code only stores its result with the settings.

:::tip[In a big project, use a library]
Well-tested libraries do exactly this for you, and add details such as upgrading old hashes at login. In Python, `argon2-cffi` gives you Argon2id, and Flask's `werkzeug.security` has `generate_password_hash` and `check_password_hash`. The idea is always the one from this lesson.
:::

## Exercise

A different app was smarter: it used a salt, but still plain SHA-256. Its leaked row for the user `lee` is:

```text
lee:7c4a1b2e9d03f8a6:63c2f80a73541c055d8ed45b397354a3c3ba76fd973813baca3c3a86ceeda163
```

The first part after the name is the salt in hex, the second is `sha256(salt + password)` in hex. Make the row yourself with the lines below, then change `crack.py` into `crack_salted.py` so that it finds lee's password with `wordlist.txt`. What does this tell you about salts?

```bash
python3 -c 'import hashlib; s = bytes.fromhex("7c4a1b2e9d03f8a6"); print("lee:7c4a1b2e9d03f8a6:" + hashlib.sha256(s + b"dragon").hexdigest())' > salted.txt
```

<details>
<summary>Show the solution</summary>

```python title="crack_salted.py"
"""Try every word against salted SHA-256 hashes, one user at a time."""
import hashlib

for line in open("salted.txt"):
    name, salt_hex, digest = line.strip().split(":")
    salt = bytes.fromhex(salt_hex)
    for word in open("wordlist.txt"):
        word = word.strip()
        if hashlib.sha256(salt + word.encode()).hexdigest() == digest:
            print(f"{name} uses {word!r}")
```

```bash
python3 crack_salted.py
```

```output
lee uses 'dragon'
```

The salt is stored right next to the hash, so the thief has it too. A salt does not make one guess harder: it only forces the thief to repeat the whole list for every user, and makes precomputed tables useless. With fast SHA-256, repeating it is still cheap. That is why you need both a salt and a slow hash.

</details>

## Check yourself

**1. Why does a login never need the user's real password to be stored?**

<details>
<summary>Answer</summary>

It only needs to check whether the typed password is right. Hashing the typed password and comparing it with the stored hash answers that, so the password itself can be thrown away.

</details>

**2. In step 1, sam and kim had the same hash. What did that tell an attacker, and what fixes it?**

<details>
<summary>Answer</summary>

That they have the same password, so cracking one cracks both. A random salt for each user fixes it: the same password then gives a different hash for every user.

</details>

**3. The salt is stored in the database next to the hash. Does that make it useless?**

<details>
<summary>Answer</summary>

No. A salt is not a secret. Its job is to make every user's hash different, so the thief must attack each user separately and cannot use precomputed tables. It does not need to be hidden for that.

</details>

**4. Why is a slow hash better for passwords, when speed is usually a good thing?**

<details>
<summary>Answer</summary>

The real user hashes one password per login, so a fraction of a second does not matter. An attacker needs millions or billions of guesses, and each guess costs the same time. Slow hashing makes the attack slower by the same large factor.

</details>

**5. Why does `verify_password` use `hmac.compare_digest` instead of `==`?**

<details>
<summary>Answer</summary>

`==` stops at the first character that differs, so its timing can show how much of a value was right. `hmac.compare_digest` always takes the same time, so it leaks nothing.

</details>

## Common mistakes

- **Encrypting passwords instead of hashing them.** Encryption can be undone with the key, and a thief who gets the database often gets the key too. Passwords are hashed, never encrypted.
- **One salt for everybody.** A fixed salt in the code makes equal passwords give equal hashes again. Make a new random salt with `secrets` for every password.
- **Using `random` for salts or tokens.** The `random` module is predictable. For anything related to security, use `secrets`.
- **A cost setting that is too low.** `n=2**10` is fast enough to be useless. Use at least the values OWASP recommends, and raise them as hardware gets faster.
- **Logging passwords.** A password written to a log file is stored in clear text after all. Never print or log what a user typed into a password field.

## Key terms

- **Dictionary attack**: guessing passwords by hashing every word of a list and comparing with the stolen hashes.
- **Rainbow table**: a large table computed in advance, stored in a compact form, that turns unsalted hashes back into passwords.
- **Password hashing function**: a hash made slow on purpose, with a cost setting, for storing passwords. Also called a slow hash.
- **scrypt**: a password hashing function that needs a lot of memory as well as time.
- **Argon2**: a modern password hashing function; its variant Argon2id is OWASP's first choice.
- **bcrypt**: an older password hashing function that is still widely used.
- **Constant-time comparison**: comparing two values in a way that always takes the same time, so the timing leaks nothing.

## Go further

- [OWASP: Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html): which algorithm and which settings to use, kept up to date.
- [Python: hashlib.scrypt](https://docs.python.org/3/library/hashlib.html#hashlib.scrypt): the function used in this lesson and its parameters.
- [Python: secrets](https://docs.python.org/3/library/secrets.html): how to make salts, tokens and keys that are safe to use.
