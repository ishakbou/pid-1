---
title: "Cheat sheet: Project launch checklist"
description: The polish checklist, the release commands, the security project method and the five-minute talk from Module 17 on one printable page.
cheatSheet: true
sidebar:
  order: 99
  label: Cheat sheet
---

## Polish checklist

| Item | How |
|---|---|
| No leftovers | `git grep -n -E 'TODO\|FIXME'` and `git ls-files \| grep -E '_old\|_copy\|\.bak$'` |
| Every check in one command | `scripts/check-all.sh`: tests, write-ups, no secret files, README links |
| Screenshots | Test account only, cropped, no tabs or tokens, under 500 KB, with alt text |
| Demo | A script writes real commands and real output to `docs/demo.txt` |
| Licence | `LICENSE` with the standard MIT text; change only the name and the year |
| README | Demo link, screenshots, how to run the checks, limits, licence |

## Release commands

| Command | What it does |
|---|---|
| `./scripts/check-all.sh > /dev/null; echo $?` | 0 means every check passed |
| `git log --all --oneline -- .env data/mylab.db` | Lists any commit that ever held these files |
| `git tag -a v1.0.0 -m "message"` | Makes an annotated tag on the current commit |
| `git tag -n` | Lists tags with their messages |
| `git describe` | Names the current commit by the nearest tag, such as `v1.0.0-1-g...` |
| `git push origin v1.0.0` | Sends a tag; `git push` alone does not |
| `git ls-remote --tags origin \| cut -f 2` | Shows which tags the remote has |
| `git log --format='- %s' -n 2` | Commit subjects as a list, raw material for release notes |

Semantic versioning, MAJOR.MINOR.PATCH: `1.0.1` fixes a bug, `1.1.0` adds a feature, `2.0.0` changes how people use the project.

## A security project

Four tests: **small** (a week of evenings), **legal** (only your own machines), **measurable** (one command shows before and after), **yours** (you can explain every line).

| Command | What it does |
|---|---|
| `sudo systemctl daemon-reload` | Reads the unit files again after a change |
| `sudo systemctl enable --now mylab-web` | Starts a service now and at every boot |
| `systemd-analyze security mylab-web \| tail -n 1` | Exposure score, 0 (limited) to 10 (may do anything) |
| `systemd-analyze verify /etc/systemd/system/mylab-web.service` | Shows lines systemd could not read |
| `systemctl show -p ProtectSystem mylab-web` | The setting really in force, not the one in the file |
| `sudo systemd-run -q --pipe --wait -p User=mylab -p ProtectSystem=strict CMD` | Runs a command under the same rules, to test them |
| `curl -s --retry 10 --retry-connrefused --retry-delay 1 URL` | Waits for a service that is still starting |

| Sandbox setting | Takes away |
|---|---|
| `User=` | Root |
| `NoNewPrivileges=yes` | Gaining rights later, for example through `sudo` |
| `ProtectSystem=strict` | Writing to the file system |
| `ProtectHome=yes` | Access to `/home` and `/root` |
| `PrivateTmp=yes` | Other programs' files in `/tmp` |
| `CapabilityBoundingSet=` | Every capability of root |

The file is not the result: measure what is in force after every change, and check that the service still works.

## The write-up

Summary, Setup, Steps, Evidence (a table: check, before, after, command), Dead ends, Limits, What I learned, How to check.

## Publishing, in order

1. Check: all checks pass, `git status` is empty, no secret in the history.
2. Push the commits, then the tag.
3. Create the release from the tag, with release notes written for a stranger.
4. Add a description and topics to the repository page.

## The five-minute talk

| Time | Part |
|---|---|
| 0:00 | Problem: one sentence |
| 0:30 | What I built |
| 1:30 | Demo, with `docs/demo.txt` as the fallback |
| 3:00 | One thing that went wrong, and how you found it |
| 4:00 | What I learned, what is next |
| 4:30 | One specific question |

Speaker notes outside the repository, under about 400 words (`wc -w`). Rehearse out loud with a timer at least twice; cut words before you cut the demo.

## Feedback

Ask specific questions: "After the first screen of the README, what does it do?", "Which step of the Quick start did not work?", "What would you improve first?" Keep the answers private and without names. Put what you will do in a "Next steps" section of the README.
