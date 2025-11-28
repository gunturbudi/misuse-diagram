# app.py (updated with improved error handling and Bahasa Indonesia output)
from flask import Flask, render_template, request, jsonify
import os
import json
import logging
import traceback
from datetime import datetime
from dotenv import load_dotenv

# Try to import aisuite, but make it optional for testing
try:
    import aisuite as ai
    AISUITE_AVAILABLE = True
except ImportError:
    AISUITE_AVAILABLE = False
    print("WARNING: aisuite not available - AI features will be disabled")

# Load environment variables first
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('api_calls.log'),
        logging.StreamHandler()  # Also print to console
    ]
)

class APILogger:
    def __init__(self):
        self.logger = logging.getLogger('api.llm')

    def log_request(self, model, messages, temperature, **kwargs):
        """Log details of the API request"""
        self.logger.info(f"API REQUEST: {model}")
        self.logger.info(f"Temperature: {temperature}")
        self.logger.info(f"Message count: {len(messages)}")
        # Log first few chars of the last message to avoid logging sensitive data
        if messages and len(messages) > 0:
            last_msg = messages[-1].get('content', '')
            preview = last_msg[:100] + ('...' if len(last_msg) > 100 else '')
            self.logger.info(f"Last message preview: {preview}")

        # Log additional parameters if present
        for key, value in kwargs.items():
            self.logger.info(f"Param {key}: {value}")

        return datetime.now()  # Return timestamp for duration calculation

    def log_response(self, start_time, status, content_length=None, error=None):
        """Log details of the API response"""
        duration = datetime.now() - start_time
        self.logger.info(f"API RESPONSE: {status}")
        self.logger.info(f"Duration: {duration.total_seconds():.2f}s")

        if content_length:
            self.logger.info(f"Content length: {content_length} chars")

        if error:
            self.logger.error(f"Error: {error}")

app = Flask(__name__)

# Initialize AIsuIte client if available
if AISUITE_AVAILABLE:
    client = ai.Client()
    api_logger = APILogger()
    # MODEL = "together:meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8"  # You can change to your preferred model
    MODEL = "groq:meta-llama/llama-4-maverick-17b-128e-instruct"
else:
    client = None
    api_logger = APILogger()
    MODEL = None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/save', methods=['POST'])
def save_diagram():
    try:
        # Could be expanded to save diagrams to a database
        data = request.json
        # For now, just return success
        return jsonify({"status": "success"})
    except Exception as e:
        logging.error(f"Error saving diagram: {str(e)}")
        logging.error(traceback.format_exc())
        return jsonify({
            "status": "error",
            "message": f"Gagal menyimpan diagram: {str(e)}"
        }), 500

