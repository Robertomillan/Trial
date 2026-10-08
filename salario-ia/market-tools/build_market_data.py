#!/usr/bin/env python3
"""Build aggregated CLT admission-salary percentiles from official Novo CAGED MOV TXT files.

Usage:
 python3 build_market_data.py --input /path/CAGEDMOV*.txt --start 202509 --end 202608 \
   --output ../market-data.json --min-sample 30

No personal records are published. Source files are not redistributed.
The resulting percentiles describe admission salaries, NOT all employed workers.
"""
import argparse
import csv
import datetime as dt
import json
import math
import re
import unicodedata
from collections import defaultdict
from pathlib import Path


def norm(value):
    return "".join(c for c in unicodedata.normalize("NFKD", value.lower()) if not unicodedata.combining(c)).replace("_", "").replace(" ", "")


def number(raw):
    s = str(raw).strip().replace(" ", "")
    if not s:
        return None
    if "," in s:
        s = s.replace(".", "").replace(",", ".")
    try:
        x = float(s)
        return x if math.isfinite(x) else None
    except ValueError:
        return None


def percentile(sorted_values, fraction):
    idx = (len(sorted_values) - 1) * fraction
    lo = math.floor(idx)
    hi = math.ceil(idx)
    return round(sorted_values[lo] + (sorted_values[hi] - sorted_values[lo]) * (idx - lo), 2)


def build(files, start, end, min_sample):
    samples = defaultdict(list)
    stats = {"rows_read": 0, "admissions_valid": 0, "files": []}
    for path in files:
        with open(path, encoding="utf-8-sig", newline="") as file:
            reader = csv.DictReader(file, delimiter=";")
            if not reader.fieldnames:
                raise ValueError(f"Arquivo sem cabeçalho: {path}")
            names = {norm(k): k for k in reader.fieldnames}
            needed = ["competenciamov", "saldomovimentacao", "cbo2002ocupacao", "uf", "salario"]
            missing = [k for k in needed if k not in names]
            if missing:
                raise ValueError(f"{path}: colunas ausentes: {missing}")
            for row in reader:
                stats["rows_read"] += 1
                try:
                    period = int(row[names["competenciamov"]])
                    balance = int(row[names["saldomovimentacao"]])
                except (ValueError, TypeError):
                    continue
                if not (start <= period <= end and balance == 1):
                    continue
                cbo = re.sub(r"\D", "", row[names["cbo2002ocupacao"]])
                uf = re.sub(r"\D", "", row[names["uf"]])
                salary = number(row[names["salario"]])
                if len(cbo) != 6 or len(uf) != 2 or salary is None or not (0 < salary <= 1_000_000):
                    continue
                stats["admissions_valid"] += 1
                samples[(cbo, uf)].append(salary)
                samples[(cbo, "BR")].append(salary)
        stats["files"].append(path.name)
    records = []
    for (cbo, uf), values in sorted(samples.items()):
        if len(values) < min_sample:
            continue
        values.sort()
        records.append({
            "cbo": cbo, "uf": uf, "n": len(values),
            "mean": round(sum(values) / len(values), 2), "p25": percentile(values, .25), "p50": percentile(values, .5), "p75": percentile(values, .75)
        })
    return {
        "schema_version": 1,
        "source": "MTE / PDET / Novo CAGED",
        "dataset": "Salários mensalizados de admissão; apenas movimentações +1",
        "period_start": str(start), "period_end": str(end),
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "minimum_sample": min_sample,
        "limitations": "Não representa salários de todos os vínculos, remuneração total, PJ, benefícios, PLR ou senioridade. Dados MOV sem reconciliação de FOR/EXC.",
        "records": records
    }, stats


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", nargs="+", required=True, help="Arquivos TXT MOV oficiais")
    ap.add_argument("--start", type=int, required=True, help="AAAAMM")
    ap.add_argument("--end", type=int, required=True, help="AAAAMM")
    ap.add_argument("--min-sample", type=int, default=30)
    ap.add_argument("--output", default="../market-data.json")
    args = ap.parse_args()
    files = [Path(p) for p in args.input]
    if args.start > args.end or args.min_sample < 30:
        ap.error("Período inválido ou amostra mínima inferior a 30")
    result, stats = build(files, args.start, args.end, args.min_sample)
    dest = Path(args.output)
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(json.dumps(result, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(json.dumps({"output": str(dest), "groups": len(result["records"]), **stats}, ensure_ascii=False))


if __name__ == "__main__":
    main()
