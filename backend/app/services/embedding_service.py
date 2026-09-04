from typing import Protocol

from sentence_transformers import SentenceTransformer


EMBEDDING_DIMENSION = 384
MODEL_NAME = "all-MiniLM-L6-v2"


class EmbeddingService(Protocol):
    def embed(self, text: str) -> list[float]:
        ...


class SentenceTransformerEmbeddingService:
    """Generate 384-dimensional embeddings using SentenceTransformers."""

    def __init__(self) -> None:
        self.model: SentenceTransformer | None = None

    def _get_model(self) -> SentenceTransformer:
        if self.model is None:
            self.model = SentenceTransformer(MODEL_NAME)
        return self.model

    def embed(self, text: str) -> list[float]:
        model = self._get_model()

        embedding = model.encode(
            text,
            convert_to_numpy=True,
            normalize_embeddings=True,
        )

        return embedding.tolist()


embedding_service: EmbeddingService = SentenceTransformerEmbeddingService()
