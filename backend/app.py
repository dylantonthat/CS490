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

#function should call ai api key, split text into structured data described in ticket SCRUM 18, and save to db
#should also check for duplicates inside db? (if duplicates, i think its best if we just delete the duplicate inside the db, so it always prefers the newer info)
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

        db_store(resume_text)

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