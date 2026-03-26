# SyntaxLab
A full-stack application designed to bridge the gap between theoretical DBMS concepts and live classroom execution. By integrating a randomized team-selection engine with a dynamic PostgreSQL bridge, SyntaxLab eliminates hardware bottlenecks and time crunches in large-scale learning environments.

## How to Run Locally

### 1. Prerequisites
- [Node.js](https://nodejs.org/) installed
- [PostgreSQL](https://www.postgresql.org/) database running locally

### 2. Installation
Clone the repo and install dependencies. The setup script will automatically install both frontend and backend dependencies.
```bash
git clone https://github.com/AbdulRahman1807/SyntaxLab.git
cd SyntaxLab
npm install
```

### 3. Environment Variables
You need to provide your PostgreSQL credentials to run the backend engine.
Inside the `server/` directory, duplicate the example file and rename it to `.env`:
```bash
cp server/.env.example server/.env
```
Then, edit `server/.env` to include your exact PostgreSQL password and verify the connection settings.

### 4. Start Development Servers
You can run a single command that will boot up both the React frontend and the Express backend simultaneously:
```bash
npm run dev
```

The application will be running at [http://localhost:5173](http://localhost:5173).
