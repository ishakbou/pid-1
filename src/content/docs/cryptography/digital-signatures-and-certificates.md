---
title: Digital signatures and certificates
description: Sign a file with a private key, check it with the public key, and build a small certificate authority to see how certificates make public keys trustworthy.
lesson: "10.3"
time: 25 min
sidebar:
  order: 3
---

<!-- lab: run
mkdir -p ~/crypto
cd ~/crypto
[ -f alex.key ] || openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -quiet -out alex.key
chmod 600 alex.key
openssl pkey -in alex.key -pubout -out alex.pub
cd ~
-->

Every time you ran `sudo apt update` in lesson 1.6, your computer quietly checked a signature. Hundreds of mirror servers around the world hand out Ubuntu's packages, and any of them could be broken into. Yet your system can tell, with certainty, whether a package list really comes from Ubuntu and whether anyone changed a single byte. This lesson shows how that works, and how the same idea lets your browser trust a website it has never seen before.

## Goal

After this lesson you can:

- Sign a file with a private key and verify the signature with the public key.
- Explain what a certificate contains, and how a certificate authority vouches for a public key.
- Build a tiny certificate authority with `openssl`, issue a certificate, and verify it.

## Why it matters

Encryption keeps a message secret, but it does not tell you who sent it. Signatures do. They protect software updates, git commits, documents and every HTTPS connection. Certificates solve the last problem from lesson 10.2: how to be sure that a public key really belongs to the person or site you think. When a browser shows a warning about a certificate, you will know exactly what failed.

## The idea

A **digital signature** is a value that only the owner of a private key can compute for a given message, and that anyone with the matching public key can check. The roles of the keys are the other way round from encryption:

| | Encryption | Signature |
|---|---|---|
| Goal | Only the receiver can read it | Everyone can check who wrote it |
| Uses the private key to | Decrypt | Sign |
| Uses the public key to | Encrypt | Verify |

To sign, the program first hashes the message with SHA-256, then computes the signature from that hash with the private key. To verify, the checker hashes the message too, and uses the public key to check that the signature matches this hash. If one byte of the message changed, the hash changes (the avalanche effect from lesson 10.1), and the check fails. So a valid signature proves two things: the message comes from the private key's owner, and nobody changed it.

Think of it as a seal that is different for every letter. Only Alex's ring can make it, everyone knows what Alex's seals look like, and a seal made for one letter does not fit any other letter.

That leaves one question: how do you know that a public key is really Alex's? A **certificate** answers it. It is a small file that says "this public key belongs to this name", signed by someone you already trust, a **certificate authority** (CA). A certificate holds:

- the **subject**: whose key it is, for example a website's name;
- the subject's public key;
- the **issuer**: the CA that signed it;
- the dates between which it is valid;
- the CA's signature over all of it.

It works like a passport. A border officer has never met you, but trusts the government that issued the passport and checked who you are. In the same way, your browser has never met a website, but trusts the CA that signed its certificate.

Who vouches for the CAs? Your system comes with a short list of **root certificates**, the certificates of CAs that browser and operating system makers have checked carefully. This list is the **trust store**. A root CA usually signs an intermediate CA, which signs the certificates of websites. Following the signatures from a website up to a root you trust is called the **chain of trust**.

<figure class="diagram">
<svg viewBox="0 0 460 270" role="img" aria-labelledby="ch-title ch-desc">
<title id="ch-title">A chain of trust</title>
<desc id="ch-desc">Three boxes stacked from top to bottom. The top box, highlighted, is the root CA, which is in the trust store. A line labelled signs leads down to the middle box, the intermediate CA. Another line labelled signs leads down to the bottom box, the site certificate for example.com.</desc>
<rect class="d-box d-hot" x="110" y="15" width="240" height="50"/>
<rect class="d-box" x="110" y="110" width="240" height="50"/>
<rect class="d-box" x="110" y="205" width="240" height="50"/>
<path class="d-line" d="M230 65 V110 M230 160 V205"/>
<text x="230" y="45">root CA (trust store)</text>
<text x="230" y="140">intermediate CA</text>
<text x="230" y="235">site: example.com</text>
<text x="280" y="92">signs</text>
<text x="280" y="187">signs</text>
</svg>
<figcaption>Each certificate is signed by the one above it. The root is trusted because it is in the trust store, not because of its own signature.</figcaption>
</figure>

## Try it

You use Alex's key pair from lesson 10.2, in the `~/crypto` folder.

### 1. Sign a message

```bash
cd ~/crypto
echo "Pay Sam 20 euros." > order.txt
openssl dgst -sha256 -sign alex.key -out order.sig order.txt
wc -c order.sig
```

```output
256 order.sig
```

`openssl dgst -sha256` hashes the file with SHA-256, and `-sign alex.key` computes the signature from the hash with Alex's private key. The signature is a separate file of 256 bytes, the size of the key. The message itself stays readable: a signature proves who wrote it, it does not hide it.

