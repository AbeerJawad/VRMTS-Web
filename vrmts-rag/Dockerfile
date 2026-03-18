# Dockerfile for VRMTS-RAG FastAPI server
FROM python:3.10-slim

WORKDIR /app
ENV PYTHONUNBUFFERED=1

COPY requirements.txt ./
RUN pip install --default-timeout=1000 --no-cache-dir --retries 10 -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["python", "-m", "scripts.rag_server"]
