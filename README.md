# **CS490**

## **Tech Stack**

- **Frontend:** Next.js (Page Router), TypeScript
- **Styling:** Tailwind CSS, Framer Motion
- **Backend:** Flask, REST APIs
- **Database:** TBD (MongoDB?)
- **Authentication:** Auth0 by Okta
- **Testing:** Vitest, pytest

## **Setup Instructions**

### **Frontend**
1. Clone the repository:
   ```sh
   git clone <repository-url>
   cd <project-folder>
   cd frontend
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Run the development server:
   ```sh
   npm run dev
   ```

### **Backend**
1. Navigate to the backend folder:
   ```sh
   cd backend
   ```
2. Create a virtual environment and activate it:
   ```sh
   python -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   ```
3. Install dependencies:
   ```sh
   export OPENAI_API_KEY=(put openai api key here)
   sudo apt install -y libreoffice # Needed for docx files
   sudo apt install pandoc # Needed for converting formatted resumes to docx
   sudo apt install texlive-full
   pip install -r requirements.txt
   ```
4. Start the Flask server:
   ```sh
   flask run
   ```

## **Testing**
- **Frontend Testing:**
  ```sh
  npm run test
  ```
- **Backend Testing:**
  ```sh
  pytest
  ```
