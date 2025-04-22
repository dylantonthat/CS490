import json
import re
from flask_cors import CORS
import uuid
from flask import Flask, request, jsonify, Response
from pymongo import MongoClient
import docx2txt
import tempfile
import os
import pdfplumber
import openai
import gridfs
import tempfile
import subprocess
from bson.json_util import dumps
from datetime import datetime, timezone

client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY")) #API KEY MUST BE SET IN ENVIRONMENT

RESUME_PROCESSING = {}
RESUME_FAILED = {}
RESUME_FAILED_JSON = {}

ALLOWED_EXTENSIONS = {'docx', 'pdf'}

clientDB = MongoClient("mongodb+srv://kdv:fp4ZIfpKYM3zghYX@kdv-cluster.wn6dsp1.mongodb.net/?retryWrites=true&w=majority&appName=kdv-cluster")
db = clientDB['cs490_project']
fs = gridfs.GridFS(db)
user_info_collection = db['user_info']
user_resume_collection = db['resumes']
user_resume_gen_collection = db['resumes_gen']
user_freeform_collection = db['freeform']
user_job_desc_collection = db['job_desc']

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
- Similarly, you should be able to recognize two skills are the same, like "js" and "javascript". The merged JSON object must only contain one of these.
- For overlapping experiences, merge responsibilities and accomplishments
- Add any unique items from either object
- Ensure a clean structure with no redundant info
- If contact info is different, chose the one from the new JSON file (unless it is blank), since the structure does not have multiple contact info
- Similarly, if an overlapping experience has a different responsibility listed, go with the new one. If there are 2 accomplishments under an overlapping experience that are too similar, then go with the new accomplishment.

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
  ],
  "skills": ["", ""]
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
  ],
  "skills": ["", ""]
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
  ],
  "skills": ["", ""]
}}

Since we are extracting only career history, all fields under contact and education must be left blank.
You can also extract skills from the freeform text and store them in skills (ex. Python, Javascript). However if there are no notable skills you can leave it blank.
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

