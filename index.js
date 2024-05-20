const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());


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

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        const database = client.db("cravio");
        const foodCollection = database.collection("foods");
        const requestFoodCollection = database.collection('requestedFood');
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
        app.get('/manage-food', async (req, res) => {
            const userEmail = req.query.email;
            const query = { donatorEmail: userEmail }
            // console.log(userEmail)
            const result = await foodCollection.find(query).toArray();
            res.send(result);
        })
        // ---ok
        app.put('/food/update', async(req, res) =>{
            const food = req.body;
            console.log(food)
            const filter = { _id: new ObjectId(`${food.id}`) }
            const updatedFood = {
                $set : {
                    foodName : food.fname,
                    foodImg : food.fImage,
                    foodQuantity : food.fQuantity,
                    date : food.eDate,
                    notes : food.note,
                    location : food.pLocation
                }
            }
            const result = await foodCollection.updateOne(filter,updatedFood);
            res.send(result);
            console.log(updatedFood);
        })
        //---ok
        app.get('/requested-food', async (req, res) => {
            const userEmail = req.query.email;
            const query = { email: userEmail }
            // console.log(userEmail)
            const result = await requestFoodCollection.find(query).toArray();
            res.send(result);
        })

        // ---ok
        app.post('/request-food', async (req, res) => {
            const foodDetails = req.body;
            const result = await requestFoodCollection.insertOne(foodDetails);
            res.send(result);
        })
        //---ok
        app.post('/add-food', async (req, res) => {
            const foodDetails = req.body;
            // console.log(foodDetails);
            const result = await foodCollection.insertOne(foodDetails);
            res.send(result);
        })
        // ---ok
        app.delete('/delete-food/:id', async (req, res) => {
            const id = req.params.id;
            // console.log('deleted',id);
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
