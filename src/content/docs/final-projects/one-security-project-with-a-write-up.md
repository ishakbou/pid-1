---
title: One security project with a write-up
description: Choose a small security project, build it in your own lab and document it with evidence, using a locked-down web service as the worked example.
lesson: "17.2"
time: 25 min
sidebar:
  order: 2
---

<!-- lab: run
git config --global user.name "Sam"
git config --global user.email "sam@example.com"
git config --global init.defaultBranch main
sudo systemctl disable --now mylab-web > /dev/null 2>&1
sudo rm -f /etc/systemd/system/mylab-web.service /etc/mylab-was-here
sudo systemctl daemon-reload
sudo userdel mylab > /dev/null 2>&1
sudo rm -rf /opt/mylab
rm -rf ~/mylab ~/hardened-server
mkdir -p ~/mylab/app
cat > ~/mylab/app/server.py <<'EOF'
"""A tiny web server for mylab, made only from the Python standard library.

Run it from the mylab folder:  python3 app/server.py [port]
"""
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer

HOST = "127.0.0.1"  # loopback only: no other machine can connect
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000

PAGE = """<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>mylab</title></head>
<body>
<h1>mylab</h1>
<p>This page was served by app/server.py.</p>
</body>
</html>
"""


class Handler(BaseHTTPRequestHandler):
    def route(self):
        """Return the status code, content type and text for the requested path."""
        if self.path == "/":
            return 200, "text/html; charset=utf-8", PAGE
        if self.path == "/health":
            return 200, "text/plain; charset=utf-8", "ok\n"
        return 404, "text/plain; charset=utf-8", "not found\n"

    def do_GET(self):
        status, content_type, text = self.route()
        body = text.encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        """Print one line per request: when, who, what, and the answer."""
        host, port = self.client_address
        headers = getattr(self, "headers", None)
        agent = headers.get("User-Agent", "-") if headers else "-"
        print(f"{self.log_date_time_string()} {host}:{port} {format % args} {agent}", flush=True)


