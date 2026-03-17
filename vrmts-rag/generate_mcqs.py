"""
Enhanced MCQ Generator for Human Anatomy Lab Manual
Generates 50-100 high-quality MCQs per lab using RAG + LLM
"""

import requests
import json
import re
import os
import time
from typing import List, Dict, Optional

# Configuration
RAG_URL = "http://127.0.0.1:8000"
OLLAMA_CHAT_URL = "http://localhost:11434/api/chat"
OLLAMA_GENERATE_URL = "http://localhost:11434/api/generate"
MODEL = "llama3.2"
MCQS_DIR = "mcqs"
TARGET_MCQS_PER_LAB = 40  # Target 40 MCQs per lab (400 total for 10 labs)

os.makedirs(MCQS_DIR, exist_ok=True)

# Lab topics for better context
LAB_TOPICS = {
    1: "Anatomical Language - body planes, directional terms, body regions, anatomical position",
    2: "Bones and Bone Markings - skeletal system, bone types, bone markings, axial and appendicular skeleton",
    3: "Spinal Cord and Spinal Nerves - spinal cord anatomy, nerve pathways, dermatomes, reflexes",
    4: "Brain and Cranial Nerves - brain regions, cranial nerves, neural pathways, meninges",
    5: "Special Senses - eye anatomy, ear anatomy, taste, smell, vision, hearing",
    6: "Muscles - muscle anatomy, muscle groups, origins, insertions, actions",
    7: "Heart and Blood Vessels - cardiac anatomy, blood vessels, circulation",
    8: "Respiratory System - lungs, airways, breathing mechanics, gas exchange",
    9: "Digestive System - GI tract, accessory organs, digestion, absorption",
    10: "Urinary and Reproductive Systems - kidneys, urinary tract, male and female reproductive anatomy"
}

# Question categories for diverse MCQs
QUESTION_CATEGORIES = [
    "definitions",
    "structure_identification",
    "function",
    "location",
    "relationships",
    "clinical_relevance",
    "comparisons",
    "procedures"
]


def call_ollama(prompt: str, max_retries: int = 3) -> str:
    """Call Ollama with retry logic."""
    for attempt in range(max_retries):
        try:
            response = requests.post(
                OLLAMA_CHAT_URL,
                json={
                    "model": MODEL,
                    "messages": [{"role": "user", "content": prompt}],
                    "stream": False,
                    "options": {
                        "temperature": 0.7,
                        "num_predict": 4000
                    }
                },
                timeout=180
            )
            
            if response.status_code == 200:
                result = response.json()
                if "message" in result and "content" in result["message"]:
                    return result["message"]["content"]
            
            # Fallback to generate API
            response = requests.post(
                OLLAMA_GENERATE_URL,
                json={
                    "model": MODEL,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.7,
                        "num_predict": 4000
                    }
                },
                timeout=180
            )
            
            if response.status_code == 200:
                return response.json().get("response", "")
                
        except Exception as e:
            print(f"  ⚠️ Attempt {attempt + 1} failed: {e}")
            time.sleep(2)
    
    return ""


def get_lab_content(lab_num: int) -> Dict:
    """Fetch all content for a specific lab from RAG server."""
    try:
        response = requests.get(f"{RAG_URL}/lab_content/{lab_num}", timeout=30)
        if response.status_code == 200:
            return response.json()
    except Exception as e:
        print(f"  ⚠️ Could not fetch lab content: {e}")
    
    # Fallback: use RAG queries
    return collect_lab_facts_via_rag(lab_num)


def collect_lab_facts_via_rag(lab_num: int) -> Dict:
    """Collect comprehensive facts about a lab using RAG queries."""
    questions = [
        f"What is Lab {lab_num} about? Give a detailed overview.",
        f"What are all the anatomical structures covered in Lab {lab_num}?",
        f"What are the key terms and definitions in Lab {lab_num}?",
        f"What are the learning objectives for Lab {lab_num}?",
        f"What lab activities are performed in Lab {lab_num}?",
        f"What anatomical features should students identify in Lab {lab_num}?",
        f"What are the important functions described in Lab {lab_num}?",
        f"What comparisons or relationships are discussed in Lab {lab_num}?",
        f"What clinical applications are mentioned in Lab {lab_num}?",
        f"List all body parts, organs, or systems in Lab {lab_num}."
    ]
    
    all_text = []
    for q in questions:
        try:
            r = requests.post(
                f"{RAG_URL}/ask",
                json={"q": q, "k": 8, "use_llm": False},
                timeout=30
            ).json()
            
            chunks = r.get("retrieved", [])
            for chunk in chunks:
                text = chunk.get("text", "")
                if text and text not in all_text:
                    all_text.append(text)
        except Exception as e:
            print(f"  ⚠️ Query failed: {e}")
            continue
    
    return {
        "lab_num": lab_num,
        "combined_text": "\n\n".join(all_text),
        "chunk_count": len(all_text)
    }


