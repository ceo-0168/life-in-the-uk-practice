#!/usr/bin/env python3
"""Build data/questions.json from source/exams.json + source/corrections.json.

- Normalises whitespace (non-breaking spaces etc.).
- Gives every question a stable ID: e<exam>q<number>, e.g. "e04q09".
- Merges exact duplicates (same text, same options, same correct answers) into one question that appears
  in several exams, so coverage/accuracy aren't double-counted. Same stem with different options stays separate.
- Applies source/corrections.json (typos, explanations, handbook notes). Every correction must match the text
  it expects, otherwise the build fails: a stale or mistyped fix can never be applied silently.
- Guards ID stability: data/id-manifest.json records, per ID, how many options there are and which are correct.
  If a rebuild would change any of those (e.g. upstream data was reordered), the build stops, because users'
  saved progress is keyed by ID. Re-run with --accept-key-changes after reviewing.

Correction fields (all optional):
  text     replace the question stem
  ref      replace the explanation
  replace  [[old, new], ...] substring replacements in the stem and explanation (each pair must match)
  options  {old: new} exact option-text replacements (each must match one option)
  note     extra "Since the handbook" note shown after the explanation
"""
import json
import re
import sys
from collections import OrderedDict
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "source" / "exams.json"
CORR = ROOT / "source" / "corrections.json"
OUT = ROOT / "data" / "questions.json"
MANIFEST = ROOT / "data" / "id-manifest.json"


def clean(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "").replace(" ", " ")).strip()


def key_of(text: str) -> str:
    return re.sub(r"\W+", " ", text.lower()).strip()


def apply_corrections(questions, corrections):
    by_id = {q["id"]: q for q in questions}
    errors = []
    for qid, fix in corrections.items():
        q = by_id.get(qid)
        if q is None:
            errors.append(f"{qid}: no such question")
            continue
        for old, new in fix.get("replace", []):
            hit = False
            for field in ("text", "ref"):
                if old in q[field]:
                    q[field] = q[field].replace(old, new)
                    hit = True
            if not hit:
                errors.append(f"{qid}: replace target not found: {old!r}")
        for old, new in fix.get("options", {}).items():
            matches = [o for o in q["options"] if o["t"] == old]
            if len(matches) != 1:
                errors.append(f"{qid}: option not found (or ambiguous): {old!r}")
            else:
                matches[0]["t"] = new
        if "text" in fix:
            q["text"] = fix["text"]
        if "ref" in fix:
            q["ref"] = fix["ref"]
        if "note" in fix:
            q["note"] = fix["note"]
    return errors


def check_quality(questions):
    """Cheap guards so known defect classes can't come back."""
    problems = []
    for q in questions:
        texts = [q["text"], q["ref"]] + [o["t"] for o in q["options"]]
        for t in texts:
            if re.search(r"\s{2,}|\\'", t):
                problems.append(f"{q['id']}: stray whitespace/backslash in {t[:50]!r}")
        if q["ref"].startswith("Incorrect"):
            problems.append(f"{q['id']}: explanation starts with 'Incorrect'")
        if q["ref"] and not re.search(r"[.!?’'”\")]$", q["ref"]):
            problems.append(f"{q['id']}: explanation does not end in punctuation (truncated?): ...{q['ref'][-40:]!r}")
        if not q["text"].rstrip().endswith(("?", ":", ".", ")")) :
            problems.append(f"{q['id']}: stem has no closing punctuation: {q['text'][-40:]!r}")
        if len({key_of(o["t"]) for o in q["options"]}) != len(q["options"]):
            problems.append(f"{q['id']}: duplicate options")
    return problems


def build(accept_key_changes=False, check=False):
    raw = json.loads(SRC.read_text(encoding="utf-8"))["exams"]
    by_signature: "OrderedDict[tuple, dict]" = OrderedDict()
    questions = []

    for exam_key in sorted(raw, key=int):
        exam = int(exam_key)
        for q in raw[exam_key]:
            options = [{"t": clean(a["text"]), "c": bool(a["isCorrect"])} for a in q["answers"]]
            if not any(o["c"] for o in options):
                sys.exit(f"Exam {exam} Q{q['id']} has no correct answer")
            text = clean(q["question"])
            signature = (
                key_of(text),
                tuple(sorted((key_of(o["t"]), o["c"]) for o in options)),
            )
            where = {"exam": exam, "n": q["id"]}
            if signature in by_signature:
                by_signature[signature]["exams"].append(where)
                continue
            item = {
                "id": f"e{exam:02d}q{q['id']:02d}",
                "exams": [where],
                "text": text,
                "options": options,
                "pick": sum(o["c"] for o in options),
                "ref": clean(q["reference"]),
            }
            by_signature[signature] = item
            questions.append(item)

    # ID stability guard (computed on the raw data, before corrections)
    sigs = {q["id"]: {"n": len(q["options"]), "c": [i for i, o in enumerate(q["options"]) if o["c"]]} for q in questions}
    if MANIFEST.exists():
        old = json.loads(MANIFEST.read_text(encoding="utf-8"))
        changed = sorted(i for i in sigs if i in old and old[i] != sigs[i])
        removed = sorted(i for i in old if i not in sigs)
        if (changed or removed) and not accept_key_changes:
            sys.exit(
                "ID stability check failed: saved progress is keyed by question ID, and these IDs now point at "
                f"different answers/options: changed={changed[:10]} removed={removed[:10]}.\n"
                "Review the source change, then re-run with --accept-key-changes."
            )
    manifest_text = json.dumps(sigs, separators=(",", ":"), sort_keys=True)
    if not check:
        MANIFEST.write_text(manifest_text, encoding="utf-8")

    corrections = json.loads(CORR.read_text(encoding="utf-8")) if CORR.exists() else {}
    errors = apply_corrections(questions, corrections)
    errors += check_quality(questions)
    if errors:
        print("Build failed:\n  " + "\n  ".join(errors), file=sys.stderr)
        sys.exit(1)

    exams = sorted({w["exam"] for q in questions for w in q["exams"]})
    exam_sizes = {e: sum(1 for q in questions if any(w["exam"] == e for w in q["exams"])) for e in exams}
    out = {
        "meta": {
            "builtOn": date.today().isoformat(),
            "source": "https://github.com/DHKLeung/life-in-the-uk-test",
            "count": len(questions),
            "exams": exams,
            "examSizes": exam_sizes,
            "corrections": len(corrections),
        },
        "questions": questions,
    }
    if check:
        current = json.loads(OUT.read_text(encoding="utf-8"))
        current["meta"].pop("builtOn", None)
        fresh = json.loads(json.dumps(out))
        fresh["meta"].pop("builtOn", None)
        if current != fresh:
            sys.exit("data/questions.json is out of date: run `npm run build:data`")
        if MANIFEST.read_text(encoding="utf-8") != manifest_text:
            sys.exit("data/id-manifest.json is out of date: run `npm run build:data`")
        print("data is up to date")
        return
    OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    merged = sum(len(q["exams"]) - 1 for q in questions)
    print(f"Wrote {OUT.relative_to(ROOT)}: {len(questions)} questions, {len(exams)} exams, "
          f"{merged} duplicates merged, {len(corrections)} corrections applied")


if __name__ == "__main__":
    build(accept_key_changes="--accept-key-changes" in sys.argv, check="--check" in sys.argv)