### 2. Verify it

Anyone with `order.txt`, `order.sig` and Alex's public key can check it:

```bash
openssl dgst -sha256 -verify alex.pub -signature order.sig order.txt
```

```output
Verified OK
```

### 3. Change one thing

Someone on the way adds two zeros:

```bash
echo "Pay Sam 2000 euros." > order.txt
openssl dgst -sha256 -verify alex.pub -signature order.sig order.txt 2> /dev/null
```

```output
Verification failure
```

The changed message has a different hash, so the signature no longer matches. The `2> /dev/null` hides a few extra error lines, which only repeat the same news in more technical words. Without Alex's private key, nobody can make a new signature that fits the new text.

### 4. Look at a real root certificate

Ubuntu keeps its trust store in `/etc/ssl/certs`. One of its roots is ISRG Root X1, the root of Let's Encrypt, a free CA that signs the certificates of hundreds of millions of websites:

```bash
openssl x509 -in /etc/ssl/certs/ISRG_Root_X1.pem -noout -subject -issuer -dates
```

```output
subject=C = US, O = Internet Security Research Group, CN = ISRG Root X1
issuer=C = US, O = Internet Security Research Group, CN = ISRG Root X1
notBefore=Jun  4 11:04:38 2015 GMT
notAfter=Jun  4 11:04:38 2035 GMT
```

`openssl x509` reads certificates. (X.509 is the name of the standard format of certificates.) `-noout` skips printing the certificate itself. `CN` is the common name, `O` the organization and `C` the country. Subject and issuer are the same: a root signs its own certificate, which is called a **self-signed certificate**. Nobody stands above it, and that is exactly why it must already be in the trust store.

<!-- lab: nocheck -->
```bash
ls /etc/ssl/certs/*.pem | wc -l
```

```output
121
```

Your system trusts about this many roots. The number changes a little when Ubuntu updates its list.

### 5. Become a certificate authority

You can run a CA yourself in a few commands. Your CA is trusted by nobody except you, which is perfect for a lab:

```bash
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -quiet -out ca.key
chmod 600 ca.key
openssl req -x509 -new -key ca.key -subj "/CN=mylab Root CA" -days 3650 -out ca.crt
openssl x509 -in ca.crt -noout -subject -issuer
```

```output
subject=CN = mylab Root CA
issuer=CN = mylab Root CA
```

`openssl req -x509 -new` makes a new self-signed certificate. `-subj` sets the name, and `-days 3650` makes it valid for ten years. Like ISRG Root X1, your root certificate signs itself.

### 6. Ask for a certificate

A web server on this machine, called `localhost`, needs a certificate. The server makes its own key pair and a **certificate signing request** (CSR): its name and public key, signed with its own private key, which proves it holds that key.

```bash
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -quiet -out server.key
chmod 600 server.key
openssl req -new -key server.key -subj "/CN=localhost" -out server.csr
head -n 1 server.csr
```

```output
-----BEGIN CERTIFICATE REQUEST-----
```

The private key never leaves the server. Only the CSR goes to the CA.

### 7. Sign the request as the CA

```bash
printf "subjectAltName = DNS:localhost\n" > server.ext
openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key -days 30 -extfile server.ext -out server.crt
```

```output
Certificate request self-signature ok
subject=CN = localhost
```

The CA checked the signature on the CSR, then signed a certificate valid for 30 days. The file `server.ext` adds a **subject alternative name** (SAN): the list of names the certificate is valid for. Browsers check the SAN, not the CN, so a website's certificate always has one. Look at the result:

```bash
openssl x509 -in server.crt -noout -subject -issuer -ext subjectAltName
```

```output
subject=CN = localhost
issuer=CN = mylab Root CA
X509v3 Subject Alternative Name: 
    DNS:localhost
```

Subject and issuer are now different: this certificate was signed by your CA.

### 8. Verify the chain

```bash
openssl verify -CAfile ca.crt server.crt
```

```output
server.crt: OK
```

`-CAfile ca.crt` says "trust this root". The signature on `server.crt` checks out with the CA's public key, so the chain is complete. Now ask Ubuntu's normal trust store instead:

```bash
openssl verify server.crt
```

```output
CN = localhost
error 20 at 0 depth lookup: unable to get local issuer certificate
error server.crt: verification failed
```

Ubuntu has never heard of `mylab Root CA`, so it cannot follow the chain to a root it trusts. Error 20 means "I cannot find who signed this". A browser that meets the same problem shows its "Your connection is not private" page.

### 9. Try to forge it

An attacker makes his own CA with the same name and signs a certificate for `localhost`:

```bash
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -quiet -out fake.key
openssl req -x509 -new -key fake.key -subj "/CN=mylab Root CA" -days 3650 -out fake.crt
openssl x509 -req -in server.csr -CA fake.crt -CAkey fake.key -days 30 -extfile server.ext -out forged.crt 2> /dev/null
openssl verify -CAfile ca.crt forged.crt
```

