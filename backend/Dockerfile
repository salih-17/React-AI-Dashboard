FROM python:3.13-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install -r requirements.txt

COPY . .

ARG DATABASE_URL
ARG OPENAI_API_KEY
ENV DATABASE_URL=$DATABASE_URL
ENV OPENAI_API_KEY=$OPENAI_API_KEY

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]