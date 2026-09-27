from io import BytesIO

import pytesseract
from PIL import Image


def extract_text_from_image(content: bytes) -> str:
    image = Image.open(BytesIO(content))
    text = pytesseract.image_to_string(image)

    return text.strip()
