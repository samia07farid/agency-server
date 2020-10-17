const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs-extra');
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config()
const fileUpload = require('express-fileupload');

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.djh40.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const app = express()
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('servies'));
app.use(fileUpload());
const port = 5000;

app.get('/', (req, res) => {
    res.send('hello, db is working')
})

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect(err => {
    const serviceCollection = client.db("agencyDb").collection("services");
    const reviewCollection = client.db("agencyDb").collection("reviews");
    const userOrder = client.db("agencyDb").collection("userOrder");
    const adminCollection = client.db("agencyDb").collection("admin");

    // for service 
    app.post('/addService', (req, res) => {
        const file = req.files.file;
        const name = req.body.name;
        const description = req.body.description;
        const filePath = `${__dirname}/services/${file.name}`;
        file.mv(filePath, err => {
            if (err) {
                console.log(err);
                res.status(500).send({ msg: 'Failed to upload image' });
            }
        
            const newImg = fs.readFileSync(filePath);
            const encImg = newImg.toString('base64');

            var image = {
                contentType: req.files.file.mimetype,
                size: req.files.file.size, 
                img: Buffer.from(encImg, 'base64')
            }

            serviceCollection.insertOne({ image, name, description })
                .then(result => {
                    fs.remove(filePath, error => {
                        if(error) {
                            console.log(error);
                            res.status(500).send({ msg: 'Failed to upload image' });
                        }
                        res.sendStatus(result.insertedCount ? 200 : 500)
                    })
                    
                })
            })    
        })

        app.get('/service', (req, res) => {
            serviceCollection.find({})
                .toArray((err, documents) => {
                    res.send(documents);
                })
        })

        // for review 
        app.post('/addReviews', (req, res) => {
            const reviews = req.body;
            reviewCollection.insertOne(reviews)
                .then(result => {
                    console.log(result)
                    res.send(result)
                })
        })

        app.get('/reviews', (req, res) => {
            reviewCollection.find({})
                .toArray((err, documents) => {
                    res.send(documents);
                })
        })

        // for user order
        app.post('/placeOrder', (req, res) => {
            const orders = req.body;
            userOrder.insertOne(orders)
                .then(result => {
                    console.log(result)
                    res.send(result)
                })
        })

        app.get('/seeOrder', (req, res) => {
            userOrder.find({ email: req.query.email })
                .toArray((err, documents) => {
                    res.send(documents);
                })
        })

        app.get('/allOrder', (req, res) => {
            userOrder.find({})
                .toArray((err, documents) => {
                    res.send(documents);
                })
        })

        // for admin
        app.post('/adminEmail', (req, res) => {
            const email = req.body;
            adminCollection.insertOne(email)
                .then(result => {
                    console.log(result)
                    res.send(result)
                })
        })

        app.post('/isAdmin', (req, res) => {
            const email = req.body.email;
            adminCollection.find({ email: email })
                .toArray((err, admin) => {
                    res.send(admin.length > 0);
                })
        })

    });


    app.listen(process.env.PORT || port)