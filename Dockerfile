FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && \
    apt-get install -y libreoffice pandoc texlive-full curl gnupg && \
    apt-get clean

# Set working directory
WORKDIR /app

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend files
COPY backend/ .

# Expose Flask port
EXPOSE 5000

# Start Flask app
CMD ["flask", "run", "--host=0.0.0.0", "--port=5000"]
