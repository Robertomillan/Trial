import csv
import tempfile
import unittest
from pathlib import Path

from build_market_data import build, number, percentile


class MarketDataTests(unittest.TestCase):
    def test_brazilian_decimal(self):
        self.assertEqual(number("12.345,67"), 12345.67)
        self.assertIsNone(number(""))

    def test_percentile(self):
        self.assertEqual(percentile([10, 20, 30, 40], .5), 25)

    def test_admissions_only_and_sample_suppression(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "CAGEDMOV202601.txt"
            with path.open("w", encoding="utf-8", newline="") as f:
                writer = csv.writer(f, delimiter=";")
                writer.writerow(["competênciamov", "saldomovimentação", "cbo2002ocupação", "uf", "salário"])
                for i in range(30):
                    writer.writerow(["202601", 1, "142410", "35", str(10000 + i * 100)])
                writer.writerow(["202601", -1, "142410", "35", "999999"])
                writer.writerow(["202501", 1, "142410", "35", "999999"])
                writer.writerow(["202601", 1, "142405", "35", "15000"])
            result, stats = build([path], 202601, 202601, 30)
            self.assertEqual(stats["admissions_valid"], 31)
            self.assertEqual(len(result["records"]), 2)
            sp = next(x for x in result["records"] if x["uf"] == "35")
            self.assertEqual(sp["cbo"], "142410")
            self.assertEqual(sp["n"], 30)
            self.assertAlmostEqual(sp["p50"], 11450)
            self.assertTrue(sp["p25"] <= sp["p50"] <= sp["p75"])


if __name__ == "__main__":
    unittest.main()
