#!/bin/sh
# Builds the Linux image of the practice terminal (the small real Linux that v86 runs in the reader's browser).
#
#   sh build.sh            run on a 64-bit x86 Linux with sudo, internet, cpio and zstd (the Ubuntu test lab)
#
# What it makes, in $OUT (default ~/practice-out):
#   vmlinuz      the Linux kernel of Alpine Linux's "linux-virt" package, 32-bit x86, unchanged
#   initrd.zst   the whole system as a compressed initramfs: Alpine Linux 32-bit (BusyBox, musl), Bash, nano,
#                git, Python 3, a normal user called sam, and a small init that logs sam in on the serial port
#   packages.tsv the same list as a table (name, version, license, web site, Alpine source package)
#   SOURCES.txt  the exact package list with versions (for the License page)
#
# Nothing is compiled: every program is an official Alpine Linux package, downloaded from the Alpine mirror
# and checked with Alpine's signatures by apk. The system runs from memory, so a page reload gives a fresh one.
set -eu

ALPINE_BRANCH=v3.24
MINIROOT=alpine-minirootfs-3.24.4-x86.tar.gz
MINIROOT_SHA256=df793865bf166c10acaad3a4d5d40498f9ee3f89fa405d39c7f540464fb3b0c1
MIRROR=https://dl-cdn.alpinelinux.org/alpine
# bash: the shell of Ubuntu and of the course (same prompt, same error messages, Bash scripts in lesson 1.9)
# coreutils: GNU ls, cp, mv... print exactly like Ubuntu's (BusyBox's ls pads its columns differently)
PACKAGES="bash coreutils nano git python3"
HERE=$(cd "$(dirname "$0")" && pwd)
WORK=${WORK:-$HOME/practice-build}
OUT=${OUT:-$HOME/practice-out}
R=$WORK/root

mkdir -p "$WORK" "$OUT"
cd "$WORK"

# 1. The Alpine mini root filesystem (BusyBox, musl, apk), checked against the published SHA-256
[ -f "$MINIROOT" ] || wget -q "$MIRROR/$ALPINE_BRANCH/releases/x86/$MINIROOT"
echo "$MINIROOT_SHA256  $MINIROOT" | sha256sum -c -
# REUSE=1 keeps the tree of an earlier run that stopped after step 2 (it saves the slow downloads)
if [ "${REUSE:-0}" = 1 ] && [ -x "$R/usr/bin/python3" ] && [ -d "$R/lib/apk" ]; then
  echo "Reusing the tree of the last run"
else
  sudo rm -rf "$R"
  mkdir -p "$R"
  sudo tar xzf "$MINIROOT" -C "$R"
  # 2. Add the packages. The 32-bit programs run directly on the 64-bit kernel, so apk works inside a chroot.
  sudo cp /etc/resolv.conf "$R/etc/resolv.conf"
  printf '%s\n' "$MIRROR/$ALPINE_BRANCH/main" "$MIRROR/$ALPINE_BRANCH/community" | sudo tee "$R/etc/apk/repositories" >/dev/null
  sudo chroot "$R" /sbin/apk add --no-cache $PACKAGES
fi
# The kernel: the package file of linux-virt (not installed); only the kernel and its config are taken out.
# A copy already in $WORK is used if it is there.
KAPK=$(ls "$WORK"/linux-virt-*.apk 2>/dev/null | tail -n 1)
if [ -z "$KAPK" ]; then
  sudo cp /etc/resolv.conf "$R/etc/resolv.conf"
  sudo chroot "$R" /sbin/apk fetch --no-cache -o /tmp linux-virt
  sudo cp "$R"/tmp/linux-virt-*.apk "$WORK/"
  KAPK=$(ls "$WORK"/linux-virt-*.apk | tail -n 1)
fi
rm -rf "$WORK/kernel" && mkdir -p "$WORK/kernel"
# (an .apk is a gzip tar file; tar warns about Alpine's extra headers, which is harmless)
tar xzf "$KAPK" -C "$WORK/kernel" --wildcards boot/vmlinuz-virt 'boot/config-*' 2>/dev/null || true
cp "$WORK/kernel/boot/vmlinuz-virt" "$OUT/vmlinuz"
cp "$WORK"/kernel/boot/config-* "$OUT/kernel-config.txt"

