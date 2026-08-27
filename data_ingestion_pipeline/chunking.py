from typing import List

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

from data_ingestion_pipeline.data_ingestion import build_knowledge_base


def clean_text(text: str) -> str:
    # Remove excessive whitespace
    text = " ".join(text.split())
    return text


def create_text_splitter() -> RecursiveCharacterTextSplitter:

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=150,
        separators=["\n\n", "\n", " ", ""]
    )

    return splitter


def chunk_documents(
    documents: List[Document]
) -> List[Document]:

    text_splitter = create_text_splitter()

    processed_chunks: List[Document] = []

    total_pages = len(documents)

    for page_num, page in enumerate(documents):

        cleaned_text = clean_text(page.page_content)

        print(
            f"Page {page_num + 1} "
            f"text length: {len(cleaned_text.strip())}"
        )

        # Skip ONLY truly empty pages
        if not cleaned_text.strip():

            print(f"Skipping empty page {page_num + 1}")

            continue

        chunks: List[Document] = text_splitter.create_documents(
            texts=[cleaned_text],
            metadatas=[{
                **page.metadata,
                "page": page_num + 1,
                "total_pages": total_pages,
                "chunk_method": "RecursiveCharacterTextSplitter",
                "char_count": len(cleaned_text)
            }]
        )

        print(
            f"Created {len(chunks)} chunks "
            f"from page {page_num + 1}"
        )

        processed_chunks.extend(chunks)

    return processed_chunks


def build_chunks(
    pdf_path: str
) -> List[Document]:

    print("\nBuilding knowledge base...")

    documents: List[Document] = build_knowledge_base(pdf_path)

    print(f"\nLoaded {len(documents)} documents/pages")

    chunks: List[Document] = chunk_documents(documents)

    print(f"\nTotal chunks created: {len(chunks)}")

    if not chunks:
        raise ValueError(
            "No chunks were created from the PDF. "
            "Check PDF extraction."
        )

    return chunks


if __name__ == "__main__":

    pdf_path = "./knowledge_base/geu-brochure.pdf"

    chunks = build_chunks(pdf_path)

    if chunks:

        print("\nSample chunk metadata:\n")

        for key, value in chunks[0].metadata.items():
            print(f"{key}: {value}")

        print("\nSample chunk text:\n")

        print(chunks[0].page_content[:300])