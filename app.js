require('dotenv').config({
    path: `./env-files/${process.env.NODE_ENV || 'development'}.env`,
})

var express = require('express');
var path = require('path');
var redis = require('redis');
var expressLayouts = require('express-ejs-layouts');
var cookieParser = require('cookie-parser');
var redisClient = redis.createClient();

var session = require('express-session');
var redisStore = require('connect-redis')(session);
var bodyParser = require('body-parser');

var initAuthMiddleware = require('./features/login/init-auth-middleware');
const indexRouter = require('./routes/index');

var StoreRedis = new redisStore({
    host: 'localhost',
    port: 6379,
    url: 'redis://:@127.0.0.1:6379',
    client: redisClient,
    ttl: 260
});

var app = express();

app.set('views', path.join(__dirname + '/views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.engine('html', require('ejs').renderFile);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '/public')));

app.enable('trust proxy');

redisClient.on('error', err => {
    console.log('Redis error: ', err);
});

const { COOKIE_EXPIRATION_MS } = process.env;

app.use(session({
    secret: 'ssshhhhh',
    store: StoreRedis,
    saveUninitialized: false,
    resave: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        expires: Date.now() + parseInt(COOKIE_EXPIRATION_MS, 10),
        maxAge: parseInt(COOKIE_EXPIRATION_MS, 10),
    },
}));

initAuthMiddleware(app);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/', indexRouter);

app.use((req, res) => {
    res.status(404).render('pages/404');
});

module.exports = app;