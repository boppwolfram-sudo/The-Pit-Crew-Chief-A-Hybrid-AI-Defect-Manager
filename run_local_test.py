import pandas as pd
from pit_crew_core import SMTTranslator, CausalAnalyst, TitansManager

def setup_dummy_data():
    # 1. Training Data for SMT (Defect, Requirement) - Swapped for Traceability
    training_pairs = [
        ("Error: Gateway Timeout 504", "System latency must be under 500ms"),
        ("TimeoutException after 5000ms", "Response time shall not exceed 500ms"),
        ("Latency warning: 1200ms", "User profile must load quickly"),
        ("SQL Integrity Constraint Violation", "Database must enforce unique IDs"),
        ("CSS Style mismatch error", "UI buttons must be blue")
    ]
    
    # 2. Log Data for Causal RAG (The "Approximation")
    logs = {
        "timestamp": range(100),
        "latency_ms": [400] * 90 + [1200] * 10, # 90% good, 10% bad
        "status": ["200"] * 90 + ["503"] * 10
    }
    pd.DataFrame(logs).to_csv("dummy_logs.csv", index=False)
    
    return training_pairs, "dummy_logs.csv"

def run_golden_scenario():
    print("=== 🏁 STARTING PIT CREW CHIEF LOCAL TEST 🏁 ===\n")
    
    # Setup
    train_data, csv_path = setup_dummy_data()
    
    # --- STEP 1: MODULE A (The Translator) ---
    print("\n--- TEST 1: TRANSLATOR (SMT) ---")
    translator = SMTTranslator()
    translator.train(train_data)
    
    # Input Defect
    defect_report = "Critical issue: Gateway Timeout 504 observed in logs"
    print(f"Input Defect: '{defect_report}'")
    
    # Translate Defect -> Requirement Keywords
    keywords = translator.translate(defect_report)
    print(f"Predicted Requirement Keywords: {keywords}")
    
    # Logic: If keywords contain 'latency' or 'time', we link to Performance Req
    linked_req = "Requirement-101: Max Latency < 500ms"
    if any(k in ['latency', 'time', '500ms'] for k in keywords):
        print(f"✅ LINK FOUND: {linked_req}")
    else:
        print("❌ Link Failed")
        return

    # --- STEP 2: MODULE B (The Analyst) ---
    print("\n--- TEST 2: ANALYST (Causal RAG) ---")
    analyst = CausalAnalyst()
    # It will write python code to check the CSV
    verdict = analyst.analyze(defect_report, linked_req, csv_path)
    print(f"✅ ANALYST VERDICT: {verdict}")

    # --- STEP 3: MODULE C (The Manager) ---
    print("\n--- TEST 3: MANAGER (Titans Memory) ---")
    manager = TitansManager()
    
    # We ask Titans who owns "Performance" (derived from the link)
    assignee = manager.assign("Performance")
    print(f"✅ SUGGESTED ASSIGNEE: {assignee}")

    print("\n=== 🏁 TEST COMPLETE 🏁 ===")

if __name__ == "__main__":
    run_golden_scenario()
