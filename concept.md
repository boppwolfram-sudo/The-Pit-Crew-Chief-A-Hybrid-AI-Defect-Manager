# The Pit Crew Chief: A Hybrid AI Defect Manager

**Codegeist 2025 Submission - Atlassian Williams Racing Edition**

## 1. Executive Summary

In high-performance racing, a mechanical failure isn't just bad luck; it's a breakdown in the process. The same applies to software. "The Pit Crew Chief" is an AI Agent that treats Defects not as isolated incidents, but as "Translation Errors" between High-Level Requirements and Low-Level Implementation.

Unlike standard RAG chatbots that simply summarize Jira tickets, this agent acts as a Translator, Analyst, and Manager to autonomously:

*   **Trace** defects back to their originating requirement using **Statistical Machine Translation (SMT)**.
*   **Diagnose** the root cause using **Causal Logic (Python Code Gen)**.
*   **Assign** the fix to the most qualified engineer using **Neural Memory**.

## 2. The Core Philosophy: "Bugs are a Foreign Language"

We frame Defect Management as a Machine Translation problem, inspired by the **MMLoSo (Multi-Modal Models for Low-Resource Contexts)** Challenge.

*   **High-Resource Language:** Requirements (Jira Stories). Abundant, structured, "Human-Readable."
*   **Low-Resource Language:** Defects (Logs, Error Codes). Scarce, cryptic, "Machine-Readable."

**The Mission:** To build a Unified Translation Model that aligns these two worlds using Statistical Machine Translation (SMT), treating "Latency Requirement" and "TimeoutException" as synonymous concepts in different languages.

## 3. Architecture Overview

Our system is a Hybrid Agent composed of three specialized independent modules.

### Module A: The Translator (Traceability)

*   **Goal:** Rebuild missing links between Defects and Requirements.
*   **Technology:** **Statistical Machine Translation (MMLoSo SMT)**.
    *   We use an IBM Model 1 approach (Dice Coefficient + EM Algorithm) to learn a probabilistic lexicon.
    *   It learns that the word "Latency" in a Requirement statistically correlates with "504 Gateway Timeout" in a Defect Log.
*   **Benefit:** Works on small datasets ("Low Resource") where Deep Learning fails.
*   **Data Strategy:** Pre-trained on SEOSS 33 (Hibernate Project) to learn general open-source code/issue translation patterns.

### Module B: The Analyst (Root Cause)

*   **Goal:** Diagnose why the defect occurred using hard data.
*   **Technology:** **Causal RAG (Python/Pandas Approach)**.
    *   **Step 1: Code Gen:** The Agent generates Python (Pandas) code to extract facts from the defect data (e.g., "Calculate p99 latency from logs").
    *   **Step 2: Execution:** The code runs in a sandbox to get the exact number (e.g., "1200ms").
    *   **Step 3: Consultant:** A secondary LLM compares the Fact (1200ms) vs. the Requirement (<500ms) to output a verdict ("Compliance Violation").
*   **Data Strategy:** Fine-tuned on iTrust/LibEST (Safety-Critical datasets) to learn strict compliance logic.

### Module C: The Manager (Assignment)

*   **Goal:** Assign the fix to the "Context Owner."
*   **Technology:** **Titans Neural Memory (mcp-titan)**.
    *   **Mechanism:** It uses a **Surprise Metric** to learn team patterns over time.
    *   **Process:** It watches the project stream. It "memorizes" that "Jane fixed the last 3 billing bugs."
    *   **Recall:** When a new billing bug appears, it queries its Long-Term Memory (not just Jira history) to find the implicit owner.
*   **Data Strategy:** Validated against AIDev to distinguish between human errors and AI-generated hallucinations.

## 4. The "High-Performance" Workflow (Demo Script)

**Scenario:** A critical bug hits the "Checkout" service.

1.  **Ingestion:** The Agent receives Bug-404: "System error 503 during high load.".
2.  **Trace (The Translator):**
    *   **Action:** The SMT Model "translates" the error code 503 into Requirement language.
    *   **Translation Output:** "Predicted Source: Tax Calculation Service (Probability: 0.85)."
    *   **Link:** Links Bug-404 to Story-101.
3.  **Diagnose (The Analyst):**
    *   **Action:** Agent generates Python code to check the logs attached to Bug-404.
    *   **Execution:** `df['latency'].max()` -> 1200ms.
    *   **Insight:** "Root Cause: Performance Constraint Violation. 1200ms > 500ms limit."
4.  **Assign (The Manager):**
    *   **Action:** Agent asks Titans Memory: "Who fixes Performance Violations in Tax Service?"
    *   **Memory Recall:** "Jane Doe typically handles performance regressions."
    *   **Result:** "Assigning to Jane."

## 5. Technology Stack

*   **Platform:** Atlassian Forge (Custom UI + Rovo Agent).
*   **Translation Engine:** Custom Python SMT Class (MMLoSo adaptation).
*   **Logic Engine:** OpenAI GPT-4o (generating Python & Consulting).
*   **Memory Engine:** `henryhawke/mcp-titan` (Model Context Protocol Server).
*   **Execution:** Local Python Runtime (Tunnelled to Forge).

## 6. Why This Wins "Codegeist x Williams Racing"

*   **Traceability:** Like tracking a specific tire set in F1, we track every line of code back to its intent using translation logic.
*   **Speed:** We reduce Triage time from days to seconds using automated Python analysis.
*   **Reliability:** We don't just fix bugs; we fix the Process by identifying vague requirements and overloaded developers via Neural Memory.
