import json
import re
from flask_cors import CORS
import uuid
from flask import Flask, request, jsonify
from pymongo import MongoClient
import docx2txt
import tempfile
import os
import pdfplumber
import openai
from bson.json_util import dumps

client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY")) #API KEY MUST BE SET IN ENVIRONMENT

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
- Do NOT duplicate entries (e.g., same job title AND company)
- If there are two different job titles at the same company, you can keep them as separate, unless the positions seem too similar
- Similarly, If there are two of the same job titles at different companies, you can also keep them separate
- You should be able to recognize that two companies are the same even if they have different names. For instance: NJIT and New Jersey Institute of Technology are the same company
- For overlapping experiences, merge responsibilities and accomplishments
- Add any unique items from either object
- Ensure a clean structure with no redundant info
- If contact info is different, chose the one from the new JSON file (unless it is blank), since the structure does not have multiple contact info

Existing JSON:
\"\"\"{existing}\"\"\"


New JSON:
\"\"\"{incoming}\"\"\"


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
      "responsibilities": "",
      "accomplishments": ["", ""]
    }}
  ]
}}

Only include fields you can extract.
Do not guess missing values, leave them blank.
Use the exact parameter names.
"""

    response = client.chat.completions.create(model="gpt-4o",
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
      "responsibilities": "",
      "accomplishments": ["", ""]
    }}
  ]
}}

Only include fields you can extract.
Do not guess missing values, leave them blank.
Use the exact parameter names.

It is important to distinguish responsibility and accomplishments for each career.
The responsibility should be their main job description for that task, there should only be one.
The accomplishments should be a list of accomplishments they were able to achieve, there can be multiple
Either of these can be blank.
For example, a responsibility would be: created QA tests for the development team to use.
An accomplishment would be: cut costs by 25% by implementing a new feature.
It is up to you to determine what is a feature and what is an accomplishment.
If none of the sentences under a career seems like the main responsibility, then leave responsibility blank and put them all in accomplishments as a list.

Here's the resume text:

\"\"\"{text}\"\"\"
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
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
      "responsibilities": "",
      "accomplishments": ["", ""]
    }}
  ]
}}

Since we are extracting only career history, all fields under contact and education must be left blank.
It must be formatted like this to be used in future steps involving resumes.
Only include fields you can extract.
Do not guess missing values, leave them blank.
Use the exact parameter names.

The career history text can have multiple instances of careers. Each should be stored as a list following the JSON format.

It is important to distinguish responsibility and accomplishments for each career.
The responsibility should be their main job description for that task, there should only be one.
The accomplishments should be a list of accomplishments they were able to achieve, there can be multiple
Either of these can be blank.
For example, a responsibility would be: created QA tests for the development team to use.
An accomplishment would be: cut costs by 25% by implementing a new feature.
It is up to you to determine what is a feature and what is an accomplishment.
If none of the sentences under a career seems like the main responsibility, then leave responsibility blank and put them all in accomplishments as a list.

Here's the career history text:

\"\"\"{text}\"\"\"
"""
    try:
        response = client.chat.completions.create(model="gpt-4o",
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
    print("FILE RECEIVED:", request.files) #debugging
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']
    file_name, file_ext = file.filename.rsplit('.', 1)
   
    resume_id = str(uuid.uuid4())
    
    if file and file_ext.lower() in ALLOWED_EXTENSIONS:
        if file_ext.lower() == 'docx':
            resume_text = parse_docx(file)
            print("FILE IS A DOCX", file_ext) #debugging
        else:
            resume_text = parse_pdf(file)
            print("FILE IS A PDF", file_ext) #debugging

        resume_json = ai_parser(resume_text)
        print("FILE PARSED:", resume_json) #debugging

        db_store(resume_json)
        print("FILE STORED!") #debugging

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

    print("TEXT RECEIVED:", text) #debugging

    careers_json = ai_freeform(text)

    print("TEXT PARSED:", careers_json) #debugging

    db_store(careers_json)

    print("TEXT STORED!") #debugging

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
        return jsonify({
            "hiii": "iiii"
        }), 200
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
        return jsonify({
            "hiii": "iiii"
        }), 200
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

# SPRINT 3 APIS BELOW
#TODO:
@app.route('/api/jobs/submit', methods=['POST'])
def upload_job_desc():
    user_id = request.headers.get('Email', None)
    return jsonify({
        'test': 'test',
    }), 200

#TODO:
@app.route('/api/jobs/history', methods=['GET']) #STRETCH
def get_job_desc():
    user_id = request.headers.get('Email', None)
    return jsonify({
        'test': 'test',
    }), 200

#TODO:
@app.route('/api/resumes/generate', methods=['POST'])
def generate_resume():
    user_id = request.headers.get('Email', None)
    return jsonify({
        'test': 'test',
    }), 200

#TODO:
@app.route('/api/resumes/status:resumeId', methods=['GET'])
def get_resume_status():
    user_id = request.headers.get('Email', None)
    return jsonify({
        'test': 'test',
    }), 200

#TODO:
@app.route('/api/resumes/contact', methods=['GET']) #STRETCH
def view_contact_info():
    user_id = request.headers.get('Email', None)
    return jsonify({
        'test': 'test',
    }), 200

#TODO:
@app.route('/api/resumes/contact:id', methods=['PUT']) #STRETCH
def update_contact_info():
    user_id = request.headers.get('Email', None)
    return jsonify({
        'test': 'test',
    }), 200

#STRETCH: ADD LIST OF SKILLS TO RESUME FORMAT (separate from career history and education, also ensure no duplicates)

#TODO:
@app.route('/api/resumes/skills', methods=['POST']) #STRETCH (can be free form entry like career, or a form, should also check against duplicates)
def upload_skills():
    user_id = request.headers.get('Email', None)
    return jsonify({
        'test': 'test',
    }), 200

#TODO:
@app.route('/api/resumes/skills', methods=['GET']) #STRETCH
def get_skills():
    user_id = request.headers.get('Email', None)
    return jsonify({
        'test': 'test',
    }), 200

#TODO:
@app.route('/api/resumes/upload', methods=['GET']) #STRETCH (need to change our POST method to also save resumes to database)
def view_resumes():
    user_id = request.headers.get('Email', None)
    return jsonify({
        'test': 'test',
    }), 200

#ok so these last two make no sense because we already have a GET and PUT /api/resumes/history but he also wants us to view and edit the freeform text?
#TODO:
@app.route('/api/resumes/freeform', methods=['GET']) #STRETCH (need to change our POST method to also save freeform text to database)
def get_freeform():
    user_id = request.headers.get('Email', None)
    return jsonify({
        'test': 'test',
    }), 200

#TODO:
@app.route('/api/resumes/freeform:id', methods=['PUT']) #STRETCH (also make sure that when you edit a freeform entry it re-posts it so it shows up)
def update_freeform():
    user_id = request.headers.get('Email', None)
    return jsonify({
        'test': 'test',
    }), 200

@app.route('/api/test/db', methods=['GET']) #FOR TESTING/DEBUGGING PURPOSES ONLY, SHOULD NOT BE ACCESSIBLE THRU FRONT END
def get_all_users():
    users = user_info_collection.find()  # Returns a cursor of all documents
    return dumps(users), 200  # dumps handles ObjectId and other BSON types

if __name__ == '__main__':
    app.run(debug=True)
