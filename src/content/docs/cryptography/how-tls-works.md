---
title: How TLS works
description: Follow the TLS handshake that turns HTTP into HTTPS, run a small HTTPS server on your own machine, and inspect the certificate it sends.
lesson: "10.4"
time: 25 min
sidebar:
  order: 4
---

<!-- lab: run
pkill -f s_server
mkdir -p ~/crypto
cd ~/crypto
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -quiet -out ca.key
openssl req -x509 -new -key ca.key -subj "/CN=mylab Root CA" -days 3650 -out ca.crt
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -quiet -out server.key
openssl req -new -key server.key -subj "/CN=localhost" -out server.csr
printf "subjectAltName = DNS:localhost\n" > server.ext
openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key -days 30 -extfile server.ext -out server.crt 2> /dev/null
chmod 600 ca.key server.key
cd ~
-->

You type a web address, press Enter, and the page appears in less than a second. In that second, before a single byte of the page was sent, your browser and a server that had never met agreed on secret keys, checked a certificate, and made sure nobody in between changed anything. This all happens in a few messages called the TLS handshake. In this lesson you watch it happen on your own machine.

## Goal

After this lesson you can:

- Describe the steps of a TLS handshake and what each one protects against.
- Run a small HTTPS server with your own certificate, and connect to it with `curl` and `openssl s_client`.
- Read the certificate and the connection details that a server sends, and understand the common certificate errors.

## Why it matters

HTTPS protects logins, payments and private messages for billions of people, and every security job sooner or later asks you to judge whether a connection is safe. Certificate errors are also among the most common problems you will debug on real servers. Knowing what the handshake checks lets you tell a harmless lab warning from a real attack.

## The idea

**TLS** (Transport Layer Security) is the protocol that puts an encrypted, checked channel on top of a TCP connection. **HTTPS** is plain HTTP sent through TLS, as lesson 6.5 explained. The HTTP requests and responses do not change at all; TLS only wraps them. TLS uses everything from this module: a key exchange to agree on keys, a certificate and a signature to prove the server's identity, and symmetric encryption for the data.

A TLS 1.3 connection, the current version, starts with this **handshake**:

1. **Client hello.** The client sends the TLS versions and **cipher suites** (combinations of algorithms) it supports, the name of the server it wants, and its half of a key exchange, called a **key share**.
2. **Server hello.** The server picks a version and a cipher suite and sends its own key share. Now both sides can compute the same secret, and everything after this message is encrypted.
3. **Certificate and certificate verify.** The server sends its certificate, then a signature over the handshake so far, made with its private key. The client checks the chain of trust (lesson 10.3), checks that the certificate's name matches the server it asked for, and checks the signature with the public key from the certificate.
4. **Finished.** Both sides send a short check value computed over the whole handshake with the new keys. If anyone changed a single message on the way, the check values do not match and the connection stops.

After that, the HTTP data flows, encrypted with fast symmetric keys made from the shared secret.

<figure class="diagram">
<svg viewBox="0 0 460 330" role="img" aria-labelledby="hs-title hs-desc">
<title id="hs-title">The TLS 1.3 handshake</title>
<desc id="hs-desc">Two boxes at the top, client on the left and server on the right, each with a vertical line going down. Arrows between the lines, from top to bottom: client hello with a key share, from client to server. Server hello with a key share, from server to client. Certificate, certificate verify and finished, from server to client, highlighted as encrypted. Finished, from client to server, highlighted as encrypted. HTTP requests and responses, in both directions, highlighted as encrypted.</desc>
<rect class="d-box" x="20" y="10" width="110" height="36"/>
<rect class="d-box" x="330" y="10" width="110" height="36"/>
<path class="d-line" d="M75 46 V320 M385 46 V320"/>
<path class="d-line" d="M75 85 H385 M377 80 L385 85 L377 90"/>
<path class="d-line" d="M385 135 H75 M83 130 L75 135 L83 140"/>
<path class="d-line d-hot" d="M385 185 H75 M83 180 L75 185 L83 190"/>
<path class="d-line d-hot" d="M75 235 H385 M377 230 L385 235 L377 240"/>
<path class="d-line d-hot" d="M75 290 H385 M377 285 L385 290 L377 295 M83 285 L75 290 L83 295"/>
<text x="75" y="33">client</text>
<text x="385" y="33">server</text>
<text x="230" y="75">client hello + key share</text>
<text x="230" y="125">server hello + key share</text>
<text x="230" y="175">certificate, verify, finished</text>
<text x="230" y="225">finished</text>
<text x="230" y="280">HTTP data</text>
</svg>
<figcaption>The TLS 1.3 handshake. Highlighted messages are already encrypted with keys made from the two key shares.</figcaption>
</figure>

