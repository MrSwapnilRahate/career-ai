// ========== Day 1 ==============
/*
 mkdir resume-analyzer
 cd resume-analyzer

 npm init

 dependencies install
    npm install express dotenv mongoose
    npm install --save-dev nodmon
*/

/*
    Folder Structure

    src
        mkdir
        conrollers
        routes
        middleware
        models
        services
        utils
        app.js
    server.js
    Package.json
    .env

*/

// ========== Day 2 =============
/*
 Task = 1) User Model
        2) Signuo API
        3) Login API
        4) Password hashing (bcrypt)
*/
/*
npm install bcrypt jsonwebtoken
*/

// =========== Day 3 ===========
/*
Task: JWT Auth + Protected Route
    - User login krega
    - Serever JWT  token dega
    - Protected API sirf logged-in user use kr skega
*/
/*
npm install jsonwebtoken
*/

// ========= Day 4 - Resume Upload API =============
/*
 Task: user resume upload krega (pdf)
      - Server pdf text me extract krega
      - age hm AI se resume analyze krenge
*/
/*
npm install multer pdf-parse
multer -> file upload ke liye
pdf-parse -> pdf text extract krnr ke liye
*/

// ========= Day 5 - Resume Text ko AI(Open API) se Analysis krna =============
/*
 Task: skill detect ho
    -  Resume score mile
    -  Improvement suggestion mile
*/
/*
npm install openai
*/

// ================ Day 6 - skill extractor api ===============

// ================ Day 7 - Score + feedback ==================

// ================ Day 8 - Job Discription vs Resume AI Match =====================
/*
user dega - Resume(PDF) + Job Dicription
AI dega - matchingscore, missing skills, suggestions
*/

// ================ Day 9 - Real SaaS feel - Analyis history API ==================
/*
MongoDB me resume analysis save krna
modals -> Analysis schema
*/

// ======== Complete Flow ================
/*
    User -> React Frontend -> Node API -> AI Analysis -> MongoDB -> Result Dashboard

    1] User Authentication APIs
        1) Signup API
            POST - /api/auth/register
            Body - {
                    "name": "Swapnil",
                    "email": "swapnil@gmail.com",
                    "password": "123456"
                    }
            Flow - User -> Register API -> password bcrypt hash -> MongoDB save -> success response

        2) Login API
            POST - /api/auth/login
            Response - { "token": "JWT_TOKEN" }
            Flow - Login -> verify password -> generate JWT -> send token

    2] Resume Upload + Analysis
        POST - /api/resume/job-match
        Headers - Authorization: Bearer TOKEN
        BODY(form-data) - resume(file)
                          jobDescription(text)
        Flow - User upload resume -> Multer upload file -> PDF parse(extract text) -> Send text to AI -> AI generate analysis -> Save result in MongoDB -> Return result
        Response - {
                    "message": "Analysis complete",
                    "result": "Match Score 72%"
                    }

    3] Resume Histoey API
        GET - /api/resume/history
        Headers - Authorization: Bearer TOKEN
        FLOW - User request history - JWT verify -> Find user analysis in MongoDB -> Return list
        Response - [
                        {
                            "resumeName": "resume.pdf",
                            "aiResult": "Match Score 75%"
                        }
                    ]

    4] Database Structure (MongoDB Collections)
        1) Users - user
           Fields - name
                    email
                    password

        2) Analysis - Analysis
           Fields - userId
                    resumeName
                    resumeText
                    jobDescription
                    aiResult
                    createdAt

    5] Full Architucture
        Frontend (React)
            |
        API (Node + Express)
            |
        Auth Middleware (JWT)
            |
        File Upload (Multer)
            |
        PDF Parser
            |
        AI Service
            |
        MongoDB

    6) API list
        1) /api/auth/register     POST    Resgister user
        2) /api/auth/login        POST    Login
        3) /api/resume/job-match  POST    Resume AI analysis
        4) /api/resume/history    GET     Get user history
        5) /api/resume/:id        GET     Get resume by id
        6) /api/resume/delete/:id DELETE  Delete analysis

        7) /api/resume/ats-score  GET     ATS score API ;
*/

// ================ Day 10 - Global Error Handler ===========
/*
abhi agar error ata hai - const user = await User.findById(id);
agar error ata to: server crash ya random response
                    - aur frontend ko proper error nhi milta
Soluction - Global Error Handler
*/
/*
error middleware bnayenge
*/

// ================ Day 11 - Input Validation Library (Joi) =========
/*
ye library request ane se philehi data check krleti hai
*/
/*
npm install jio

src
    validation
        resumeValidation.js

Flow - Request -> Validation -> Controller -> AI Analysis -> MongoDB Save -> Response
*/

// ================ Day 12 - Rate Lomiting(Security)(express-rate-limit) ==========
/**
 * IMP Bcoz project me AI API call ho rhi hai, agar koi user spam kre to mera paise jyda khrch hoga
 *
 * nom install express-rate-limit
 *
 * src
 *  middleware
 *      rateLimitMiddleware.js
 *
 * Flow - Request -> Rate Limit Check -> Auth Middleware -> Controller -> AI Service
 */

// ================ Day 13 - Logging System(winston) =========================
/**
 * konsi API call hue, kha error aaya, kitna time lga
 *
 * npm install winston
 *
 * Flow - Request -> Rate Limit -> Validation -. Auth Middleware -> Controller -> Logging -> AI Service -> MongoDB
 */

//============ Complete Fetures =========
/**
 * Auth System
 * Resume upload
 * AI analysis
 * MongoDB save
 * History API
 * Error handling
 * Validation
 * Rate limiting
 * Logging
 * Environment config
 */

// =============== Day 14 - Backend GitHub Push ===============
/**
 * git init
 * git add .
 * git commit -m "initial commit"
 * git branch -M main
 * git remote add origin repo_link
 * git push -u origin main
 */

// ============ Day 15 - Backen Deploy (Render) =================
/**
 * render.com
 * login using GitHub
 * New -> Web Service -> AI_Resume_Analyzer_Backend(Repo select)
 * Configuration
 *      Runtime - Node
 *      Build Command - npm install
 *      Start Command - node server.js
 *
 * Environment Variables
 *   Add Environment Variables
 *      MONGO_URI=
 *      JWT_SECRET=
 *      OPENAI_API_KEY=
 *
 * Create Web Service
 *
 * Render automatically - clone repo, install dependencies, start server
 *
 * URL milega - https://ai-resume-anlyzer-backend.onrender.com
 *
 */

// ============ Day 16 - CORS ======================
/**
 * npm install cors
 *
 * app.js
 *      import cors from "cors";
 *      const app = express();
 *      app.use(cors());
 *      app.use(express.json());
 */

// ================= Day 17 - Cloudinary(Backend) ==================
/**
 * cloude pe resume upload krnekeliye
 * 
 * npm install cloudinary multer-storage-cloudinary
 */