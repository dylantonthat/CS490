import json
import re
import jwt
from flask_cors import CORS
import uuid
from flask import Flask, request, jsonify
from pymongo import MongoClient
# from backend.auth import get_token_auth_header, get_rsa_key, AUTH0_DOMAIN, API_AUDIENCE, ALGORITHMS
import docx2txt
import tempfile
import os
import pdfplumber
import openai

client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


 # SET OPENAI_API_KEY TO OUR API KEY IN OUR ENVIRONMENT (lowk idk how to do this)

ALLOWED_EXTENSIONS = {'docx', 'pdf'}

clientDB = MongoClient("mongodb+srv://kdv:fp4ZIfpKYM3zghYX@kdv-cluster.wn6dsp1.mongodb.net/?retryWrites=true&w=majority&appName=kdv-cluster")
db = clientDB['cs490_project']
user_info_collection = db['user_info']

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])



def parse_docx(filename):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".docx") as tmp:
        filename.save(tmp.name)
        text = docx2txt.process(tmp.name)
    os.remove(tmp.name)
    return text



def parse_pdf(filename):
    text = []
    with pdfplumber.open(filename) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text.append(page_text)
    return '\n'.join(text)



def db_store(new_data):
    # token = get_token_auth_header()
    # rsa_key = get_rsa_key(token)
    # decoded = jwt.decode(token, key=rsa_key, algorithms=ALGORITHMS, audience=API_AUDIENCE, issuer=f"https://{AUTH0_DOMAIN}/")
    # user_id = decoded.get("sub")
    user_id = request.headers.get('Email', None)
    exist = user_info_collection.find_one({"user_id": user_id})

    if exist:
        print(f"User {user_id} ALREADY EXISTS")
        user_info_collection.delete_one({"user_id": user_id})
        merged_data = merge(exist, new_data)
        return db_store(merged_data)

    else:
        new_data["user_id"] = user_id
        user_info_collection.insert_one(new_data)
        print(f"DATA STORED: {user_id}")



def merge(existing, incoming):
    prompt = f"""
You are a resume data merging assistant.

Given two JSON objects representing extracted resume data for the same user, combine them into one unified JSON object.

Merge strategy:
- Do NOT duplicate entries (e.g., same job title + company)
- For overlapping experiences, merge responsibilities and accomplishments
- Add any unique items from either object
- Ensure a clean structure with no redundant info
- For cases where 2 unique items cannot be merged, for instance 2 different phone numbers, chose the one from the new JSON

Existing JSON:
\"\"\"{existing}\"\"\"


New JSON:
\"\"\"{incoming}\"\"\"


Return the merged JSON object:
"""

    response = client.chat.completions.create(model="gpt-3.5-turbo",
    messages=[
        {"role": "system", "content": "You are a smart resume merging assistant."},
        {"role": "user", "content": prompt}
    ],
    temperature=0.3)

    merged = response.choices[0].message.content.strip()

    if merged.startswith("```"):
            merged = re.sub(r"^```[a-zA-Z]*\n?", "", merged)
            merged = merged.rstrip("```").strip()

    return json.loads(merged)



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
      "startDate": "",
      "endDate": "",
      "gpa": ""
    }}
  ],
  "career": [
    {{
      "title": "",
      "company": "",
      "startDate": "",
      "endDate": "",
      "responsibility": "",
      "accomplishments": ["", ""]
    }}
  ]
}}

Only include fields you can extract.
Do not guess missing values, leave them blank.

It is important to distinguish responsibility and accomplishments for each career.
The responsibility should be their main job description for that task, there should only be one.
The accomplishments should be a list of accomplishments they were able to achieve, there can be multiple
Either of these can be blank.
For example, a responsibility would be: created QA tests for the development team to use.
An accomplishment would be: cut costs by 25% by implementing a new feature.
It is up to you to determine what is a feature and what is an accomplishment.

Here's the resume text:

\"\"\"{text}\"\"\"
"""

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that extracts structured data from resumes."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2
        )

        content = response.choices[0].message.content.strip()

        if content.startswith("```"):
            content = re.sub(r"^```[a-zA-Z]*\n?", "", content)
            content = content.rstrip("```").strip()

        parsed = json.loads(content)
        return parsed

    except json.JSONDecodeError as e:
        print("Failed to parse JSON:", e)
        print("Raw content:", content)
        return None
    except Exception as e:
        print("OpenAI API error:", e)
        return None



def ai_freeform(text):
    prompt = f"""
