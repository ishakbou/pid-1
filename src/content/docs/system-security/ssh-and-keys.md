---
title: SSH and keys
description: Log in to another machine with SSH, replace passwords with a key pair, and tighten the SSH server so it accepts only what it should.
lesson: "11.2"
time: 25 min
sidebar:
  order: 2
---

<!-- lab: run
sudo rm -f /etc/ssh/sshd_config.d/10-hardening.conf
sudo systemctl reload ssh
[ -f ~/.ssh/authorized_keys.orig ] || cp ~/.ssh/authorized_keys ~/.ssh/authorized_keys.orig
cp ~/.ssh/authorized_keys.orig ~/.ssh/authorized_keys
rm -f ~/.ssh/id_ed25519 ~/.ssh/id_ed25519.pub ~/.ssh/lab2_ed25519 ~/.ssh/lab2_ed25519.pub ~/.ssh/known_hosts ~/.ssh/known_hosts.old
-->

How do you type commands on a computer that sits in a data centre on another continent? You open a terminal on your own laptop, type one line, and a few seconds later your prompt belongs to the other machine. The program that does this is SSH, and almost every server in the world is managed with it. That also makes the SSH door the one that attackers knock on most often.

## Goal

After this lesson you can:

- Log in to a machine with SSH and check that it is the machine you expect.
- Create a key pair and log in with it instead of a password.
- Change the SSH server's settings so it refuses root and passwords.

## Why it matters

The login attempts described at the start of lesson 11.1 are almost all SSH password guesses. A password can be guessed, reused from a leak, or typed into a fake site. A key pair cannot be guessed in any useful time, and the secret half never leaves your computer. Switching a server to keys only, and checking its settings, closes the most attacked door on the internet.

## The idea

**SSH** (Secure Shell) is a protocol for logging in to another machine and running commands there over an encrypted connection. The machine you log in to runs the **SSH server**, a service called `sshd` that listens on TCP port 22. Your side runs the **SSH client**, the command `ssh`.

Two things must be proven when you connect, in both directions:

1. **The server proves who it is.** Every SSH server has a **host key**. The first time you connect, the client shows the host key's **fingerprint**, a short checksum of the key, and asks if you trust it. If you say yes, it saves the key in `~/.ssh/known_hosts` and checks it on every later visit. If the key ever changes, `ssh` refuses with a loud warning, because someone may be sitting between you and the server.
2. **You prove who you are.** With a password, or better, with a key pair.

A **key pair** is the asymmetric cryptography from Module 10 put to work: two keys that belong together. The **private key** stays on your computer and is protected by a **passphrase**, a password that encrypts the key file. The **public key** can be shown to anyone. You copy it to the server, into a file called `~/.ssh/authorized_keys`. When you log in, the server sends a challenge that only the matching private key can sign. Your private key never travels over the network.

Think of the private key as a wax seal that only you own, and the public key as a photo of the mark it leaves. You can give the photo to as many servers as you like. With it, a server can check that a fresh mark was made by your seal, but nobody can make the seal from the photo.

| | Password | Key pair |
|---|---|---|
| What the server stores | A hash of your password | Your public key |
| What travels at login | The password, inside the encrypted tunnel | A signature, never the private key |
| Guessing | Possible, and attackers try all day | Not possible in any useful time |
| If the server is broken into | The password may be cracked from its hash | The attacker gets a public key, which is useless to them |

## Try it

Here, the "other machine" is your own machine: you connect to `localhost`. Over a real network everything works the same way, with an address instead of `localhost`. The outputs come from a lab machine called `lab` with the user `sam`; you see your own names.

### 1. Check that the SSH server runs

```bash
systemctl is-active ssh
ss -tln | grep ':22 '
```

```output
active
LISTEN 0      4096         0.0.0.0:22        0.0.0.0:*
LISTEN 0      4096            [::]:22           [::]:*
```

The service is called `ssh` on Ubuntu, and it listens on port 22. If `systemctl` answers `inactive` or says the unit is not found, install the server with `sudo apt install openssh-server`. On WSL this is usually needed, because the server is not installed there by default.

### 2. Look at the server's fingerprint

<!-- lab: nocheck -->
```bash
ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub
```

```output
256 SHA256:daKBq8qOVRQtzvFAEJSJ/2T0TFvWv4hwO2j1grYn2uc root@lab (ED25519)
```

