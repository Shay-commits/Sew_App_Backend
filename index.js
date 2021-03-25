const express = require('express')
const bodyparser = require('body-parser')
const app = express()
require('dotenv').config();
const port = 3000;
const db = require('./models/queries')
var passport = require('passport')
var TwitterStrategy = require('passport-twitter').Strategy;
var session = require('express-session')
const sellerRouter = require('./routes/seller_routes');
const{ getSaleItems } = require('./controllers/sale_items');



passport.use(new TwitterStrategy({
    consumerKey: process.env.TWITTER_CONSUMER_KEY,
    consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
    callbackURL: "http://localhost:3000/auth/twitter/callback"
  },
  function(token, tokenSecret, profile, done) {
    
      
      db.query('SELECT * FROM sellers WHERE id = $1', [profile.id], (err,results) => {
          console.log('we got to the first query')
          if (err) {throw err }

          if (results.rowCount > 0) { 

              return done(null, results)}


          // create new account if none exists
          const text = 'INSERT INTO sellers(id, name) VALUES($1, $2)';
          const values = [ profile.id, profile.displayName ]

          db.query(text, values, (err,res) => {
              if (err) {throw err}
              return done(null, res)

          })



      })

    
  }
));

passport.serializeUser(function(user, cb) {
    console.log(`this is the serialise function ${user.id}`)

    cb(null, user.id);
    
  });
  
  passport.deserializeUser(function(obj, cb) {
    console.log(`this is the deserialise function ${obj}`)
    cb(null, obj);
  });
  


app.use(bodyparser.json())

app.use(bodyparser.urlencoded({extended:true}))
app.use(session({ secret: 'SECRET' }));
app.use(passport.initialize());
app.use(passport.session());

app.use('auth/twitter', sellerRouter)



app.get('/', (req, res) => {
    res.json({info: 'postgres database'})
})

app.get('/items', getSaleItems)



app.get('/auth/twitter',
  passport.authenticate('twitter'));

app.get('/auth/twitter/callback', 
  passport.authenticate('twitter', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    console.log('succesful')
    res.redirect('/');
  });


app.listen(port, () => {
    console.log(`app is running on ${port}`)
})

