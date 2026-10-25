# Bless to Art

React storefront and FastAPI/MongoDB API for the Bless to Art catalogue and order-enquiry flow.

## Run locally

Prerequisites: Node.js 22+, Python 3.11+, and Docker Desktop.

1. Create your local environment files from the included templates:

   ```powershell
   Copy-Item backend/.env.example backend/.env
   Copy-Item frontend/.env.example frontend/.env
   ```

   Set a private `ADMIN_PASSWORD` in `backend/.env`.

2. Start MongoDB:

   ```powershell
   docker compose up -d mongo
   ```

3. In one terminal, install and run the API:

   ```powershell
   python -m venv backend/.venv
   backend/.venv/Scripts/python -m pip install -r backend/requirements.txt
   backend/.venv/Scripts/python -m uvicorn server:app --app-dir backend --reload --port 8001
   ```

4. In a second terminal, install and run the storefront:

   ```powershell
   Set-Location frontend
   npm install --legacy-peer-deps
   npm start
   ```

The storefront runs at http://localhost:4200 and calls the API at http://localhost:8001. The API allows both localhost and 127.0.0.1 on ports 3000 and 4200 by default. Confirm the API at http://localhost:8001/api/.

Images uploaded through Admin use the `IMAGE_STORAGE` setting in `backend/.env`. The default `local` option saves files under `backend/uploads/`, which is ignored by Git. To use the private Amazon S3 bucket, set `IMAGE_STORAGE=s3` and configure `AWS_REGION`, `AWS_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, and `AWS_SECRET_ACCESS_KEY`. The frontend continues to load images through the API, so the S3 bucket does not need public access.

## Database deployment

Use MongoDB Atlas for the deployed database: it is the managed version of the database already used by this app, avoids server maintenance, and can begin with an Atlas Free cluster for testing. Select a region close to the deployed backend and your customers, create a least-privilege database user, restrict network access to the backend host, and put the Atlas connection string in the backend host's `MONGO_URL` secret. Upgrade to a paid tier before relying on it for production availability and backups.

When frontend and backend are deployed, set `CORS_ORIGINS` on the backend to the exact deployed frontend URL(s), separated by commas. Do not use `*` with credentialed requests.
