FROM python:3.11-slim-bookworm
ARG TORCH_VERSION=2.14.0
ARG LAYA_COMMIT=4066d5d5fbf08b66c6757ddeedbd797bd7655bc0
ENV PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PYTHONUNBUFFERED=1 \
    TORCH_DISABLE_NATIVE_JIT=1 \
    TOKENIZERS_PARALLELISM=false \
    HF_HOME=/home/laya/.cache/huggingface
RUN pip install "torch==${TORCH_VERSION}" --index-url https://download.pytorch.org/whl/cpu \
 && pip install "laya[serve] @ https://github.com/NandhaKishorM/laya/archive/${LAYA_COMMIT}.tar.gz" \
 && pip check
RUN groupadd --gid 10001 laya \
 && useradd --uid 10001 --gid laya --create-home laya \
 && mkdir -p /home/laya/.cache/huggingface \
 && chown -R laya:laya /home/laya/.cache
USER laya
WORKDIR /home/laya
CMD ["laya-serve"]
