// Run this with: node test_brain.js
// Prerequisites: npm install node-fetch dotenv

require('dotenv').config();
// const fetch = require('node-fetch'); // Using native fetch in Node 24
const fs = require('fs');
const path = require('path');

// --- CONFIGURATION ---
const MEMORY_FILE = path.join(__dirname, 'titans_memory_db.json');

// Toggle between Cloud (OpenAI) and Local (Ollama/LM Studio)
const USE_LOCAL_LLM = process.env.USE_LOCAL_LLM === 'true';

// 1. Cloud Config
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const CLOUD_URL = "https://api.openai.com/v1/chat/completions";
const CLOUD_MODEL = "gpt-4o"; // Required for MMLoSo Vision

// 2. Local Config (Example: Ollama running Llama 3)
const LOCAL_URL = "http://localhost:11434/v1/chat/completions";
const LOCAL_MODEL = "llama3";

// Select Provider
const API_URL = USE_LOCAL_LLM ? LOCAL_URL : CLOUD_URL;
const MODEL = USE_LOCAL_LLM ? LOCAL_MODEL : CLOUD_MODEL;

// --- HELPER: GENERIC LLM CALL ---
async function callLLM(messages, max_tokens = 100) {
    const headers = { "Content-Type": "application/json" };
    if (!USE_LOCAL_LLM) headers["Authorization"] = `Bearer ${OPENAI_API_KEY}`;

    const payload = {
        model: MODEL,
        messages: messages,
        max_tokens: max_tokens,
        stream: false
    };

    console.log(`> 🤖 Calling AI (${USE_LOCAL_LLM ? "Local" : "Cloud"}): ${MODEL}`);

    const response = await fetch(API_URL, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(`AI API Error: ${response.statusText}`);
    const data = await response.json();
    return data.choices[0].message.content;
}

// --- 1. REAL LOCAL MEMORY (Simulating Titans) ---
// We implement a simple file-based "Long Term Memory" 
// instead of mocking the MCP server connection.
const LocalTitans = {
    load: () => {
        if (fs.existsSync(MEMORY_FILE)) {
            return JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf8'));
        }
        return { short_term: [], long_term: [] };
    },

    save: (data) => {
        fs.writeFileSync(MEMORY_FILE, JSON.stringify(data, null, 2));
    },

    remember: (fact) => {
        const db = LocalTitans.load();
        // Simulate "Surprise Metric": If it's new, add to Long Term
        if (!db.long_term.includes(fact)) {
            db.long_term.push(fact);
            LocalTitans.save(db);
            return "Stored in Long-Term Memory (High Surprise)";
        }
        return "Ignored (Low Surprise / Duplicate)";
    },

    recall: (query) => {
        const db = LocalTitans.load();
        // Simple keyword search simulation
        const keywords = query.split(" ").filter(w => w.length > 3);
        const matches = db.long_term.filter(fact =>
            keywords.some(kw => fact.toLowerCase().includes(kw.toLowerCase()))
        );
        return matches.length > 0 ? matches[0] : "No memory found.";
    }
};

async function testTitansMemory() {
    console.log("\n🧠 Testing Titans Neural Memory (Local Implementation)...");

    // Step A: Teach it
    const fact = "Fact: Developer 'Jane_Doe' is the exclusive owner of the 'Tax_Service'.";
    console.log(`> Teaching: "${fact}"`);
    const storeResult = LocalTitans.remember(fact);
    console.log(`✅ Result: ${storeResult}`);

    // Step B: Recall it
    console.log("> Recalling: 'Who owns Tax Service?'");
    const recallResult = LocalTitans.recall("Tax Service");
    console.log(`✅ Result: Retrieved '${recallResult}'`);
}

// --- 2. SIMULATE MMLoSo (The Eyes) ---
async function testMMLoSo() {
    console.log("\n👁️ Testing MMLoSo Vision...");

    if (USE_LOCAL_LLM && !MODEL.includes("llava")) {
        console.log("⚠️  WARNING: Standard Local LLMs (Llama3) cannot see images.");
        console.log("    Skipping Vision Test (requires 'llava' or GPT-4o).");
        return;
    }

    const imageUrl = "https://support.content.office.net/en-us/media/4c10fee6-e17b-4395-9275-52467d3fb333.png";
    console.log(`> Analyzing Image: ${imageUrl}`);

    const messages = [
        {
            role: "user",
            content: [
                { type: "text", text: "Read the error code and describe the UI." },
                { type: "image_url", image_url: { url: imageUrl } }
            ]
        }
    ];

    try {
        const output = await callLLM(messages);
        console.log("✅ Vision Output:", output.replace(/\n/g, " "));
    } catch (e) {
        console.error("❌ MMLoSo Failed:", e.message);
    }
}

// --- 3. SIMULATE CAUSAL GRAPH (The Logic) ---
async function testCausalLogic() {
    console.log("\n📉 Testing Causal Logic (Root Cause Analysis)...");

    const defectText = "The system latency is 1200ms.";
    const reqText = "Requirement: Max latency shall not exceed 500ms.";

    const messages = [
        { role: "system", content: "You are a Logic Engine. Compare Defect vs Requirement. If Defect > Req, output 'Compliance Violation'." },
        { role: "user", content: `Defect: ${defectText}\nReq: ${reqText}` }
    ];

    try {
        const output = await callLLM(messages);
        console.log(`✅ Logic Output: ${output}`);
    } catch (e) {
        console.error("❌ Logic Failed:", e.message);
    }
}

// --- RUN SUITE ---
(async () => {
    if (!USE_LOCAL_LLM && !OPENAI_API_KEY) {
        console.error("❌ Error: Set OPENAI_API_KEY in .env OR set USE_LOCAL_LLM=true");
        return;
    }

    await testTitansMemory();
    await testCausalLogic(); // Runs on Llama 3 or GPT-4o
    await testMMLoSo();      // Runs only if model supports vision
})();
