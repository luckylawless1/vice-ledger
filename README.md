# Vice Ledger — GTA VI Trophy Guide & Tracker

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/luckylawless1/vice-ledger/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/luckylawless1/vice-ledger/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

**Vice Ledger** is a fully offline guide and tracker for all 55 PlayStation 5 trophies of *Grand Theft Auto VI* — 1 platinum, 2 gold, 6 silver, 46 bronze, 28 of them hidden. It is a static web app: no build step, no network requests, no accounts. Open it, hunt trophies, and your progress is saved in your browser.

Every trophy carries its official name, description and grade, a kind (story, side chains, collectibles, activities, online, crime, riddles/mystery, money, feats), a missable or watch flag where the evidence warrants one, and a guide written in our own words — **every step numbered and cited** to one of seven sources (PowerPyx, PSNProfiles, Exophase, PlayStationTrophies.org, TrueTrophies, GTABase, KeenGamer, all read 20 Nov 2026). Where the sources disagree, both versions are shown; where a trigger is not yet known, the guide says so and is flagged OPEN.

## Features

- **Header dashboard** — big earned count, progress bar, per-grade counts, per-kind completion bars, and a **Platinum Forecast**: the summed time estimates of everything you have left.
- **Evidence audit strip** — every figure (55 official · 28 hidden · steps cited · sources read · missable / watch / single-source / disagreement counts) is counted from the data file at runtime, never typed by hand.
- **Checklist of all 55** — grade medals, official descriptions, kind tags, red MISSABLE badges, +/− progress steppers for the trophies PSN counts, earned checkboxes, and a guide pane beside the list.
- **Cited guide pane** — full steps with per-step citation markers like [1][3], missable warning boxes, "sources disagree" boxes showing both claims, time and difficulty ratings, per-trophy personal notes, and the numbered source list with links.
- **Filters** — kind chips (including a Missable filter), grade filter, live search, hide-earned, and a **spoiler shield** that hides the names and descriptions of unearned story and hidden trophies until you earn them. Press `/` anywhere to jump to search; `Esc` clears it.
- **Roadmap** — seven stages to the platinum with per-stage progress and the missable/watch flags pinned where they bite. **Missables view** lists every point of no return.
- **Next Up planner** — the next trophies in roadmap order, plus the quickest wins still on the table.
- **Journey log** — every earned trophy stamped with the date it popped, in the order your run actually happened.
- **Sources view & Source Matrix** — the seven sources tabled (role, what each backs, read date, how much cites it), a "Where sources disagree" section, and a full 55 × 7 trophy-by-source citation grid with per-trophy confidence flags (OK / 1 SRC / DIFFER / OPEN).
- **Save anywhere** — progress lives in `localStorage`; Export downloads it as a JSON file, Import reads it back, Reset clears it.

## Run it

```sh
node serve.ts
# then open http://localhost:8080
```

Any static file server pointed at `app/` works just as well. For screenshots and demos the app accepts URL parameters: `?seed=13` (a lived-in demo state that never touches your real save), `?grade=silver`, `?view=roadmap|missables|planner|journey|sources|matrix`, `?spoilers=1`, `?open=<trophy id>`.

## Handing it in (make.fun)

`main.ts` copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored `buildDossier` library:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT — see `LICENSE`. The official trophy names and descriptions are PlayStation's; everything else here, guides included, is original to this repository.