def extract_json_array(text: str) -> Optional[List[Dict]]:
    """Extract JSON array from LLM response with robust parsing."""
    if not text:
        return None
    
    # Remove markdown code blocks
    text = re.sub(r'```json\s*', '', text)
    text = re.sub(r'```\s*', '', text)
    
    # Find JSON array boundaries
    start = text.find('[')
    if start == -1:
        return None
    
    # Find matching closing bracket
    bracket_count = 0
    end = -1
    for i in range(start, len(text)):
        if text[i] == '[':
            bracket_count += 1
        elif text[i] == ']':
            bracket_count -= 1
            if bracket_count == 0:
                end = i + 1
                break
    
    if end == -1:
        end = text.rfind(']') + 1
    
    if end <= start:
        return None
    
    json_str = text[start:end]
    
    # Fix common JSON issues
    json_str = re.sub(r',\s*]', ']', json_str)  # Trailing commas in arrays
    json_str = re.sub(r',\s*}', '}', json_str)  # Trailing commas in objects
    json_str = re.sub(r'"\s*\n\s*"', '" "', json_str)  # Line breaks in strings
    json_str = json_str.replace('\n', ' ').replace('\r', ' ')  # Remove newlines
    json_str = re.sub(r'\s+', ' ', json_str)  # Normalize whitespace
    
    # Try to parse
    try:
        return json.loads(json_str)
    except json.JSONDecodeError:
        pass
    
    # Try to extract individual objects and build array
    try:
        objects = []
        obj_pattern = r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}'
        matches = re.findall(obj_pattern, json_str)
        for m in matches:
            try:
                obj = json.loads(m)
                if isinstance(obj, dict):
                    objects.append(obj)
            except:
                continue
        if objects:
            return objects
    except:
        pass
    
    return None


def generate_mcq_batch(lab_num: int, context: str, category: str, batch_num: int, count: int = 10) -> List[Dict]:
    """Generate a batch of MCQs for a specific category."""
    topic = LAB_TOPICS.get(lab_num, f"Lab {lab_num}")
    
    prompt = f"""You are an expert anatomy professor creating exam questions for Lab {lab_num}: {topic}.

CONTEXT FROM LAB MANUAL:
{context[:6000]}

TASK: Generate EXACTLY {count} multiple-choice questions focusing on "{category}".

REQUIREMENTS:
1. Each question must be based ONLY on the context provided
2. Questions should test understanding, not just memorization
3. All 4 options must be plausible (avoid obviously wrong answers)
4. Vary difficulty: mix easy, medium, and hard questions
5. Include anatomical terminology appropriately
6. correctIndex must be 0, 1, 2, or 3 (0-indexed)

OUTPUT FORMAT - Return ONLY a valid JSON array:
[
  {{
    "id": {batch_num * 10 + 1},
    "question": "Clear, well-written question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "difficulty": "easy|medium|hard",
    "category": "{category}",
    "explanation": "Brief explanation of correct answer"
  }}
]

Generate {count} questions now. Return ONLY the JSON array, no other text."""

    response = call_ollama(prompt)
    
    if not response:
        print(f"    ⚠️ Empty response for {category} batch {batch_num}")
        return []
    
    mcqs = extract_json_array(response)
    
    if not mcqs:
        print(f"    ⚠️ Could not parse JSON for {category} batch {batch_num}")
        # Try with a simpler prompt
        return generate_mcq_simple(lab_num, context, category, batch_num, count)
    
    # Validate and fix MCQs
    valid_mcqs = []
    for i, mcq in enumerate(mcqs):
        if validate_mcq(mcq):
            mcq["id"] = batch_num * 10 + i + 1
            mcq["lab"] = lab_num
            if "category" not in mcq:
                mcq["category"] = category
            valid_mcqs.append(mcq)
    
    return valid_mcqs


def generate_mcq_simple(lab_num: int, context: str, category: str, batch_num: int, count: int = 5) -> List[Dict]:
    """Simplified MCQ generation as fallback."""
    topic = LAB_TOPICS.get(lab_num, f"Lab {lab_num}")
    
    prompt = f"""Create {count} anatomy quiz questions for Lab {lab_num} ({topic}).

Context: {context[:3000]}

Return JSON array only:
[{{"id":1,"question":"...","options":["A","B","C","D"],"correctIndex":0,"category":"{category}"}}]"""

    response = call_ollama(prompt)
    mcqs = extract_json_array(response)
    
    if mcqs:
        for i, mcq in enumerate(mcqs):
            mcq["id"] = batch_num * 10 + i + 1
            mcq["lab"] = lab_num
        return [m for m in mcqs if validate_mcq(m)]
    
    return []


def validate_mcq(mcq: Dict) -> bool:
    """Validate MCQ structure."""
    required = ["question", "options", "correctIndex"]
    
    if not all(k in mcq for k in required):
        return False
    
    if not isinstance(mcq["options"], list) or len(mcq["options"]) != 4:
        return False
    
    if not isinstance(mcq["correctIndex"], int) or mcq["correctIndex"] not in [0, 1, 2, 3]:
        return False
    
    if len(mcq["question"]) < 10:
        return False
    
    return True


