import express, { Request, Response } from 'express'
import routes from './app/routes/index'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import 'dotenv/config'
import { PORT } from './config/config'
import rateLimit from 'express-rate-limit'
import hpp from 'hpp'
import helmet from 'helmet'

import passport from "./config/passport"
import path from 'path'
import { uploadLimitHandler } from './helpers/files/multer'
import { initiateSuperAdmin } from './initialization/initiateSuperAdmin'
import { autoTrackVisitor } from './app/middleware/visitor.middleware'
import GlobalErrorHandler from './app/middleware/globalErrorHandler'

//Initialize Express
const app = express()

//Passport initializing
app.use(passport.initialize());

//Middleware
//Webhooks

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://103.143.148.254:3001',
    'https://store.dhrubix.com'
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true,
}));


app.use(hpp())
app.use(helmet())

app.use(express.json({ limit: '200mb' }))
app.use(express.urlencoded({ limit: '200mb', extended: true }))
app.use(cookieParser())

// initiate super admin
initiateSuperAdmin();

app.use(autoTrackVisitor);

// Request Rate Limit
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 6000 })
app.use(limiter)

app.set('etag', false);

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

//Routes
app.use('/api/v1', routes);
app.use(GlobalErrorHandler);

// Multer limiter
app.use(uploadLimitHandler);

app.get('/', (req: Request, res: Response) => res.send("API Working"))
app.use("*", (req: Request, res: Response) => {
  res.status(404).json({ status: "fail", data: "Incorrect API" });
});

//Port
app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`)
})

export default app;