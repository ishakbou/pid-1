---
title: Symmetric vs asymmetric encryption
description: Encrypt with one shared key, then with a public and private key pair, and see why real systems combine the two.
lesson: "10.2"
time: 20 min
sidebar:
  order: 2
---

<!-- lab: run
mkdir -p ~/crypto
-->

Here is a puzzle that kept clever people busy for centuries. You want to send a secret to someone you have never met. Everything you send can be read by strangers on the way. How do you agree on a key without the strangers learning it too? This lesson shows the two kinds of encryption, and how together they solve the puzzle.

## Goal

After this lesson you can:

- Explain the difference between symmetric encryption (one shared key) and asymmetric encryption (a key pair).
- Make an RSA key pair with `openssl`, and encrypt and decrypt with it.
- Explain why real systems use asymmetric encryption to share a key, and symmetric encryption for the data.

## Why it matters

Every HTTPS page, every SSH login and every encrypted chat message uses both kinds of encryption, one after the other. If you understand why, you understand what a "public key" in a GitHub account, a server certificate or an SSH setup is actually for. In Module 11 you will make an SSH key pair, and it works on the same idea as the key pair you make here: a private key that never leaves you, and a public key you can give to anyone.

## The idea

**Symmetric encryption** uses one key for both directions: the same key locks and opens. AES from lesson 10.1 is symmetric. It is like the key to a shared flat: every flatmate needs a copy, and anyone with a copy can get in. Symmetric encryption is very fast, which is why it protects almost all data in practice. Its problem is the puzzle above: before you can use it, both sides must have the same key, and you cannot just send the key over the network that strangers watch.

**Asymmetric encryption**, also called public-key cryptography, uses a **key pair**: two keys made together that belong to each other. What the public key locks, only the private key can open.

- The **public key** can be given to anyone, even posted on a website.
- The **private key** stays with its owner and is never shared.

Think of an open padlock. Alex makes a thousand padlocks and hands them out to anyone who asks; the padlocks are the public key. Anyone can snap one shut on a box. Only Alex has the key that opens them: the private key. Sam does not need to meet Alex: he takes a padlock, locks his box, and sends it. Strangers on the way see the box, but cannot open it.

The best-known asymmetric algorithm is **RSA**. Newer systems often use elliptic-curve algorithms instead, which give the same security with much shorter keys: for example X25519 to agree on a key (you will meet it in lesson 10.4) and Ed25519 for signatures.

Asymmetric encryption has two weak spots. It is slow, thousands of times slower than AES. And RSA can only encrypt a message that is smaller than its key: a few hundred bytes. So real systems use both:

| | Symmetric | Asymmetric |
|---|---|---|
| Keys | One shared secret key | A public key and a private key |
| Speed | Very fast | Slow |
| Data size | Any size | Only small messages |
| Hard part | Getting the key to the other side safely | Being sure a public key is really theirs |
| Examples | AES, ChaCha20 | RSA, elliptic curves |

The combination is called **hybrid encryption**. Sam makes a random symmetric key just for this one message, a **session key**. He encrypts the data with it, using fast AES. Then he encrypts the small session key with Alex's public key and sends both. Alex opens the session key with her private key, then the data with the session key. Because each session key is used only once, a session key that leaks exposes only that one message.

<figure class="diagram">
<svg viewBox="0 0 560 250" role="img" aria-labelledby="hy-title hy-desc">
<title id="hy-title">Hybrid encryption</title>
<desc id="hy-desc">On the left are two boxes, the big file and a random session key. The big file leads to a highlighted box labelled AES with the session key. The session key leads to a highlighted box labelled RSA with Alex's public key. Both highlighted boxes lead to one box on the right labelled to Alex. A note below says that Alex's private key opens the session key, and the session key opens the file.</desc>
<rect class="d-box" x="10" y="30" width="130" height="40"/>
<rect class="d-box" x="10" y="150" width="130" height="40"/>
<rect class="d-box d-hot" x="180" y="30" width="210" height="40"/>
<rect class="d-box d-hot" x="180" y="150" width="210" height="40"/>
<rect class="d-box" x="430" y="90" width="120" height="40"/>
<path class="d-line" d="M140 50 H180 M140 170 H180 M390 50 H410 V100 H430 M390 170 H410 V120 H430"/>
<text x="75" y="55">big file</text>
<text x="75" y="175">session key</text>
<text x="285" y="55">AES, session key</text>
<text x="285" y="175">RSA, Alex's public key</text>
<text x="490" y="115">to Alex</text>
<text x="280" y="225">Alex: private key opens the session key,</text>
<text x="280" y="243">the session key opens the file</text>
</svg>
<figcaption>Hybrid encryption: fast AES for the data, slow RSA only for the small key.</figcaption>
</figure>

## Try it

