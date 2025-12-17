import re
import math
import pickle
import os
from collections import defaultdict, Counter

# --- CONFIGURATION ---
# Stopwords common in Requirements (High Resource)
COMMON_STOPS = set([
    "the", "a", "an", "and", "or", "to", "of", "in", "on", "for", "is", "are", "was", "were",
    "shall", "must", "should", "will", "system", "user"
])

class DefectTranslator:
    def __init__(self):
        self.lex_prob = {}       # Word Translation Probabilities
        self.lm_data = None      # Language Model Data
        self.len_ratio = 1.0     # Length Ratio (Req vs Defect)
        
    # --- UTILITIES ---
    def normalize(self, s):
        s = str(s).lower()
        s = re.sub(r"([.,!?;:()\[\]{}\"'“”‘’|/\\\-])", r" \1 ", s) # Space out punct
        return re.sub(r"\s+", " ", s).strip()

    def tokenize(self, s):
        return self.normalize(s).split()

    # --- TRAINING (IBM Model 1 + Diagonal Alignment) ---
    def train(self, pairs, em_iter=5):
        """
        pairs: List of tuples [(Requirement_Text, Defect_Text)]
        """
        print(f"Training on {len(pairs)} pairs...")
        
        # 1. Initialize with Dice Coefficient (Co-occurrence)
        print("-> Step 1: Dice Initialization...")
        cooccur = defaultdict(int)
        src_counts = defaultdict(int)
        tgt_counts = defaultdict(int)
        
        for s, t in pairs:
            s_toks = set(self.tokenize(s))
            t_toks = set(self.tokenize(t))
            for sw in s_toks: src_counts[sw] += 1
            for tw in t_toks: tgt_counts[tw] += 1
            for sw in s_toks:
                for tw in t_toks:
                    cooccur[(sw, tw)] += 1
                    
        t_given_s = defaultdict(dict)
        for (sw, tw), count in cooccur.items():
            dice = 2.0 * count / (src_counts[sw] + tgt_counts[tw])
            if dice > 0.1: # Threshold to keep model small
                t_given_s[sw][tw] = dice

        # 2. EM Algorithm (Refining Probabilities)
        print("-> Step 2: EM Training...")
        for _ in range(em_iter):
            count = defaultdict(lambda: defaultdict(float))
            total_s = defaultdict(float)
            
            for s, t in pairs:
                s_toks = ["<NULL>"] + self.tokenize(s)
                t_toks = self.tokenize(t)
                
                for tw in t_toks:
                    z = 0.0
                    for sw in s_toks:
                        z += t_given_s.get(sw, {}).get(tw, 1e-6)
                    
                    for sw in s_toks:
                        p = t_given_s.get(sw, {}).get(tw, 1e-6) / z
                        count[sw][tw] += p
                        total_s[sw] += p
            
            # Update probabilities
            for sw, targets in count.items():
                denom = total_s[sw]
                for tw, c in targets.items():
                    t_given_s[sw][tw] = c / denom
        
        self.lex_prob = t_given_s
        
        # 3. Train Language Model (Trigram) on Target (Defects)
        print("-> Step 3: Language Model Training...")
        tgt_sents = [t for _, t in pairs]
        self.lm_data = self._train_trigram(tgt_sents)
        
        print("✅ Training Complete.")

    def _train_trigram(self, sentences):
        ngram = defaultdict(Counter)
        ctx_count = Counter()
        for s in sentences:
            toks = ["<s>", "<s>"] + self.tokenize(s) + ["</s>"]
            for i in range(2, len(toks)):
                ctx = (toks[i-2], toks[i-1])
                ngram[ctx][toks[i]] += 1
                ctx_count[ctx] += 1
        return (ngram, ctx_count)

    # --- INFERENCE (Beam Search Decoder) ---
    def translate(self, source_text):
        """
        Translates a Requirement (Source) into a predicted Defect (Target).
        """
        src_toks = self.tokenize(source_text)
        beam = [([], "<s>", "<s>", 0.0)] # (hyp, p2, p1, score)
        beam_width = 5
        
        for sw in src_toks:
            if sw in COMMON_STOPS: continue # Skip stop words
            
            candidates = self.lex_prob.get(sw, {})
            # Get top 5 translations for this word
            top_cands = sorted(candidates.items(), key=lambda x: x[1], reverse=True)[:5]
            
            new_beam = []
            for hyp, p2, p1, score in beam:
                for tw, prob in top_cands:
                    # Language Model Score
                    lm_prob = self._get_lm_score(tw, p2, p1)
                    
                    new_score = score + math.log(prob) + (0.5 * lm_prob)
                    new_hyp = hyp + [tw]
                    new_beam.append((new_hyp, p1, tw, new_score))
            
            # Prune beam
            new_beam.sort(key=lambda x: x[3], reverse=True)
            beam = new_beam[:beam_width]
            
        # Return best hypothesis
        if not beam: return ""
        best_toks = beam[0][0]
        return " ".join(best_toks)

    def _get_lm_score(self, w, p2, p1):
        if not self.lm_data: return 0.0
        ngram, ctx_count = self.lm_data
        ctx = (p2, p1)
        count = ngram[ctx][w]
        total = ctx_count[ctx]
        return math.log((count + 0.1) / (total + 1000)) # Add-k smoothing

    # --- PERSISTENCE ---
    def save(self, path):
        with open(path, 'wb') as f:
            pickle.dump(self.__dict__, f)
    
    def load(self, path):
        with open(path, 'rb') as f:
            self.__dict__ = pickle.load(f)

# --- EXAMPLE USAGE ---
if __name__ == "__main__":
    # Mock Data: (Requirement, Defect Log)
    data = [
        ("The system must verify user password", "AuthError: Invalid Credentials 401"),
        ("The checkout latency should be under 500ms", "TimeoutException: Gateway 504"),
        ("User profile image must be PNG format", "UploadFailed: Invalid MimeType"),
        ("Password must be 8 characters", "AuthError: Validation Length Failed")
    ]
    
    model = DefectTranslator()
    model.train(data)
    
    print("\n--- Test Translation ---")
    test_req = "Verify user password length"
    prediction = model.translate(test_req)
    print(f"Input Req: '{test_req}'")
    print(f"Predicted Defect: '{prediction}'")