The key exchange is the clever part, and it solves the puzzle from lesson 10.2 in a different way from hybrid encryption. It is called **Diffie-Hellman key exchange**. Each side picks a random secret number and sends only a public value computed from it: the key share. From its own secret and the other side's public value, each side computes the same shared secret. Someone who records both public values cannot compute the secret, because that would mean undoing a one-way calculation. No key is ever sent.

The key shares are made new for every connection and thrown away afterwards. So even if a server's private key is stolen one day, recordings of old connections stay locked. This is called **forward secrecy**. The private key is used only to sign, to prove who the server is.

TLS protects three things: confidentiality (nobody can read the data), integrity (nobody can change it unnoticed) and authenticity (you talk to the real owner of the name). It does not hide which server you connect to, and it says nothing about whether the site is honest. A phishing site from lesson 9.5 can have a perfectly valid certificate for its own lookalike name.

## Try it

You use the CA and the `localhost` certificate that you made in lesson 10.3, in `~/crypto`.

### 1. Start a small HTTPS server

```bash
cd ~/crypto
mkdir -p www
echo "<h1>Hello over TLS</h1>" > www/index.html
cd www
openssl s_server -accept 8443 -cert ../server.crt -key ../server.key -WWW -quiet > /dev/null 2>&1 &
cd ..
```

<!-- lab: run
for i in $(seq 50); do ss -ltn | grep -q ':8443 ' && break; sleep 0.2; done
-->

`openssl s_server` is a test server that speaks TLS. `-accept 8443` sets the port, `-cert` and `-key` give it the certificate and private key, and `-WWW` makes it serve files from the directory it was started in, like a tiny web server. That is why you start it inside `www`: it serves every file in that directory, and `server.key` must not be one of them. The `&` runs it in the background, as in lesson 1.5.

### 2. Connect with curl

```bash
curl -s --cacert ca.crt https://localhost:8443/index.html
```

```output
<h1>Hello over TLS</h1>
```

`--cacert ca.crt` tells `curl` to trust your lab CA. The page arrived through TLS, and `curl` checked the whole chain before it sent the request.

### 3. Watch the handshake

```bash
curl -sv --cacert ca.crt https://localhost:8443/index.html 2>&1 | grep -E "handshake|SSL connection"
```

```output
* TLSv1.3 (OUT), TLS handshake, Client hello (1):
* TLSv1.3 (IN), TLS handshake, Server hello (2):
* TLSv1.3 (IN), TLS handshake, Encrypted Extensions (8):
* TLSv1.3 (IN), TLS handshake, Certificate (11):
* TLSv1.3 (IN), TLS handshake, CERT verify (15):
* TLSv1.3 (IN), TLS handshake, Finished (20):
* TLSv1.3 (OUT), TLS handshake, Finished (20):
* SSL connection using TLSv1.3 / TLS_AES_256_GCM_SHA384 / X25519 / RSASSA-PSS
* TLSv1.3 (IN), TLS handshake, Newsession Ticket (4):
* TLSv1.3 (IN), TLS handshake, Newsession Ticket (4):
```

`-v` makes `curl` describe every step on its error output, and `2>&1` sends that into the pipe for `grep`. `OUT` is a message from `curl`, `IN` a message from the server. You can see the steps from the diagram in order. "Encrypted Extensions" carries extra settings from the server, already encrypted. The "Newsession Ticket" messages come after the handshake; they let the client reconnect faster next time.

The summary line names the four choices of this connection:

| Part | Meaning |
|---|---|
| `TLSv1.3` | The version of TLS |
| `TLS_AES_256_GCM_SHA384` | AES with a 256-bit key in GCM mode for the data; SHA-384 to make the keys |
| `X25519` | The elliptic curve used for the Diffie-Hellman key exchange |
| `RSASSA-PSS` | The kind of RSA signature in "certificate verify" |

GCM is the authenticated mode mentioned in lesson 10.1: it notices any changed byte.

### 4. Ask openssl for a summary

```bash
openssl s_client -connect localhost:8443 -CAfile ca.crt -brief < /dev/null
```

```output
Can't use SSL_get_servername
CONNECTION ESTABLISHED
Protocol version: TLSv1.3
Ciphersuite: TLS_AES_256_GCM_SHA384
Peer certificate: CN = localhost
Hash used: SHA256
Signature type: RSA-PSS
Verification: OK
Server Temp Key: X25519, 253 bits
DONE
```

`openssl s_client` is the client side of the same toolbox, and the best tool for looking at any TLS server. `-brief` prints only a summary, and `< /dev/null` gives it no input, so it closes the connection right away. `Verification: OK` means the chain to `ca.crt` checked out. `Server Temp Key` is the server's key share: "temp" because it is thrown away after this connection, which gives forward secrecy. The first line is harmless: `s_client` notes that the test server did not confirm the server name it was sent, because `s_server` was started without any setting for names.

### 5. Inspect the certificate the server sends

```bash
openssl s_client -connect localhost:8443 -CAfile ca.crt < /dev/null 2> /dev/null | openssl x509 -noout -subject -issuer -ext subjectAltName
```

```output
subject=CN = localhost
issuer=CN = mylab Root CA
X509v3 Subject Alternative Name: 
    DNS:localhost
```

`s_client` prints the certificate it received in PEM form, and `openssl x509` reads it from the pipe, as it read files in lesson 10.3. This is how you inspect the certificate of any HTTPS server, not only your own.

On a real website, use your browser. Click the icon left of the address (a padlock or a settings icon, depending on the browser), open the connection or certificate details, and look for the same fields: the subject and the SAN with the site's name, the issuer, which is usually an intermediate CA, and the dates of validity. At the time of writing, many website certificates are valid for only 90 days and are renewed automatically.

### 6. See the two classic errors

First, connect without trusting the lab CA:

```bash
curl -sS https://localhost:8443/index.html 2>&1 | head -n 1
```

```output
curl: (60) SSL certificate problem: unable to get local issuer certificate
```

`-sS` hides the progress bar but still shows errors. `curl` checked the chain against Ubuntu's trust store, where your lab CA is not, and refused to send anything. It is error 20 from lesson 10.3, now in the middle of a handshake. Second, trust the CA but use a different name for the same server:

```bash
curl -sS --cacert ca.crt https://127.0.0.1:8443/index.html 2>&1 | head -n 1
```

```output
curl: (60) SSL: no alternative certificate subject name matches target host name '127.0.0.1'
```

`127.0.0.1` is the same machine, but the certificate lists only `localhost` in its SAN. A valid certificate for the wrong name is worthless, because otherwise anyone with a certificate for their own site could pretend to be yours. `head -n 1` keeps only the first line; `curl` adds a few lines of advice after it.

:::caution[Never turn verification off]
`curl -k` and similar options skip all these checks. The data is still encrypted, but you no longer know who you are talking to, so anyone in the middle can pretend to be the server. In a lab, pass the CA with `--cacert` instead.
:::

### 7. Stop the server

```bash
pkill -f s_server
```

## Exercise

Older servers still use TLS 1.2. Start the server again, and make `curl` connect with at most TLS 1.2 by adding the option `--tls-max 1.2`. Show only the `SSL connection` line, and compare it with the one from step 3. Which parts changed? Stop the server at the end.

<details>
<summary>Show the solution</summary>

```bash
cd www
openssl s_server -accept 8443 -cert ../server.crt -key ../server.key -WWW -quiet > /dev/null 2>&1 &
cd ..
```

<!-- lab: run
for i in $(seq 50); do ss -ltn | grep -q ':8443 ' && break; sleep 0.2; done
-->

