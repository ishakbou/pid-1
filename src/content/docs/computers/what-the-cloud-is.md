---
title: What "the cloud" actually is
description: The cloud as other people's computers rented by the minute, with data centres, regions, service models and shared responsibility, and the arithmetic behind its prices and its speed.
lesson: "5.7"
time: 20 min
sidebar:
  order: 7
---

Somewhere there is a building the size of a few football pitches, with no windows, full of rows of metal racks humming under cold air. Your photos backup, your university's email and half the apps on your phone run in buildings like that one. "The cloud" sounds like it floats; in fact it is one of the heaviest, most physical things people have ever built.

## Goal

After this lesson you can:

- Explain what a cloud provider rents out, and how virtual machines make that possible.
- Tell IaaS, PaaS and SaaS apart, and know what regions and availability zones are for.
- Work out what "pay as you go" and "elastic" mean with real arithmetic, and why distance still matters.

## Why it matters

Almost every job in computing touches the cloud: developers deploy to it, administrators run it, and security teams spend much of their time on it. Many of the big data leaks of recent years were not clever attacks at all, but cloud storage left open to the whole internet by mistake. Knowing what you rent, and which part of its security is yours, is the first step to not being the next example.

## The idea

**The cloud** is computing power, storage and software that you rent over the internet from a provider, instead of buying and running the machines yourself. The machines are real servers in a provider's **data centres**. You never see them; you ask for what you need through a website or a program, and you pay for what you use, often by the second or the minute.

This only works because of the previous lesson. One big physical server can run dozens of virtual machines with a hypervisor, so the provider can cut its hardware into small pieces and rent each piece to a different customer. A **vCPU** (virtual CPU) is one such piece of processor; a **cloud instance**, or just instance, is one rented virtual machine with a given number of vCPUs, an amount of RAM and a disk.

Think of the difference between owning a car and using a car rental company. If you own the car, you pay for it even when it stands in the garage, and repairs are your problem. With a rental, you pick the size you need today, pay by the day, and give it back. Renting costs more per day than owning, but much less if you only need a car now and then, or a van once a year.

### Service models

Providers rent things at different levels. The more they manage, the less you have to.

| Model | You rent | You still manage | Example |
|---|---|---|---|
| **IaaS** (infrastructure as a service) | virtual machines, disks, networks | the operating system, updates, your app | a cloud VM with Ubuntu |
| **PaaS** (platform as a service) | a ready place to run your code | your code and its settings | a service where you upload a web app and it runs |
| **SaaS** (software as a service) | a finished application | your data and your accounts | web email, an online office suite |

### Regions and zones

A **region** is a geographic area where a provider has data centres, for example "Frankfurt" or "Paris". Inside a region there are usually several **availability zones**: separate locations, each made of one or more data centres with their own power and cooling, kilometres apart, so that a fire or a power cut in one does not stop the others. You choose a region close to your users, and spread important systems over two or more zones.

### Shared responsibility

The provider secures the buildings, the hardware and the hypervisor. You secure what you put on top: your operating system in IaaS, your code in PaaS, and in every model, your data, your passwords and who you give access to. This split is called the **shared responsibility model**, and most cloud incidents happen on the customer's side of it.

## Try it

The cloud is other people's computers, so you cannot open a data centre from your terminal. What you can do is the arithmetic that cloud decisions are made with, using your own machine as the example. The prices below are made-up round numbers for practice, not any provider's real prices.

```bash
mkdir ~/cloud
cd ~/cloud
```

### 1. Describe your machine like an instance

```python title="machine.py"
import os
import shutil

with open("/proc/meminfo") as f:
    mem_kib = int(f.readline().split()[1])    # first line: MemTotal in KiB

disk = shutil.disk_usage("/")
print(f"{os.cpu_count()} vCPU, {mem_kib / 2**20:.1f} GiB RAM, {disk.total / 2**30:.0f} GiB disk")
```

<!-- lab: nocheck -->
```bash
python3 machine.py
```

```output
2 vCPU, 2.8 GiB RAM, 18 GiB disk
```

