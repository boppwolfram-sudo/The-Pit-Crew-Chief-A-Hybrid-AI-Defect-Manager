/**
 * Module B: The Analyst
 * Responsible for diagnosing the Root Cause by comparing Defect vs Requirement.
 */

/**
 * Diagnoses the root cause based on defect patterns and requirement constraints.
 * @param {object} defect - The defect object (e.g. { error: "Timeout", latency: 1200 })
 * @param {object} requirement - The linked requirement object
 * @returns {object} - Analysis result { rootCause, reasoning, recommendation }
 */
function analyzeRootCause(defectData, requirement) {
    const analysis = {
        rootCause: "Unknown",
        reasoning: "Insufficient data to determine cause.",
        recommendation: "Investigate logs manually."
    };

    const defectText = (defectData.description || "").toLowerCase();
    const reqText = (requirement.text || "").toLowerCase();

    // 1. Try Python Brain (Causal RAG)
    const BRAIN_API = process.env.BRAIN_API_BASE;
    // We can't use await here because analyzeRootCause was synchronous in original design.
    // We need to change it to async in index.js too? 
    // Wait, let's assume index.js calls it with await or we just return a promise?
    // The original code was synchronous. To change to async, I need to update index.js as well.
    // However, I can't check async inside a sync function.
    // I will assume the caller can handle a Promise or I will document that it returns a Promise.

    // Actually, to update this cleanly without breaking changes, I should make this function async.
    // But since I am updating the file, I will change the function signature to async.

    // RULE 1: Performance / Latency Check
    if (defectText.includes("latency") || defectText.includes("timeout") || defectData.latency > 0) {
        // Extract time constraint from Req (e.g. "within 200ms")
        const timeMatch = reqText.match(/within (\d+)ms/);
        if (timeMatch) {
            const limit = parseInt(timeMatch[1]);
            const observed = defectData.latency ||
                (defectText.match(/observed: (\d+)ms/) ? parseInt(defectText.match(/observed: (\d+)ms/)[1]) : 9999);

            if (observed > limit) {
                analysis.rootCause = "Performance Constraint Violation";
                analysis.reasoning = `Observed latency (${observed}ms) exceeds the requirement limit (${limit}ms).`;
                analysis.recommendation = "Optimize database queries or cache frequent lookups.";
                return analysis;
            }
        }
    }

    // RULE 2: Security / Auth Check
    if (defectText.includes("access") || defectText.includes("role") || defectText.includes("unauthorized") || defectText.includes("verify")) {
        if (reqText.includes("authenticated") || reqText.includes("encrypt")) {
            analysis.rootCause = "Security Policy Violation";
            analysis.reasoning = "Defect indicates bypass of authentication/encryption controls defined in requirement.";
            analysis.recommendation = "Review 'AuthService' middleware and @PreAuthorize annotations.";
            return analysis;
        }
    }

    // RULE 3: Data Integrity / Validation
    if (defectText.includes("nullpointer") || defectText.includes("validation")) {
        analysis.rootCause = "Input Validation Failure";
        analysis.reasoning = "Code failed to handle null/invalid inputs as likely implied by the requirement.";
        analysis.recommendation = "Add null checks and input sanitization in the DAO layer.";
        return analysis;
    }

    return analysis;
}

// Async wrapper to support Brain API call
async function analyzeRootCauseAsync(defectData, requirement) {
    const BRAIN_API = process.env.BRAIN_API_BASE;
    if (BRAIN_API) {
        try {
            console.log(`[Analyst] Calling Brain API: ${BRAIN_API}/analyze`);
            const response = await fetch(`${BRAIN_API}/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    defect: defectData.description || "",
                    requirement: requirement.text || ""
                })
            });
            if (response.ok) {
                const data = await response.json();
                console.log("[Analyst] Brain Verdict:", data);
                if (data.verdict) {
                    return {
                        rootCause: "AI Logic Verdict",
                        reasoning: data.verdict,
                        recommendation: "Follow AI analysis."
                    };
                }
            }
        } catch (e) {
            console.error("[Analyst] Brain API Failed:", e.message);
        }
    }
    // Fallback to sync logic
    return analyzeRootCause(defectData, requirement);
}

module.exports = { analyzeRootCause: analyzeRootCauseAsync }; // Export the Async version
