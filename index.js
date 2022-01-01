const express = require('express');
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const cors = require('cors');
require('dotenv').config()
const fileUpload = require('express-fileupload')
const app = express();
const port = process.env.PORT || 5000;

// middleware
// app.use(cors());
app.use(cors({
    origin: '*'
}));
app.use(express.json());
app.use(fileUpload());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mhdj2.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        await client.connect();
        const database = client.db('HeroRiderDB');
        const userCollection = database.collection('users');

        // Riders Post API
        app.post('/users', async (req, res) => {
            const dlImg = req.files?.dl?.data;
            const nidImg = req.files.nid.data;
            const profileImg = req.files.profile.data;
            const nidBuffer = Buffer.from(nidImg.toString('base64'), 'base64')
            const profileBuffer = Buffer.from(profileImg.toString('base64'), 'base64')
            let user;
            if (dlImg) {
                const dlBuffer = Buffer.from(dlImg.toString('base64'), 'base64');
                user = {
                    ...req.body,
                    dl: dlBuffer,
                    nid: nidBuffer,
                    profile: profileBuffer
                }
            }
            else {
                user = {
                    ...req.body,
                    nid: nidBuffer,
                    profile: profileBuffer
                }
            }
            const result = await userCollection.insertOne(user);
            res.json(result);
        });

        // Check user Role API
        app.get('/users/role', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await userCollection.findOne(query);
            let userRole;
            if (user?.role === 'Rider') {
                userRole = 'Rider'
            }
            else if (user?.role === 'Learner') {
                userRole = 'Learner'
            }
            else if (user?.role === 'Admin') {
                userRole = 'Admin'
            }
            res.json({ role: userRole });
        })

        // All users GET API
        app.get('/users', async (req, res) => {
            const query = {
                $or: [
                    { role: "Rider" },
                    { role: "Learner" }
                ]
            };
            const cursor = await userCollection.find(query);
            const count = await cursor.count();
            const page = req.query.page;
            const size = parseInt(req.query.size);
            const email = req.query.email;
            let users;

            if (email) {
                users = await userCollection.findOne({ email: email })
            }
            else if (page) {
                users = await cursor.skip(page * size).limit(size).toArray();
            }
            else {
                users = await cursor.toArray();
            }

            res.json({ count, users });
        })

    }
    finally {
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('hero rider server is running')
})

app.listen(port, () => {
    console.log('hero rider server is running on port', port);
})