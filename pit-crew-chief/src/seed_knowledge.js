const fs = require('fs');
// const { storage } = require('@forge/api'); // Uncomment when running in Forge environment
// const OpenAI = require('openai'); // Uncomment if using direct OpenAI SDK

/**
 * seed_knowledge.js
 * 
 * This script is responsible for:
 * 1. Reading the generated 'Requirements' from the dataset.
 * 2. Generating embeddings for each Requirement description using OpenAI.
 * 3. Storing the [Embedding, ID, Text] tuple in Forge Storage (or a local mock for testing).
 * 
 * NOTE: Since this is intended for a Forge App, the actual execution might need to happen
 * inside a Forge Function (Triggers) due to Storage API access, OR using the GraphQL API externally.
 * 
 * For this hackathon setup, we will mock the "Storage" part if running locally, 
 * or print the instructions to move this logic into a `src/seed.js` file in the Forge App.
 */

const TRAINING_FILE = 'itrust_rovo_training.jsonl';

async function seedKnowledge() {
    console.log("Reading data from " + TRAINING_FILE);

    if (!fs.existsSync(TRAINING_FILE)) {
        console.error(`File ${TRAINING_FILE} not found. Run generate_data.py first.`);
        return;
    }

    const fileStream = fs.readFileSync(TRAINING_FILE, 'utf-8');
    const lines = fileStream.split('\n').filter(line => line.trim() !== '');

    console.log(`Found ${lines.length} entries.`);

    const requirements = new Map();

    // 1. Extract Unique Requirements
    for (const line of lines) {
        try {
            const entry = JSON.parse(line);
            // Extract the "assistant" message which contains the Found Linked Requirement
            const assistantMsg = entry.messages.find(m => m.role === 'assistant');

            if (assistantMsg) {
                // Regex to capture REQ-ID and Description
                // "Found Linked Requirement REQ-530: 'The system shall ensure...'"
                const match = assistantMsg.content.match(/Found Linked Requirement (REQ-\d+): '([^']+)'/);
                if (match) {
                    const reqId = match[1];
                    const reqText = match[2];
                    if (!requirements.has(reqId)) {
                        requirements.set(reqId, reqText);
                    }
                }
            }
        } catch (e) {
            console.error("Error parsing line:", e);
        }
    }

    console.log(`Extracted ${requirements.size} unique requirements.`);

    // 2. Mock Embedding and Storage (Mocking the Forge Logic)
    console.log("\n--- STARTING SIMULATED SEEDING (Forge Storage) ---\n");

    for (const [id, text] of requirements) {
        // In a real Forge app, you would call:
        // const embedding = await openai.embeddings.create({ input: text, model: "text-embedding-3-small" });
        // await storage.set(`REQ_EMBEDDING_${id}`, { vector: embedding.data[0].embedding, text: text });

        console.log(`[Mock] Generating Embedding for ${id}...`);
        console.log(`[Mock] Storing in Forge Storage: Key='REQ_EMBEDDING_${id}'`);
    }

    console.log("\n--- SEEDING COMPLETE (Simulated) ---");
    console.log("To run this for real, move this logic into your Forge App's `src` folder and use the `@forge/api` and OpenAI wrapper.");
}

if (require.main === module) {
    seedKnowledge();
}

module.exports = seedKnowledge;
