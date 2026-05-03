"""Acceptance tests for sample-rag-service using Rhesis.

Creates a test set and endpoint in Rhesis, runs each prompt against the RAG
service locally, evaluates with Ollama, and writes test results to the Rhesis
database so they appear in the UI.

This uses direct HTTP calls to the Rhesis API (no SDK dependency) and runs
evaluation locally because the Rhesis worker cannot reach the local RAG
service or Ollama when running inside Docker.

Requires:
  - Rhesis running locally (docker compose up)
  - RAG service running locally (deno task start)
  - Ollama running with llama3 model pulled
  - RHESIS_API_KEY and RHESIS_BASE_URL set in environment (or .env file)

Usage:
  pip install requests
  python acceptance/run_acceptance.py
"""

import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

import requests

RAG_SERVICE_URL = os.environ.get("RAG_SERVICE_URL", "http://localhost:3000")
RHESIS_BASE_URL = os.environ.get("RHESIS_BASE_URL", "http://localhost:8080")
RHESIS_API_KEY = os.environ.get("RHESIS_API_KEY", "rh-local-token")
PROMPTS_PATH = Path(__file__).parent.parent / "test" / "prompts.json"

TEST_SET_NAME = "Sample RAG Acceptance Tests"
ENDPOINT_NAME = "Sample RAG Service"


def api_headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {RHESIS_API_KEY}",
        "Content-Type": "application/json",
    }


def api_get(path: str, params: dict | None = None) -> requests.Response:
    return requests.get(
        f"{RHESIS_BASE_URL}/{path}",
        headers=api_headers(),
        params=params,
        timeout=30,
    )


def api_post(path: str, data: dict | None = None) -> requests.Response:
    return requests.post(
        f"{RHESIS_BASE_URL}/{path}",
        headers=api_headers(),
        json=data,
        timeout=60,
    )


def api_put(path: str, data: dict) -> requests.Response:
    return requests.put(
        f"{RHESIS_BASE_URL}/{path}",
        headers=api_headers(),
        json=data,
        timeout=30,
    )


def load_prompts() -> list[dict]:
    with open(PROMPTS_PATH) as f:
        return json.load(f)


def wait_for(url: str, kind: str, timeout: int = 60) -> None:
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            if kind == "rag":
                req = urllib.request.Request(url)
                with urllib.request.urlopen(req, timeout=5) as resp:
                    if resp.status == 200:
                        return
            elif kind == "health":
                resp = requests.get(f"{url}/health", timeout=5)
                if resp.status_code == 200:
                    return
            elif kind == "auth":
                resp = requests.get(
                    f"{url}/projects/",
                    headers=api_headers(),
                    timeout=5,
                )
                if resp.status_code == 200:
                    return
                if resp.status_code in (401, 403):
                    time.sleep(3)
                    continue
        except (urllib.error.URLError, ConnectionError, OSError, requests.exceptions.RequestException):
            pass
        time.sleep(2)
    raise RuntimeError(f"{kind} not ready at {url} after {timeout}s")


