---
title: Encoding vs hashing vs encryption
description: Tell Base64, SHA-256 and AES apart, use each one in the terminal, and know which one protects a secret and which ones do not.
lesson: "10.1"
time: 20 min
sidebar:
  order: 1
---

"Don't worry, the password in the config file is encrypted." You open the file and see `c2VjcmV0LXBhc3MK`. Ten seconds later you know the password, and nothing was encrypted at all. Encoding, hashing and encryption all turn readable text into strange-looking strings, so people mix them up all the time. This lesson puts the three side by side, so that you never do.

## Goal

After this lesson you can:

- Explain what encoding, hashing and encryption are for, and which of them needs a key.
- Encode and decode Base64, compute a SHA-256 hash, and encrypt and decrypt a file with AES.
- Look at a strange string and make a good guess at which of the three it is.

## Why it matters

Choosing the wrong one is a real and common security bug. Apps have shipped API keys "protected" by Base64, which anyone can undo. Others have stored passwords encrypted, so whoever stole the key got every password back. The rest of this module builds on these three tools: signatures use hashes, TLS uses encryption, and safe password storage uses a special kind of hash.

## The idea

All three take some input and produce a different-looking output. The difference is in what they are for and who can undo them.

| | Encoding | Hashing | Encryption |
|---|---|---|---|
| Purpose | Make data fit a format | Make a fingerprint of data | Keep data secret |
| Needs a key? | No | No | Yes |
| Can it be undone? | Yes, by anyone | No | Yes, with the right key |
| Output size | Grows with the input | Always the same | Grows with the input |
| Example | Base64 | SHA-256 | AES |

**Encoding** writes data in a different alphabet so that it can travel through a system that only accepts certain characters. Think of Morse code: it changes how a message looks, but anyone with the chart can read it. Encoding gives no secrecy at all.

**Hashing** runs data through a **cryptographic hash function** (usually just called a hash function), which produces a short, fixed-size value called a **digest**, or simply a hash. It works like a fingerprint. The same person always leaves the same fingerprint, and two people almost never share one, but you cannot rebuild a person from their fingerprint. A good hash is one-way: from the hash you cannot get the data back.

**Encryption** scrambles data with a secret value, a **cryptographic key** (or just key), so that only someone with the key can turn it back. Think of a safe: the content is still there, whole, but locked. The readable input is called the **plaintext**, the scrambled output is the **ciphertext**, and turning ciphertext back into plaintext is **decryption**.

A concrete example: your browser sends a photo to a website. The photo may travel Base64-encoded inside JSON (encoding, so it fits a text format), the site checks it arrived whole by comparing hashes (hashing), and the whole connection is protected by HTTPS (encryption).

## Try it

Make a folder for this module's practice files:

```bash
mkdir -p ~/crypto
cd ~/crypto
```

### 1. Encode and decode Base64

```bash
echo "meet at noon" | base64
```

```output
bWVldCBhdCBub29uCg==
```

**Base64** writes any bytes using only 64 safe characters: `A` to `Z`, `a` to `z`, `0` to `9`, `+` and `/`. Every 3 bytes of input become 4 characters, so the output is about a third longer. The `Cg` near the end is the newline that `echo` adds, and the `=` signs are padding that fills up the last group of 4.

Now undo it. No key, no password:

```bash
echo "bWVldCBhdCBub29uCg==" | base64 -d
```

```output
meet at noon
```

`-d` means decode. That is the whole point of encoding: anyone can reverse it. You have already met Base64 in lesson 8.6, inside the Flask session cookie, and email attachments and images inside JSON use it too.

### 2. Compute a hash

```bash
echo "meet at noon" | sha256sum
```

```output
6113e1fc87e2590791ab4c649c0af1b9218a09c922e4f2e3354dba0c5596b5d6  -
```

`sha256sum` computes a **SHA-256** hash, which is 256 bits long, shown as 64 hex digits. The `-` at the end means the input came from the pipe instead of a file. You used the same command in lesson 9.2 to check a file. Now change one character:

```bash
echo "meet at noon." | sha256sum
```

```output
3add88e652ccc4f80a9764191a40de606be605ef6bc0cb7715918215d119301e  -
```

One added dot, and the whole hash is different. This is called the **avalanche effect**: a tiny change in the input changes about half of the output bits, so similar inputs do not give similar hashes.

### 3. See that the size never changes

```bash
seq 1 100000 > numbers.txt
wc -c numbers.txt
sha256sum numbers.txt
```

```output
588895 numbers.txt
b2bc7d3f8b652d2ec96865b68ad8f80e22cca174abe1aed7889e242a747d590f  numbers.txt
```

