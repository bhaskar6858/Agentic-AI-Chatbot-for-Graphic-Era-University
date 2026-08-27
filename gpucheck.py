import torch
if torch.backends.mps.is_available():
    print("✅ PyTorch is using the M1 GPU (Metal)")
else:
    print("❌ PyTorch is stuck on CPU")

# If this loads without error, your C++ bindings are correct