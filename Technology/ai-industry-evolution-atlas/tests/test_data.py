import json
import unittest
from pathlib import Path


PROJECT = Path(__file__).resolve().parents[1]


class DashboardDataTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = json.loads((PROJECT / "data" / "dashboard.json").read_text(encoding="utf-8"))

    def test_seven_unique_chronological_eras(self):
        eras = self.data["eras"]
        self.assertEqual(len(eras), 7)
        self.assertEqual(len({era["id"] for era in eras}), 7)
        self.assertEqual([era["start"] for era in eras], sorted(era["start"] for era in eras))

    def test_attention_is_era_local_and_bounded(self):
        for era in self.data["eras"]:
            self.assertGreaterEqual(len(era["attention"]), 5)
            for point in era["attention"]:
                self.assertGreaterEqual(point["normalized"], 0)
                self.assertLessEqual(point["normalized"], 1)

    def test_events_are_unique_sourced_and_shape_redundant(self):
        events = [event for era in self.data["eras"] for event in era["events"]]
        self.assertEqual(len(events), 30)
        self.assertEqual(len({event["id"] for event in events}), len(events))
        for event in events:
            self.assertTrue(event["sourceUrl"].startswith("https://"))
            expected = "filled" if event["type"] in {"breakthrough", "adoption"} else "hollow"
            self.assertEqual(event["endpoint"], expected)

    def test_partial_year_is_explicit(self):
        latest = self.data["eras"][-1]
        self.assertEqual(latest["years"], "2022–2026 H1")
        self.assertEqual(latest["attention"][-1]["label"], "2026 H1")

    def test_attention_sources_do_not_claim_one_continuous_index(self):
        sources = [era["source"] for era in self.data["eras"]]
        self.assertEqual(sources[:5], ["ngram"] * 5)
        self.assertEqual(sources[5:], ["pageviews"] * 2)
        self.assertIn("within each era only", self.data["meta"]["normalization"])


if __name__ == "__main__":
    unittest.main()
