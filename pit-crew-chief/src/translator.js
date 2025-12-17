const cosineSimilarity = require('compute-cosine-similarity');

/**
 * Module A: The Translator
 * Responsible for tracing Defects back to Requirements.
 */

// MOCKED Requirements Database (In a real app, this comes from Forge Storage / Vector DB)
const MOCK_REQUIREMENTS = [
    {
        id: "REQ-101",
        text: "The system shall ensure that only authenticated personnel can access the PatientDAO. All access attempts must be logged with a timestamp and user ID within 200ms."
    },
    {
        id: "REQ-102",
        text: "The system must encrypt all patient health information (PHI) at rest and in transit using AES-256."
    },
    {
        id: "REQ-103",
        text: "Prescriptions must be validated against the drug interaction database before issuance."
    },
    {
        id: "REQ-104",
        text: "Lab procedure results must be accessible to the ordering physician within 24 hours of completion."
    },
    {
        id: "REQ-105",
        text: "The system shall automatically log out users after 15 minutes of inactivity."
    }
];

// Simple Bag-of-Words Embedding (Mock for Hackathon)
function getMockEmbedding(text) {
    const vocab = ["personnel", "access", "patient", "logged", "timestamp", "200ms", "encrypt", "aes-256", "prescription", "drug", "interaction", "lab", "physician", "logout", "inactivity", "timeout", "latency", "error", "fail", "null", "pointer", "exception", "patientdao", "verify", "role", "authentication", "required", "constraint"];
    const words = text.toLowerCase().match(/\w+/g) || [];
    const vector = vocab.map(word => words.includes(word) ? 1 : 0);
    return vector;
}

/**
 * Finds the most relevant Requirement for a given Defect description.
 * @param {string} defectText - The error log or bug description.
 * @returns {object} - The matched requirement and confidence score.
 */
async function findLinkedRequirement(defectText) {
    console.log(`[Translator] Analyzing Defect: "${defectText.substring(0, 50)}..."`);

    // 1. Try Python Brain (SMT)
    const BRAIN_API = process.env.BRAIN_API_BASE;
    if (BRAIN_API) {
        try {
            console.log(`[Translator] Calling Brain API: ${BRAIN_API}/translate`);
            const response = await fetch(`${BRAIN_API}/translate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ defect: defectText })
            });

            if (response.ok) {
                const data = await response.json();
                console.log("[Translator] Brain Response:", data);
                // If Brain found a link, return it mocked as a requirement object
                if (data.linked_req) {
                    return {
                        requirement: { id: "BRAIN-REQ", text: data.linked_req },
                        confidence: 0.95,
                        method: "SMT (Python Brain)"
                    };
                }
            }
        } catch (e) {
            console.error("[Translator] Brain API Failed:", e.message);
        }
    }

    // 2. Fallback to Mock Vector Search
    const defectVector = getMockEmbedding(defectText);

    let bestMatch = null;
    let maxScore = -1;

    for (const req of MOCK_REQUIREMENTS) {
        const reqVector = getMockEmbedding(req.text);

        // Calculate Cosine Similarity
        // Note: In a real app, you'd use OpenAI embeddings here.
        // For this mock, we use simple shared vocabulary overlap.
        let score = cosineSimilarity(defectVector, reqVector);

        if (isNaN(score)) score = 0; // Handle zero-vectors

        // Boost score if explicit ID reference (Simulating "Hard Link")
        if (defectText.includes(req.id)) {
            score = 1.0;
        }

        if (score > maxScore) {
            maxScore = score;
            bestMatch = req;
        }
    }

    return {
        requirement: bestMatch,
        confidence: maxScore,
        method: maxScore === 1.0 ? "Hard Link" : "Vector Similarity (Mock)"
    };
}

module.exports = { findLinkedRequirement, MOCK_REQUIREMENTS };