def remove_duplicates(mcqs: List[Dict]) -> List[Dict]:
    """Remove duplicate questions."""
    seen = set()
    unique = []
    
    for mcq in mcqs:
        # Normalize question for comparison
        q_norm = re.sub(r'\s+', ' ', mcq["question"].lower().strip())
        
        if q_norm not in seen:
            seen.add(q_norm)
            unique.append(mcq)
    
    return unique


def generate_mcqs_for_lab(lab_num: int, target_count: int = TARGET_MCQS_PER_LAB) -> List[Dict]:
    """Generate comprehensive MCQs for a single lab."""
    print(f"\n{'='*60}")
    print(f"📚 Generating MCQs for Lab {lab_num}: {LAB_TOPICS.get(lab_num, 'Unknown')}")
    print(f"{'='*60}")
    
    # Get lab content
    print("  📖 Fetching lab content...")
    content = get_lab_content(lab_num)
    context = content.get("combined_text", "")
    
    if not context:
        print(f"  ❌ No content found for Lab {lab_num}")
        return []
    
    print(f"  ✓ Retrieved {content.get('chunk_count', 0)} chunks")
    
    all_mcqs = []
    batch_num = 0
    
    # Generate MCQs in batches by category
    mcqs_per_category = max(8, target_count // len(QUESTION_CATEGORIES))
    
    for category in QUESTION_CATEGORIES:
        print(f"  🔄 Generating {category} questions...")
        
        # Generate in smaller batches for reliability
        for sub_batch in range(2):  # 2 sub-batches per category
            batch_mcqs = generate_mcq_batch(
                lab_num, 
                context, 
                category, 
                batch_num,
                count=mcqs_per_category // 2
            )
            all_mcqs.extend(batch_mcqs)
            batch_num += 1
            
            print(f"    ✓ Generated {len(batch_mcqs)} questions")
            time.sleep(1)  # Rate limiting
        
        if len(all_mcqs) >= target_count:
            break
    
    # If we need more MCQs, generate additional general ones
    while len(all_mcqs) < target_count - 10:
        print(f"  🔄 Generating additional questions ({len(all_mcqs)}/{target_count})...")
        extra = generate_mcq_batch(lab_num, context, "general", batch_num, count=10)
        all_mcqs.extend(extra)
        batch_num += 1
        time.sleep(1)
    
    # Remove duplicates and renumber
    all_mcqs = remove_duplicates(all_mcqs)
    
    for i, mcq in enumerate(all_mcqs):
        mcq["id"] = i + 1
    
    print(f"  ✅ Total unique MCQs: {len(all_mcqs)}")
    return all_mcqs


def save_mcqs(lab_num: int, mcqs: List[Dict]):
    """Save MCQs to JSON file."""
    filepath = os.path.join(MCQS_DIR, f"lab{lab_num}.json")
    
    output = {
        "lab": lab_num,
        "title": LAB_TOPICS.get(lab_num, f"Lab {lab_num}"),
        "total_questions": len(mcqs),
        "questions": mcqs
    }
    
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    
    print(f"  💾 Saved to {filepath}")


def generate_all_labs(labs: List[int] = None, min_mcqs: int = 50):
    """Generate MCQs for all specified labs."""
    if labs is None:
        labs = list(range(1, 11))  # Labs 1-10
    
    print("\n" + "="*70)
    print("🎓 HUMAN ANATOMY LAB MCQ GENERATOR")
    print("="*70)
    print(f"Target: {TARGET_MCQS_PER_LAB} MCQs per lab")
    print(f"Labs to process: {labs}")
    print("="*70)
    
    summary = {}
    
    for lab_num in labs:
        try:
            mcqs = generate_mcqs_for_lab(lab_num, TARGET_MCQS_PER_LAB)
            
            if len(mcqs) >= min_mcqs:
                save_mcqs(lab_num, mcqs)
                summary[lab_num] = len(mcqs)
            else:
                print(f"  ⚠️ Only generated {len(mcqs)} MCQs (minimum: {min_mcqs})")
                if mcqs:  # Save anyway if we have something
                    save_mcqs(lab_num, mcqs)
                    summary[lab_num] = len(mcqs)
                    
        except Exception as e:
            print(f"  ❌ Error processing Lab {lab_num}: {e}")
            summary[lab_num] = 0
    
    # Print summary
    print("\n" + "="*70)
    print("📊 GENERATION SUMMARY")
    print("="*70)
    
    total = 0
    for lab, count in sorted(summary.items()):
        status = "✅" if count >= min_mcqs else "⚠️" if count > 0 else "❌"
        print(f"  {status} Lab {lab}: {count} MCQs")
        total += count
    
    print("-"*70)
    print(f"  📝 Total MCQs generated: {total}")
    print("="*70)
    
    return summary


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Generate MCQs for Human Anatomy Labs")
    parser.add_argument("--labs", type=int, nargs="+", default=None,
                        help="Specific lab numbers to process (default: all 1-10)")
    parser.add_argument("--count", type=int, default=TARGET_MCQS_PER_LAB,
                        help=f"Target MCQs per lab (default: {TARGET_MCQS_PER_LAB})")
    
    args = parser.parse_args()
    
    if args.count:
        TARGET_MCQS_PER_LAB = args.count
    
    generate_all_labs(args.labs)