This is how a provider's price list describes an instance: cores, memory and disk. The first line of `/proc/meminfo` is the total RAM in KiB, and `shutil.disk_usage` reports the disk in bytes. The test machine for this course would be a small instance. Yours shows your own numbers.

### 2. Compare paying by the hour with paying for a month

```python title="cost.py"
HOURS_PER_MONTH = 730        # 365 days x 24 hours / 12 months

small = 0.04                 # made-up price per hour: 2 vCPU, 4 GiB
big = 1.50                   # made-up price per hour: 32 vCPU, 128 GiB

print(f"small, all month: {small * HOURS_PER_MONTH:7.2f}")
print(f"big, all month:   {big * HOURS_PER_MONTH:7.2f}")
print(f"big, 3 hours:     {big * 3:7.2f}")
```

```bash
python3 cost.py
```

```output
small, all month:   29.20
big, all month:   1095.00
big, 3 hours:        4.50
```

Look at the last line. A machine with 32 cores is expensive to keep, but if your job needs it for three hours, you pay for three hours and switch it off. Buying that machine would cost thousands up front. This is the main promise of the cloud: you pay for the time you use, not for the machine.

### 3. Scale with the load

```python title="scale.py"
import math

# made-up requests per hour over one day, from midnight to 23:00
load = [200, 150, 100, 100, 100, 200, 500, 1200, 2500, 3000, 3200, 3000,
        3500, 3300, 3000, 2800, 2600, 2500, 2400, 2200, 1500, 900, 500, 300]
capacity = 1000              # requests one server handles in an hour

servers = [math.ceil(n / capacity) for n in load]
fixed = max(servers) * len(load)     # enough servers for the peak, all day
elastic = sum(servers)               # only as many as each hour needs
print("servers per hour:", servers)
print("server-hours, fixed:  ", fixed)
print("server-hours, elastic:", elastic)
```

```bash
python3 scale.py
```

```output
servers per hour: [1, 1, 1, 1, 1, 1, 1, 2, 3, 3, 4, 3, 4, 4, 3, 3, 3, 3, 3, 3, 2, 1, 1, 1]
server-hours, fixed:   96
server-hours, elastic: 53
```

`math.ceil` rounds up, because you cannot run 2.5 servers. A shop that owns its machines must buy enough for the busiest hour, so four servers run all day long. In the cloud, the number can follow the load: that is what **elastic** means, and adding and removing servers automatically is called **autoscaling**. Here it needs 53 server-hours instead of 96, a little more than half.

### 4. Find the speed limit of distance

```python title="distance.py"
FIBRE_KM_PER_S = 200_000     # light in glass fibre: about two thirds of its speed in vacuum

for km in (50, 500, 2000, 10000):
    round_trip_ms = 2 * km / FIBRE_KM_PER_S * 1000
    print(f"{km:>6} km away: at least {round_trip_ms:5.1f} ms per round trip")
```

```bash
python3 distance.py
```

```output
    50 km away: at least   0.5 ms per round trip
   500 km away: at least   5.0 ms per round trip
  2000 km away: at least  20.0 ms per round trip
 10000 km away: at least 100.0 ms per round trip
```

A request has to go to the data centre and the answer has to come back, and nothing travels faster than light. Real cables do not run in straight lines, and every router on the way adds time, so real numbers are higher. A web page that needs 20 round trips to a region on the other side of the world waits at least two seconds for physics alone. That is why you choose a region close to your users.

## Exercise

Copy `scale.py` to `exercise.py` and change it for a smaller online shop: one server handles 400 requests an hour, and the load is the list below. Print the fixed and elastic server-hours, then the cost of each at a made-up price of 0.10 per server-hour.

```text
load = [50, 40, 30, 30, 40, 80, 200, 450, 900, 1100, 1200, 1150,
        1300, 1250, 1100, 1000, 950, 900, 850, 700, 500, 300, 150, 80]
```

<details>
<summary>Show the solution</summary>

```python title="exercise.py"
import math

load = [50, 40, 30, 30, 40, 80, 200, 450, 900, 1100, 1200, 1150,
        1300, 1250, 1100, 1000, 950, 900, 850, 700, 500, 300, 150, 80]
capacity = 400
price = 0.10

servers = [math.ceil(n / capacity) for n in load]
fixed = max(servers) * len(load)
elastic = sum(servers)
print("fixed:  ", fixed, "server-hours, cost", round(fixed * price, 2))
print("elastic:", elastic, "server-hours, cost", round(elastic * price, 2))
```

