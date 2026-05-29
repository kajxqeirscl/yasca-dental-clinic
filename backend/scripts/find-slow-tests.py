"""
Slow test bulucu — pytest --durations çıktısını parse eder, budget'i aşan testleri raporlar.

Kullanım:
    cd backend
    pytest --durations=0 -q | python scripts/find-slow-tests.py

Budget:
    Unit testleri:        <=200ms (aşan → @pytest.mark.slow)
    Integration testleri: <=2s
    E2E testleri:         <=30s (Playwright)

Output: stdout'a markdown tablo.
"""
import re
import sys

UNIT_BUDGET_MS = 200
INTEG_BUDGET_MS = 2000

# pytest --durations çıktı formatı:
#   0.45s call     api/tests/test_views.py::TestPatientCRUD::test_patient_create
PATTERN = re.compile(r"^\s*(\d+\.\d+)s\s+(call|setup|teardown)\s+(.+)$")


def parse_durations(lines):
    """List of (duration_ms, kind, test_id)."""
    rows = []
    for line in lines:
        m = PATTERN.match(line)
        if not m:
            continue
        duration_s = float(m.group(1))
        rows.append((int(duration_s * 1000), m.group(2), m.group(3).strip()))
    return rows


def classify(test_id, duration_ms):
    """Test kategorisi → budget kontrolü."""
    if "integration" in test_id.lower() or "test_views" in test_id:
        return "integration", INTEG_BUDGET_MS
    return "unit", UNIT_BUDGET_MS


def main():
    lines = sys.stdin.readlines()
    durations = parse_durations(lines)
    if not durations:
        print("Hiç test süresi bulunamadı. Komut: pytest --durations=0 -q | python scripts/find-slow-tests.py")
        sys.exit(0)

    over_budget = []
    for ms, kind, test_id in durations:
        if kind != "call":
            continue
        category, budget = classify(test_id, ms)
        if ms > budget:
            over_budget.append((ms, category, budget, test_id))

    if not over_budget:
        print("✅ Tüm testler budget içinde!")
        return

    over_budget.sort(reverse=True)
    print(f"⚠️  {len(over_budget)} test budget'i aşıyor:\n")
    print("| Süre | Kategori | Budget | Test |")
    print("|------|----------|--------|------|")
    for ms, category, budget, test_id in over_budget:
        print(f"| {ms}ms | {category} | {budget}ms | `{test_id}` |")

    print("\nÖneri: budget'i aşan unit testleri `@pytest.mark.slow` ile işaretle, ayrı CI job'da çalışsın.")


if __name__ == "__main__":
    main()