```output
CN = localhost
error 20 at 0 depth lookup: unable to get local issuer certificate
error forged.crt: verification failed
```

The names match, but the keys do not. What counts is the signature, and only the real `ca.key` can make one that `ca.crt` accepts. That is why a CA guards its private key more carefully than anything else.

:::caution[Your CA key can sign anything]
Whoever has `ca.key` can make a certificate for any name, and every machine that trusts `ca.crt` would accept it. Never add a lab CA to your browser's or your system's trust store, and never share its key.
:::

## Exercise

Your CA must issue a second certificate, for a server called `notes.lab`. Make a key called `notes.key`, a CSR, and a certificate `notes.crt` that is valid for 7 days and has `notes.lab` as its subject alternative name. Check it with `openssl verify`, and print its subject, issuer and SAN.

<details>
<summary>Show the solution</summary>

```bash
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -quiet -out notes.key
chmod 600 notes.key
openssl req -new -key notes.key -subj "/CN=notes.lab" -out notes.csr
printf "subjectAltName = DNS:notes.lab\n" > notes.ext
openssl x509 -req -in notes.csr -CA ca.crt -CAkey ca.key -days 7 -extfile notes.ext -out notes.crt
```

```output
Certificate request self-signature ok
subject=CN = notes.lab
```

```bash
openssl verify -CAfile ca.crt notes.crt
openssl x509 -in notes.crt -noout -subject -issuer -ext subjectAltName
```

```output
notes.crt: OK
subject=CN = notes.lab
issuer=CN = mylab Root CA
X509v3 Subject Alternative Name: 
    DNS:notes.lab
```

The same CA signed both certificates, so both verify against `ca.crt`. Each one is valid only for its own name.

</details>

## Check yourself

**1. To sign a message, which key does Alex use? Which key do others use to check it?**

<details>
<summary>Answer</summary>

Alex signs with her private key. Everyone else verifies with her public key. Only she can sign, but anyone can check.

</details>

**2. A signed message is changed by one character. Why does the check fail?**

<details>
<summary>Answer</summary>

The signature was computed from the SHA-256 hash of the original message. The changed message has a completely different hash, so the signature does not match it. Making a new valid signature needs the private key.

</details>

**3. Does signing a file keep its content secret?**

<details>
<summary>Answer</summary>

No. The message stays readable, as `order.txt` did. A signature proves who wrote it and that nobody changed it. To keep it secret, you also need encryption.

</details>

**4. Name four things a certificate contains.**

<details>
<summary>Answer</summary>

Any four of: the subject (whose key), the subject's public key, the issuer (the CA), the dates of validity, the subject alternative names, and the CA's signature.

</details>

**5. Root certificates sign themselves. Why does your computer trust them anyway?**

<details>
<summary>Answer</summary>

Because they are in the trust store that came with the operating system or browser, chosen and checked by their makers. The trust comes from that list, not from the self-signature.

</details>

## Common mistakes

- **Mixing up the files.** `-sign` takes the private key, `-verify` the public key, `-signature` the signature file, and the message comes last. Check each one before you decide that a signature is bad.
- **Signing, then editing.** Even an added newline makes the signature fail. Sign the final version, and sign again after every change.
- **Forgetting the subject alternative name.** A certificate with only a CN is rejected by browsers. Always add a SAN with every name the server uses.
- **Clicking through certificate warnings.** "Not private" means the browser could not build a chain of trust to a root, or the name does not match. On a site you do not control, that is a reason to stop, not to click "continue".
- **Leaving a CA key lying around.** It can sign certificates for any name. Keep it `600`, and outside any repository.

## Key terms

- **Digital signature**: a value computed from a message's hash with a private key, which anyone can check with the public key.
- **Certificate**: a file that binds a public key to a name, signed by a certificate authority.
- **Certificate authority (CA)**: an organization or program that checks identities and signs certificates.
- **Subject**: the name a certificate belongs to.
- **Issuer**: the CA that signed a certificate.
- **Subject alternative name (SAN)**: the list of names, such as `localhost`, for which a certificate is valid.
- **Root certificate**: a CA certificate at the top of a chain, trusted because it is in the trust store.
- **Self-signed certificate**: a certificate whose issuer is its own subject.
- **Trust store**: the list of root certificates a system or browser trusts, in `/etc/ssl/certs` on Ubuntu.
- **Chain of trust**: the path of signatures from a certificate up to a trusted root.
- **Certificate signing request (CSR)**: a name and a public key, signed by the matching private key, sent to a CA to ask for a certificate.

## Go further

- [Let's Encrypt: How It Works](https://letsencrypt.org/how-it-works/): how a free CA checks that you control a domain before it signs your certificate.
- [OpenSSL: openssl-x509](https://docs.openssl.org/3.0/man1/openssl-x509/): every option for reading, signing and checking certificates.
- [MDN: Certificate Transparency](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Certificate_Transparency): how public logs make it hard for a CA to issue a certificate in secret.