Almost 600,000 bytes in, still 64 hex digits out. A hash cannot hold the data: it is a summary. That is why it cannot be "decoded" back. You can only take a guess, hash the guess, and compare.

### 4. Get the same hash in Python

The hash is a standard, so every tool gives the same answer for the same bytes. Python has it in the `hashlib` module:

```python
import hashlib

data = "meet at noon\n".encode()
print(hashlib.sha256(data).hexdigest())
```

```output
6113e1fc87e2590791ab4c649c0af1b9218a09c922e4f2e3354dba0c5596b5d6
```

It matches step 2, because the `\n` is the same newline that `echo` added. `.encode()` turns the text into bytes, because hash functions work on bytes, not on letters.

### 5. Encrypt a file

```bash
echo "meet at noon" > message.txt
openssl enc -aes-256-cbc -pbkdf2 -in message.txt -out message.enc -pass pass:correct-horse
ls
```

```output
message.enc  message.txt  numbers.txt
```

`openssl` is a toolbox for cryptography that comes with Ubuntu. `enc -aes-256-cbc` encrypts with **AES**, the most widely used encryption algorithm today, with a 256-bit key. You gave it a password, not a key, so `-pbkdf2` tells it to turn the password into a key in a slow, careful way (lesson 10.5 explains why slow is good). `-pass pass:correct-horse` passes the password on the command line, which is fine for practice but bad for real secrets, because it ends up in your shell history.

Look at what came out:

<!-- lab: nocheck -->
```bash
base64 message.enc
```

```output
U2FsdGVkX1/fXBn3K1HC1MEfojlWhs42ah6/D1a20ds=
```

The ciphertext is raw bytes, so you encoded it with Base64 to print it: two of today's tools in one line. Run the `openssl enc` command again and then `base64 message.enc`, and the output changes every time. `openssl` mixes a random **salt** into each encryption, so the same message with the same password never looks the same twice. Your output differs from the one above for the same reason.

### 6. Decrypt it, with the right and the wrong password

```bash
openssl enc -d -aes-256-cbc -pbkdf2 -in message.enc -pass pass:correct-horse
```

```output
meet at noon
```

`-d` decrypts. With the right password, the plaintext comes back exactly. Now the wrong one:

<!-- lab: nocheck -->
```bash
openssl enc -d -aes-256-cbc -pbkdf2 -in message.enc -pass pass:wrong-horse
```

```output
bad decrypt
4007C2C9B7730000:error:1C800064:Provider routines:ossl_cipher_unpadblock:bad decrypt:../providers/implementations/ciphers/ciphercommon_block.c:124:
```

The wrong password gives a wrong key, and the result does not make sense, so `openssl` refuses. The number at the start of the second line is different on every run. Without the right key, the data is just noise.

:::note[An honest detail]
Once in a few hundred tries, a wrong password gives garbage instead of `bad decrypt`, because the old CBC mode cannot always tell. Modern systems use authenticated encryption, such as AES-GCM, which always notices a wrong key or a changed byte. You will see it in TLS in lesson 10.4.
:::

## Exercise

You find these three values in an old project. For each one, say whether it is encoded, hashed or encrypted, and get back whatever can be got back.

```text
A: c2VjcmV0LXBhc3MK
B: 5318e8edcec75b258a6a465e506eb6ff3f2b8b93de0d2e4024a76dd990f0305f
C: U2FsdGVkX1+peoaWWdSZ42Vghs+pdeTjdV9b2Nc/9XFoPELXzMtMx4GIXxNPpK8R
```

A sticky note next to them says: `lab-pass`.

Hints: Base64 uses letters, digits, `+`, `/` and `=`. A hash is a fixed number of hex digits. Try decoding the first characters of C with Base64.

<details>
<summary>Show the solution</summary>

**A** uses only Base64 characters, so try to decode it:

```bash
echo "c2VjcmV0LXBhc3MK" | base64 -d
```

```output
secret-pass
```

It was only encoded. Anyone who sees it knows the password.

**B** is 64 hex digits: the size of a SHA-256 hash. You cannot decode it. You can only guess and compare. Try the password from A:

```bash
echo "secret-pass" | sha256sum
```

```output
5318e8edcec75b258a6a465e506eb6ff3f2b8b93de0d2e4024a76dd990f0305f  -
```

Same hash, so B is the hash of `secret-pass`. Guessing worked here only because the answer was easy to guess. Lesson 10.5 is about making that kind of guessing hard.

**C** looks like Base64 too. Decode only its start:

