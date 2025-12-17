from flask import Flask, request, jsonify
from pit_crew_core import SMTTranslator, CausalAnalyst, TitansManager
import os

app = Flask(__name__)

# --- INITIALIZATION ---
print("🧠 Initializing Pit Crew Brain...")
train_data = [
    ("Error: Gateway Timeout 504", "System latency must be under 500ms"),
    ("TimeoutException after 5000ms", "Response time shall not exceed 500ms"),
    ("Latency warning: 1200ms", "User profile must load quickly"),
    ("SQL Integrity Constraint Violation", "Database must enforce unique IDs"),
    ("CSS Style mismatch error", "UI buttons must be blue")
]

# 1. Translator
translator = SMTTranslator()
translator.train(train_data)
print("✅ SMT Translator Ready")

# 2. Analyst
analyst = CausalAnalyst()
# Note: In a real app, we would dynamically load CSVs. 
# For this hackathon demo, we'll use the dummy_logs.csv we created.
CSV_PATH = "dummy_logs.csv"
print("✅ Causal Analyst Ready")

# 3. Manager
manager = TitansManager()
print("✅ Titans Manager Ready")

# --- ENDPOINTS ---

@app.route('/trace', methods=['POST'])
def trace():
    """
    The 'Golden Trigger' Endpoint.
    Orchestrates the full pipeline: Translate -> Analyze -> Assign.
    """
    print(f"\n🏎️  Race Started! Trace requested...")
    data = request.json
    defect = data.get('defect', '')

    # 1. Translate
    print(f"[1] SMT Translating defect: '{defect}'")
    keywords = translator.translate(defect)
    
    linked_req_str = "Unknown"
    req_text = "General Requirement"
    context_key = "General"

    # Heuristic Linking (same as /translate)
    if any(k in ['latency', 'time', '500ms', 'slow'] for k in keywords):
        linked_req_str = "Requirement-101: Max Latency < 500ms"
        req_text = "The system latency must be under 500ms."
        context_key = "Performance"
    elif any(k in ['sql', 'database', 'id'] for k in keywords):
        linked_req_str = "Requirement-102: Data Integrity"
        req_text = "Database must enforce unique IDs."
        context_key = "Database"
    
    print(f"    -> Match: {linked_req_str}")

    # 2. Analyze
    # Ensure CSV exists
    import pandas as pd
    if not os.path.exists(CSV_PATH):
         logs = {
            "timestamp": range(100),
            "latency_ms": [400] * 90 + [1200] * 10,
            "status": ["200"] * 90 + ["503"] * 10
        }
         pd.DataFrame(logs).to_csv(CSV_PATH, index=False)

    print(f"[2] Analyst Verifying Compliance...")
    verdict = analyst.analyze(defect, req_text, CSV_PATH)
    print(f"    -> Verdict: {verdict}")

    # 3. Assign
    print(f"[3] Manager Finding Expert...")
    assignee = manager.assign(context_key)
    print(f"    -> Assignee: {assignee}")
    
    print("🏁 Lap Complete.\n")

    return jsonify({
        "step_1_translation": linked_req_str,
        "step_2_analysis": verdict,
        "step_3_assignment": assignee
    })

@app.route('/translate', methods=['POST'])
def translate():
    """
    Input: { "defect": "Error code 504" }
    Output: { "keywords": ["latency", "500ms"], "link_candidate": "Requirement-101" }
    """
    data = request.json
    defect = data.get('defect', '')
    
    keywords = translator.translate(defect)
    
    # Simple Heuristic Linking
    linked_req = None
    if any(k in ['latency', 'time', '500ms', 'slow'] for k in keywords):
        linked_req = "Requirement-101: Max Latency < 500ms"
    elif any(k in ['sql', 'database', 'id'] for k in keywords):
        linked_req = "Requirement-102: Data Integrity"
        
    return jsonify({
        "keywords": keywords,
        "linked_req": linked_req
    })

@app.route('/analyze', methods=['POST'])
def analyze():
    """
    Input: { "defect": "...", "requirement": "..." }
    Output: { "verdict": "Compliance Violation..." }
    """
    data = request.json
    defect = data.get('defect', '')
    req = data.get('requirement', '')
    
    # Generate and Init dummy_logs.csv if not exists
    import pandas as pd
    if not os.path.exists(CSV_PATH):
         logs = {
            "timestamp": range(100),
            "latency_ms": [400] * 90 + [1200] * 10,
            "status": ["200"] * 90 + ["503"] * 10
        }
         pd.DataFrame(logs).to_csv(CSV_PATH, index=False)

    verdict = analyst.analyze(defect, req, CSV_PATH)
    return jsonify({"verdict": verdict})

@app.route('/assign', methods=['POST'])
def assign():
    """
    Input: { "context": "Performance" }
    Output: { "assignee": "Jane Doe" }
    """
    data = request.json
    context = data.get('context', 'General')
    
    assignee = manager.assign(context)
    return jsonify({"assignee": assignee})

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "Brain is Online 🧠"})

if __name__ == '__main__':
    print("\n🏎️  Pit Crew Brain is at the start line. Waiting for requests...")
    # Run on port 5000
    app.run(port=5000, debug=True)