All files go into the `~/crypto` folder from lesson 10.1. You play both people, Sam and Alex.

### 1. Encrypt with one shared key

```bash
cd ~/crypto
openssl rand -base64 32 > shared.key
echo "meet at the library at 3" > plan.txt
openssl enc -aes-256-cbc -pbkdf2 -in plan.txt -out plan.enc -pass file:shared.key
openssl enc -d -aes-256-cbc -pbkdf2 -in plan.enc -pass file:shared.key
```

```output
meet at the library at 3
```

`openssl rand -base64 32` makes 32 random bytes and prints them as Base64. `-pass file:shared.key` reads the secret from that file instead of from the command line. The same file encrypts and decrypts: that is symmetric encryption. Whoever decrypts `plan.enc` needs a copy of `shared.key`, and you have no safe way to send it yet.

### 2. Make Alex's key pair

```bash
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -quiet -out alex.key
chmod 600 alex.key
openssl pkey -in alex.key -pubout -out alex.pub
head -n 1 alex.key alex.pub
```

```output
==> alex.key <==
-----BEGIN PRIVATE KEY-----

==> alex.pub <==
-----BEGIN PUBLIC KEY-----
```

`genpkey` generates a private key: here RSA with 2048 bits, a common size today. `-quiet` hides the progress dots it prints while it searches for the large prime numbers that RSA needs. `chmod 600` makes the private key readable only by you, as in lesson 1.4. `pkey -pubout` then computes the matching public key from the private key. The other way round is impossible: nobody can compute the private key from the public one.

Both files are in **PEM** format: Base64 text between `BEGIN` and `END` lines, so that keys can be copied and pasted like text. Check the size of the key:

```bash
openssl pkey -pubin -in alex.pub -noout -text | head -n 1
```

```output
Public-Key: (2048 bit)
```

### 3. Encrypt with the public key, decrypt with the private key

Sam has only `alex.pub`. He encrypts a short note for Alex:

```bash
echo "the vault code is 4711" > note.txt
openssl pkeyutl -encrypt -pubin -inkey alex.pub -pkeyopt rsa_padding_mode:oaep -in note.txt -out note.enc
wc -c note.txt note.enc
```

```output
 23 note.txt
256 note.enc
279 total
```

`pkeyutl` does operations with a key pair. `-pubin -inkey alex.pub` says "use this public key". `-pkeyopt rsa_padding_mode:oaep` chooses OAEP, the safe way of preparing a message for RSA. The ciphertext is 256 bytes, exactly the size of a 2048-bit key, even for a 23-byte note.

Can the public key undo it?

```bash
openssl pkeyutl -decrypt -pubin -inkey alex.pub -pkeyopt rsa_padding_mode:oaep -in note.enc
```

```output
A private key is needed for this operation
pkeyutl: Error initializing context
```

No. Sam can lock the box, but even he cannot open it again. Only Alex can:

```bash
openssl pkeyutl -decrypt -inkey alex.key -pkeyopt rsa_padding_mode:oaep -in note.enc
```

```output
the vault code is 4711
```

### 4. Hit the size limit

```bash
seq 1 100 > numbers.txt
wc -c numbers.txt
```

```output
292 numbers.txt
```

<!-- lab: nocheck -->
```bash
openssl pkeyutl -encrypt -pubin -inkey alex.pub -pkeyopt rsa_padding_mode:oaep -in numbers.txt -out numbers.enc
```

```output
Public Key operation error
40A7246808700000:error:0200006E:rsa routines:ossl_rsa_padding_add_PKCS1_OAEP_mgf1_ex:data too large for key size:../crypto/rsa/rsa_oaep.c:87:
```

`data too large for key size`. A 2048-bit key with OAEP padding fits at most 214 bytes, and this file has 292. A photo or a backup has millions. The number at the start of the error line differs on every run.

### 5. Combine both: hybrid encryption

Sam wants to send `numbers.txt` to Alex. He makes a fresh session key, encrypts the file with it, and locks the session key with Alex's public key:

```bash
openssl rand -base64 32 > session.key
openssl enc -aes-256-cbc -pbkdf2 -in numbers.txt -out numbers.enc -pass file:session.key
openssl pkeyutl -encrypt -pubin -inkey alex.pub -pkeyopt rsa_padding_mode:oaep -in session.key -out session.key.enc
rm session.key
ls numbers.enc session.key.enc
```

```output
numbers.enc  session.key.enc
```

Sam deletes his copy of the session key: he no longer needs it. Only these two files travel to Alex, and a stranger who copies them cannot open either one.

Now be Alex. First the private key opens the session key, then the session key opens the file:

```bash
openssl pkeyutl -decrypt -inkey alex.key -pkeyopt rsa_padding_mode:oaep -in session.key.enc -out session.key
openssl enc -d -aes-256-cbc -pbkdf2 -in numbers.enc -pass file:session.key | tail -n 3
```

