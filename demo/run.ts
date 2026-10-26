import express from 'express';

// Import routes
import userRoutes from './routes/userRoutes.js';
import laptopRoutes from './routes/laptopRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database connection

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('static_files'));

// Session configuration
app.use(sessionMiddleware({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', './views');

// Routes
app.use('/', userRoutes);
app.use('/', laptopRoutes);
app.use('/admin', adminRoutes);

// Home route
app.get('/', (req, res) => {
    res.render('index', { title: 'Laptop Search' });
});

// Database connection and server start
async function startServer() {
    try {
        await sequelize.authenticate();
        console.log('Database connection established successfully.');
        
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
}

startServer();