import api, { route } from "@forge/api";
import fetch from "node-fetch";

// --- CONFIGURATION ---
// 1. For OpenAI: Set 'OPENAI_API_KEY' and leave BASE_URL as default.
// 2. For Local LLM (Ollama via ngrok): 
//    Set 'LLM_API_BASE' to your ngrok url (e.g. "https://<id>.ngrok-free.app/v1")
//    and set 'LLM_MODEL' to "llama3" or "mistral".

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const LLM_API_BASE = process.env.LLM_API_BASE || "https://api.openai.com/v1";
const LLM_MODEL = process.env.LLM_MODEL || "gpt-4o";

// --- HELPER: LLM CLIENT (Universal) ---
async function callLLM(systemPrompt, userPrompt) {

  // payload compatible with OpenAI and Ollama (v1 compat mode)
  const payload = {
    model: LLM_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.2,
    stream: false
  };

  const headers = {
    "Content-Type": "application/json"
  };

  // Only add Auth if using OpenAI (Local LLMs usually don't need it)
  if (LLM_API_BASE.includes("openai.com")) {
    headers["Authorization"] = `Bearer ${OPENAI_API_KEY}`;
  }

  console.log(`[AI] Calling ${LLM_API_BASE} with model ${LLM_MODEL}`);

  const response = await fetch(`${LLM_API_BASE}/chat/completions`, {
    method: "POST",
    headers: headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`LLM API Error (${response.status}): ${text}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// --- IMPORTS FROM MODULES ---
import { findLinkedRequirement as findLinkedRequirementModule } from './translator';
import { analyzeRootCause as analyzeRootCauseModule } from './analyst';
import { findAssignee as findAssigneeModule } from './manager';

// --- MODULE A: THE TRANSLATOR (Traceability) ---
export async function findLinkedRequirement(event) {
  const defectDescription = event.defectText || event.defectDescription;
  console.log(`[Index] Delegating to Translator Module for: ${defectDescription}`);

  // Call the module (which tries Brain API first)
  const result = await findLinkedRequirementModule(defectDescription);

  // Format for Rovo
  return {
    success: true,
    linkedRequirement: result.requirement,
    confidence: result.confidence
  };
}

// --- MODULE B: THE ANALYST (Root Cause) ---
export async function analyzeRootCause(event) {
  const defectDescription = event.defectText || event.defectDescription;
  const requirementText = event.requirementText;

  console.log(`[Index] Delegating to Analyst Module`);

  // Adapt to Module signature: (defectData, requirement)
  const defectData = { description: defectDescription, latency: 0 }; // Extract latency if possible
  const requirement = { text: requirementText };

  const analysis = await analyzeRootCauseModule(defectData, requirement);

  return {
    success: true,
    analysis: `**Root Cause:** ${analysis.rootCause}\n**Reasoning:** ${analysis.reasoning}\n**Recommendation:** ${analysis.recommendation}`
  };
}

// --- MODULE C: THE MANAGER (Assignment) ---
export async function findAssignee(event) {
  const requirementId = event.reqId || event.requirementId;

  console.log(`[Index] Delegating to Manager Module for: ${requirementId}`);

  const result = await findAssigneeModule(requirementId);

  return {
    success: true,
    assigneeName: result.assignee.name,
    assigneeId: result.assignee.id, // May be 'brain_pick' or Jira ID
    rationale: result.assignee.breakdown
  };
}

// --- ROVO ACTION HANDLER ---
export async function rovoActionHandler(event, context) {
  const { action } = event;

  if (action === "find-link") {
    return await findLinkedRequirement(event.payload);
  }
  else if (action === "analyze-cause") {
    return await analyzeRootCause(event.payload);
  }
  else if (action === "recommend-assignee") {
    return await findAssignee(event.payload);
  }

  return { success: false, message: "Unknown action" };
}
