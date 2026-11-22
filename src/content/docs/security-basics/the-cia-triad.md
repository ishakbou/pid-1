---
title: The CIA triad
description: Learn the three goals of security (confidentiality, integrity and availability), see one real failure of each, and break and repair each one on a practice file.
lesson: "9.2"
time: 20 min
sidebar:
  order: 2
---

What does "secure" mean? Ask ten people and most will say "nobody can get in". By that definition, a server with its power cable pulled out is perfectly secure. It is also useless. Security people use a more exact answer, made of three words, and you will hear those three words in every job interview and every incident report.

## Goal

After this lesson you can:

- Explain confidentiality, integrity and availability in your own words.
- Say which of the three an incident damaged.
- Protect a file against a failure of each kind with basic Linux commands.

## Why it matters

"Is it secure?" cannot be answered. "Can a stranger read it, can someone change it without us noticing, and will it be there when we need it?" can be answered, tested and fixed. The three words also give a team a shared language. When a report says "integrity incident", everyone knows the first job is to find out what was changed, not who read what.

## The idea

The **CIA triad** is a list of the three things security protects. The letters have nothing to do with the American agency.

| Property | The question it asks | Typical defenses |
|---|---|---|
| **Confidentiality** | Can only the right people read it? | Permissions, passwords, encryption |
| **Integrity** | Is it correct, and would we notice a change? | Checksums, signatures, logs, access control |
| **Availability** | Can the right people use it when they need it? | Backups, spare machines, updates, protection against overload |

Think of your medical record at a hospital. Confidentiality: your doctors can read it, your neighbor cannot. Integrity: the blood type written in it is the right one, and nobody changed it by mistake or on purpose. Availability: the emergency room can open it at three in the morning. Lose any one of the three and the record has failed you, in three very different ways.

### One real failure of each

**Confidentiality: Equifax, 2017.** Equifax is a company that keeps credit files on most American adults. Attackers got in through a known flaw in the software of one of its websites. A fix had been available for about two months, and it had not been installed. The attackers copied personal data of about 147 million people. Nothing was deleted and the site kept working. The damage was that the wrong people could read the data. An event like this is called a **data breach**.

**Integrity: SolarWinds, 2020.** SolarWinds sells a network management product called Orion. Attackers broke into the company and quietly added their own code to an official Orion update. About 18,000 organizations then installed that update, as they should, from the real vendor. The file came from the right place but it was not what the developers wrote. Customers trusted something that had been changed.

**Availability: Dyn, 2016.** Dyn ran DNS servers for many large websites. One day in October, a huge number of hijacked cameras and home routers sent it junk requests, all at once. The servers could not keep up, and for hours many people could not reach sites such as Twitter, Netflix and Reddit. No data was stolen or changed. The service was simply not there. An attack that makes a service unusable is called a **denial of service** (DoS).

### The three pull against each other

You cannot turn all three up to the maximum. Lock a file in a safe with no network and it is very confidential and hard to change, but nobody can use it. Copy it to ten servers so it is always available, and there are ten places to steal it from. Security work is choosing the right balance for each system. A public price list needs integrity and availability, and no confidentiality at all. A password database needs confidentiality first.

## Try it

You will keep a small grades file and make it fail in all three ways. Wherever you see `sam` in an output, your screen shows your own username.

### 1. Create the file

```bash
mkdir ~/cia
cd ~/cia
```

```text title="grades.txt"
amina 15
karim 12
lea 17
```

### 2. Confidentiality: check who can read it

```bash
stat -c '%A %n' grades.txt
```

```output
-rw-rw-r-- grades.txt
```

`stat` prints facts about a file. The `-c` option chooses which ones: `%A` is the permissions and `%n` is the name. You read permissions in [lesson 1.4](../linux/users-and-permissions/).

The last three characters, `r--`, mean that the file lets every other user on this machine read the grades. On Ubuntu your home folder is usually closed to other users, which blocks them one level up, but the file should not count on that: copied to a shared folder, it keeps its own permissions. On some systems you will see `-rw-r--r--`; the last three are the same.

```bash
chmod 600 grades.txt
stat -c '%A %n' grades.txt
```

```output
-rw------- grades.txt
```

Now only the owner can read or write the file. That is a confidentiality control, and it took one command.

### 3. Availability: prepare for the bad day

```bash
mkdir backup
cp grades.txt backup/
ls backup
```

```output
grades.txt
```

A copy in another place is the oldest availability defense there is. In real life the copy goes to another disk or another building, not to a folder next to the original.

### 4. Integrity: take a fingerprint

```bash
sha256sum grades.txt
```

```output
04064ccd3bea752370cfeb12420bf0855d3cd1fb8f215cb4361fa0a365764205  grades.txt
```

`sha256sum` reads the file and computes a **checksum**: a short value that depends on every byte of the content. Change one character and the checksum changes completely. [Module 10](../cryptography/) explains how this works. For now, treat it as a fingerprint of the file.

```bash
sha256sum grades.txt > grades.sha256
sha256sum -c grades.sha256
```

```output
grades.txt: OK
```

You saved the fingerprint in a second file. The `-c` option means "check": it computes the checksum again and compares it with the saved one.

### 5. Break integrity