```bash
python3 exercise.py
```

```output
fixed:   96 server-hours, cost 9.6
elastic: 51 server-hours, cost 5.1
```

The busiest hour (1,300 requests) needs 4 servers, so the fixed plan is 4 × 24 = 96 server-hours. The elastic plan adds up what each hour needs. `round(..., 2)` keeps two decimals and hides the tiny rounding errors that floating-point numbers make.

</details>

## Check yourself

**1. In one sentence, what is the cloud?**

<details>
<summary>Answer</summary>

Computing power, storage and software that you rent over the internet from a provider's data centres, paying for what you use, instead of owning the machines.

</details>

**2. You rent a virtual machine and install Ubuntu and a database on it. Which service model is that, and who installs the security updates for Ubuntu?**

<details>
<summary>Answer</summary>

IaaS. In IaaS the operating system is yours, so you install its updates. The provider only looks after the hardware, the buildings and the hypervisor.

</details>

**3. Why would a company spread its servers over two availability zones?**

<details>
<summary>Answer</summary>

Each zone is a separate location, with its own data centres, power and cooling. If one zone fails, the servers in the other keep running, so the service stays up.

</details>

**4. Your users are in Algeria and your server is in a region in Australia. Why will the site feel slow, even on a fast connection?**

<details>
<summary>Answer</summary>

Distance. Every request has to cross more than 10,000 km and back, which costs over 100 ms per round trip even at the speed of light in fibre, and a page needs many round trips. A faster connection gives more bandwidth but cannot beat that delay.

</details>

**5. What does "elastic" mean for a cloud service?**

<details>
<summary>Answer</summary>

The amount of resources can grow and shrink with the load, for example more servers at noon and fewer at night, and you pay only for what runs.

</details>

## Common mistakes

- **Forgetting to switch things off.** Paying by the hour also means paying for every hour you forget. A test machine left running for a month costs a full month. Set a budget alert with any provider you sign up with, and delete what you no longer use.
- **Leaving storage or databases open to the internet.** "Public" is one setting away. Check who can reach every storage bucket and database you create, and keep them private unless they truly must be public.
- **Thinking the provider handles all the security.** In IaaS, an unpatched Ubuntu or a weak SSH password is your problem, not the provider's. Read the shared responsibility page of your provider.
- **Putting secret keys in code.** Cloud access keys pushed to a public repository are found by automated scanners within minutes. Keep keys out of git, as you learned with `.gitignore` in Module 2.

## Key terms

- **The cloud**: computing power, storage and software rented over the internet from a provider, paid for by use.
- **Data centre**: a building full of servers, with power, cooling and network for all of them.
- **vCPU**: a virtual CPU, the share of a real processor that a virtual machine gets.
- **Cloud instance**: one virtual machine rented from a cloud provider.
- **IaaS**: infrastructure as a service. You rent virtual machines, disks and networks and manage the rest.
- **PaaS**: platform as a service. You hand over your code and the provider runs it.
- **SaaS**: software as a service. You use a finished application over the internet.
- **Region**: a geographic area where a provider has data centres.
- **Availability zone**: one of several separate locations inside a region, each with its own data centres, power and cooling.
- **Shared responsibility model**: the split of security work between the provider (hardware, buildings, hypervisor) and the customer (what they put on top).
- **Elastic**: able to grow and shrink with the load.
- **Autoscaling**: adding and removing servers automatically as the load changes.

## Go further

- [NIST SP 800-145: The NIST Definition of Cloud Computing](https://csrc.nist.gov/pubs/sp/800/145/final): the short, official definition of the cloud and its service models, only a few pages long.
- [OWASP Cloud-Native Application Security Top 10](https://owasp.org/www-project-cloud-native-application-security-top-10/): the most common security mistakes in cloud applications.
- [Ubuntu: Public cloud](https://ubuntu.com/cloud/public-cloud): how the same Ubuntu you use in this course runs on the big cloud providers.
