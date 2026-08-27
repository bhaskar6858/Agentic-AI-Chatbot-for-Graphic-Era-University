import os
import torch

from sentence_transformers import SentenceTransformer

from langchain_core.embeddings import Embeddings
from langchain_chroma import Chroma

from data_ingestion_pipeline.chunking import build_chunks


# =========================
# CONFIG
# =========================

pdf_path = "./knowledge_base/geu-brochure.pdf"

persist_directory = "./chroma_db"

collection_name = "graphic_era_collection"


# =========================
# DEVICE SETUP
# =========================

device = "mps" if torch.backends.mps.is_available() else "cpu"

print(f"\nDetected Device: {device}")


# =========================
# LOAD EMBEDDING MODEL
# =========================

embedding_model = SentenceTransformer(
    "BAAI/bge-base-en-v1.5",
    device=device,
    cache_folder="models/bge"
)

print(f"\nEmbedding Model Loaded on: {embedding_model.device}")


# =========================
# EMBEDDING WRAPPER
# =========================

class BGEEmbeddingWrapper(Embeddings):

    def embed_documents(self, texts: list[str]) -> list[list[float]]:

        embeddings = embedding_model.encode(
            texts,
            batch_size=32,
            normalize_embeddings=True,
            show_progress_bar=True,
            convert_to_numpy=True
        )

        return embeddings.tolist()

    def embed_query(self, query: str) -> list[float]:

        # Recommended instruction for BGE models
        instruction = (
            "Represent this question for retrieving relevant documents: "
        )

        full_query = instruction + query

        embedding = embedding_model.encode(
            full_query,
            normalize_embeddings=True,
            convert_to_numpy=True
        )

        return embedding.tolist()


# Global embedding object
embedding_function = BGEEmbeddingWrapper()


# =========================
# BUILD VECTOR STORE
# =========================

def build_vector_store():

    print("\nBuilding chunks...\n")

    documents = build_chunks(pdf_path)

    print(f"\nTotal Chunks Created: {len(documents)}")

    # delete old db if exists
    if os.path.exists(persist_directory):

        import shutil

        print("\nDeleting old vector database...\n")

        shutil.rmtree(persist_directory)

    print("\nCreating Chroma Vector Store...\n")

    vector_store = Chroma.from_documents(
        documents=documents,
        embedding=embedding_function,
        persist_directory=persist_directory,
        collection_name=collection_name
    )

    print(
        f"\nVector Store Created Successfully "
        f"with {vector_store._collection.count()} vectors"
    )

    print(f"\nPersisted at: {persist_directory}")

    return vector_store


# =========================
# LOAD VECTOR STORE
# =========================

def load_vector_store():

    if (
        not os.path.exists(persist_directory)
        or
        not os.listdir(persist_directory)
    ):

        raise ValueError(
            "Vector database not found. "
            "Run build_vector_store() first."
        )

    vector_store = Chroma(
        persist_directory=persist_directory,
        embedding_function=embedding_function,
        collection_name=collection_name
    )

    return vector_store


# =========================
# QUERY VECTOR STORE
# =========================

def query_vector_store(query: str, k: int = 3):

    vector_store = load_vector_store()

    results = vector_store.similarity_search(
        query,
        k=k
    )

    return results


# =========================
# MAIN
# =========================

if __name__ == "__main__":

    # Build if DB missing
    if (
        not os.path.exists(persist_directory)
        or
        not os.listdir(persist_directory)
    ):

        print("\nNo existing vector store found.\n")

        build_vector_store()

    else:

        print("\nVector store already exists.\n")

        vs = load_vector_store()

        print(
            f"\nLoaded Existing Vector Store "
            f"with {vs._collection.count()} vectors"
        )

    # =========================
    # TEST QUERY
    # =========================

    query = input("\nEnter Query: ")

    results = query_vector_store(query, k=3)

    print("\n========== RETRIEVED DOCUMENTS ==========\n")

    for i, r in enumerate(results):

        print(f"\nDOCUMENT {i + 1}\n")

        print(r.page_content[:1500])

        print("\n----------------------------------------\n")