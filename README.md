# UML Use Case Editor with AI-Powered Misuse Case Generation

A Flask-based web application that provides an interactive UML Use Case diagram editor with AI-powered security threat analysis. The system automatically generates misuse cases (security threat scenarios) to help identify potential vulnerabilities in your use case diagrams.

## Features

- **Interactive UML Editor**: Canvas-based diagram creation with support for:
  - Actors and Use Cases
  - System boundaries
  - Relationships (Association, Include, Extend, Generalization)
  - Misusers and Misuse Cases

- **AI-Powered Security Analysis**: Generate security threats using LLM integration
  - Automatic misuse case generation from selected use cases
  - Threat scenarios with actors, descriptions, and impact assessments
  - Support for multiple AI providers (Groq, Together AI)

- **Export Capabilities**: Export diagrams as SVG or PNG

- **Auto-save**: Automatic diagram persistence to browser storage

- **Undo/Redo**: Full history management for diagram changes

## Architecture

### Backend
- **Flask**: Web framework for API endpoints
- **aisuite**: LLM integration library supporting multiple AI providers
- **python-dotenv**: Environment variable management

### Frontend
- **Fabric.js**: Canvas manipulation and interactive graphics
- **Modular ES6 JavaScript**: Clean separation of concerns with modules for:
  - Core canvas management
  - Element creation and manipulation
  - Connection handling
  - UI controls and interactions
  - Font and styling management
  - History tracking
  - AI integration

## Prerequisites

- Python 3.11 or higher
- Docker and Docker Compose (for containerized deployment)
- API key from one of the supported AI providers:
  - [Groq](https://console.groq.com/keys) (recommended)
  - [Together AI](https://api.together.xyz/settings/api-keys) (alternative)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/gunturbudi/misuse-diagram.git
cd misuse-diagram
```

### 2. Configure Environment Variables

Copy the example environment file and add your API keys:

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:

```env
GROQ_API_KEY=your_actual_groq_api_key_here
TOGETHER_API_KEY=your_actual_together_api_key_here  # Optional
```

**Important**: Never commit the `.env` file to version control. It's already included in `.gitignore`.

### 3. Installation Options

#### Option A: Local Development

Install Python dependencies:

```bash
pip install -r requirements.txt
```

Run the Flask development server:

```bash
python app.py
```

The application will be available at `http://localhost:5000`

#### Option B: Docker Deployment (Recommended)

Build and run using Docker Compose:

```bash
docker-compose up -d
```

The application will be available at `http://localhost:2346`

To view logs:

```bash
docker-compose logs -f
```

To stop the application:

```bash
docker-compose down
```

To rebuild after code changes:

```bash
docker-compose up -d --build
```

## Docker Deployment Details

The Docker setup includes:

- **Container**: Flask application running on Python 3.11-slim
- **Port Mapping**: Internal port 5000 mapped to external port 2346
- **Volume Mounts**: Source code mounted for hot-reloading during development
- **Logging**: API calls logged to `api_calls.log`
- **Network**: Isolated bridge network for the application

### Production Deployment

For production, modify `docker-compose.yml`:

1. Change environment variables:
```yaml
environment:
  - FLASK_ENV=production
  - FLASK_DEBUG=0
```

2. Remove development volume mounts (keep only logs)

3. Consider using gunicorn in the Dockerfile CMD:
```dockerfile
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "app:app"]
```

## Configuration

### AI Model Selection

The application uses AI models for misuse case generation. To change the model, edit `app.py`:

```python
# Current default model
MODEL = "groq:meta-llama/llama-4-maverick-17b-128e-instruct"

# Alternative model
# MODEL = "together:meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8"
```

### API Logging

All AI API calls are automatically logged to `api_calls.log` with:
- Timestamp
- Request details
- Response data
- Execution duration

## Usage

1. **Create Diagram Elements**:
   - Use the toolbar to select element types (Actor, Use Case, etc.)
   - Click on the canvas to place elements
   - Double-click text to edit labels

2. **Create Connections**:
   - Select a connection type from the toolbar
   - Click on the source element (highlights blue)
   - Click on the target element (validates and creates connection)

3. **Generate Misuse Cases**:
   - Select a use case element
   - Click "Generate Misuse Cases" in the sidebar
   - Review AI-generated security threats
   - Add relevant threats to your diagram

4. **Export Diagram**:
   - Use the export button to save as SVG or PNG
   - Diagrams are also auto-saved to browser storage

## Troubleshooting

### Element Interaction Issues
- If canvas elements become unselectable, click the "Fix Interaction" button in the header
- Press ESC to cancel ongoing operations
- Double-tap ESC (within 500ms) to clear all dialog overlays

### API Errors
- Check that your API keys are correctly set in `.env`
- Verify API key validity at the provider's dashboard
- Check `api_calls.log` for detailed error messages

### Docker Issues
- Ensure Docker daemon is running
- Check port 2346 is not already in use: `netstat -ano | findstr :2346`
- View container logs: `docker-compose logs -f`

## Development

### Project Structure

```
flask-uml-editor/
├── app.py                      # Flask application and API endpoints
├── requirements.txt            # Python dependencies
├── Dockerfile                  # Docker container configuration
├── docker-compose.yml          # Docker Compose orchestration
├── .env                        # Environment variables (not in git)
├── .env.example                # Environment template
├── static/
│   ├── css/
│   │   └── style.css          # Application styles
│   └── js/
│       ├── main.js            # Application entry point
│       └── modules/           # Modular JavaScript components
│           ├── core.js        # Canvas and state management
│           ├── elements.js    # UML element creation
│           ├── connections.js # Relationship handling
│           ├── ui.js          # User interface controls
│           ├── utils.js       # Utilities and export
│           ├── fontManager.js # Text styling
│           ├── misuseCaseManager.js  # AI integration
│           └── historyManager.js     # Undo/redo
└── templates/
    └── index.html             # Main application template
```

### Adding New Features

See `CLAUDE.md` for detailed development guidelines including:
- Module communication patterns
- Adding new UML elements
- Connection system architecture
- Error handling conventions

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is available for educational and research purposes.

## Acknowledgments

- Built with [Flask](https://flask.palletsprojects.com/)
- Canvas rendering powered by [Fabric.js](http://fabricjs.com/)
- AI integration via [aisuite](https://github.com/andrewyng/aisuite)
- LLM services provided by [Groq](https://groq.com/) and [Together AI](https://www.together.ai/)

## Support

For issues, questions, or contributions, please visit the [GitHub repository](https://github.com/gunturbudi/misuse-diagram).
