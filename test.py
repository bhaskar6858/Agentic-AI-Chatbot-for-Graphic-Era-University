from langchain_community.llms import LlamaCpp

model= LlamaCpp(
    model_path= "./models/Mistral-7B-Instruct-v0.3-Q3_K_M.gguf",
    n_gpu_layers= -1,
    n_ctx= 2048,
    verbose= False

)

while True:
    query= input("\n\nYou:")

    if query.lower() in ["bye"]:
        print("\nGoodBye")
        break
    
    print("\nAI:",end="")
    for chunks in model.stream(query):
         print(chunks, end="", flush= True)
