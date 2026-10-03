from __future__ import annotations

import hashlib
import math
import re
from collections import Counter
from typing import Protocol

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from sentence_transformers import SentenceTransformer

from app.core.config import settings


EMBEDDING_DIMENSION = 384
EMBEDDING_VERSION = "minilm-l6-v2" if settings.enable_sentence_transformers else "hash-v2"
MODEL_NAME = "all-MiniLM-L6-v2"


class EmbeddingService(Protocol):
    def embed(self, text: str) -> list[float]:
        ...


class SentenceTransformerEmbeddingService:
    """Generate 384-dimensional embeddings deterministically.

    The project may run in environments without a local model cache, so this
    service uses a stable hashing fallback to keep the API fast and testable.
    """

    def __init__(self) -> None:
        self.model: SentenceTransformer | None = None

    def _get_model(self) -> SentenceTransformer | None:
        if not settings.enable_sentence_transformers:
            return None

        if self.model is None:
            try:
                from sentence_transformers import SentenceTransformer
                self.model = SentenceTransformer(MODEL_NAME)
            except Exception:
                self.model = None
        return self.model

    def _fallback_embed(self, text: str) -> list[float]:
        tokens = re.findall(r"[a-z0-9]+", text.lower())
        if not tokens:
            tokens = ["empty"]

        counts = Counter(tokens)
        vector = [0.0] * EMBEDDING_DIMENSION
        for token, count in counts.items():
            token_hash = hashlib.sha256(token.encode("utf-8")).digest()
            seed = int.from_bytes(token_hash[:8], byteorder="big", signed=False)

            # Hash each token into a small stable set of dimensions. Using token
            # frequency here keeps semantically similar texts closer together while
            # preserving determinism without a downloaded model.
            for offset in range(2):
                dim = (seed + offset * 131) % EMBEDDING_DIMENSION
                vector[dim] += count * (1.0 + (offset * 0.35))

        norm = math.sqrt(sum(value * value for value in vector))
        if norm == 0:
            vector[0] = 1.0
            norm = 1.0

        return [value / norm for value in vector]

    def embed(self, text: str) -> list[float]:
        model = self._get_model()
        if model is not None:
            try:
                embedding = model.encode(
                    text,
                    convert_to_numpy=True,
                    normalize_embeddings=True,
                )
                values = embedding.tolist()
                if len(values) == EMBEDDING_DIMENSION:
                    return values
            except Exception:
                pass

        if settings.enable_sentence_transformers:
            raise RuntimeError("Configured embedding model is unavailable; retry after model recovery.")
        return self._fallback_embed(text)


embedding_service: EmbeddingService = SentenceTransformerEmbeddingService()