`ssh-keygen -l` prints the fingerprint of a key file: the key size, the fingerprint itself, a comment, and the type. Yours is different, because every server makes its own host keys when it is installed. Keep this line in mind for step 5. On a real server, the person who set it up should give you this line through another channel, or you read it from the server's own console.

### 3. Make your key pair

<!-- lab: skip -->
```bash
ssh-keygen -t ed25519 -C "sam@lab"
```

<!-- lab: run
ssh-keygen -q -t ed25519 -C "sam@lab" -N "" -f ~/.ssh/id_ed25519
-->

`-t ed25519` picks the key type: Ed25519 is modern, short and fast, and it is the type to choose today. `-C` adds a comment, so you can tell your keys apart later. The command then asks three questions:

1. Where to save the key. Press Enter to accept `~/.ssh/id_ed25519`.
2. A passphrase. Type one, a long sentence is best. Nothing appears while you type.
3. The same passphrase again.

If you made a key in lesson 2.5, `ssh-keygen` first says that `~/.ssh/id_ed25519` already exists and asks `Overwrite (y/n)?`. Answer `n`: it stops and keeps your old key, which works just as well for this lesson, only its comment is the one you chose then instead of `sam@lab`. Answering `y` would delete the key that GitHub knows, and `git push` over SSH would stop working.

For a new key, it then prints the key's fingerprint. Look at what it made:

```bash
stat -c '%A %n' ~/.ssh/id_ed25519 ~/.ssh/id_ed25519.pub
```

```output
-rw------- /home/sam/.ssh/id_ed25519
-rw-r--r-- /home/sam/.ssh/id_ed25519.pub
```

Two files. The private key, `id_ed25519`, can be read only by you: `ssh` refuses to use a private key that other users can read. The public key, ending in `.pub`, can be read by everyone, because that is its job.

```bash
cut -d' ' -f1,3 ~/.ssh/id_ed25519.pub
```

```output
ssh-ed25519 sam@lab
```

A public key is one line with three parts: the type, the key itself (a long block of letters, left out here), and your comment.

### 4. Put the public key on the server

```bash
cat ~/.ssh/id_ed25519.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
grep -c "sam@lab" ~/.ssh/authorized_keys
```

```output
1
```

`>>` adds the line at the end of `authorized_keys`, and creates the file if needed. The server lets in anyone who holds the private half of any key in this file, one key per line. The `chmod 600` matters: the SSH server ignores an `authorized_keys` file that other users could write to, because anyone who can add a line to it can let themselves in.

On a real second machine, the command `ssh-copy-id user@address` does these steps for you: it logs in once with your password and adds your public key.

### 5. Connect for the first time

<!-- lab: skip -->
```bash
ssh localhost whoami
```

<!-- lab: run
ssh -o StrictHostKeyChecking=accept-new localhost true 2>/dev/null
-->

The first connection to a new server stops with a question: `The authenticity of host 'localhost (127.0.0.1)' can't be established`, followed by the server's fingerprint and `Are you sure you want to continue connecting (yes/no/[fingerprint])?`. Compare the fingerprint with the line from step 2. They match, so type `yes`. `ssh` saves the host key in `~/.ssh/known_hosts`, then asks for your key's passphrase, logs in, runs `whoami` there and prints `sam`.

Typing `yes` without comparing is the most common SSH mistake there is. The check exists for exactly this moment.

### 6. Connect again

```bash
ssh localhost whoami
```

```output
sam
```

No question this time: the host key is known. You put a command after the address, so `ssh` ran it on the other side, printed its output and came back. Without a command, you would get a shell on the other machine until you type `exit`.

If your key has a passphrase, `ssh` asks for it at each login, unless a helper called `ssh-agent` keeps the key ready for your session. Most desktops start one for you.

### 7. Read the server's current settings

```bash
sudo sshd -T | grep -E '^(maxauthtries|permitrootlogin|passwordauthentication|kbdinteractiveauthentication|x11forwarding) '
```

```output
maxauthtries 6
permitrootlogin without-password
passwordauthentication no
kbdinteractiveauthentication no
x11forwarding yes
```

`sshd -T` prints every setting the server really uses, after reading all its files. Here is what these five mean:

| Setting | Here | Meaning |
|---|---|---|
| `maxauthtries` | 6 | Login attempts allowed per connection |
| `permitrootlogin` | `without-password` | Root may log in, with a key only |
| `passwordauthentication` | `no` | Passwords are refused |
| `kbdinteractiveauthentication` | `no` | The other way of typing a password is refused |
| `x11forwarding` | `yes` | Graphical programs may be sent over the connection |