def query_rag_service(prompt_text: str) -> str:
    payload = json.dumps({"prompt": prompt_text}).encode("utf-8")
    req = urllib.request.Request(
        f"{RAG_SERVICE_URL}/query",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        result = json.loads(resp.read().decode("utf-8"))
    return result.get("answer", "")


def judge_with_ollama(prompt: str, answer: str, expected: str) -> bool:
    import subprocess
    judgment_prompt = (
        "You are evaluating whether a RAG system's answer contains the key information "
        "from the expected response.\n\n"
        f"Question: {prompt}\n"
        f"Expected key information: {expected}\n"
        f"Actual answer: {answer}\n\n"
        "Does the actual answer contain the key information from the expected response? "
        "Answer only 'yes' or 'no'."
    )
    try:
        result = subprocess.run(
            ["ollama", "run", "llama3", judgment_prompt],
            capture_output=True,
            text=True,
            timeout=60,
        )
        return result.stdout.strip().lower().startswith("yes")
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return False


def find_project_id() -> str | None:
    resp = api_get("projects/")
    if resp.status_code != 200:
        return None
    items = resp.json()
    return items[0]["id"] if items else None


def find_or_create_endpoint(project_id: str | None) -> dict:
    resp = api_get("endpoints/", params={"$filter": f"name eq '{ENDPOINT_NAME}'"})
    if resp.status_code == 200:
        items = resp.json()
        if items:
            ep = items[0]
            expected_url = "http://host.docker.internal:3000/query"
            if ep.get("url") != expected_url:
                print(f"  Updating endpoint URL to {expected_url}")
                update_resp = api_put(f"endpoints/{ep['id']}", {"url": expected_url})
                if update_resp.status_code in (200, 201):
                    ep = update_resp.json()
            print(f"  Found existing endpoint: {ep['name']} ({ep['id']})")
            return ep

    data: dict = {
        "name": ENDPOINT_NAME,
        "description": "Sample RAG service for acceptance testing",
        "connection_type": "REST",
        "url": "http://host.docker.internal:3000/query",
        "method": "POST",
        "request_mapping": {"prompt": "{{ input }}"},
        "response_mapping": {"output": "answer"},
        "request_headers": {"Content-Type": "application/json"},
    }
    if project_id:
        data["project_id"] = project_id

    resp = api_post("endpoints/", data)
    if resp.status_code not in (200, 201):
        raise RuntimeError(f"Failed to create endpoint: {resp.status_code} {resp.text}")
    ep = resp.json()
    print(f"  Created endpoint: {ep['name']} ({ep['id']})")
    return ep


def find_or_create_test_set() -> dict:
    resp = api_get("test_sets/", params={"$filter": f"name eq '{TEST_SET_NAME}'"})
    if resp.status_code == 200:
        items = resp.json()
        if items:
            print(f"  Found existing test set: {items[0]['name']} ({items[0]['id']})")
            return items[0]

    prompts = load_prompts()
    tests = []
    for item in prompts:
        tests.append({
            "category": "RAG Accuracy",
            "topic": "GLOP Planet",
            "behavior": "Factual Compliance",
            "prompt": {
                "content": item["prompt"],
                "expected_response": item["expectedResponse"],
                "language_code": "en",
            },
            "test_type": "Single-Turn",
        })

    data = {
        "name": TEST_SET_NAME,
        "description": "Acceptance tests for the sample RAG service covering GLOP planet facts",
        "short_description": "RAG acceptance tests",
        "test_set_type": "Single-Turn",
        "tests": tests,
    }
    resp = api_post("test_sets/bulk", data)
    if resp.status_code not in (200, 201):
        raise RuntimeError(f"Failed to create test set: {resp.status_code} {resp.text}")
    ts = resp.json()
    print(f"  Created test set: {ts['name']} ({ts['id']}), {len(tests)} tests")
    return ts


def main() -> None:
    print("Waiting for services...")
    try:
        wait_for(RAG_SERVICE_URL, "rag")
        print("  RAG service is up")
    except RuntimeError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

    try:
        wait_for(RHESIS_BASE_URL, "health")
        print("  Rhesis backend is up")
    except RuntimeError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

    try:
        wait_for(RHESIS_BASE_URL, "auth")
        print("  Rhesis auth is ready")
    except RuntimeError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

    print("\nSetting up Rhesis resources...")
    project_id = find_project_id()
    if project_id:
        print(f"  Found project: {project_id}")

    endpoint = find_or_create_endpoint(project_id)
    test_set = find_or_create_test_set()

    print("\nRunning acceptance tests against RAG service...")
    prompts = load_prompts()
    results: list[dict] = []
    all_passed = True

    for i, item in enumerate(prompts, 1):
        prompt_text = item["prompt"]
        expected = item["expectedResponse"]
        print(f"  [{i}/{len(prompts)}] {prompt_text[:50]}...")
        answer = query_rag_service(prompt_text)
        passed = judge_with_ollama(prompt_text, answer, expected)
        if not passed:
            all_passed = False
        status = "PASS" if passed else "FAIL"
        print(f"      [{status}]")
        results.append({
            "prompt": prompt_text,
            "expected": expected,
            "actual": answer,
            "passed": passed,
        })

    passed_count = sum(1 for r in results if r["passed"])
    print(f"\n  {passed_count}/{len(results)} tests passed")

    print("\n=== Acceptance Test Results ===")
    for r in results:
        s = "PASS" if r["passed"] else "FAIL"
        print(f"  [{s}] {r['prompt']}")
        if not r["passed"]:
            print(f"    Expected: {r['expected']}")
            print(f"    Actual:   {r['actual']}")

    print("\nWriting results to Rhesis...")
    config_resp = api_post("test_configurations/", {
        "endpoint_id": endpoint["id"],
        "test_set_id": test_set["id"],
    })
    if config_resp.status_code not in (200, 201):
        print(f"  Warning: Failed to create test configuration: {config_resp.status_code}")
        print(f"  Results written only to stdout.")
        sys.exit(0 if all_passed else 1)

    config_id = config_resp.json()["id"]

    run_resp = api_post("test_runs/", {
        "test_configuration_id": config_id,
        "name": f"Acceptance Run {time.strftime('%Y-%m-%d %H:%M')}",
    })
    if run_resp.status_code not in (200, 201):
        print(f"  Warning: Failed to create test run: {run_resp.status_code}")
        print(f"  Results written only to stdout.")
        sys.exit(0 if all_passed else 1)

    run_id = run_resp.json()["id"]
    print(f"  Created test run: {run_id}")

    for r in results:
        score = 1.0 if r["passed"] else 0.0
        result_data: dict = {
            "test_configuration_id": config_id,
            "test_run_id": run_id,
            "test_output": {
                "output": r["actual"],
                "input": r["prompt"],
            },
            "test_metrics": {
                "metrics": {
                    "Acceptance Judge": {
                        "score": score,
                        "reason": f"Expected: {r['expected']}",
                        "backend": "ollama",
                        "is_successful": r["passed"],
                        "threshold": 0.5,
                    }
                },
                "execution_time": 0,
            },
        }
        result_resp = api_post("test_results/", result_data)
        if result_resp.status_code not in (200, 201):
            print(f"  Warning: Failed to create result for '{r['prompt'][:40]}...'")

    api_put(f"test_runs/{run_id}", {"status": "Completed"})
    print(f"  Wrote {len(results)} test results to Rhesis")

    frontend_url = RHESIS_BASE_URL.replace(":8080", ":3001")
    print(f"\nView results at {frontend_url}/test-runs/{run_id}")
    sys.exit(0 if all_passed else 1)


if __name__ == "__main__":
    main()