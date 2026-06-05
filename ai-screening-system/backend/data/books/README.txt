Place ML textbook PDFs here for RAG ingestion.

Recommended books (from assignment specification):
  - machine_learning_tom_mitchell.pdf
  - hundred_page_ml_book_burkov.pdf
  - ml_absolute_beginners.pdf
  - intro_ml_python.pdf
  - master_ml_algorithms_brownlee.pdf

On backend startup, all PDFs in this folder are automatically:
  1. Extracted (pdfplumber / PyPDF2)
  2. Chunked into 500-token overlapping segments
  3. Embedded via sentence-transformers (all-MiniLM-L6-v2)
  4. Stored in ChromaDB for semantic retrieval

If no PDFs are present, the system uses the embedded knowledge base as fallback.