This lab machine comes from a cloud image, which already turns passwords off. On a fresh Ubuntu installed from a USB stick, you will most likely see `passwordauthentication yes`.

### 8. Tighten the server

Settings go in a small file of your own, in the folder `/etc/ssh/sshd_config.d/`. The main file reads every `.conf` file in that folder first, in alphabetical order, and for each setting the first value it finds wins. A name that starts with `10-` is therefore read before the files that Ubuntu and cloud tools put there, which start with `50-` and `60-`.

```bash
mkdir ~/sshlab
cd ~/sshlab
```

```text title="10-hardening.conf"
# My SSH hardening (lesson 11.2)
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
X11Forwarding no
MaxAuthTries 3
```

Create this file in `~/sshlab` with your editor. Lines that start with `#` are comments. Then install it, test it and reload the server:

```bash
sudo cp 10-hardening.conf /etc/ssh/sshd_config.d/
sudo sshd -t && echo "config OK"
sudo systemctl reload ssh
```

```output
config OK
```

`sshd -t` checks the settings and prints nothing when they are correct, so `&& echo` adds a visible "yes". After a typo, it names the file and the line instead. `reload` tells the running server to read its settings again, without cutting the connections that are open.

```bash
sudo sshd -T | grep -E '^(maxauthtries|permitrootlogin|passwordauthentication|kbdinteractiveauthentication|x11forwarding) '
```

```output
maxauthtries 3
permitrootlogin no
passwordauthentication no
kbdinteractiveauthentication no
x11forwarding no
```

Every value is now the strict one. Root cannot log in over SSH at all, which forces everyone to log in as themselves and use `sudo`, so the logs show who did what.

:::caution[Never lock the door you are standing behind]
On a remote server, turn passwords off only after a key login works, and keep your current session open while you test a new one in a second terminal. If the new settings shut you out, the open session lets you undo them. Without it, you may need someone with physical access to the machine.
:::

### 9. Test the new rules

```bash
ssh -o BatchMode=yes -o PubkeyAuthentication=no localhost true
ssh -o BatchMode=yes root@localhost true
ssh localhost whoami
```

```output
sam@localhost: Permission denied (publickey).
root@localhost: Permission denied (publickey).
sam
```

`-o` sets a client option for one command. `BatchMode=yes` tells `ssh` never to ask questions, so a refusal shows up as a message instead of a prompt. The first line pretends you have no key: the server lists the methods it would accept in brackets, and only `publickey` is left. The second line tries root and is refused. The third line is your normal key login, which still works.

## Exercise

A backup script needs its own key, so you can remove its access later without touching yours.

1. Create a second key pair in `~/.ssh/lab2_ed25519` with the comment `sam@lab-2`. A script cannot type a passphrase, so use `-N ""` for an empty one.
2. Install its public key with `ssh-copy-id -i ~/.ssh/lab2_ed25519.pub localhost`, then log in with it using `ssh -i ~/.ssh/lab2_ed25519 -o IdentitiesOnly=yes localhost whoami`.
3. Revoke the key: delete its line from `authorized_keys`.
4. Show that the same login is now refused.

<details>
<summary>Show the solution</summary>

```bash
ssh-keygen -q -t ed25519 -C "sam@lab-2" -N "" -f ~/.ssh/lab2_ed25519
ssh-copy-id -i ~/.ssh/lab2_ed25519.pub localhost
```

```output
/usr/bin/ssh-copy-id: INFO: Source of key(s) to be installed: "/home/sam/.ssh/lab2_ed25519.pub"
/usr/bin/ssh-copy-id: INFO: attempting to log in with the new key(s), to filter out any that are already installed
/usr/bin/ssh-copy-id: INFO: 1 key(s) remain to be installed -- if you are prompted now it is to install the new keys

Number of key(s) added: 1

Now try logging into the machine, with:   "ssh 'localhost'"
and check to make sure that only the key(s) you wanted were added.

```

`-q` makes `ssh-keygen` quiet, and `-f` gives the file name. `ssh-copy-id` logged in with the key that already works, your first one, and added the new public key to `authorized_keys`. On a new server it would log in with your password instead.

```bash
ssh -i ~/.ssh/lab2_ed25519 -o IdentitiesOnly=yes localhost whoami
```

