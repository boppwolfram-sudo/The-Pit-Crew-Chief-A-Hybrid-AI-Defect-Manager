import json
import csv
import random

# NOTE: This script mocks the conversion process for the hackathon. 
# In a real scenario, you would parse the raw SQL/XML files from the iTrust dataset.
# Here, we generate a synthetic "Gold Standard" JSONL file based on the iTrust schema
# to train/test your Rovo Agent immediately.

def generate_itrust_data(num_samples=50):
    """
    Generates synthetic Requirement-to-Defect pairs mimicking the iTrust medical dataset.
    Format: JSONL for fine-tuning or RAG ingestion.
    """
    
    data = []
    
    components = ["PatientDAO", "AuthService", "PrescriptionValidator", "LabProcedureBean"]
    error_types = ["NullPointerException", "SQLInjectionWarning", "PrivacyViolation", "TimeoutException"]
    
    for i in range(num_samples):
        # 1. Create a Requirement (The "High Resource" Language)
        req_id = f"REQ-{random.randint(100, 999)}"
        component = random.choice(components)
        
        requirement_text = (
            f"The system shall ensure that only authenticated personnel can access the {component}. "
            "All access attempts must be logged with a timestamp and user ID within 200ms."
        )
        
        # 2. Create a Matched Defect (The "Low Resource" Language)
        bug_id = f"BUG-{random.randint(4000, 9999)}"
        error = random.choice(error_types)
        
        defect_text = (
            f"Error in {component}.java: {error}. "
            f"System failed to verify user role before returning patient data. "
            f"Latency observed: {random.randint(300, 1500)}ms."
        )
        
        # 3. Create the "Analysis" (The Chain of Thought)
        analysis = (
            f"Traceability: {bug_id} links to {req_id}.\n"
            f"Root Cause: Implementation Logic. The code failed to enforce the 'authenticated personnel' constraint.\n"
            f"Assignment: Recommended for Security Team."
        )

        # Structure for Rovo / Chat Fine-Tuning
        entry = {
            "messages": [
                {"role": "system", "content": "You are The Pit Crew Chief, an AI that maps Defects to Requirements and diagnoses root causes."},
                {"role": "user", "content": f"Analyze this Defect: {defect_text}"},
                {"role": "assistant", "content": f"Found Linked Requirement {req_id}: '{requirement_text}'\n\nAnalysis: {analysis}"}
            ]
        }
        data.append(entry)

    return data

def save_to_jsonl(data, filename="itrust_rovo_training.jsonl"):
    with open(filename, 'w') as f:
        for entry in data:
            f.write(json.dumps(entry) + "\n")
    print(f"Successfully generated {len(data)} training samples in {filename}")

if __name__ == "__main__":
    # Generate the dataset
    dataset = generate_itrust_data(50)
    save_to_jsonl(dataset)
    
    # Preview one entry
    print("\nSample Data Preview:")
    print(json.dumps(dataset[0], indent=2))