```bash
curl -sv --cacert ca.crt --tls-max 1.2 https://localhost:8443/index.html 2>&1 | grep "SSL connection"
pkill -f s_server
```

```output
* SSL connection using TLSv1.2 / ECDHE-RSA-AES256-GCM-SHA384 / X25519 / RSASSA-PSS
```

The version is now TLS 1.2, and the cipher suite has an older name, `ECDHE-RSA-AES256-GCM-SHA384`. It names the same ideas: ECDHE is Diffie-Hellman on an elliptic curve with temporary keys, RSA is the signature, and AES-256 in GCM mode protects the data. The key exchange (X25519) and the signature type stayed the same. TLS 1.3 removed many old, weak options and needs one round trip less, so prefer it when both sides support it.

</details>

## Check yourself

**1. In the TLS 1.3 handshake, which message proves that the server really has the private key of its certificate?**

<details>
<summary>Answer</summary>

Certificate verify. The server signs the handshake so far with its private key, and the client checks the signature with the public key from the certificate. Anyone can copy a certificate, but only the owner of the private key can make that signature.

</details>

**2. The client and the server never send the session key. How do they both get it?**

<details>
<summary>Answer</summary>

With Diffie-Hellman key exchange. Each side sends a public key share made from its own random secret, and each computes the same shared secret from its own secret and the other side's share. The keys for the data are made from that secret.

</details>

**3. What is forward secrecy, and why does it matter if a server's private key is stolen?**

<details>
<summary>Answer</summary>

The key shares are new for every connection and thrown away afterwards. The private key only signs. So a thief who steals the private key later cannot decrypt connections that someone recorded before.

</details>

**4. `curl` says `no alternative certificate subject name matches target host name`. What is wrong, and why is it refused?**

<details>
<summary>Answer</summary>

The certificate is valid, but not for the name you used: the name is missing from its SAN. If certificates were accepted for any name, anyone with a valid certificate for their own site could pretend to be another site.

</details>

**5. A phishing site shows a padlock and a valid certificate. Is it safe?**

<details>
<summary>Answer</summary>

No. TLS proves that you talk to the owner of that exact name and that nobody can read or change the traffic. It says nothing about whether the owner is honest. Check the name itself, as in lesson 9.5.

</details>

## Common mistakes

- **Using `-k` or `--insecure` to make an error go away.** It removes the protection against a fake server. Fix the cause: trust the right CA with `--cacert`, or use the name the certificate was made for.
- **Wrong name in the URL.** A certificate for `localhost` does not cover `127.0.0.1`. Use a name that is in the SAN, or make a certificate with all the names the server uses.
- **Forgetting the intermediate certificate.** A real server must send its own certificate and the intermediate one. If it sends only its own, some clients fail with `unable to get local issuer certificate`.
- **Serving the private key by accident.** Test servers such as `s_server -WWW` serve every file in their directory. Keep keys outside it, and keep them `600`.
- **Expired certificates.** Certificates have an end date. Check it with `openssl x509 -noout -dates` and renew in time, ideally automatically.

## Key terms

- **TLS**: Transport Layer Security, the protocol that encrypts and checks a connection and proves the server's identity.
- **Handshake**: the first messages of a TLS connection, in which both sides agree on algorithms and keys and the server proves who it is.
- **Cipher suite**: a named combination of algorithms that a TLS connection uses, such as `TLS_AES_256_GCM_SHA384`.
- **Key share**: a public value one side sends during the key exchange, made from its own random secret.
- **Diffie-Hellman key exchange**: a method for two sides to compute the same secret while only public values travel.
- **Forward secrecy**: the property that a stolen private key cannot decrypt connections recorded earlier, because the key shares were temporary.

## Go further

- [MDN: Transport Layer Security](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Transport_Layer_Security): how browsers use TLS, with links to the details.
- [RFC 8446: TLS 1.3](https://www.rfc-editor.org/rfc/rfc8446): the official specification. Section 2 gives an overview of the handshake in a few pages.
- [OpenSSL: openssl-s_client](https://docs.openssl.org/3.0/man1/openssl-s_client/): every option of the tool from step 4, for testing any TLS server.
