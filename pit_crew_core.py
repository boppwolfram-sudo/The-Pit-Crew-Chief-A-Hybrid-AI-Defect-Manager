import re
import math
import json
import pandas as pd
import requests
import io
import contextlib
from collections import defaultdict, Counter

# --- CONFIGURATION ---
# Set your OpenAI Key here or in environment variables
import os
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
TITANS_URL = "http://localhost:3000"  # Assuming mcp-titan is running

# --- MODULE A: THE TRANSLATOR (SMT) ---
class SMTTranslator:
    """
    Statistical Machine Translation (IBM Model 1 inspired)
    to translate 'Requirement Language' <-> 'Defect Language'
    """
    def __init__(self):
        self.lex_prob = defaultdict(lambda: defaultdict(float))
        self.stops = {"the", "a", "is", "of", "to", "in", "for", "system"}

    def normalize(self, text):
        text = re.sub(r"([.,!?;:])", r" \1 ", str(text).lower())
        return [w for w in text.split() if w not in self.stops]

    def train(self, pairs):
        """
        pairs: List of (Requirement_Text, Defect_Text)
        """
        print(f"[A] Training SMT on {len(pairs)} pairs...")
        # Simple Co-occurrence training (Dice Coefficient for hackathon speed)
        cooccur = defaultdict(int)
        src_counts = defaultdict(int)
        tgt_counts = defaultdict(int)

        for src, tgt in pairs:
            s_toks = set(self.normalize(src))
            t_toks = set(self.normalize(tgt))
            for sw in s_toks: src_counts[sw] += 1
            for tw in t_toks: tgt_counts[tw] += 1
            for sw in s_toks:
                for tw in t_toks:
                    cooccur[(sw, tw)] += 1
        
        for (sw, tw), count in cooccur.items():
            # Calculate P(tgt|src)
            prob = (2.0 * count) / (src_counts[sw] + tgt_counts[tw])
            if prob > 0.1: # Threshold
                self.lex_prob[sw][tw] = prob

    def translate(self, text):
        toks = self.normalize(text)
        guesses = Counter()
        
        for w in toks:
            translations = self.lex_prob.get(w, {})
            for t_word, prob in translations.items():
                guesses[t_word] += prob
        
        # Return top 3 keywords
        return [w for w, p in guesses.most_common(3)]

# --- MODULE B: THE ANALYST (Causal RAG via Python) ---
class CausalAnalyst:
    """
    Generates and Executes Python Code to find facts.
    """
    def __init__(self):
        pass

    def analyze(self, defect_context, requirement_text, csv_path):
        print(f"[B] Analyzing Defect using Causal RAG...")
        
        # 1. Ask LLM to write code
        system_prompt = (
            "You are a Data Analyst. Write Python pandas code to analyze the provided CSV file. "
            "Calculate metrics relevant to the Requirement. "
            "The CSV is loaded into dataframe 'df'. "
            "PRINT the final result using print(). Do not generate markdown."
        )
        user_prompt = f"Requirement: {requirement_text}\nContext: {defect_context}\nCSV File: {csv_path}"
        
        # Simulate LLM Code Gen (Mocking OpenAI call for stability in local test)
        # In real app: call_openai(system_prompt, user_prompt)
        print("    -> LLM Generating Code...")
        generated_code = f"""
# AI Generated Code
p99_latency = df['latency_ms'].quantile(0.99)
print(f"P99 Latency: {{p99_latency:.2f}}ms")
"""
        print(f"    -> Generated:\n{generated_code}")

        # 2. Execute Code
        try:
            df = pd.read_csv(csv_path)
            output_capture = io.StringIO()
            with contextlib.redirect_stdout(output_capture):
                exec(generated_code, {'df': df, 'pd': pd})
            
            fact = output_capture.getvalue().strip()
            print(f"    -> Execution Result: {fact}")
            
            # 3. Consultant Logic (Comparison)
            # Simple logic for demo: Extract number and compare
            metric = float(re.search(r"(\d+\.\d+)", fact).group(1))
            limit = 500 # extracted from Req text
            if metric > limit:
                return f"Compliance Violation: Observed {metric}ms > Limit {limit}ms"
            return "Compliance OK"

        except Exception as e:
            return f"Analysis Failed: {str(e)}"

# --- MODULE C: THE MANAGER (Titans Memory) ---
class TitansManager:
    """
    Connects to the henryhawke/mcp-titan server
    """
    def assign(self, context_key):
        print(f"[C] Querying Titans Memory for '{context_key}'...")
        # In a real run, this hits the local API: http://localhost:3000/recall
        # Here we mock the behavior of "Learning"
        
        # Simulating a stored pattern
        memory_db = {
            "Performance": "Jane Doe (High Affinity for Latency bugs)",
            "UI": "John Smith (Owner of Frontend)",
            "Security": "Mike Ross (Security Lead)"
        }
        
        return memory_db.get(context_key, "Unassigned")
