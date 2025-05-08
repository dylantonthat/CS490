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
import markdown
from weasyprint import HTML
import pypandoc

client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY")) #API KEY MUST BE SET IN ENVIRONMENT

RESUME_PROCESSING = {}
RESUME_FAILED = {}
RESUME_FAILED_JSON = {}

ALLOWED_EXTENSIONS = {'docx', 'pdf'}
#Formatting types
# ALLOWED_FORMATS = {'plain', 'markdown', 'html', 'pdf', 'docx'}
ALLOWED_FORMATS = {'txt', 'md', 'html', 'pdf', 'docx', None}
ALLOWED_TEMPLATES = {'modern', 'simple', None} #temp names
ALLOWED_STYLES = {'compact', 'expanded', 'colors', None} #temp names

clientDB = MongoClient("mongodb+srv://kdv:fp4ZIfpKYM3zghYX@kdv-cluster.wn6dsp1.mongodb.net/?retryWrites=true&w=majority&appName=kdv-cluster")
db = clientDB['cs490_project']
fs = gridfs.GridFS(db)
user_info_collection = db['user_info']
user_resume_collection = db['resumes']
user_resume_gen_collection = db['resumes_gen']
user_resume_format_collection = db['resumes_format']
user_freeform_collection = db['freeform']
user_job_desc_collection = db['job_desc']

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])

