import uuid
from flask import Flask, request, jsonify
from pymongo import MongoClient
import PyPDF2
from docx import Document
from auth import get_token_auth_header
import docx2txt
import tempfile
import os
import pdfplumber
import openai
openai.api_key = os.getenv("OPENAI_API_KEY") # SET OPENAI_API_KEY TO OUR API KEY IN OUR ENVIRONMENT (lowk idk how to do this)
import json

ALLOWED_EXTENSIONS = {'docx', 'pdf'}

client = MongoClient("mongodb+srv://kdv:fp4ZIfpKYM3zghYX@kdv-cluster.wn6dsp1.mongodb.net/?retryWrites=true&w=majority&appName=kdv-cluster")
db = client['cs490_project']
user_info_collection = db['user_info']

app = Flask(__name__)

def parse_docx(filename):
    # document = Document(filename)
    # text = []
    # for paragraph in document.paragraphs:
    #     text.append(paragraph.text)
    # return '\n'.join(text)
    with tempfile.NamedTemporaryFile(delete=False, suffix=".docx") as tmp:
        filename.save(tmp.name)
        text = docx2txt.process(tmp.name)
    os.remove(tmp.name)
    return text

def parse_pdf(filename):
    # reader = PyPDF2.PdfReader(filename)
    # text = []
    # for page in reader.pages:
    #     text.append(page.extract_text())
    # return '\n'.join(filter(None, text))
    text = []
    with pdfplumber.open(filename) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text.append(page_text)
    return '\n'.join(text)

#how do we check for duplicates????
def ai_parser(text):
    prompt = f"""
You are an intelligent parser for resumes. 
Given the raw text of a resume, extract the following structured information in JSON format.

Return a JSON object with this structure:

{{
  "contact": {{
    "name": "",
    "email": "",
    "phone": ""
  }},
  "education": [
    {{
      "degree": "",
      "institution": "",
      "start_date": "",
      "end_date": "",
      "gpa": ""
    }}
  ],
  "career": [
    {{
      "title": "",
      "company": "",
      "start_date": "",
      "end_date": "",
      "responsibility": "",
      "accomplishments": ["", ""]
    }}
  ]
}}

Only include fields you can extract.
Do not guess missing values.
A resume can have multiple instances of education or career. Each should be stored as a list following the JSON format.
Here's the resume text:

\"\"\"{text}\"\"\"
"""

    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",  # or gpt-4 ??? idk i think 3.5 is free but if it sucks i dont mind paying
            messages=[
                {"role": "system", "content": "You are a helpful assistant that extracts structured data from resumes."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2
        )

        content = response.choices[0].message.content.strip()
        
        # Try parsing it as JSON
        parsed = json.loads(content)
        return parsed

    except json.JSONDecodeError as e:
        print("Failed to parse JSON:", e)
        print("Raw content:", content)
        return None
    except Exception as e:
        print("OpenAI API error:", e)
        return None


def db_store(text):
    return

@app.route('/')
def hello():
    return 'Hello, World!'

@app.route('/api/resumes/upload', methods=['POST'])
def upload_resume():
    file = request.files['file']
    file_name, file_ext = file.filename.rsplit('.', 1)
    resume_id = uuid.uuid4

    if file and file_ext.lower() in ALLOWED_EXTENSIONS:
        if file_ext.lower() == 'docx':
            resume_text = parse_docx(file)
        else:
            resume_text = parse_pdf(file)

        resume_json = ai_parser(resume_text)

        db_store(resume_json)

        return jsonify({
            'resumeId': resume_id,
            'status': 'processing'
        }), 200
    
    return jsonify({
        'error': 'Unsupported file type',
        'status': 'failed'
    }), 400

@app.route('/api/resumes/history', methods=['POST'])
def upload_freeform_career_history():
    text = request.json()['text']
    history_id = uuid.uuid4

    if text:
        return jsonify({
            'historyId': history_id,
            'status': 'saved'
        }), 200
    
    return jsonify({
        'error': 'Empty text',
        'status': 'failed'
    }), 400

# I believe this is different from the freeform history. this is from parsing resumes
@app.route('/api/resumes/history', methods=['GET'])
def get_career_history():
    return jsonify({
        'test': 'test'
    }), 200

@app.route('/api/resumes/education', methods=['GET'])
def get_edu_history():
    return jsonify({
        'test': 'test'
    }), 200

@app.route('/api/resumes/history', methods=['PUT'])
def update_career_history():
    return jsonify({
        'test': 'test',
    }), 200

@app.route('/api/resumes/education', methods=['PUT'])
def update_edu():
    return jsonify({
        'test': 'test',
    }), 200

if __name__ == '__main__':
    app.run(debug=True)