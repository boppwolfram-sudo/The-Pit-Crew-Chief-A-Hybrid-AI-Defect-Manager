# 🏎️ The Pit Crew Chief (Codegeist 2025)
**A Hybrid AI Agent for High-Performance Defect management.**
The "Pit Crew Chief" treats software defects as "Translation Errors" between High-Level Requirements and Low-Level Implementation. It uses a **Local Python Brain** (SMT + RAG + Titans Memory) connected to **Atlassian Forge** to trace, diagnose, and assign bugs autonomously.
## 🌟 Architecture
*   **Module A (Translator):** Statistical Machine Translation (SMT) to link Defect Logs $\to$ Requirement Text.
*   **Module B (Analyst):** Causal RAG (Python Code Gen) to verify logs against performance constraints.
*   **Module C (Manager):** Titans Neural Memory to assign fixes based on historical ownership patterns.
*   **The Bridge:** A local Flask server exposed via `ngrok` to the Atlassian Forge Cloud App.
---
## 🚀 Installation Guide
### Prerequisites
*   **Python 3.8+**
*   **Node.js 20+** (for Forge CLI)
*   **Ngrok** (for tunneling)
*   **Atlassian Forge CLI** (`npm install -g @forge/cli`)
### 1. Setup the Python Brain (Local)
1.  Clone the repo:
    ```bash
    git clone https://github.com/Start-Atlassian-Codegeist/The-Pit-Crew-Chief.git
    cd The-Pit-Crew-Chief
    ```
2.  Create Virtual Environment:
    ```bash
    python -m venv venv
    .\venv\Scripts\activate   # Windows
    # source venv/bin/activate # Mac/Linux
    ```
3.  Install Dependencies:
    ```bash
    pip install flask pandas requests csv
    ```
### 2. Setup the Forge App (Cloud)
1.  Navigate to app folder:
    ```bash
    cd pit-crew-chief
    ```
2.  Install & Deploy:
    ```bash
    npm install
    forge deploy
    forge install
    ```
    *(Select your Jira site when prompted)*
---
## 🏁 Running the Demo (The "Golden Trigger")
This project is optimized for a **3-Terminal Local Demo**.
### Terminal 1: The Brain (Python Server)
Start the logic engine. It listens on Port 5000.
```bash
python brain_server.py
# Output: 🏎️ Pit Crew Brain is at the start line...
```
### Terminal 2: The Bridge (Ngrok)
Expose your local brain to the internet (or just leave it running for Rovo).
```bash
ngrok http 5000
```
### Terminal 3: The Trigger (Simulation)
Simulate a "Defect Event" (e.g., from a CI/CD pipeline or Jira webhook) by hitting the `/trace` endpoint.
**PowerShell Command:**
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/trace" -Method Post -Headers @{"Content-Type"="application/json"} -Body '{"defect": "Critical latency timeout 504 error observed in checkout logs"}'
```
---
## 📊 Expected Output
**Terminal 1** will light up with the AI's thought process:
```text
🏎️  Race Started! Trace requested...
[1] SMT Translating defect: 'Critical latency timeout...'
    -> Match: Requirement-101: Max Latency < 500ms
[2] Analyst Verifying Compliance...
    -> Verdict: Compliance Violation: Observed 1200ms > Limit 500ms
[3] Manager Finding Expert...
    -> Assignee: Jane Doe
🏁 Lap Complete.
```