```bash
echo "U2FsdGVkX1+peoaWWdSZ42Vghs+pdeTjdV9b2Nc/9XFoPELXzMtMx4GIXxNPpK8R" | base64 -d | head -c 8; echo
```

```output
Salted__
```

`Salted__` is how `openssl enc` marks its files: C is encrypted, then Base64-encoded. With the password from the sticky note, it opens. `-a` tells `openssl` that the input is Base64:

```bash
echo "U2FsdGVkX1+peoaWWdSZ42Vghs+pdeTjdV9b2Nc/9XFoPELXzMtMx4GIXxNPpK8R" | openssl enc -d -aes-256-cbc -pbkdf2 -a -pass pass:lab-pass
```

```output
the lab is open
```

The `; echo` in the second command only adds a newline after the 8 bytes, so the prompt starts on a new line.

</details>

## Check yourself

**1. A colleague says a token is "encrypted with Base64". What is wrong with that sentence?**

<details>
<summary>Answer</summary>

Base64 is an encoding, not encryption. It uses no key, and anyone can decode it with `base64 -d`. The token is not protected at all.

</details>

**2. Why can't you "decrypt" a SHA-256 hash?**

<details>
<summary>Answer</summary>

Hashing is not encryption. A hash is a fixed-size summary: 64 hex digits for any input, even a file of 600,000 bytes, so it does not contain the data. You can only hash a guess and compare it with the hash.

</details>

**3. You hash `hello` with `echo hello | sha256sum` and with Python's `hashlib.sha256(b"hello")`, and get two different hashes. Why?**

<details>
<summary>Answer</summary>

`echo` adds a newline, so it hashes the bytes `hello\n`. Python hashed `hello` without the newline. The avalanche effect makes one extra byte change the whole hash. Use `echo -n hello` or `b"hello\n"` to compare the same bytes.

</details>

**4. You encrypt the same file twice with the same password, and the two outputs differ. Is something broken?**

<details>
<summary>Answer</summary>

No. `openssl enc` mixes a new random salt into every encryption, so the ciphertext differs every time. Both decrypt to the same plaintext with the right password.

</details>

**5. Which of the three would you use to check that a downloaded file is not damaged, and which to keep a file secret?**

<details>
<summary>Answer</summary>

Hashing to check the file: compare its SHA-256 hash with the one the publisher gives. Encryption to keep it secret, because only encryption needs a key to undo it.

</details>

## Common mistakes

- **Treating Base64 as protection.** If a string ends in `=` or `==` and uses only letters, digits, `+` and `/`, decode it before you trust that it is secret. Encoding is never security.
- **Comparing hashes of different bytes.** A newline, a space or a different text encoding changes the whole hash. Check exactly which bytes each tool hashed.
- **Using MD5 or SHA-1.** Both are old, and people have made two different inputs with the same hash for both. Use SHA-256 for fingerprints.
- **Passwords on the command line.** `-pass pass:...` lands in your shell history and can be seen in the list of processes. For real secrets, leave `-pass` out and `openssl` asks for the password.
- **Losing the key.** Encryption without the key is permanent. There is no "forgot password" link for an encrypted file.

## Key terms

- **Encoding**: writing data in a different format or alphabet so it fits a system. Anyone can reverse it.
- **Base64**: an encoding that writes any bytes with 64 safe text characters.
- **Cryptographic hash function**: a function that turns data of any size into a short value of fixed size, one way, so that the data cannot be rebuilt from it.
- **Digest**: the fixed-size value a cryptographic hash function produces, often just called a hash.
- **SHA-256**: a widely used hash function with a 256-bit output, shown as 64 hex digits.
- **Avalanche effect**: a tiny change in the input changes about half of the bits of the hash.
- **Encryption**: scrambling data with a key so that only someone with the key can read it.
- **Decryption**: turning ciphertext back into plaintext with the key.
- **Cryptographic key**: the secret value that controls encryption and decryption.
- **Plaintext**: readable data before encryption.
- **Ciphertext**: scrambled data after encryption.
- **AES**: the most widely used encryption algorithm, with keys of 128, 192 or 256 bits.
- **Salt**: a random value mixed in so that the same input never gives the same output twice.

## Go further

- [Python: hashlib](https://docs.python.org/3/library/hashlib.html): every hash function Python offers, with examples.
- [OpenSSL: openssl-enc](https://docs.openssl.org/3.0/man1/openssl-enc/): the manual of the command used in this lesson, with every option.
- [RFC 4648: Base16, Base32 and Base64](https://www.rfc-editor.org/rfc/rfc4648): the official definition of Base64, short and readable.