```output
sam
```

`-i` picks the key to use. `IdentitiesOnly=yes` makes `ssh` use only that key: without it, `ssh` would also try your normal key, and the test in step 4 would prove nothing.

```bash
sed -i '/sam@lab-2/d' ~/.ssh/authorized_keys
ssh -i ~/.ssh/lab2_ed25519 -o IdentitiesOnly=yes -o BatchMode=yes localhost whoami
```

```output
sam@localhost: Permission denied (publickey).
```

`sed -i '/text/d'` deletes, in place, every line that contains the text. Your own key is untouched, and the script's access is gone. This is why each person and each script should have its own key: you can remove one without changing the others.

</details>

## Check yourself

**1. Which half of a key pair goes to the server, and which half must never leave your computer?**

<details>
<summary>Answer</summary>

The public key goes to the server, into `~/.ssh/authorized_keys`. The private key stays on your computer, protected by its file permissions and a passphrase.

</details>

**2. `ssh` shows a fingerprint and asks `Are you sure you want to continue connecting?`. What should you do before typing `yes`?**

<details>
<summary>Answer</summary>

Compare the fingerprint with one you got another way, for example from the server's console with `ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub` or from the person who runs the server. Only if they match is it the right machine.

</details>

**3. Why does the file name `10-hardening.conf` matter?**

<details>
<summary>Answer</summary>

The SSH server reads the files in `/etc/ssh/sshd_config.d/` in alphabetical order, and the first value for each setting wins. A name starting with `10-` comes before the `50-` and `60-` files that Ubuntu and cloud tools add, so your values are the ones used.

</details>

**4. What does `sudo sshd -t` do, and why run it before `systemctl reload ssh`?**

<details>
<summary>Answer</summary>

It checks the server's settings for errors without changing anything. If a file has a mistake, the server could fail to start again, and on a remote machine that would cut you off. Testing first catches the mistake while you can still fix it.

</details>

**5. After the change, a login without a key ends with `Permission denied (publickey)`. What does the word in brackets tell you?**

<details>
<summary>Answer</summary>

It is the list of login methods the server still accepts. Only `publickey` is left, so passwords are really turned off.

</details>

## Common mistakes

- **Typing `yes` to every fingerprint question.** The question is the only protection on the first visit. Compare the fingerprint first.
- **Ignoring the `REMOTE HOST IDENTIFICATION HAS CHANGED` warning.** It means the server's key is not the one you saved. Find out why (a reinstalled server, or someone in the middle) before you remove the old line with `ssh-keygen -R name`.
- **Wrong permissions on `~/.ssh`.** The server ignores an `authorized_keys` file that others can write to, and the client refuses a private key that others can read. Use `chmod 700 ~/.ssh` and `chmod 600` on the files.
- **Sending your private key to someone.** Nobody, not a server and not a colleague, ever needs your private key. Send the `.pub` file.
- **Editing `/etc/ssh/sshd_config` and seeing no change.** An earlier file in `sshd_config.d` may set the same thing, and the first value wins. Check the real result with `sudo sshd -T`.

## Key terms

- **SSH**: Secure Shell, a protocol for logging in to another machine and running commands over an encrypted connection.
- **SSH server**: the service `sshd` that accepts SSH connections, usually on TCP port 22.
- **SSH client**: the program `ssh` that you run to connect to an SSH server.
- **Host key**: the key pair that identifies an SSH server. Clients save its public half in `~/.ssh/known_hosts`.
- **Fingerprint**: a short checksum of a key, used to compare keys by eye.
- **Key pair**: a private key and its matching public key, used to prove who you are without a password.
- **Private key**: the half of a key pair that stays secret on your computer.
- **Public key**: the half of a key pair that you can share, for example in `~/.ssh/authorized_keys` on a server.
- **Passphrase**: a password that encrypts a private key file, so a stolen copy is useless without it.

## Go further

- [OpenSSH manual pages](https://www.openssh.org/manual.html): the official reference for `ssh`, `sshd`, `ssh-keygen` and every setting in `sshd_config`.
- [Ubuntu Server documentation: OpenSSH server](https://ubuntu.com/server/docs/openssh-server): how Ubuntu sets up the SSH server and where its files live.
- [OverTheWire: Bandit](https://overthewire.org/wargames/bandit/): every level starts with an `ssh` login, and some levels are about keys. Real practice on a machine that invites you in.
