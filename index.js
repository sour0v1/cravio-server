const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
// const cookieParser = require('cookie-parser');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true
}));

// mongodb connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xhnq0hd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

// middlewares
// step 5
const verifyToken = (req, res, next) => {
    const token = req.cookies?.token;
    console.log('tokennn -',token);
    if (!token) {
        return res.status(401).send({ message: 'unauthorized' })
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'unauthorized' })
        }
        // console.log('userrr - ', decoded)
        req.user = decoded;
        next();
    })

}
// step 6
const verifyUser = (req, res, next) => {
    const userEmail = req.query.email;
    if (userEmail !== req.user.email) {
        return res.status(401).send({ message: 'unauthorized' })
    }
    next();
}
// finally use middleware in the api

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        const database = client.db("cravio");
        const foodCollection = database.collection("foods");
        const requestFoodCollection = database.collection('requestedFood');

        // api to set token to the cookie
        // [step 2, 4 from client side]
        // step 1
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            console.log(user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1h'
            })
            res.cookie('token', token, {
                httpOnly: true,
                secure: true,
                sameSite: 'None'
            })
            res.send({ success: true });
        })
        // api to remove token from cookie
        // step 3
        app.post('/remove-token', async (req, res) => {
            const user = req.body;
            // console.log('user - ', user)
            res.clearCookie('token', {
                httpOnly: true,
                secure: true,
                sameSite: true,
                maxAge: 0
            })
            res.send({ success: true })
        })
        //---ok
        app.get('/available-foods', async (req, res) => {
            const { availability } = req.query;
            // console.log(availability)
            const query = { status: availability }
            const result = await foodCollection.find(query).toArray();
            res.send(result);
            // console.log(availability);
        })
        //---ok
        app.get('/food/:id', async (req, res) => {
            const id = req.params.id;
            // console.log('food',id);
            const query = { _id: new ObjectId(id) }
            const result = await foodCollection.findOne(query);
            // console.log(id);
            res.send(result);
        })
        // ---ok
        app.get('/manage-food', verifyToken, verifyUser, async (req, res) => {
            const userEmail = req.query.email;
            const query = { donatorEmail: userEmail }
            // console.log(userEmail)
            const result = await foodCollection.find(query).toArray();
            res.send(result);
        })
        // ---ok
        app.put('/food/update', verifyToken, async (req, res) => {
            const food = req.body;
            console.log(food)
            const filter = { _id: new ObjectId(`${food.id}`) }
            const updatedFood = {
                $set: {
                    foodName: food.fname,
                    foodImg: food.fImage,
                    foodQuantity: food.fQuantity,
                    date: food.eDate,
                    notes: food.note,
                    location: food.pLocation
                }
            }
            const result = await foodCollection.updateOne(filter, updatedFood);
            res.send(result);
            console.log(updatedFood);
        })
        //---ok
        app.get('/requested-food', verifyToken, verifyUser, async (req, res) => {
            const userEmail = req.query.email;
            // console.log('user for the valid token - ', req.user.email)
            // console.log(userEmail)
            const query = { email: userEmail }
            // console.log(userEmail)
            const result = await requestFoodCollection.find(query).toArray();
            res.send(result);
        })

        // ---ok
        app.post('/request-food', verifyToken, async (req, res) => {
            const foodDetails = req.body;
            const result = await requestFoodCollection.insertOne(foodDetails);
            res.send(result);
        })
        //---ok
        app.post('/add-food', verifyToken, async (req, res) => {
            const foodDetails = req.body;
            // console.log(foodDetails);
            const result = await foodCollection.insertOne(foodDetails);
            res.send(result);
        })
        // ---ok
        app.delete('/delete-food/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            console.log('deleted',id);
            const query = { _id: new ObjectId(id) }
            const result = await foodCollection.deleteOne(query);
            res.send(result);
        })
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('cravio is running');
})

app.listen(port, () => {
    console.log(`cravio is running on port ${port}`)
})
