import re

# Discouraging words to filter out
DISCOURAGING_PATTERNS = [
    r"you['']?ll never",
    r"it['']?s impossible",
    r"too old",
    r"not qualified enough",
    r"hopeless",
    r"give up",
    r"can['']?t do",
    r"won['']?t work",
    r"no chance",
]

def check_response_safety(response_text: str) -> tuple[bool, str]:
    """Check if response contains harmful or discouraging language"""
    
    for pattern in DISCOURAGING_PATTERNS:
        if re.search(pattern, response_text.lower()):
            return False, f"Response contains discouraging language matching: {pattern}"
    
    # Add safety disclaimer
    disclaimer = "\n\n---\n*🤝 This is AI-generated guidance. For important career decisions, consider discussing with a career counselor or mentor.*"
    
    return True, response_text + disclaimer

def sanitize_input(user_input: str) -> str:
    """Sanitize user input to prevent injection"""
    # Remove any potential injection patterns
    sanitized = re.sub(r'[<>]', '', user_input)
    return sanitized.strip()[:500]  # Limit length