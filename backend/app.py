import uuid
from flask import Flask, request, jsonify

ALLOWED_EXTENSIONS = {'docx', 'pdf'}
career_hist_texts = {}

app = Flask(__name__)



@app.route('/')
def hello():
    return 'Hello, World!'

@app.route('/api/resumes/upload', methods=['POST'])
def upload_resume():
    file = request.files['file']
    file_name, file_ext = file.filename.rsplit('.', 1)
    resume_id = uuid.uuid4

    if file and file_ext in ALLOWED_EXTENSIONS:
        return jsonify({
            'resumeId': resume_id,
            'status': 'processing'
        }), 200
    
    return jsonify({
        'error': 'Unsupported file type',
        'status': 'failed'
    }), 400

@app.route('/api/resumes/history', methods=['POST'])
def upload_career_history():
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

@app.route('/api/resumes/history', methods=['GET'])
def get_career_history():
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

@app.route('/api/resumes/education', methods=['GET'])
def get_edu_history():
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

if __name__ == '__main__':
    app.run(debug=True)