You are an intelligent parser for resumes. 
Given the raw text of career history information, extract the following structured information in JSON format.

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
      "startDate": "",
      "endDate": "",
      "gpa": ""
    }}
  ],
  "career": [
    {{
      "title": "",
      "company": "",
      "startDate": "",
      "endDate": "",
      "responsibility": "",
      "accomplishments": ["", ""]
    }}
  ]
}}

Since we are extracting only career history, all fields under contact and education must be left blank.
It must be formatted like this to be used in future steps involving resumes.
Only include fields you can extract.
Do not guess missing values, leave them blank.

The career history text can have multiple instances of careers. Each should be stored as a list following the JSON format.

It is important to distinguish responsibility and accomplishments for each career.
The responsibility should be their main job description for that task, there should only be one.
The accomplishments should be a list of accomplishments they were able to achieve, there can be multiple
Either of these can be blank.
For example, a responsibility would be: created QA tests for the development team to use.
An accomplishment would be: cut costs by 25% by implementing a new feature.
It is up to you to determine what is a feature and what is an accomplishment.

Here's the career history text:

\"\"\"{text}\"\"\"
"""
    try:
        response = client.chat.completions.create(model="gpt-3.5-turbo",  # or gpt-4 ??? idk i think 3.5 is free but if it sucks i dont mind paying
        messages=[
            {"role": "system", "content": "You are a helpful assistant that extracts structured career history data from free-form text."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.2)

        content = response.choices[0].message.content.strip()
        # Try parsing it as JSON

        if content.startswith("```"):
            content = re.sub(r"^```[a-zA-Z]*\n?", "", content)
            content = content.rstrip("```").strip()

        parsed = json.loads(content)
        return parsed

    except json.JSONDecodeError as e:
        print("Failed to parse JSON:", e)
        print("Raw content:", content)
        return None
    except Exception as e:
        print("OpenAI API error:", e)
        return None



@app.route('/')
def hello():
    return 'Hello, World!'

@app.route('/api/resumes/upload', methods=['POST'])
def upload_resume():
    print("FILE RECEIVED:", request.files) #debugging, remove later
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']
    file_name, file_ext = file.filename.rsplit('.', 1)
   
    resume_id = str(uuid.uuid4())
    
    if file and file_ext.lower() in ALLOWED_EXTENSIONS:
        if file_ext.lower() == 'docx':
            resume_text = parse_docx(file)
            print("FILE IS A DOCX", file_ext) #debugging, remove later
        else:
            resume_text = parse_pdf(file)
            print("FILE IS A PDF", file_ext) #debugging, remove later

        resume_json = ai_parser(resume_text)
        print("FILE PARSED:", resume_json) #debugging, remove later

        db_store(resume_json)
        print("FILE STORED!") #debugging, remove later

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
    text = request.json['text']
    history_id = str(uuid.uuid4())

    print("TEXT RECEIVED:", text) #debugging, remove later

    careers_json = ai_freeform(text)

    print("TEXT PARSED:", careers_json) #debugging, remove later

    db_store(careers_json)

    print("TEXT STORED!") #debugging, remove later

    if text:
        return jsonify({
            'historyId': history_id,
            'status': 'saved'
        }), 200

    return jsonify({
        'error': 'Empty text',
        'status': 'failed'
    }), 400

@app.route('/api/resumes/history', methods=['GET'])
def get_career_history():
    user_id = request.headers.get('Email', None)
    print("******USER EMAIL: ", user_id)
    user_career = user_info_collection.find_one({"user_id": user_id}, {'career':1, '_id':0})

    if user_career:
        print("****** USER CAREER EXISTS: ", user_career)

    else:
        print("****** USER DOES NOT EXIST")
    #TODO: write rest of function. Should take exist and extract all career info, then return it
    return jsonify(user_career), 200

@app.route('/api/resumes/education', methods=['GET'])
def get_edu_history():
    user_id = request.headers.get('Email', None)
    print("******USER EMAIL: ", user_id)
    user_edu = user_info_collection.find_one({"user_id": user_id}, {'education':1, '_id':0})

    if user_edu:
        print("****** USER EDUCATION EXISTS: ", user_edu)

    else:
        print("****** USER DOES NOT EXIST")
    #TODO: write rest of function. Should take exist and extract all education info, then return it
    return jsonify(user_edu), 200

@app.route('/api/resumes/history:id', methods=['PUT'])
def update_career_history():
    user_id = request.headers.get('Email', None)
    return jsonify({
        'test': 'test',
    }), 200

@app.route('/api/resumes/education:id', methods=['PUT'])
def update_edu():
    user_id = request.headers.get('Email', None)
    return jsonify({
        'test': 'test',
    }), 200

if __name__ == '__main__':
    app.run(debug=True)