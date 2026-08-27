from langchain_chroma import Chroma
from models.mistral import model
from traditional_rag_pipeline.vector_store import embedding_function

#loading vector store
vectorstore = Chroma(
    persist_directory="./chroma_db",
    embedding_function=embedding_function,
    collection_name="graphic_era_collection"
)

#converting vector into store retriever, this acts like an iterface to the vector store

retriever = vectorstore.as_retriever(
    search_kwargs={"k": 3}
)

#prompt template to give instrucrtions to the LLM

system_prompt= """You are domain specific chatbot designed for answering questions on Graphic Era University.
-Your knowledge base is Graphic Era University Brochure 2026.
-Use the following pieces of retrieved context to answer the question.
-Give detailed answered from the relevant chunks in the knowledge base.
-Think deep, give moderately comprehensive answers,enough to be informative without being overwhelming, yet concise enough to avoid unnecessary exhaustive minutiae. Use bullet points, if required.
-Don't say anything, which you are not sure of. Verify your generation from the knowledge base provided.
-If you don't know the answer, just say that you don't know.
-If user asks anything else other than Graphic Era University, and you don't get better context, say you're a domian specific chatbot designed to answer on Graphic Era 
-Never hallucinate, only use the context given to you to generate an answer.

Context: {context}"""

from langchain_core.prompts import ChatPromptTemplate

prompt= ChatPromptTemplate.from_messages([
    ("system", system_prompt),
    ("human", "{input}")
])


#lets ceeate a document chain
#this document chain will combine retrieved information from all the chunks, and pass it as a context to LLM

from langchain_classic.chains.combine_documents import create_stuff_documents_chain
document_chain= create_stuff_documents_chain(model, prompt)

#rag chain

from langchain_classic.chains import create_retrieval_chain
rag_chain= create_retrieval_chain(retriever, document_chain)

#rag_chain.invoke({"input": "What is the maximum TCP speed?"})

def rag(query: str):
    for chunks in rag_chain.stream({"input": query}):
        if not chunks:
            continue

        if "answer" in chunks and chunks["answer"]:
            yield chunks["answer"]

if __name__ == "__main__":
    
    while(True):
        query= input("\nYou: ")
        
        if query in ["bye"]:
            break

        print("\nFinal Answer:\n")
    
        for token in rag(query):
            print(token, end="", flush= True)