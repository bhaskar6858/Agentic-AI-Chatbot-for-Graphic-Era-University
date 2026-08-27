from typing import List

import fitz
import pdfplumber
import pytesseract

from PIL import Image

from langchain_core.documents import Document


pdf_path = "knowledge_base/geu-brochure.pdf"


# ============================================================
# OCR TEXT EXTRACTION
# ============================================================

def load_text_and_images(path: str) -> List[Document]:

    documents: List[Document] = []

    try:

        print("\nRunning OCR extraction...\n")

        pdf = fitz.open(path)

        for page_num in range(len(pdf)):

            page = pdf.load_page(page_num)

            # Render PDF page as high-quality image
            pix = page.get_pixmap(dpi=300)

            img = Image.frombytes(
                "RGB",
                [pix.width, pix.height],
                pix.samples
            )

            # OCR extraction
            extracted_text = pytesseract.image_to_string(img)

            print(
                f"Page {page_num + 1} "
                f"OCR Length: "
                f"{len(extracted_text.strip())}"
            )

            documents.append(
                Document(
                    page_content=extracted_text,
                    metadata={
                        "source": path,
                        "page": page_num + 1,
                        "type": "ocr_page"
                    }
                )
            )

        print(f"\nLoaded {len(documents)} OCR pages")

        return documents

    except Exception as e:

        print(f"\nError loading PDF with OCR: {e}")

        return []


# ============================================================
# TABLE EXTRACTION
# ============================================================

def load_tables_from_pdf(
    pdf_path: str
) -> List[Document]:

    docs: List[Document] = []

    try:

        with pdfplumber.open(pdf_path) as pdf:

            for page_number, page in enumerate(pdf.pages):

                tables = page.extract_tables({
                    "vertical_strategy": "lines",
                    "horizontal_strategy": "lines"
                })

                for table in tables:

                    if not table:
                        continue

                    headers = table[0]

                    for row in table[1:]:

                        sentence = ", ".join(
                            f"{headers[i]}: {row[i]}"
                            for i in range(len(headers))
                            if (
                                i < len(row)
                                and headers[i]
                                and row[i]
                            )
                        )

                        docs.append(
                            Document(
                                page_content=sentence,
                                metadata={
                                    "source": pdf_path,
                                    "page": page_number + 1,
                                    "type": "table"
                                }
                            )
                        )

        print(f"\nExtracted {len(docs)} table rows")

        return docs

    except Exception as e:

        print(f"\nError extracting tables: {e}")

        return []


# ============================================================
# COMBINE DOCUMENTS
# ============================================================

def combine_documents(
    documents: List[Document],
    docs: List[Document]
) -> List[Document]:

    all_docs = documents + docs

    print(
        f"\nTotal documents after combining: "
        f"{len(all_docs)}"
    )

    return all_docs


# ============================================================
# BUILD KNOWLEDGE BASE
# ============================================================

def build_knowledge_base(
    pdf_path: str
) -> List[Document]:

    print("\nBuilding knowledge base...")

    # OCR text extraction
    text_and_image_docs = load_text_and_images(pdf_path)

    # Table extraction
    table_docs = load_tables_from_pdf(pdf_path)

    # Combine both
    all_docs = combine_documents(
        text_and_image_docs,
        table_docs
    )

    return all_docs


# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":

    documents = build_knowledge_base(pdf_path)

    print("\nExample document:\n")

    if documents:

        print(documents[0].page_content[:1000])

        print("\n-------- METADATA --------\n")

        print(documents[0].metadata)

    else:

        print("\nNo documents extracted.")