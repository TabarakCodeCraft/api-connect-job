# Connect Jobs Backend API

## Employee Profile API Endpoints

### Authentication Required
All endpoints require authentication with a valid JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Profile Endpoints

#### GET /api/employee/profile
Get the current employee's profile with education and experience data.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "location": "San Francisco",
    "bio": "About me...",
    "cvUrl": "/uploads/cv-123.pdf",
    "educations": [...],
    "experiences": [...]
  }
}
```

#### PUT /api/employee/profile
Update the employee's basic profile information.

**Request Body:**
```json
{
  "username": "John Doe",
  "phone": "+1234567890",
  "location": "San Francisco",
  "bio": "About me..."
}
```

#### PUT /api/employee/profile/cv
Upload a CV file (PDF, DOC, DOCX).

**Request:** Multipart form data with file field 'cv'


## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Install multer for file uploads:
```bash
npm install multer
```

3. Set up environment variables in `.env`:
```
DATABASE_URL="your-database-url"
JWT_SECRET="your-jwt-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
```

4. Run database migrations:
```bash
npx prisma migrate dev
```

5. Start the server:
```bash
npm run dev
```

## File Upload

- CV files are stored in the `uploads/` directory
- Supported formats: PDF, DOC, DOCX
- Maximum file size: 5MB
- Files are served statically at `/uploads/` endpoint 