# 3. No package manager: there is no internet in the practice terminal, so apk could not do anything
sudo rm -f "$R/etc/resolv.conf" "$R"/tmp/*.apk
sudo chroot "$R" /sbin/apk del --no-cache apk-tools alpine-keys

# 4. Record exactly what is inside, from apk's database, before the database is removed:
#    SOURCES.txt (readable) and packages.tsv (name, version, license, web site, Alpine source package)
KVER=$(basename "$KAPK" .apk | sed 's/^linux-virt-//')
DB="$R/lib/apk/db/installed"
sudo awk -F: '/^P:/{p=substr($0,3)} /^V:/{v=substr($0,3)} /^L:/{l=substr($0,3)} /^U:/{u=substr($0,3)} /^o:/{o=substr($0,3)}
  /^$/{if(p!="")print p"\t"v"\t"l"\t"u"\t"o; p=v=l=u=o=""} END{if(p!="")print p"\t"v"\t"l"\t"u"\t"o}' "$DB" | sort > "$OUT/packages.tsv"
printf 'linux-virt\t%s\tGPL-2.0-only\thttps://www.kernel.org/\tlinux-lts\n' "$KVER" >> "$OUT/packages.tsv"
{
  echo "Practice terminal image, built $(date -u +%Y-%m-%d) from Alpine Linux $ALPINE_BRANCH (x86, 32-bit)."
  echo "Every package is an official, unchanged Alpine Linux package. Sources: https://pkgs.alpinelinux.org/"
  echo "(each package page links to its build recipe in aports) and https://distfiles.alpinelinux.org/"
  echo
  printf 'package\tversion\tlicense\tweb site\tAlpine source package\n'
  cat "$OUT/packages.tsv"
} > "$OUT/SOURCES.txt"

# 5. Make it a practice machine: host name, user sam, login on the serial port, prompt
echo practice | sudo tee "$R/etc/hostname" >/dev/null
printf '127.0.0.1\tlocalhost\n127.0.1.1\tpractice\n' | sudo tee "$R/etc/hosts" >/dev/null
grep -q '^sam:' "$R/etc/passwd" || sudo chroot "$R" /usr/sbin/adduser -D -s /bin/bash -g "Sam" sam
sudo chroot "$R" /bin/sh -c 'passwd -d sam >/dev/null 2>&1 || true'
# BusyBox adduser makes the home folder with the setgid bit (drwxr-sr-x), and new folders would inherit it.
# Ubuntu 24.04 makes it drwxr-x---.
sudo chmod g-s "$R/home/sam"
sudo chmod 0750 "$R/home/sam"
sudo install -m 0755 "$HERE/init" "$R/init"
sudo install -m 0755 "$HERE/rc" "$R/etc/practice-rc"
sudo install -m 0644 "$HERE/inittab" "$R/etc/inittab"
sudo install -m 0644 "$HERE/profile.sh" "$R/etc/profile.d/practice.sh"
sudo install -m 0644 "$HERE/motd" "$R/etc/motd"
sudo rm -rf "$R/var/cache/apk" "$R/lib/apk" "$R/etc/apk" "$R/usr/share/apk"
# Python compiles a module the first time it is imported. Do it now for the modules every start needs and the
# ones the course uses, so python3 starts fast in the slow emulated computer (the rest stays uncompiled, smaller).
sudo chroot "$R" /usr/bin/python3 -c 'import os, sys, re, json, csv, random, math, pathlib, collections, datetime, argparse, subprocess, shutil, string, textwrap, unittest, sqlite3, hashlib, logging, time' || true

# 6. Pack the whole tree as a newc cpio archive (the format of an initramfs), compressed with zstd
( cd "$R" && sudo find . -mindepth 1 | LC_ALL=C sort | sudo cpio -o -H newc --quiet ) > "$WORK/initrd.cpio"
zstd -q -f -T0 -19 "$WORK/initrd.cpio" -o "$OUT/initrd.zst"
sudo du -sh "$R" | sed 's/^/Unpacked system: /'
ls -l "$OUT"
