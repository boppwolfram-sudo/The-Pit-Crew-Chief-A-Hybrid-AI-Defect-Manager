const { findLinkedRequirement } = require('./translator');

async function runTest() {
    console.log("=== Testing Module A: The Translator ===\n");

    const testCases = [
        "Error in PatientDAO: NullPointerException. System failed to verify user role.",
        "Latency observed: 1458ms in PatientDAO access.",
        "User was able to view Lab Results without authentication.",
        "REQ-103: Prescription validation failed."
    ];

    for (const test of testCases) {
        const result = await findLinkedRequirement(test);
        console.log(`\nInput: "${test}"`);
        console.log(`Match: ${result.requirement ? result.requirement.id : "None"}`);
        console.log(`Score: ${result.confidence.toFixed(2)} (${result.method})`);
        console.log(`Desc:  ${result.requirement ? result.requirement.text.substring(0, 60) + "..." : "N/A"}`);
    }
}

runTest();
