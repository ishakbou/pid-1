---
title: "Module 10: Cryptography Basics"
description: Encoding, hashing and encryption, key pairs, signatures and certificates, the TLS handshake, and how to store passwords safely.
module: 10
sidebar:
  order: 0
  label: Overview
---

Cryptography sounds like advanced mathematics, and inside it is. But you do not need the mathematics to use it well. You need to know what each tool is for, what it promises, and how people get it wrong. In this module you use `openssl`, `sha256sum` and Python's standard library to try every idea yourself: you encrypt, sign, run your own certificate authority and HTTPS server, and finally fix the passwords of `mylab`.

## Ethics and law

Only test systems you own or have written permission to test. Everything in this module runs on your own computer: your own keys, your own certificates, a test server on `localhost`, and password hashes that you made up yourself. Lesson 10.5 shows how a dictionary attack works, so that you understand why passwords need slow hashes. Use it only on hashes you created. Trying to crack hashes from a real leak, or anyone else's passwords, is illegal in most countries, even "just to see".

## What you will learn

- The difference between encoding, hashing and encryption, and when to use each.
- How symmetric encryption and key pairs work, and why real systems combine them.
- How digital signatures prove who wrote something, and how certificates and certificate authorities build trust.
- What the TLS handshake does when HTTP becomes HTTPS, and how to read a server's certificate.
- How to store passwords with a salt and a slow hash, and why plain SHA-256 is not enough.

## Before you start

You need the terminal from [Module 1](../linux/), including permissions and background processes, and Python from [Module 3](../python/). Lesson 10.4 builds on HTTP, HTTPS, ports and `curl` from [Module 6](../networking/). The project step changes the `mylab` web app from [Module 8](../web/), with its database from [Module 7](../databases/), and closes a risk from the threat model of [Module 9](../security-basics/).

## Time

6 lessons, about 2 hours 20 minutes of reading and practice.

## Module map

```mindmap
Cryptography Basics
  Three tools
    encoding: Base64
    hashing: SHA-256
    encryption: AES
  Keys
    symmetric key
    key pair
    hybrid encryption
  Trust
    digital signatures
    certificates
    chain of trust
  TLS
    handshake
    key exchange
    forward secrecy
  Passwords
    salt
    slow hash: scrypt
    mylab migration
```

## Lessons

1. 10.1 [Encoding vs hashing vs encryption](../cryptography/encoding-vs-hashing-vs-encryption/): three things beginners mix up: Base64, SHA-256 and AES side by side.
2. 10.2 [Symmetric vs asymmetric encryption](../cryptography/symmetric-vs-asymmetric-encryption/): one shared key versus a key pair, and why real systems use both.
3. 10.3 [Digital signatures and certificates](../cryptography/digital-signatures-and-certificates/): prove who sent something, and see how certificate authorities build trust.
4. 10.4 [How TLS works](../cryptography/how-tls-works/): what the handshake does to turn HTTP into HTTPS. Inspect a real certificate.
5. 10.5 [Storing passwords safely](../cryptography/storing-passwords-safely/): salts and slow hashes, and why plain SHA-256 is not enough.
6. 10.6 [Project step: safe passwords in mylab](../cryptography/project/): replace the plain-text passwords in mylab with salted, slow hashes.

## Project step

Since Module 7, `mylab` has stored its passwords in plain text, and the threat model of Module 9 listed it as risk R3. In this step you add a small `passwords.py` module with scrypt, change `db.py` so that new users are hashed and logins compare hashes, and write a migration that converts the existing users in one transaction, so nobody needs a new password. You check the database file for leftovers, log in through the app, write `docs/tls-notes.md` about what TLS would need before the app could go online, and close R3.

## Cheat sheet

Everything from this module on one page: [Cheat sheet: Cryptography](../cryptography/cheat-sheet/).