def main():
    server = HTTPServer((HOST, PORT), Handler)
    print(f"mylab server on http://{HOST}:{PORT}/  (press Ctrl+C to stop)", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("stopped")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
EOF
cd ~
-->

A CTF challenge has a flag at the end: you know when you are done. A project of your own has no flag. Nobody tells you what to build, where to stop, or how to prove that it worked. In this lesson you set all three yourself, build a small security project in your lab, and write it up so that a stranger can check every claim.

## Goal

After this lesson you can:

- Choose a security project that is small enough to finish and safe and legal to build.
- Measure a system before and after a change, so the result is evidence, not opinion.
- Write up the project with its goal, steps, evidence, dead ends and limits.

## Why it matters

"I hardened a server" on a CV means nothing until someone asks "how do you know?" A project with a measured before and after answers that question before anyone asks it. It is also how security work is done in real jobs: an audit or a penetration test ends with a report, and the report is what the client pays for. A small project that is well documented beats a big one that nobody can check.

## The idea

A good portfolio security project has three parts: a **question** ("can I run a web service so that a bug in it cannot damage the rest of the machine?"), a **build** that answers it in your own lab, and **evidence**: numbers or outputs that anyone can reproduce. Pick one that passes four tests:

| Test | Good sign |
|---|---|
| Small | You can finish it in a week of evenings |
| Legal | It runs only on machines you own: your computer, your VMs, your `mylab` |
| Measurable | One command shows the state before and after |
| Yours | It builds on something you made, so you can explain every line |

Some projects that pass all four, each building on a module of this course:

| Project | What you measure | Builds on |
|---|---|---|
| A hardened home server | Open ports, SSH settings, firewall rules | Module 11 |
| A locked-down web service | What the service may do if it is attacked | Modules 5, 6, 11 |
| Login monitoring with alerts | How fast a burst of failed logins is reported | Module 13 |
| A password storage review of `mylab` | Time to test one guess, before and after | Module 10 |

This lesson builds the second one, because it is the next step after the hardened machine of the [Module 11 project step](../system-security/project/). Module 11 protected the machine from the outside. Now you limit what a program on that machine could do if someone found a bug in it.

The tool is systemd, which starts the services on Ubuntu. You describe a service in a **unit file**, and systemd can run it inside a **service sandbox**: a set of limits on what the process may see and change, built from the same kernel features as the containers of lesson 5.6. Think of it like lending your flat to a guest: you give a key to one room, not to the whole building, and the cupboards with your papers stay locked. The guest can still use the room fully.

How do you measure a sandbox? `systemd-analyze security` reads a service's settings and gives it an **exposure score** from 0 (very limited) to 10 (may do anything). The score is a summary, not a proof, so you also test the most important limits directly.

## Try it

This step uses the tiny server `app/server.py` from the [Module 6 project step](../networking/project/), and the lab machine `lab` with the user `sam`. It changes system settings, so do it in your VM or lab machine, as in Module 11. The project gets its own repository, `~/hardened-server`: a second project for your portfolio, next to `mylab`.

### 1. Install the server where a service can use it

```bash
mkdir ~/hardened-server
cd ~/hardened-server
git init -q
sudo install -D -m 644 ~/mylab/app/server.py /opt/mylab/server.py
ls -l /opt/mylab
```

```output
total 4
-rw-r--r-- 1 root root 1927 Nov 22 06:05 server.py
```

`install` copies a file and sets its permissions in one go; `-D` creates `/opt/mylab` first. The copy belongs to root, and nobody else may change it. That is on purpose: the service will run as another user, and a service that cannot change its own code cannot be turned into something else. It also does not need your home directory, which matters in step 4.

### 2. Run it as a plain service

```ini title="mylab-web.service"
[Unit]
Description=mylab web server (app/server.py)
After=network.target

[Service]
ExecStart=/usr/bin/python3 /opt/mylab/server.py 8000
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

The `[Service]` part says what to run, and to start it again if it crashes. `[Install]` says to start it at boot. Copy it to where systemd reads unit files and start it:

```bash
sudo cp mylab-web.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now mylab-web
curl -s --retry 10 --retry-connrefused --retry-delay 1 http://127.0.0.1:8000/health
```

```output
Created symlink /etc/systemd/system/multi-user.target.wants/mylab-web.service → /etc/systemd/system/mylab-web.service.
ok
```

`daemon-reload` tells systemd to read its unit files again. `enable --now` starts the service now and also at every boot. Then `curl` asks for the health page from Module 6. The service needs a moment to start, so `--retry-connrefused` lets `curl` try again, once per second and up to 10 times, while the connection is still refused. You use the same `curl` line after every restart in this lesson.

### 3. Measure the "before"

```bash
pid=$(systemctl show -p MainPID --value mylab-web)
ps -o user=,cmd= -p "$pid"
systemd-analyze security mylab-web | tail -n 1
```

```output
root     /usr/bin/python3 /opt/mylab/server.py 8000
→ Overall exposure level for mylab-web.service: 9.6 UNSAFE :-{
```

`systemctl show -p MainPID --value` prints only the process number of the service, and `ps -p` shows that one process, with its user and its command. (`ps -C python3` would also list any other Python program that happens to run, and Ubuntu runs a few in the background.) The service runs as root, and its score is 9.6 out of 10. Now the direct test. `systemd-run`, which you met in lesson 5.6, runs one command under the same kind of rules as a service. With no rules, as now, it shows what an attacker could do with a bug in the server:

```bash
sudo systemd-run -q --pipe --wait bash -c 'touch /etc/mylab-was-here; ls /home/sam'
ls /etc/mylab-was-here
sudo rm /etc/mylab-was-here
```

```output
hardened-server
mylab
/etc/mylab-was-here
```

The command wrote a file into `/etc`, where the system's settings live, and listed your home directory. A bug in a 60-line demo server should not lead to that.

### 4. Write the hardened unit

First a user for the service:

```bash
sudo useradd --system --no-create-home --shell /usr/sbin/nologin mylab
```

`--system` makes a system account, like the ones you found in `/etc/passwd` in lesson 11.1. `--no-create-home` skips the home directory, and the `nologin` shell refuses every login. The account exists only to own the running service.

Then add these lines to the `[Service]` part, after `Restart=on-failure`:

```ini title="mylab-web.service"
[Unit]
Description=mylab web server (app/server.py)
After=network.target

[Service]
ExecStart=/usr/bin/python3 /opt/mylab/server.py 8000
Restart=on-failure
User=mylab
Group=mylab
NoNewPrivileges=yes
ProtectSystem=strict
ProtectHome=yes
PrivateTmp=yes
PrivateDevices=yes
CapabilityBoundingSet=
RestrictAddressFamilies=AF_INET AF_INET6
ProtectKernelTunables=yes
ProtectKernelModules=yes
ProtectControlGroups=yes

[Install]
WantedBy=multi-user.target
```

| Setting | What it takes away |
|---|---|
| `User=`, `Group=` | Root: the service runs as `mylab` |
| `NoNewPrivileges=yes` | Any way to gain rights later, for example through `sudo` |
| `ProtectSystem=strict` | Writing anywhere in the file system (only its private `/tmp` and `/var/tmp` stay writable) |
| `ProtectHome=yes` | Seeing `/home` and `/root` at all |
| `PrivateTmp=yes` | Other programs' files in `/tmp` and `/var/tmp`: it gets its own, empty ones |
| `PrivateDevices=yes` | Access to hardware devices such as disks |
| `CapabilityBoundingSet=` | Every **capability**, a piece of root's power such as changing the clock |
| `RestrictAddressFamilies=` | Every kind of network socket except IPv4 and IPv6 |
| The two `ProtectKernel...` lines and `ProtectControlGroups` | Changing kernel settings, loading kernel modules, changing cgroups |

Each line takes away something that a web server showing one page never needs. That is least privilege from lesson 9.4, written as a configuration file.

```bash
sudo cp mylab-web.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl restart mylab-web
curl -s --retry 10 --retry-connrefused --retry-delay 1 http://127.0.0.1:8000/health
```

```output
ok
```

The service still works. Check that after every change: a sandbox that breaks the service is not a fix.

### 5. Measure the "after"

```bash
pid=$(systemctl show -p MainPID --value mylab-web)
ps -o user=,cmd= -p "$pid"
systemd-analyze security mylab-web | tail -n 1
```

```output
mylab    /usr/bin/python3 /opt/mylab/server.py 8000
→ Overall exposure level for mylab-web.service: 4.5 OK :-)
```

From 9.6 to 4.5, and the service no longer runs as root. Now the same direct test, with the same user and file system rules as the service:

```bash
sudo systemd-run -q --pipe --wait -p User=mylab -p ProtectSystem=strict -p ProtectHome=yes bash -c 'touch /etc/mylab-was-here; ls /home/sam'
```

```output
touch: cannot touch '/etc/mylab-was-here': Read-only file system
ls: cannot access '/home/sam': Permission denied
```

The write failed: for this process, the file system is read-only. And your home directory is out of reach: `ProtectHome` puts an empty directory over `/home` that nobody may open. An attacker with a bug in the server would now find much less to steal or break.

### 6. Make one mistake on purpose

Change `strict` into `strickt`, a typo anyone could make, and load the file:

```bash
sed -i 's/^ProtectSystem=strict$/ProtectSystem=strickt/' mylab-web.service
sudo cp mylab-web.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl restart mylab-web
systemctl is-active mylab-web
systemctl show -p ProtectSystem mylab-web
```

```output
active
ProtectSystem=no
```

No error. The service runs, and `systemctl show`, which prints the settings systemd really uses, says `ProtectSystem=no`. systemd skipped the line it could not read and only wrote a warning into the system log. `systemd-analyze verify` shows the same warning on demand:

```bash
systemd-analyze verify /etc/systemd/system/mylab-web.service
```

```output
/etc/systemd/system/mylab-web.service:11: Failed to parse protect system value, ignoring: strickt
```

This is the most important lesson of the project: **the file is not the result.** Only a measurement shows what is really in force. Fix the typo and load it again:

```bash
sed -i 's/^ProtectSystem=strickt$/ProtectSystem=strict/' mylab-web.service
sudo cp mylab-web.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl restart mylab-web
curl -s --retry 10 --retry-connrefused --retry-delay 1 http://127.0.0.1:8000/health
systemctl show -p ProtectSystem mylab-web
```

```output
ok
ProtectSystem=strict
```

### 7. Turn the evidence into a script

You will want to check again after every change. A script does it in a second:

```bash title="check.sh"
#!/bin/bash
# Check the mylab-web service against the goals of this project.
status=0
pass() { echo "PASS  $1"; }
fail() { echo "FAIL  $1"; status=1; }

if [ "$(curl -s http://127.0.0.1:8000/health)" = "ok" ]; then
  pass "answers on /health"
else
  fail "answers on /health"
fi

pid=$(systemctl show -p MainPID --value mylab-web)
if [ "$(ps -o user= -p "$pid")" = "mylab" ]; then
  pass "runs as mylab"
else
  fail "runs as mylab"
fi

for setting in NoNewPrivileges=yes ProtectSystem=strict ProtectHome=yes PrivateTmp=yes; do
  name=${setting%%=*}
  if [ "$(systemctl show -p "$name" mylab-web)" = "$setting" ]; then
    pass "$setting"
  else
    fail "$setting"
  fi
done

score=$(systemd-analyze security mylab-web | tail -n 1 | grep -o -E '[0-9]+\.[0-9]+')
if [ "${score%.*}" -lt 5 ]; then
  pass "exposure $score is below 5"
else
  fail "exposure $score is not below 5"
fi
exit "$status"
```

The process check is the one from step 3. The new parts: `${setting%%=*}` cuts everything from the first `=`, so `ProtectSystem=strict` becomes `ProtectSystem`. `${score%.*}` cuts the decimal part, so `4.5` becomes `4`, because `[ ... -lt 5 ]` compares whole numbers only. And the script checks the settings systemd really uses, so it would have caught the typo of step 6.

```bash
chmod +x check.sh
./check.sh
echo "exit status: $?"
```

```output
PASS  answers on /health
PASS  runs as mylab
PASS  NoNewPrivileges=yes
PASS  ProtectSystem=strict
PASS  ProtectHome=yes
PASS  PrivateTmp=yes
PASS  exposure 4.5 is below 5
exit status: 0
```

### 8. Write it up

The write-up is the project's README. It uses the shape of your CTF write-ups from Module 14, with a few changes: "Setup" replaces "Recon", "Evidence" replaces "Flag", "Limits" says honestly what is still open, and "How to check" tells a stranger how to repeat the measurement.

```markdown title="README.md"
# hardened-server: a locked-down web service

Can a web service run so that a bug in it cannot damage the rest of the
machine? This project runs the mylab server under systemd with a sandbox,
and measures the result. Built and tested on my own lab VM (Ubuntu 24.04).

## Summary

The service ran as root with an exposure score of 9.6 (UNSAFE). After
adding a service user and 10 sandbox settings, it runs as `mylab` with a
score of 4.5 (OK), cannot write outside its private temporary folders and cannot open /home.
It still answers every request. `./check.sh` checks all of it.

## Setup

- `server.py` installed in /opt/mylab, owned by root, mode 644.
- `mylab-web.service`: the unit file, copied to /etc/systemd/system.
- A system user `mylab` with no home and no login shell.

## Steps

1. Ran the server as a plain service and measured it.
2. Added the user and the sandbox settings, one group at a time,
   checking /health after each group.
3. Measured again and tested the limits directly with systemd-run.
4. Wrote check.sh so that anyone can repeat the measurement.

## Evidence

| Check | Before | After | Command |
|---|---|---|---|
| Runs as | root | mylab | ps -o user= -p (MainPID of mylab-web) |
| Exposure score | 9.6 UNSAFE | 4.5 OK | systemd-analyze security mylab-web |
| Write to /etc | allowed | Read-only file system | systemd-run, see step 3 |
| List /home/sam | allowed | Permission denied | systemd-run, see step 3 |
| /health answers | ok | ok | curl -s http://127.0.0.1:8000/health |

## Dead ends

A typo, `ProtectSystem=strickt`, did not stop the service. systemd
ignored the line with only a warning in the journal, and the setting was
off. Since then, check.sh reads the settings from `systemctl show`,
not from the file.

## Limits

- No system call filter yet (`SystemCallFilter=`): the score could go lower.
- The sandbox limits damage. It does not fix bugs in server.py.
- Tested on one machine, with one small service.

## What I learned

The file is not the result. Measure what is in force, every time.

## How to check

    sudo cp mylab-web.service /etc/systemd/system/
    sudo systemctl daemon-reload && sudo systemctl restart mylab-web
    ./check.sh
```

Read it as a stranger would. Every number in it came from a command, and the table says which. Lines indented by four spaces show as a code block in Markdown, which keeps the commands readable without a block inside the block.

```bash
git add README.md mylab-web.service check.sh
git status --short
```

```output
A  README.md
A  check.sh
A  mylab-web.service
```

<!-- lab: nocheck -->
```bash
git commit -q -m "Locked-down mylab web service, with evidence and a check script"
git log --oneline
```

```output
30a31f1 Locked-down mylab web service, with evidence and a check script
```

Your commit number differs. The service itself keeps running on the lab machine; leave it there for lesson 17.3, or stop it with `sudo systemctl disable --now mylab-web` when you are done.

## Exercise

Close the first item under "Limits". Add these three lines to the unit, after `ProtectControlGroups=yes`:

```text
SystemCallFilter=@system-service
RestrictNamespaces=yes
UMask=0077
```

`SystemCallFilter=@system-service` allows only the system calls that ordinary services use, `RestrictNamespaces=yes` forbids creating the namespaces of lesson 5.6, and `UMask=0077` makes every file the service creates private. Load the unit, check that the service still answers, run `./check.sh`, and update the Evidence table and the Limits.

<details>
<summary>Show the solution</summary>

<!-- lab: run
cd ~/hardened-server
sed -i 's/^ProtectControlGroups=yes$/ProtectControlGroups=yes\nSystemCallFilter=@system-service\nRestrictNamespaces=yes\nUMask=0077/' mylab-web.service
-->

```bash
grep -A 3 '^ProtectControlGroups' mylab-web.service
sudo cp mylab-web.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl restart mylab-web
curl -s --retry 10 --retry-connrefused --retry-delay 1 http://127.0.0.1:8000/health
./check.sh
```

```output
ProtectControlGroups=yes
SystemCallFilter=@system-service
RestrictNamespaces=yes
UMask=0077
ok
PASS  answers on /health
PASS  runs as mylab
PASS  NoNewPrivileges=yes
PASS  ProtectSystem=strict
PASS  ProtectHome=yes
PASS  PrivateTmp=yes
PASS  exposure 2.4 is below 5
```

The score drops from 4.5 to 2.4 and every other check still passes, so the service works with the new limits. In the README, change the score row to `9.6 UNSAFE | 2.4 OK`, "10 sandbox settings" to 13, and replace the first Limits line with what is still open, for example "No `IPAddressDeny=` rule yet". Commit the unit and the README together.

</details>

## Check yourself

**1. Why is the server copied to `/opt/mylab`, owned by root, instead of running from your home directory?**

<details>
<summary>Answer</summary>

The service runs as `mylab`, which cannot change a file owned by root, so a bug cannot be used to rewrite the server's own code. And with `ProtectHome=yes`, the service cannot see `/home` at all, so it must not need anything there.

</details>

**2. The exposure score fell from 9.6 to 4.5. Why test with `systemd-run` as well?**

<details>
<summary>Answer</summary>

The score is a summary computed from the settings, not a proof. The direct test shows the real effect: the write to `/etc` fails and your home directory cannot be opened. Evidence is strongest when a summary and a direct test agree.

</details>

**3. In step 6, the service started without an error. What was wrong, and how did you see it?**

<details>
<summary>Answer</summary>

systemd could not read `ProtectSystem=strickt`, ignored the line and left the protection off, with only a warning in the journal. `systemctl show -p ProtectSystem` revealed it, because it prints the setting systemd really uses: `no`.

</details>

**4. Name the four tests a portfolio security project should pass.**

<details>
<summary>Answer</summary>

Small enough to finish, legal (only machines you own), measurable before and after with a command, and yours, built on something you made and can explain.

</details>

**5. Why does the write-up have a "Limits" section?**

<details>
<summary>Answer</summary>

Because no project closes every gap. Saying what is still open, such as the missing system call filter, shows that you know where your work stops. Readers trust a write-up with honest limits more than one that claims everything is secure.

</details>

## Common mistakes

- **Choosing a project that is too big.** "Secure my whole network" never ends. Pick one service or one question, finish it, write it up, then pick the next.
- **Changing ten settings at once.** If the service breaks, you do not know which line did it. Add a few, check `/health`, then go on.
- **Trusting the file.** A typo is skipped silently. Check what is in force with `systemctl show` and the score.
- **Copying numbers from this page.** Your scores may differ, especially on another version of systemd. Write what your machine prints.
- **Testing on systems you do not own.** Only your own machines and VMs. A security project that breaks the law is not a portfolio item.

## Key terms

- **Unit file**: a text file that tells systemd how to run a service, what to start and when.
- **Service sandbox**: a set of limits on what a service's process may see and change, so that a bug in it does less damage.
- **Exposure score**: the number from 0 to 10 that `systemd-analyze security` gives a service; lower means fewer rights.
- **Capability**: one piece of root's power, such as changing the clock or binding to low ports, that Linux can give or take away separately.

## Go further

- [systemd.exec manual](https://www.freedesktop.org/software/systemd/man/latest/systemd.exec.html): every sandbox setting used in this lesson, and many more, with exact meanings.
- [systemd-analyze manual](https://www.freedesktop.org/software/systemd/man/latest/systemd-analyze.html): the `security` command and how it scores a service.
- [Ubuntu Server documentation: Security](https://ubuntu.com/server/docs/security-introduction): ideas for your next project on the same machine.