Someone adds a student who was never in the class:

```bash
echo "omar 20" >> grades.txt
sha256sum -c grades.sha256
```

```output
grades.txt: FAILED
sha256sum: WARNING: 1 computed checksum did NOT match
```

The file still opens, and it still looks like a normal grades file. Without the fingerprint you would have no reason to doubt it. The check does not prevent the change. It makes the change visible, which is the first half of integrity.

### 6. Repair integrity

```bash
cp backup/grades.txt grades.txt
sha256sum -c grades.sha256
```

```output
grades.txt: OK
```

The backup had the last known good version, so one copy brings the truth back. Notice how the two defenses worked together: the checksum told you that something was wrong, and the backup fixed it.

### 7. Break and repair availability

```bash
rm grades.txt
cat grades.txt
```

```output
cat: grades.txt: No such file or directory
```

The data is not stolen and not changed. It is gone, which for the teacher who needs it today is just as bad.

```bash
cp backup/grades.txt grades.txt
cat grades.txt
```

```output
amina 15
karim 12
lea 17
```

Availability is back. If you had skipped step 3, this lesson would end here with no grades.

## Exercise

A café keeps its prices in a file. Work in `~/cia`.

1. Create `prices.txt` with three lines: `coffee 2`, `tea 2` and `cake 4`.
2. Decide which of the three properties matters least for this file, and why.
3. Save a checksum of the file in `prices.sha256` and put a copy of the file in `backup/`.
4. Play the attacker: add the line `cake 0` to `prices.txt`.
5. Play the defender: prove that the file changed, restore it, and prove that it is correct again.

<details>
<summary>Show the solution</summary>

```bash
cd ~/cia
echo "coffee 2" > prices.txt
echo "tea 2" >> prices.txt
echo "cake 4" >> prices.txt
sha256sum prices.txt > prices.sha256
cp prices.txt backup/
echo "cake 0" >> prices.txt
sha256sum -c prices.sha256
```

```output
prices.txt: FAILED
sha256sum: WARNING: 1 computed checksum did NOT match
```

```bash
cp backup/prices.txt prices.txt
sha256sum -c prices.sha256
```

```output
prices.txt: OK
```

Confidentiality matters least: the prices hang on the wall for every customer to read. Integrity matters most (free cake is bad for business), and availability comes second, because the till needs the file all day.

</details>

## Check yourself

**1. A hospital's computers are locked by an attacker and doctors cannot open patient records for two days. Which property failed?**

<details>
<summary>Answer</summary>

Availability. The right people could not use the data when they needed it. If the attacker also copied the records, confidentiality failed too.

</details>

**2. In the SolarWinds case, customers downloaded the update from the real vendor. Why is it still an integrity failure?**

<details>
<summary>Answer</summary>

Because the content was not what it should have been. Attackers had added their own code to the update before it was published. Integrity is about the content being correct and unchanged, and a trusted source does not prove that on its own.

</details>

**3. In step 5, the checksum check failed. Did it stop the change from happening?**

<details>
<summary>Answer</summary>

No. A checksum only detects a change. To undo it you needed the backup, and to prevent it you would need access control, such as permissions.

</details>

**4. Why can you not simply maximize all three properties?**

<details>
<summary>Answer</summary>

They pull against each other. Locking data away helps confidentiality but hurts availability. Making many copies helps availability but gives more places to steal from. Each system needs its own balance.

</details>

## Lesson map

```mindmap
CIA triad
  Confidentiality
    only the right readers
    permissions
    Equifax 2017
  Integrity
    correct and unchanged
    checksums
    SolarWinds 2020
  Availability
    there when needed
    backups
    Dyn 2016
```

## Common mistakes

- **Thinking security means secrecy only.** Two of the three properties have nothing to do with secrets. A site that is down or a record that is wrong is a security failure too.
- **Keeping the checksum next to the file.** Someone who can change `grades.txt` can also change `grades.sha256`. In real life the fingerprint is stored somewhere the attacker cannot write.
- **Calling a copy in the same folder a backup.** If the disk dies or the folder is deleted, both are gone. A backup lives on another device.
- **Forgetting accidents.** Most integrity and availability failures are not attacks. A wrong command, a full disk or a bad update break things just as well, and the same defenses help.

## Key terms

- **CIA triad**: the three goals of security: confidentiality, integrity and availability.
- **Confidentiality**: only the people who are allowed to can read the data.
- **Integrity**: the data is correct, and a change by the wrong person or by accident does not go unnoticed.
- **Availability**: the people who are allowed to can use the system or the data when they need it.
- **Data breach**: an incident in which people who should not see some data get a copy of it.
- **Denial of service** (DoS): an attack that makes a service unusable for its real users, often by flooding it with requests.
- **Checksum**: a short value computed from the content of a file, used to detect that the content changed.

## Go further

- [NIST glossary: confidentiality](https://csrc.nist.gov/glossary/term/confidentiality): the formal definitions used in standards, with links to integrity and availability.
- [GAO report on the Equifax breach](https://www.gao.gov/products/gao-18-559): the official United States government review of what went wrong, written in plain language.
- [sha256sum manual page](https://man7.org/linux/man-pages/man1/sha256sum.1.html): every option of the command you used for the fingerprint.