@app.route('/generate_misuse_cases', methods=['POST'])
def generate_misuse_cases():
    # Check if AI is available
    if not AISUITE_AVAILABLE or client is None:
        return jsonify({
            "status": "error",
            "message": "AI service tidak tersedia. Fitur ini memerlukan konfigurasi AI."
        }), 503

    try:
        data = request.json
        use_case_name = data.get('useCaseName', '')
        system_name = data.get('systemName', 'the system')
        other_use_cases = data.get('otherUseCases', [])

        # Validate input data
        if not use_case_name:
            return jsonify({
                "status": "error",
                "message": "Nama use case diperlukan"
            }), 400

        # Craft the prompt for the LLM - Modified to force Bahasa Indonesia output
        system_prompt = """Anda adalah seorang ahli keamanan yang mengkhususkan diri dalam mengidentifikasi potensi kasus penyalahgunaan (misuse case) untuk sistem perangkat lunak.
        Diberikan sebuah use case, identifikasi 3-5 skenario penyalahgunaan potensial yang dapat mengancamnya.
        Format respons Anda sebagai array JSON dengan struktur berikut:
        [
            {
                "name": "Nama singkat kasus penyalahgunaan",
                "description": "Deskripsi detail yang menjelaskan skenario penyalahgunaan",
                "actor": "Jenis aktor berbahaya yang mungkin melakukan ini",
                "impact": "Dampak potensial dari kasus penyalahgunaan ini"
            },
            ...
        ]
        PENTING: Respons Anda HARUS sepenuhnya dalam Bahasa Indonesia, termasuk semua nilai dalam JSON.
        Hanya berikan array JSON saja tanpa tambahan kalimat lain."""

        user_prompt = f"""Use Case: {use_case_name}
        Sistem: {system_name}
        Use Case Terkait: {', '.join(other_use_cases) if other_use_cases else 'Tidak ada'}
        Harap generate 3-5 kasus penyalahgunaan (misuse case) realistis yang dapat mengancam use case ini.
        Fokus pada kerentanan keamanan, pola penggunaan berbahaya, dan potensi eksploitasi sistem.
        Respons Anda HARUS dalam Bahasa Indonesia."""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        # Log the API request
        start_time = api_logger.log_request(
            model=MODEL,
            messages=messages,
            temperature=0.7,
            user_case=use_case_name,
            system_name=system_name
        )
        
        # Set timeout for API request
        try:
            # Call the LLM using AIsuIte
            response = client.chat.completions.create(
                model=MODEL,
                messages=messages,
                temperature=0.7,
                timeout=30  # 30 second timeout
            )
            
            result = response.choices[0].message.content
            
            # Log successful response
            api_logger.log_response(
                start_time=start_time,
                status="success",
                content_length=len(result) if result else 0
            )
            
            # Attempt to parse the JSON response
            try:
                # Try direct JSON parsing
                misuse_cases = json.loads(result)
                
                # Validate the structure of each misuse case
                for i, misuse_case in enumerate(misuse_cases):
                    # Check for required fields
                    for field in ["name", "description", "actor", "impact"]:
                        if field not in misuse_case:
                            misuse_case[field] = f"Informasi {field} tidak tersedia"
                
                return jsonify({"status": "success", "data": misuse_cases})
            
            except json.JSONDecodeError:
                # If the response isn't valid JSON, try to extract JSON from the text
                # This handles cases where the LLM might add explanatory text
                import re
                json_match = re.search(r'\[\s*\{.*\}\s*\]', result, re.DOTALL)
                if json_match:
                    try:
                        misuse_cases = json.loads(json_match.group(0))
                        return jsonify({"status": "success", "data": misuse_cases})
                    except Exception as parse_error:
                        api_logger.log_response(
                            start_time=start_time,
                            status="error",
                            error=f"Kesalahan parsing JSON: {str(parse_error)}"
                        )
                        logging.error(f"JSON parse error: {str(parse_error)}")
                        logging.error(traceback.format_exc())
                
                # If all parsing attempts fail, return a helpful error message
                error_msg = "Gagal memproses respons LLM sebagai JSON"
                api_logger.log_response(
                    start_time=start_time,
                    status="error",
                    error=error_msg
                )
                return jsonify({
                    "status": "error",
                    "message": error_msg,
                    "data": []  # Return empty array instead of failing completely
                })
                
        except Exception as e:
            # Log the error
            api_logger.log_response(
                start_time=start_time,
                status="error",
                error=str(e)
            )
            logging.error(f"LLM API error: {str(e)}")
            logging.error(traceback.format_exc())
            return jsonify({
                "status": "error", 
                "message": f"Error saat generate kasus penyalahgunaan: {str(e)}",
                "data": []  # Return empty array instead of failing completely
            })
            
    except Exception as e:
        # Catch all other errors
        logging.error(f"Unexpected error in generate_misuse_cases: {str(e)}")
        logging.error(traceback.format_exc())
        return jsonify({
            "status": "error",
            "message": f"Kesalahan tidak terduga: {str(e)}",
            "data": []  # Return empty array instead of failing completely
        }), 500

if __name__ == '__main__':
    app.run(debug=True)