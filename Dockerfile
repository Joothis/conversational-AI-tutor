
# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container at /app
COPY ./requirements.txt /app/requirements.txt

# Install any needed packages specified in requirements.txt
# We use --no-cache-dir to reduce image size
# And --trusted-host to avoid SSL issues in some environments
RUN pip install --no-cache-dir --upgrade -r /app/requirements.txt

# Copy the rest of the application's code into the container at /app
COPY . /app

# Run the setup for the RAG pipeline when the container launches
# This will create the initial vector store
RUN python -c 'from rag_pipeline import setup_rag_pipeline; setup_rag_pipeline()'

# Make port 8000 available to the world outside this container
EXPOSE 8000

# Define environment variable
ENV NAME World

# Run main.py when the container launches
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
