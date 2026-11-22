---
title: "Cheat sheet: Cryptography"
description: Encoding, hashing, encryption, key pairs, signatures, certificates, TLS checks and safe password storage from Module 10 on one printable page.
cheatSheet: true
sidebar:
  order: 99
  label: Cheat sheet
---

## Three tools

| | Encoding | Hashing | Encryption |
|---|---|---|---|
| For | Fitting a format | A fingerprint | Secrecy |
| Key | No | No | Yes |
| Undo | Anyone | Nobody | Only with the key |
| Example | Base64 | SHA-256 | AES |

| Command | What it does |
|---|---|
| `echo "text" \| base64` | Encode as Base64 (`echo` adds a newline: `Cg` at the end) |
| `echo "bWVl..." \| base64 -d` | Decode Base64 |
| `echo "text" \| sha256sum` | SHA-256 hash of the text and its newline |
| `hashlib.sha256(b"text\n").hexdigest()` | The same hash in Python |
| `openssl enc -aes-256-cbc -pbkdf2 -in f -out f.enc` | Encrypt a file with a password |
| `openssl enc -d -aes-256-cbc -pbkdf2 -in f.enc` | Decrypt it |
| `-pass file:shared.key` or `-a` | Read the secret from a file; input or output in Base64 |

- `U2FsdGVkX1` at the start = Base64 of `Salted__`: a file from `openssl enc`.
- Avoid MD5 and SHA-1. A wrong password gives `bad decrypt`.

## Keys

| | Symmetric | Asymmetric |
|---|---|---|
| Keys | One shared key | Public key and private key |
| Speed | Fast | Slow |
| Size | Any | Small messages only (214 bytes for RSA 2048 with OAEP) |
| Examples | AES, ChaCha20 | RSA, elliptic curves |

| Command | What it does |
|---|---|
| `openssl rand -base64 32 > session.key` | 32 random bytes as a key |
| `openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -quiet -out me.key` | Make a private key, then `chmod 600 me.key` |
| `openssl pkey -in me.key -pubout -out me.pub` | Compute the public key |
| `openssl pkeyutl -encrypt -pubin -inkey me.pub -pkeyopt rsa_padding_mode:oaep -in f -out f.enc` | Encrypt with the public key |
| `openssl pkeyutl -decrypt -inkey me.key -pkeyopt rsa_padding_mode:oaep -in f.enc` | Decrypt with the private key |

- Hybrid encryption: data with AES and a session key; the session key with the receiver's public key.

## Signatures and certificates

| Command | What it does |
|---|---|
| `openssl dgst -sha256 -sign me.key -out f.sig f` | Sign a file |
| `openssl dgst -sha256 -verify me.pub -signature f.sig f` | Verify: `Verified OK` or `Verification failure` |
| `openssl x509 -in c.crt -noout -subject -issuer -dates` | Read a certificate |
| `openssl x509 -in c.crt -noout -ext subjectAltName` | Names the certificate is valid for |
| `openssl req -x509 -new -key ca.key -subj "/CN=mylab Root CA" -days 3650 -out ca.crt` | Self-signed root (a lab CA) |
| `openssl req -new -key server.key -subj "/CN=localhost" -out server.csr` | Certificate signing request |
| `openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key -days 30 -extfile server.ext -out server.crt` | The CA signs it; `server.ext`: `subjectAltName = DNS:localhost` |
| `openssl verify -CAfile ca.crt server.crt` | Check the chain: `server.crt: OK` |

- Sign with the private key, verify with the public key. A signature does not hide the message.
- Chain of trust: root CA (in the trust store, `/etc/ssl/certs`) signs intermediate CA signs site.
- Error 20, `unable to get local issuer certificate`: no trusted root found.

## TLS

1. Client hello: versions, cipher suites, key share.
2. Server hello: choices, key share. Encrypted from here.
3. Certificate and certificate verify: the server's chain, and its signature over the handshake.
4. Finished: both sides check the whole handshake.

| Command | What it does |
|---|---|
| `curl --cacert ca.crt https://localhost:8443/index.html` | Trust a lab CA |
| `curl -sv URL 2>&1 \| grep -E "handshake\|SSL connection"` | Watch the handshake |
| `openssl s_client -connect HOST:PORT -CAfile ca.crt -brief < /dev/null` | Summary: version, cipher suite, `Verification: OK` |
| `openssl s_client -connect HOST:PORT < /dev/null 2> /dev/null \| openssl x509 -noout -subject -issuer` | The certificate a server sends |
| `curl --tls-max 1.2 ...` | Force at most TLS 1.2 |

- `TLS_AES_256_GCM_SHA384`: AES-256 in GCM mode, SHA-384 to make keys. `X25519`: the key exchange.
- Forward secrecy: temporary key shares, so a stolen private key cannot open old recordings.
- `(60) ... no alternative certificate subject name matches`: wrong name. Never "fix" errors with `curl -k`.

## Passwords

- Store a salted, **slow** hash: Argon2id, scrypt, bcrypt. Never plain text, never encrypted, never plain SHA-256.
- Salt: random, 16 bytes, new for every password (`secrets.token_bytes(16)`), stored next to the hash.
- scrypt at the time of writing: `n=2**17, r=8, p=1`, with `maxmem=2**28` in Python.
- Compare with `hmac.compare_digest`, never `==`.
- Stored form in mylab: `scrypt$131072$8$1$<salt hex>$<hash hex>`.

```python
digest = hashlib.scrypt(password.encode(), salt=salt, n=2**17, r=8, p=1, maxmem=2**28)
```

## mylab after this module

| File | Change |
|---|---|
| `app/passwords.py` | `hash_password`, `verify_password` |
| `app/db.py` | `add_user` hashes; `check_login` fetches by name, then verifies |
| `app/migrate_passwords.py` | Rename column, hash each row, one transaction, then `VACUUM` |
| `docs/tls-notes.md` | What TLS needs before mylab goes online |

- Check: `sqlite3 data/mylab.db "SELECT username, substr(password_hash, 1, 18) FROM users;"` and `grep -a -c "test-pass" data/mylab.db` gives `0`.
