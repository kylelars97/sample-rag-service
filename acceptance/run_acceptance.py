"""Acceptance tests for sample-rag-service using Rhesis SDK.

Requires:
  - Rhesis running locally (docker compose up)
  - RAG service running locally (deno task start)
  - Ollama running with llama3 model pulled
  - RHESIS_API_KEY set in environment (or .env file)

Usage:
  pip install rhesis-sdk
  python acceptance/run_acceptance.py
"""

import json
import os
import sys
import time
from pathlib import Path

from rhesis.sdk import RhesisClient, ExecutionMode
from rhesis.sdk.entities import TestSets, Endpoints
from rhesis.sdk.models import get_model
from rhesis.sdk.synthesizers import PromptSynthesizer

RAG_SERVICE_URL = os.environ.get("RAG_SERVICE_URL", "http://localhost:3000")
PROMPTS_PATH = Path(__file__).parent.parent / "test" / "prompts.json"


def load_prompts() -> list[dict]:
    with open(PROMPTS_PATH) as f:
        return json.load(f)


def wait_for_rag_service(url: str, timeout: int = 30) -> None:
    import urllib.request
    import urllib.error
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req, timeout=5) as resp:
                if resp.status == 200:
                    return
        except (urllib.error.URLError, ConnectionError, OSError):
            pass
        time.sleep(1)
    raise RuntimeError(f"RAG service not available at {url} after {timeout}s")


def run_acceptance_tests() -> dict:
    client = RhesisClient.from_environment()

    prompts = load_prompts()
    obs_model = get_model("ollama/llama3")

    test_input_outputs: list[dict] = []
    for item in prompts:
        prompt_text = item["prompt"]
        expected = item["expectedResponse"]

        import urllib.request
        import urllib.error
        payload = json.dumps({"prompt": prompt_text}).encode("utf-8")
        req = urllib.request.Request(
            f"{RAG_SERVICE_URL}/query",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
            result = json.loads(resp.read().decode("utf-8"))

        answer = result.get("answer", "")
        test_input_outputs.append({
            "input": prompt_text,
            "output": answer,
            "expected_output": expected,
        })

    results: list[dict] = []
    all_passed = True

    for entry in test_input_outputs:
        judgment_prompt = (
            f"You are evaluating whether a RAG system's answer contains the key information "
            f"from the expected response.\n\n"
            f"Question: {entry['input']}\n"
            f"Expected key information: {entry['expected_output']}\n"
            f"Actual answer: {entry['output']}\n\n"
            f"Does the actual answer contain the key information from the expected response? "
            f"Answer only 'yes' or 'no'."
        )
        judgment = obs_model.generate(prompt=judgment_prompt).strip().lower()
        passed = judgment.startswith("yes")
        if not passed:
            all_passed = False
        results.append({
            "prompt": entry["input"],
            "expected": entry["expected_output"],
            "actual": entry["output"],
            "passed": passed,
        })

    print("\n=== Acceptance Test Results ===")
    for r in results:
        status = "PASS" if r["passed"] else "FAIL"
        print(f"[{status}] {r['prompt']}")
        if not r["passed"]:
            print(f"  Expected: {r['expected']}")
            print(f"  Actual:   {r['actual']}")

    total = len(results)
    passed = sum(1 for r in results if r["passed"])
    print(f"\n{passed}/{total} tests passed")

    return {"all_passed": all_passed, "total": total, "passed": passed, "results": results}


if __name__ == "__main__":
    try:
        wait_for_rag_service(RAG_SERVICE_URL)
    except RuntimeError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

    outcome = run_acceptance_tests()
    sys.exit(0 if outcome["all_passed"] else 1)