RESUME_PROCESSING = set()
RESUME_FAILED = set()
RESUME_FAILED_JSON = set()

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

    response = client.chat.completions.create(model="gpt-3.5-turbo", # model="gpt-4o", (switched out for cheaper testing)
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
            model="gpt-3.5-turbo", # model="gpt-4o", (switched out for cheaper testing)
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

def ai_freeform(text): #OBSOLETE FUNCTION
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
        response = client.chat.completions.create(model="gpt-3.5-turbo", # model="gpt-4o", (switched out for cheaper testing)
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
        response = client.chat.completions.create(model="gpt-3.5-turbo", # model="gpt-4o", (switched out for cheaper testing)
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

def ai_resume(job_text, hist_text, freeform_text, resume_id):
    prompt = f"""
You are an intelligent resume generator that tailors resumes to match specific job descriptions.

You will receive:
- A resume formatted as a JSON object
- Freeform user-written text about past job experiences
- A job description

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

Instructions:
- Do not modify the contact or education fields.
- Keep the original job titles, companies, and dates in each career entry.
- You may remove irrelevant career entries if the user has more than 3 total.
- Do not guess missing values. If a field is missing, leave it blank.

For each career entry:
- Edit "responsibilities" to match the job description.
- Add "accomplishments" that show measurable success or impact.
- Use freeform experience where relevant.

INPUTTED VALUES:
- Resume Json:
\"\"\"{hist_text}\"\"\"

- Freeform Experience:
\"\"\"{freeform_text}\"\"\"

- Job Description:
\"\"\"{job_text}\"\"\"
"""
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo", # model="gpt-4o", (switched out for cheaper testing)
            messages=[
                {"role": "system", "content": "You are a helpful assistant that tailors resumes for different job descriptions."},
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
        RESUME_PROCESSING.remove(resume_id)
        RESUME_FAILED_JSON.add(resume_id)
        print("Failed to parse JSON:", e)
        print("Raw content:", content)
        return None

    except Exception as e:
        RESUME_PROCESSING.remove(resume_id)
        RESUME_FAILED.add(resume_id)
        print("OpenAI API error:", e)
        return None

def ai_advice(resume, job_desc):
    prompt = f"""
You are a career advisor AI. Analyze the resume and job description provided below. Then return clear, practical, and professional advice in plain text that helps the candidate improve their resume and increase their chances of landing the job.

Your advice should include:
• Suggestions for improvements or missing content in the resume.
• Insights into how well the resume matches the job description.
• Tips for tailoring the resume or preparing for interviews.

Resume (structured JSON):
{json.dumps(resume, indent=2)}

Job Description (plain text):
{job_desc}

Write your response directly to the user in a friendly but professional tone. Do not include JSON, markdown, or headings — only the plain text advice.
""".strip()

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo", # model="gpt-4o", (switched out for cheaper testing)
            messages=[
                {"role": "system", "content": "You are a helpful and experienced career advisor who gives specific and personalized guidance based on a user's resume and a job posting."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7 #higher to make advice more natural-sounding and stuff
        )

        content = response.choices[0].message.content.strip()

        if content.startswith("```"):
            content = re.sub(r"^```[a-zA-Z]*\n?", "", content)
            content = content.rstrip("```").strip()

        return content

    except Exception as e:
        print("OpenAI API error:", e)
        return None

# functions for formatting resumes
def plain_format(resume_json): # .txt
    # extracting data
    contact = resume_json['contact']
    education = resume_json['education']
    career = resume_json['career']
    skills = resume_json['skills']
    
    # string that goes in the txt file
    format_string = f"""{contact['name']} Resume
Contact
 - Email: {contact['email']}
 - Phone: {contact['phone']}

Education"""

    for edu_entry in education:
        entry = f"""
 - {edu_entry['institution']}
\t - {edu_entry['degree']} 
\t - {edu_entry['startDate']} - {edu_entry['endDate']}
\t - {edu_entry['gpa']}"""
        format_string = format_string + entry

    format_string = format_string + '\n\nCareers'
    for job_entry in career:
        entry = f"""
- {job_entry['title']}        
\t - {job_entry['company']}
\t - {job_entry['startDate']} - {job_entry['endDate']}
\t - Responsibilities:
\t\t - {job_entry['responsibilities']}
\t - Accomplishments:"""
        for accomp in job_entry['accomplishments']:
            entry = entry + f"\n\t\t - {accomp}"
        format_string = format_string + entry

    format_string = format_string + f"""
\nSkills
 - {', '.join(skills)}    
"""
    print(format_string)

    return format_string

def markdown_format(resume_json, file_type): # .md .html .pdf .docx
    # extracting data
    contact = resume_json['contact']
    education = resume_json['education']
    career = resume_json['career']
    skills = resume_json['skills']
    
    # Markdown string 
    format_string = f"""# {contact['name']} Resume
## Contact
 - **Email**: {contact['email']}
 - **Phone**: {contact['phone']}

## Education"""

    for edu_entry in education:
        entry = f"""
 - **{edu_entry['institution']}**
\t - {edu_entry['degree']} 
\t - {edu_entry['startDate']} - {edu_entry['endDate']}
\t - GPA: {edu_entry['gpa']}"""
        format_string = format_string + entry

    format_string = format_string + '\n\n## Careers'
    for job_entry in career:
        entry = f"""
- **{job_entry['title']}**        
\t - {job_entry['company']}
\t - {job_entry['startDate']} - {job_entry['endDate']}
\t - **Responsibilities**:
\t\t - {job_entry['responsibilities']}
\t - **Accomplishments**:"""
        for accomp in job_entry['accomplishments']:
            entry = entry + f"\n\t\t - {accomp}"
        format_string = format_string + entry

    format_string = format_string + f"""
\n## Skills
 - {', '.join(skills)}    
"""
    print(format_string)

    format_html = markdown.markdown(format_string)
    if file_type == 'html':
        resume_format = bytes(format_html, encoding='utf-8')
    elif file_type == 'pdf':
        resume_format = HTML(string=format_html).write_pdf()
    elif file_type == 'docx':
        with tempfile.NamedTemporaryFile(suffix=file_type) as tmp:
            pypandoc.convert_text(format_string, 'docx', format='md', outputfile=tmp.name)
            resume_format = tmp.read()
        tmp.close()
    else:
        resume_format = bytes(format_string, encoding='utf-8')

    return resume_format

def template_format(resume_json, template_id, style_id, file_type): # .html .pdf .docx (if template selected)
    return


# ***** SPRINT 2 APIS BELOW ********************************************************
@app.route('/')
def hello():
    return 'Hello, World!'

@app.route('/api/resumes/upload', methods=['POST'])
def upload_resume():
    user_id = request.headers.get('Email', None)
    if not user_id:
        return jsonify({"error": "Missing user ID"}), 401
    
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
        return jsonify({"error": "Missing user ID"}), 401
    
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

@app.route('/api/resumes/history/<int:id>', methods=['PUT']) #SPRINT 2 STRETCH
def update_career_history(id):
    # 'id' is the index from the frontend, the frontend outputs them in the same order as the database, so it normally should match up
    form_data = request.get_json()
    user_id = request.headers.get('Email', None)
    
    update_path = f'career.{id}'

    print(f'USER ID: {user_id}')
    print(f'FORM DATA: {form_data}')
    print(f'CAREER PATH: {update_path}')

    result = user_info_collection.update_one(
        {'user_id': user_id},
        {'$set': {update_path: form_data}}
    )
    # print("Matched count:", result.matched_count)
    # print("Modified count:", result.modified_count)

    return jsonify({
        'status': 'updated',
    }), 200

@app.route('/api/resumes/history/upload', methods=['POST']) #SPRINT 2 STRETCH
def upload_career_history():
    print("uploading new job")
    # 'id' is the index from the frontend, the frontend outputs them in the same order as the database, so it normally should match up
    form_data = request.get_json()
    user_id = request.headers.get('Email', None)
    
    print(f'USER ID: {user_id}')
    print(f'FORM DATA: {form_data}')

    result = user_info_collection.update_one(
        {'user_id': user_id},
        {'$push': {'career': form_data}},
        upsert=True
    )
    # print("Matched count:", result.matched_count)
    # print("Modified count:", result.modified_count)

    return jsonify({
        'status': 'updated',
    }), 200

@app.route('/api/resumes/history', methods=['DELETE']) #SPRINT 2 STRETCH
def delete_career_history():
    # 'id' is the index from the frontend, the frontend outputs them in the same order as the database, so it normally should match up
    data = request.get_json()
    index = data.get('index')
    user_id = request.headers.get('Email', None)

    update_path = f'career.{index}'
    
    print(f'USER ID: {user_id}')
    print(f'USER ID: {update_path}')

    # Unsets the desired career entry, but leaves it null. The second update removes nulls
    result = user_info_collection.update_one(
        {'user_id': user_id},
        {'$unset': {update_path: 1}}
    )
    result = user_info_collection.update_one(
        {'user_id': user_id},
        {'$pull': {'career': None}}
    )

    return jsonify({
        'status': 'removed',
    }), 200

@app.route('/api/resumes/education/<int:id>', methods=['PUT']) #SPRINT 2 STRETCH
def update_edu(id):
    # 'id' is the index from the frontend, the frontend outputs them in the same order as the database, so it normally should match up
    form_data = request.get_json()
    user_id = request.headers.get('Email', None)
    
    update_path = f'education.{id}'

    print(f'USER ID: {user_id}')
    print(f'FORM DATA: {form_data}')
    print(f'EDU PATH: {update_path}')

    result = user_info_collection.update_one(
        {'user_id': user_id},
        {'$set': {update_path: form_data}}
    )
    # print("Matched count:", result.matched_count)
    # print("Modified count:", result.modified_count)

    return jsonify({
        'status': 'updated',
    }), 200

@app.route('/api/resumes/education', methods=['POST']) #SPRINT 2 STRETCH
def upload_edu():
    print("uploading new edu")
    # 'id' is the index from the frontend, the frontend outputs them in the same order as the database, so it normally should match up
    form_data = request.get_json()
    user_id = request.headers.get('Email', None)
    
    print(f'USER ID: {user_id}')
    print(f'FORM DATA: {form_data}')

    result = user_info_collection.update_one(
        {'user_id': user_id},
        {'$push': {'education': form_data}},
        upsert=True
    )
    # print("Matched count:", result.matched_count)
    # print("Modified count:", result.modified_count)

    return jsonify({
        'status': 'uploading',
    }), 200

@app.route('/api/resumes/education', methods=['DELETE']) #SPRINT 2 STRETCH
def delete_edu():
    # 'id' is the index from the frontend, the frontend outputs them in the same order as the database, so it normally should match up
    data = request.get_json()
    index = data.get('index')
    user_id = request.headers.get('Email', None)

    update_path = f'education.{index}'
    
    print(f'USER ID: {user_id}')
    print(f'USER ID: {update_path}')

    # Unsets the desired career entry, but leaves it null. The second update removes nulls
    result = user_info_collection.update_one(
        {'user_id': user_id},
        {'$unset': {update_path: 1}}
    )
    result = user_info_collection.update_one(
        {'user_id': user_id},
        {'$pull': {'education': None}}
    )

    return jsonify({
        'status': 'removed',
    }), 200



# ***** SPRINT 3 APIS BELOW ********************************************************
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

@app.route('/api/resumes/generate', methods=['POST'])  # SPRINT 3 CORE
def generate_resume():
    user_id = request.headers.get('Email', None)
    if not user_id:
        return jsonify({
            'error': 'Missing Email header',
            'status': 'failed'
        }), 400

    job_id = request.json.get("jobId")
    if not job_id:
        return jsonify({
            'error': 'Missing Job ID',
            'status': 'failed'
        }), 400

    # Fetch job description
    job_data = user_job_desc_collection.find_one(
        {'user_id': user_id, 'jobs.job_id': job_id},
        {'jobs': {'$elemMatch': {'job_id': job_id}}}
    )
    if not job_data:
        return jsonify({
            'error': 'Given job Id does not exist in database',
            'status': 'failed'
        }), 404
    job_text = job_data['jobs'][0]['text']

    print(f"******JOB FOUND: {job_text}")
    resume_id = str(uuid.uuid4())
    RESUME_PROCESSING.add(resume_id)

    # Fetch uploaded resume JSON
    structured_resume = user_info_collection.find_one({'user_id': user_id}, {'_id': 0, 'user_id': 0})
    hist_text = json.dumps(structured_resume)

    # Fetch freeform entries
    freeform_cursor = user_freeform_collection.find({'user_id': user_id}).sort("timestamp", -1)
    freeform_entries = [entry.get("text", "") for entry in freeform_cursor if entry.get("text", "")]
    freeform_text = "\n\n".join(freeform_entries)

    # Generate AI resume
    resume_json = ai_resume(job_text, hist_text, freeform_text, resume_id)
    if not resume_json:
        return jsonify({
            "error": "Resume generation failed due to AI error",
            "status": "failed"
        }), 500

    resume_json['resume_id'] = resume_id
    resume_json['status'] = 'processing'

    user_resume_gen_collection.update_one(
        {'user_id': user_id, 'job_id': job_id},
        {'$set': resume_json},
        upsert=True
    )

    RESUME_PROCESSING.remove(resume_id)
    print("******DATABASE INSERTION COMPLETE")

    return jsonify({
        'resumeId': resume_id,
        'status': 'processing'
    }), 200

@app.route('/api/resumes/status/<resume_id>', methods=['GET'])
def get_resume_status(resume_id):
    user_id = request.headers.get('Email', None)
    if not user_id:
        return jsonify({"error": "Missing user ID"}), 401

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
        return jsonify({
            "error": "Resume ID not found"
        }), 404

    if resume_doc['user_id'] != user_id:
        return jsonify({
            "error": "Access forbidden: resume does not belong to this user"
        }), 403

    if resume_doc.get("status") == "processing":
        user_resume_gen_collection.update_one(
            {"resume_id": resume_id},
            {"$set": {"status": "completed"}}
        )

    return jsonify({
        "resume_id": resume_id,
        "status": "completed"
    }), 200

#custom for resume json retrieval
@app.route('/api/resumes/raw/<resume_id>', methods=['GET'])
def get_raw_resume(resume_id):
    user_id = request.headers.get('Email', None)
    if not user_id:
        return jsonify({"error": "Missing user ID"}), 401

    resume_doc = user_resume_gen_collection.find_one({'resume_id': resume_id})
    if not resume_doc:
        return jsonify({"error": "Resume not found"}), 404

    if resume_doc['user_id'] != user_id:
        return jsonify({"error": "Access forbidden: resume does not belong to this user"}), 403

    resume_doc.pop('_id', None) 
    return jsonify({"raw": resume_doc}), 200

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
        return jsonify({"error": "Missing user ID"}), 401

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

# ok so these last two make no sense because we already have a GET and PUT /api/resumes/history 
# but he also wants us to view and edit the freeform text?
@app.route('/api/resumes/freeform', methods=['GET'])
def get_freeform():
    user_id = request.headers.get('Email', None)
    if not user_id:
        return jsonify({"error": "Missing user ID"}), 401

    history_entries = user_freeform_collection.find({"user_id": user_id}).sort("timestamp", -1)

    return Response(
        dumps(list(history_entries)),
        mimetype='application/json'
    )

@app.route('/api/resumes/freeform/<history_id>', methods=['PUT']) #SPRINT 3 STRETCH
def update_freeform(history_id):
    user_id = request.headers.get('Email', None)
    if not user_id:
        return jsonify({"error": "Missing user ID"}), 401

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

    return jsonify({
        "history_id": history_id,
        "status": "updated"
    }), 200


# ***** SPRINT 4 APIS BELOW ********************************************************
#TODO:
@app.route('/api/resumes/format', methods=['POST']) #CORE
def resume_format():
    #STRETCH: PDF and LaTeX output support
    user_id = request.headers.get('Email', None)
    if not user_id:
        return jsonify({"error": "Missing user ID"}), 401
    
    # Grabbing data from request body
    data = request.get_json()
    resume_id = data.get('resumeId')
    if not resume_id:
        return jsonify({'error': 'invalid resume id'}), 400
    format_type = data.get('formatType')
    template_id = data.get('templateId')
    style_id = data.get('styleId')
    
    if (format_type not in ALLOWED_FORMATS) or (template_id not in ALLOWED_TEMPLATES) or (style_id not in ALLOWED_STYLES):
        return jsonify({"error": "invalid request parameters"}), 400

    resume = user_resume_gen_collection.find_one({'user_id':user_id},{'_id':0, 'user_id':0, 'resume_id':0, 'job_id':0, 'status':0})


    if format_type == 'txt':
        resume_content = plain_format(resume)
    elif format_type in ['md', 'html', 'pdf', 'docx', None]:
        resume_content = markdown_format(resume, format_type)
    else:
        template_format(resume, template_id, style_id, format_type)

    # Reading file and writing to temp temp input path
    file_id = fs.put(resume_content, filename=f"resume.{format_type}")

    resume_id = str(uuid.uuid4())
    user_resume_format_collection.insert_one({
        'formatted_resume_id': resume_id,
        'user_id': user_id,
        'file_id': file_id,
        'filename': f"resume.{format_type}",
        'content_type': format_type,
    })
    return jsonify({
        "test": resume_id,
    }), 200

@app.route('/api/resumes/download/<formattedResumeId>', methods=['GET']) #CORE
def download_resume(formattedResumeId):
    user_id = request.headers.get('Email', None)
    if not user_id:
        return jsonify({"error": "Missing user ID"}), 401
    print(formattedResumeId)
    resume_meta = user_resume_format_collection.find_one({'formatted_resume_id': formattedResumeId})
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

@app.route('/api/jobs/advice', methods=['POST']) #CORE
def job_advice():
    user_id = request.headers.get('Email', None)
    if not user_id:
        return jsonify({"error": "Missing user ID"}), 401
    
    #verify no missing fields
    jobId = request.json.get('jobId')
    if not jobId:
        return jsonify({"error": "Missing jobId field"}), 400
    resumeId = request.json.get('resumeId')
    if not resumeId:
        return jsonify({"error": "Missing resumeId field"}), 400
    print("good request\n\n") #debugging

    #verify resume
    resume = user_resume_gen_collection.find_one({"resume_id": resumeId})
    if not resume:
        return jsonify({"error": "Resume not found"}), 404
    if resume.get('user_id') != user_id:
        return jsonify({"error": "Forbidden: Resume does not belong to user"}), 403
    filtered_resume = {
        "career": resume.get("career", []),
        "contact": resume.get("contact", {}),
        "education": resume.get("education", []),
        "skills": resume.get("skills", [])
    }
    print("RESUME GOTTEN: ", filtered_resume, "\n\n") #debugging

    #verify job desc
    job_desc = user_job_desc_collection.find_one({"jobs.job_id": jobId})
    if not job_desc:
        return jsonify({"error": "Job description not found"}), 404
    if job_desc.get('user_id') != user_id:
        return jsonify({"error": "Forbidden: Job does not belong to user"}), 403
    job_entry = next((job for job in job_desc['jobs'] if job['job_id'] == jobId), None)
    if not job_entry:
        return jsonify({"error": "Job description not found"}), 404
    job_text = job_entry.get("text", "")
    print("JOB DESC GOTTEN: ", job_text, "\n\n") #debugging

    advice = ai_advice(filtered_resume, job_text)

    return jsonify({
        "advice": advice,
    }), 200

#TODO:
@app.route('/api/user/job-applications', methods=['GET']) #STRETCH
def get_job_apps():
    user_id = request.headers.get('Email', None)
    if not user_id:
        return jsonify({"error": "Missing user ID"}), 401
    
    return jsonify({
        "test": "test"
    }), 200

#TODO:
@app.route('/api/user/job-applications', methods=['POST']) #STRETCH
def post_job_apps():
    user_id = request.headers.get('Email', None)
    if not user_id:
        return jsonify({"error": "Missing user ID"}), 401
    
    return jsonify({
        "test": "test"
    }), 200

#TODO:
@app.route('/api/templates', methods=['GET']) #STRETCH
def templates():
    user_id = request.headers.get('Email', None)
    if not user_id:
        return jsonify({"error": "Missing user ID"}), 401
    
    return jsonify({
        "test": "test"
    }), 200

# ***** DEBUGGING APIS ********************************************************
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

@app.route('/api/testdb/resumesformat', methods=['GET']) #FOR TESTING/DEBUGGING PURPOSES ONLY, SHOULD NOT BE ACCESSIBLE THRU FRONT END
def get_all_resumes_format():
    resumes_format = user_resume_format_collection.find()
    return dumps(resumes_format), 200

if __name__ == '__main__':
    app.run(debug=True)
