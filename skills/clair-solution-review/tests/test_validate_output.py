import importlib.util
import unittest
from pathlib import Path

path = Path(__file__).parents[1] / "scripts" / "validate_output.py"
spec = importlib.util.spec_from_file_location("validator", path)
validator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(validator)


class ValidatorTest(unittest.TestCase):
    def test_success_and_failure(self):
        valid = {"title": "A", "verdict": "B", "confidence": 80, "summary": "C",
                 "evidence": [], "findings": [], "human_questions": [],
                 "next_actions": [], "skill_version": "1.0.0"}
        self.assertEqual(validator.validate(valid), [])
        self.assertTrue(validator.validate({"confidence": -1}))


if __name__ == "__main__":
    unittest.main()