```output
98
99
100
```

The whole file arrived. The slow RSA step handled 45 bytes, the session key in Base64, and fast AES handled the data. Email encryption such as PGP works this way. TLS, in lesson 10.4, uses a cleverer way to agree on the session key, but the idea is the same: asymmetric cryptography to set up a key, symmetric encryption for the data.

:::caution[The private key is the whole secret]
Anyone who gets `alex.key` can read everything ever sent to Alex. Keep private keys out of git, out of chat messages and out of shared folders, and give them permissions `600`. The public key can go anywhere.
:::

## Exercise

Make a key pair of your own, called `me.key` and `me.pub`. Write a message to yourself in `todo.txt`, encrypt it with your public key into `todo.enc`, delete `todo.txt`, and get it back with your private key. Then answer: which of the two key files could you post on a website without any risk?

<details>
<summary>Show the solution</summary>

```bash
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -quiet -out me.key
chmod 600 me.key
openssl pkey -in me.key -pubout -out me.pub
echo "renew the domain in March" > todo.txt
openssl pkeyutl -encrypt -pubin -inkey me.pub -pkeyopt rsa_padding_mode:oaep -in todo.txt -out todo.enc
rm todo.txt
openssl pkeyutl -decrypt -inkey me.key -pkeyopt rsa_padding_mode:oaep -in todo.enc
```

```output
renew the domain in March
```

`me.pub` is safe to publish. People can use it to encrypt messages that only you can read. `me.key` must stay private: whoever has it can read them all. For a message longer than about 200 bytes, you would use the hybrid method from step 5.

</details>

## Check yourself

**1. In symmetric encryption, how many keys are there, and who has them?**

<details>
<summary>Answer</summary>

One key, and everyone who must encrypt or decrypt has a copy of the same key. That is why getting the key to the other side safely is the hard part.

</details>

**2. Sam encrypts a note with Alex's public key. Who can decrypt it?**

<details>
<summary>Answer</summary>

Only Alex, with her private key. Not even Sam can decrypt it, as step 3 showed: the public key cannot undo its own encryption.

</details>

**3. Why not encrypt a whole 10 MB backup with RSA directly?**

<details>
<summary>Answer</summary>

RSA can only encrypt a message smaller than its key, at most 214 bytes for a 2048-bit key with OAEP, and it is very slow. You encrypt the backup with AES and a random session key, and only the session key with RSA.

</details>

**4. Can someone compute your private key from your public key?**

<details>
<summary>Answer</summary>

No. The public key is computed from the private key, but the way back is practically impossible. That is what makes it safe to publish the public key.

</details>

**5. What is a session key, and why is it made new for each message or connection?**

<details>
<summary>Answer</summary>

A random symmetric key used for one message or one connection only. If one session key leaks, only that one message is exposed, not everything else.

</details>

## Common mistakes

- **Sending the private key instead of the public one.** The private file starts with `BEGIN PRIVATE KEY`. Before you share a key, look at its first line with `head -n 1`.
- **Decrypting with the wrong key.** Encrypt with the public key, decrypt with the private key. `A private key is needed for this operation` means you passed a public key to `-decrypt`.
- **Encrypting big data with RSA.** `data too large for key size` is the sign. Use hybrid encryption.
- **Leaving private keys readable.** A private key with permissions `644` can be read by every user on the machine. `chmod 600` it right after you make it.
- **Trusting any public key.** If a stranger can swap Alex's public key for his own, Sam encrypts for the stranger. How to be sure a public key really belongs to Alex is the topic of lesson 10.3.

## Key terms

- **Symmetric encryption**: encryption in which the same key encrypts and decrypts.
- **Asymmetric encryption**: encryption with a key pair; what the public key encrypts, only the private key decrypts. Also called public-key cryptography.
- **Key pair**: a public key and a private key made together that belong to each other.
- **Public key**: the half of a key pair that can be shared with anyone.
- **Private key**: the half of a key pair that only its owner may have.
- **RSA**: a widely used asymmetric algorithm, with keys of 2048 bits or more.
- **PEM**: a text format for keys and certificates: Base64 between `BEGIN` and `END` lines.
- **Hybrid encryption**: encrypting data with a fast symmetric key, and that key with the receiver's public key.
- **Session key**: a random symmetric key made for one message or one connection.

## Go further

- [OpenSSL: openssl-pkeyutl](https://docs.openssl.org/3.0/man1/openssl-pkeyutl/): the manual of the command that encrypts and decrypts with key pairs.
- [OWASP: Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html): which algorithms and key sizes to choose, and how to handle keys.
- [OpenSSL: openssl-genpkey](https://docs.openssl.org/3.0/man1/openssl-genpkey/): how to generate RSA and elliptic-curve keys, with every option.
