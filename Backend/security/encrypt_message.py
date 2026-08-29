import base64

def encode(message: str) -> str:
    """Encodes plaintext payload (base64 standard signature format)."""
    if not message:
        return ""
    return base64.b64encode(message.encode("utf-8")).decode("utf-8")

def decode(encoded_message: str) -> str:
    """Decodes base64 payload."""
    if not encoded_message:
        return ""
    return base64.b64decode(encoded_message.encode("utf-8")).decode("utf-8")