def ai_skills(text): #might need to be changed if using a form instead
    prompt = f"""
You are an intelligent parser for resumes. 
Given the raw text of different skills, extract the following structured information in JSON format.

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
  ],
  "skills": ["", ""]
}}

Since we are extracting only skills, all fields under contact, education, and career must be left blank.
It must be formatted like this to be used in future steps involving resumes.
Only include fields you can extract.
Use the exact parameter names.

Here's the freeform skills text:

\"\"\"{text}\"\"\"
"""
    try:
        response = client.chat.completions.create(model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are a helpful assistant that extracts skills from free-form text."},
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

def ai_resume(job_text, hist_text, resume_id):
    prompt = f"""
You are an intelligent resume generator that tailors resumes to match specific job descriptions.

You will receive:
-A resume formatted as a JSON object
-A job description

Your task is to modify the "career" and "skills" sections of the resume to better align with the job description, using its language and keywords where relevant.

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
  ],
  "skills": ["", ""]
}}

It must be formatted like this to be used in future steps involving resumes.
Only include fields you can extract.
Do not guess missing values, leave them blank.
Use the exact parameter names.

Instructions
-Do not modify the contact or education fields.
-Keep the original job titles, companies, and dates in each career entry.
-You may remove irrelevant career entries if the user has more than 3 total.
-Do not guess missing values. If a field is missing, leave it blank.

For each career entry:
-Edit the "responsibilities" field to align with the job description, using relevant keywords and phrasing.
-Edit or add to the "accomplishments" list based on plausible achievements suggested by the resume and job description.
-Ensure that responsibilities describe the core duties, and accomplishments reflect impact or results (e.g., metrics, improvements, success stories).

For skills:
-Include only skills relevant to the job description.
-You may extract relevant skills from the career section even if they weren't explicitly listed before.
-Avoid redundant or overly similar skills.


It is important to distinguish responsibility and accomplishments for each career.
The responsibility should be their main job description for that task, there should only be one.
The accomplishments should be a list of accomplishments they were able to achieve, there can be multiple
Either of these can be blank.
For example, a responsibility would be: created QA tests for the development team to use.
An accomplishment would be: cut costs by 25% by implementing a new feature.
It is up to you to determine what is a feature and what is an accomplishment.

INPUTTED VALUES:
-Resume Json:
\"\"\"{hist_text}\"\"\"
-Job Description:
\"\"\"{job_text}\"\"\"
"""
    try:
        response = client.chat.completions.create(model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are a helpful assistant that tailors resumes for different job descriptions."},
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

        RESUME_PROCESSING.remove(resume_id) #for getting status
        RESUME_FAILED_JSON.add(resume_id)

        print("Failed to parse JSON:", e)
        print("Raw content:", content)
        return None
    except Exception as e:

        RESUME_PROCESSING.remove(resume_id) #for getting status
        RESUME_FAILED.add(resume_id)

        print("OpenAI API error:", e)
        return None

# ***** SPRINT 2 APIS BELOW
@app.route('/')
def hello():
    return 'Hello, World!'

@app.route('/api/resumes/upload', methods=['POST'])
def upload_resume():
    user_id = request.headers.get('Email', None)
    if not user_id:
        return jsonify({"error": "Missing user ID"}), 400
    
    print("FILE RECEIVED:", request.files) #debugging
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']
    resume_id = str(uuid.uuid4())

    file_name = file.filename
    file_firstname = file_name.rsplit('.', 1)[0].lower()
    file_ext = file_name.rsplit('.', 1)[-1].lower()
   
    if file and file_ext.lower() in ALLOWED_EXTENSIONS:
        if file_ext.lower() == 'docx':
            resume_text = parse_docx(file)
            print("FILE IS A DOCX", file_ext) #debugging
        else:
            resume_text = parse_pdf(file)
            print("FILE IS A PDF", file_ext) #debugging



        #file_id = fs.put(file, filename=file_name, content_type=file.content_type)
        timestamp = datetime.now(timezone.utc)


        with tempfile.TemporaryDirectory() as temp_dir:
            input_path = os.path.join(temp_dir, file_name)
            # Reading file and writing to temp temp input path
            file.seek(0)
            file_data = file.read()
            with open(input_path, 'wb') as f_out:
                f_out.write(file_data)

            if file_ext == 'docx':
                try:
                    subprocess.run([
                        'libreoffice',
                        '--headless',
                        '--convert-to',
                        'pdf',
                        '--outdir',
                        temp_dir,
                        input_path
                    ], check=True)

                    converted_pdf = input_path.rsplit('.', 1)[0] + '.pdf'
                    with open(converted_pdf, 'rb') as pdf_file:
                        pdf_file.seek(0)
                        file_id = fs.put(pdf_file, filename=f"{file_firstname}.pdf", content_type='application/pdf')

                except subprocess.CalledProcessError as e:
                    return jsonify({"error": "Failed to convert docx to PDF"}), 500
            else:
                file.seek(0)
                file_id = fs.put(file, filename=file_name, content_type='application/pdf')



        user_resume_collection.insert_one({
            'resume_id': resume_id,
            'user_id': user_id,
            'file_id': file_id,
            'filename': file_name,
            'content_type': file_name if file_ext == 'pdf' else f"{file_firstname}.pdf",
            'timestamp': timestamp
        })

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
    user_id = request.headers.get('Email', None)
    if not user_id:
        return jsonify({"error": "Missing user ID"}), 400
    
    if 'text' not in request.json:
        return jsonify({"error": "No text part"}), 400

    text = request.json['text']
    history_id = str(uuid.uuid4())
    timestamp = datetime.now()

    freeform = {
        "user_id": user_id,
        "history_id": history_id,
        "text": text,
        "timestamp": timestamp
    }

    user_freeform_collection.insert_one(freeform)

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
    user_career = user_info_collection.find_one({'user_id': user_id}, {'career':1, '_id':0})

    if user_career:
        print("****** USER CAREER EXISTS: ", user_career)

    else:
        print("****** USER DOES NOT EXIST")
        return jsonify({
            "hiii": "iiii"
        }), 200
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
    return jsonify(user_edu), 200

#TODO:
@app.route('/api/resumes/history:id', methods=['PUT']) #SPRINT 2 STRETCH
def update_career_history():
    user_id = request.headers.get('Email', None)
    return jsonify({
        'test': 'test',
    }), 200

#TODO:
@app.route('/api/resumes/education:id', methods=['PUT']) #SPRINT 2 STRETCH
def update_edu():
    user_id = request.headers.get('Email', None)
    return jsonify({
        'test': 'test',
    }), 200

# ***** SPRINT 3 APIS BELOW
@app.route('/api/jobs/submit', methods=['POST'])
def upload_job_desc():
    user_id = request.headers.get('Email', None)
    if not user_id:
        return jsonify({
            'error': 'Missing Email header',
            'status': 'failed'
        }), 400

    text = request.json['text']
    job_id = str(uuid.uuid4())
    if not text:
        return jsonify({
            'error': 'Empty text',
            'status': 'failed'
        }), 400

    new_job = {
        'job_id': job_id,
        'text': text,
        'timestamp': datetime.now(timezone.utc)
    }

    result = user_job_desc_collection.update_one(
        {'user_id': user_id},
        {'$push': {'jobs': new_job}},
        upsert=True
    )

    return jsonify({
        'jobId': job_id,
        'status': 'saved'
    }), 200

@app.route('/api/jobs/history', methods=['GET'])
def get_job_desc():
    user_id = request.headers.get('Email', None)
    if not user_id:
        return jsonify({'error': 'Missing Email header'}), 400

    user_data = user_job_desc_collection.find_one({'user_id': user_id})

    if not user_data or 'jobs' not in user_data:
        return jsonify({'jobs': []}), 200

    jobs = []
    for job in user_data['jobs']:
        jobs.append({
            'jobId': job.get('job_id'),
            'text': job.get('text'),
            'submittedAt': job.get('timestamp').isoformat().replace('+00:00', 'Z')  # ISO 8601 format with Z
        })

    return jsonify({'jobs': jobs}), 200

@app.route('/api/resumes/generate', methods=['POST']) #SPRINT 3 CORE
def generate_resume():
    # Getting parameters and checking for errors
    user_id = request.headers.get('Email', None)
    if not user_id:
        return jsonify({
            'error': 'Missing Email header', 
            'status': 'failed'
            }), 400
    
    job_id = request.json["jobId"]
    if not job_id:
        return jsonify({
            'error': 'Missing Job ID',
            'status': 'failed'
        }), 400
    
    job_data = user_job_desc_collection.find_one(
        {'user_id': user_id, 'jobs.job_id':job_id},
        {'jobs': {'$elemMatch': {'job_id':job_id}}}
    )
    if not job_data:
        return jsonify({
            'error': 'Given job Id does not exist in database',
            'status': 'failed'
        }), 404
    job_text = job_data['jobs'][0]['text']

    print(f"******JOB FOUND: {job_text}")
    resume_id = str(uuid.uuid4())

    RESUME_PROCESSING.add(resume_id) #for getting status

    hist_text = str(user_info_collection.find_one({'user_id': user_id}, {'_id':0, 'user_id':0}))

    # Generate new resume
    resume_json = ai_resume(job_text, hist_text, resume_id)
    resume_json['resume_id'] = resume_id
    resume_json['status'] = 'processing'
    print(f"******RESUME GENERATED: {resume_json['career']}")
    
    # Storing in 'resume' database. If it already exists
    user_resume_gen_collection.update_one(
        {'user_id': user_id, 'job_id':job_id},
        {'$set': resume_json},
        upsert=True
    )
    print(f"******DATABASE INSERTION")

    RESUME_PROCESSING.remove(resume_id)

    return jsonify({
        'resumeId': resume_id,
        'status': 'processing'
    }), 200


@app.route('/api/resumes/status/<resume_id>', methods=['GET']) #SPRINT 3 CORE
def get_resume_status(resume_id):
    user_id = request.headers.get('Email', None)
    if not user_id:
        return jsonify({"error": "Missing user ID"}), 400
    
    if resume_id in RESUME_PROCESSING:
        return jsonify({
            "resumeId": resume_id,
            "status": "processing"
        }), 200
    
    if resume_id in RESUME_FAILED:
        return jsonify({
            "resumeId": resume_id,
            "status": "failed",
            "error": "OpenAI API error"
        }), 500
    
    if resume_id in RESUME_FAILED_JSON:
        return jsonify({
            "resumeId": resume_id,
            "status": "failed",
            "error": "Failed to parse JSON"
        }), 500
    
    resume_doc = user_resume_gen_collection.find_one({'resume_id': resume_id})
    
    if not resume_doc:
        # Not found at all
        return jsonify({
            "error": "Resume ID not found"
        }), 404

    if resume_doc['user_id'] != user_id:
        # Found, but belongs to someone else
        return jsonify({
            "error": "Access forbidden: resume does not belong to this user"
        }), 403

    # Found and belongs to the user
    return jsonify({
        "resume_id": resume_id,
        "status": "completed"
    }), 200


@app.route('/api/resumes/contact', methods=['GET']) #SPRINT 3 STRETCH
def view_contact_info():
    user_id = request.headers.get('Email', None)
    print("******USER EMAIL: ", user_id)
    user_contact = user_info_collection.find_one({"user_id": user_id}, {'contact':1, '_id':0})

    if user_contact:
        print("****** USER CONTACT EXISTS: ", user_contact)

    else:
        print("****** USER DOES NOT EXIST")
        return jsonify({
            "hiii": "iiii"
        }), 200
    return jsonify(user_contact), 200

@app.route('/api/resumes/contact', methods=['PUT']) #SPRINT 3 STRETCH
def update_contact_info():
    user_id = request.headers.get('Email', None)
    if not user_id:
        return jsonify({"error": "Missing user ID"}), 400

    contact_data = request.json.get('contact')
    if not contact_data:
        return jsonify({"error": "Missing contact field"}), 400

    required_fields = ["email", "name", "phone"]
    for field in required_fields:
        if field not in contact_data:
            return jsonify({"error": f"Missing contact field: {field}"}), 400

    # Update or insert contact info
    user_info_collection.update_one(
        {"user_id": user_id},
        {"$set": {"contact": contact_data}},
        upsert=True
    )

    return jsonify({
        "status": "updated",
        "contact": contact_data
    }), 200

@app.route('/api/resumes/skills', methods=['POST']) #(should be free form like career history)
def upload_skills():
    data = request.get_json()
    skills = data.get('skills', [])
    skills_id = str(uuid.uuid4())

    print("TEXT RECEIVED:", skills) #debugging
    
    text = ", ".join(skills)
    skills_json = ai_skills(text)

    print("TEXT PARSED:", skills_json) #debugging

    db_store(skills_json)

    print("TEXT STORED!") #debugging

    if text:
        return jsonify({
            'skillsId': skills_id,
            'status': 'saved'
        }), 200

    return jsonify({
        'error': 'Empty text',
        'status': 'failed'
    }), 400

@app.route('/api/resumes/skills', methods=['GET'])
def get_skills():
    user_id = request.headers.get('Email', None)
    print("******USER EMAIL: ", user_id)
    user_skills = user_info_collection.find_one({"user_id": user_id}, {'skills':1, '_id':0})

    if user_skills:
        print("****** USER SKILLS EXISTS: ", user_skills)

    else:
        print("****** USER DOES NOT EXIST")
        return jsonify({
            "hiii": "iiii"
        }), 200
    return jsonify(user_skills), 200

@app.route('/api/resumes/upload', methods=['GET'])
def view_resumes():
    user_id = request.headers.get('Email', None)
    if not user_id:
        return jsonify({'error': 'Missing Email header'}), 400

    resumes = user_resume_collection.find({'user_id': user_id}).sort('timestamp', -1)

    resume_list = []
    for res in resumes:
        resume_list.append({
            'resumeId': res.get('resume_id'),
            'filename': res.get('filename'),
            'contentType': res.get('content_type'),
            'uploadedAt': res.get('timestamp').isoformat().replace('+00:00', 'Z')
        })

    return jsonify({'resumes': resume_list}), 200

@app.route('/api/resumes/view/<resume_id>', methods=['GET'])
def view_resume_file(resume_id):
    resume_meta = user_resume_collection.find_one({'resume_id': resume_id})
    if not resume_meta:
        return jsonify({'error': 'Resume not found'}), 404

    file_id = resume_meta.get('file_id')
    if not file_id:
        return jsonify({'error': 'File ID missing'}), 500

    try:
        file_data = fs.get(file_id)
    except gridfs.errors.NoFile:
        return jsonify({'error': 'File not found in GridFS'}), 404

    return Response(
        file_data.read(),
        mimetype=resume_meta.get('content_type'),
        headers={
            "Content-Disposition": f"inline; filename={resume_meta.get('filename')}"
        }
    )
#To view in frontend: (Have not tested, should hopefully work)
# <iframe
#   src={`http://localhost:5000/api/resumes/view/${resumeId}`}
#   width="100%"
#   height="600px"
#   style={{ border: 'none' }}
# />

#ok so these last two make no sense because we already have a GET and PUT /api/resumes/history but he also wants us to view and edit the freeform text?
@app.route('/api/resumes/freeform', methods=['GET'])
def get_freeform():
    user_id = request.headers.get('Email', None)
    if not user_id:
        return jsonify({"error": "Missing user ID"}), 400

    history_entries = user_freeform_collection.find({"user_id": user_id}).sort("timestamp", -1)

    return Response(
        dumps(list(history_entries)),
        mimetype='application/json'
    )


@app.route('/api/resumes/freeform/<history_id>', methods=['PUT']) #SPRINT 3 STRETCH
def update_freeform(history_id):
    user_id = request.headers.get('Email', None)
    if not user_id:
        return jsonify({"error": "Missing user ID"}), 400

    new_text = request.json.get('text')
    if not new_text:
        return jsonify({"error": "Missing text field"}), 400

    # Check if the document exists
    existing_entry = user_freeform_collection.find_one({"history_id": history_id})
    if not existing_entry:
        return jsonify({"error": "History ID not found"}), 404

    if existing_entry["user_id"] != user_id:
        return jsonify({"error": "Access forbidden: entry does not belong to this user"}), 403

    # Update the document
    user_freeform_collection.update_one(
        {"history_id": history_id},
        {
            "$set": {
                "text": new_text,
                "timestamp": datetime.now(timezone.utc)
            }
        }
    )

    new_careers_json = ai_freeform(new_text)


    db_store(new_careers_json)


    return jsonify({
        "history_id": history_id,
        "status": "updated"
    }), 200


# ***** DEBUGGING APIS
@app.route('/api/testdb/info', methods=['GET']) #FOR TESTING/DEBUGGING PURPOSES ONLY, SHOULD NOT BE ACCESSIBLE THRU FRONT END
def get_all_users():
    info = user_info_collection.find()
    return dumps(info), 200

@app.route('/api/testdb/resumes', methods=['GET']) #FOR TESTING/DEBUGGING PURPOSES ONLY, SHOULD NOT BE ACCESSIBLE THRU FRONT END
def get_all_resumes():
    resumes = user_resume_collection.find()
    return dumps(resumes), 200

@app.route('/api/testdb/freeform', methods=['GET']) #FOR TESTING/DEBUGGING PURPOSES ONLY, SHOULD NOT BE ACCESSIBLE THRU FRONT END
def get_all_freeform():
    freeform = user_freeform_collection.find()
    return dumps(freeform), 200

@app.route('/api/testdb/job_desc', methods=['GET']) #FOR TESTING/DEBUGGING PURPOSES ONLY, SHOULD NOT BE ACCESSIBLE THRU FRONT END
def get_all_job_desc():
    job_desc = user_job_desc_collection.find()
    return dumps(job_desc), 200

@app.route('/api/testdb/resumesgen', methods=['GET']) #FOR TESTING/DEBUGGING PURPOSES ONLY, SHOULD NOT BE ACCESSIBLE THRU FRONT END
def get_all_resumes_gen():
    resumes_gen = user_resume_gen_collection.find()
    return dumps(resumes_gen), 200

if __name__ == '__main__':
    app.run(debug=True)
