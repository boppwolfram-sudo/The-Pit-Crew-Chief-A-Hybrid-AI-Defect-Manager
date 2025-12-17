/**
 * Module C: The Manager
 * Responsible for assigning the fix to the best engineer.
 */

// Mock Data for "Jira History" and "Workload"
const MOCK_DEVELOPERS = {
    "dev_jane": { name: "Jane Doe", skills: ["PatientDAO", "AuthService"], load: 0.8 }, // 80% capacity
    "dev_bob": { name: "Bob Smith", skills: ["LabProcedureBean"], load: 0.4 },         // 40% capacity
    "dev_alice": { name: "Alice Jones", skills: ["PrescriptionValidator"], load: 0.2 } // 20% capacity
};

const MOCK_HISTORY = {
    "REQ-101": ["dev_jane", "dev_jane", "dev_bob"], // Jane touched it twice
    "REQ-102": ["dev_jane"],
    "REQ-103": ["dev_alice", "dev_alice"],
    "REQ-104": ["dev_bob"],
    "REQ-105": ["dev_jane"]
};

/**
 * Recommends an assignee for a given Requirement ID.
 * @param {string} reqId - The linked Requirement ID (e.g. "REQ-101")
 * @returns {object} - Recommended assignee and score details.
 */
async function findAssignee(reqId) {
    console.log(`[Manager] Finding assignee for ${reqId}...`);

    // 1. Fetch History (Who touched this Requirement?)
    // Real App: const history = await api.asApp().requestJira(route`/rest/api/3/issue/${reqId}/changelog`);
    const history = MOCK_HISTORY[reqId] || [];

    // 2. Calculate Context Score (0.0 - 1.0)
    const contextScores = {};
    history.forEach(dev => {
        contextScores[dev] = (contextScores[dev] || 0) + 1;
    });

    // Normalize Context Score
    const maxCommits = Math.max(...Object.values(contextScores), 1);

    const candidates = [];

    // 1. Try Python Brain (Titans)
    const BRAIN_API = process.env.BRAIN_API_BASE;
    if (BRAIN_API) {
        try {
            console.log(`[Manager] Calling Brain API: ${BRAIN_API}/assign`);
            // Heuristic context key based on Req ID or content
            const context = reqId.includes("101") ? "Performance" : "General";

            const response = await fetch(`${BRAIN_API}/assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ context: context })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.assignee) {
                    candidates.push({
                        id: "brain_pick",
                        name: data.assignee + " (Brain Pick)",
                        finalScore: "1.00",
                        breakdown: "Titans Neural Memory Recall"
                    });
                }
            }
        } catch (e) {
            console.error("[Manager] Brain API Failed:", e.message);
        }
    }

    for (const [devId, profile] of Object.entries(MOCK_DEVELOPERS)) {
        const rawScore = contextScores[devId] || 0;
        const historicalScore = rawScore / maxCommits; // Normalized 0-1

        // Invert Load for Availability Score (Lower load = Higher Score)
        const availabilityScore = 1.0 - profile.load;

        // Weighted Formula: (History * 0.7) + (Availability * 0.3)
        const finalScore = (historicalScore * 0.7) + (availabilityScore * 0.3);

        candidates.push({
            id: devId,
            name: profile.name,
            finalScore: finalScore.toFixed(2),
            breakdown: `History (${historicalScore.toFixed(2)}) * 0.7 + Avail (${availabilityScore.toFixed(2)}) * 0.3`
        });
    }

    // Sort by Score Descending
    candidates.sort((a, b) => b.finalScore - a.finalScore);

    const topPick = candidates[0];

    return {
        assignee: topPick,
        allCandidates: candidates
    };
}

module.exports = { findAssignee, MOCK_DEVELOPERS };
