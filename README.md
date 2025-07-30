

# Crawford Podcast App

A modern podcast application leveraging TypeScript, Python, and web technologies for a robust listening experience.

## Features

- TypeScript-powered frontend for a seamless user interface
- Python backend for powerful API and data handling
- Responsive design with CSS and HTML
- Containerized with Docker for easy deployment
- Clean architecture, leveraging best practices across the stack

## Tech Stack

- **Frontend:** TypeScript, JavaScript, HTML, CSS
- **Backend:** Python
- **Templating:** Mako
- **Containerization:** Docker

## Getting Started

### Prerequisites

- Node.js & npm
- Python 3.x
- Docker (optional, for containerization)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Chidi09/crawford-podcast-app.git
   cd crawford-podcast-app
   ```

2. **Install frontend dependencies:**
   ```bash
   # Move to frontend directory if applicable
   npm install
   ```

3. **Install backend dependencies:**
   ```bash
   # Move to backend directory if applicable
   pip install -r requirements.txt
   ```

### Running the App

- **Frontend:**  
  ```bash
  npm start
  ```

- **Backend:**  
  ```bash
  python main.py
  ```

- **With Docker:**  
  ```bash
  docker build -t crawford-podcast-app .
  docker run -p 8000:8000 crawford-podcast-app
  ```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

MIT

---

Update the directories and commands as needed based on your actual structure.
