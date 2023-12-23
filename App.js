const express = require('express'); 
const bodyParser = require('body-parser');
const axios = require("axios");
const { initializeApp } = require("firebase/app");
const crypto = require('crypto');
const IP = require('ip');
const { getFirestore, doc, getDoc, updateDoc } = require('firebase/firestore/lite');

const firebaseConfig = {
    apiKey: "AIzaSyDWh0ySAbT5mJKNi7RR0KemlTsU-KNcaL0",
    authDomain: "backend-db-ce68e.firebaseapp.com",
    projectId: "backend-db-ce68e",
    storageBucket: "backend-db-ce68e.appspot.com",
    messagingSenderId: "893354591028",
    appId: "1:893354591028:web:87f003fd04f0765c685b61",
    measurementId: "G-B04LN1S0H1"
};

const firebase = initializeApp(firebaseConfig);
const db = getFirestore(firebase);

const app = express(); 
app.use(express.json());
app.use(bodyParser.text());

app.get("/", (req, res) => {
    res.json("Hello World!"); 
});

function encrypt(text) {
    const key = crypto.randomBytes(32); // 256 bits
    const iv = crypto.randomBytes(16); // 128 bits
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text, 'utf-8', 'hex');
    encrypted += cipher.final('hex');
    console.log({
        encrypted: encrypted,
        key: key.toString('hex'),
        iv: iv.toString('hex')
    }
    )
    return {
        encrypted: encrypted,
        key: key.toString('hex'),
        iv: iv.toString('hex')
    };
};

//get vest app
app.post("/getVestra", async (req,res) => {
    const { document } = req.body;
    const vestraDoc = doc(db, 'Vestra', document);
    const vestraSnapshot = await getDoc(vestraDoc);
    if(vestraSnapshot.exists()){
        const vestraData = vestraSnapshot.data();
        return res.status(200).json(vestraData);
    }
    else{
        return res.status(404).json({ message: error.message });
    }
});

app.post("/updateVestraTopNav", async (req, res) => {
    try {
        const { document, topNavColor } = req.body;
        const vestraDoc = doc(db, 'Vestra', document);
        await updateDoc(vestraDoc, { topNavColor });
        return res.status(200).json({ message: "Document updated successfully" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

app.post("/updateVestraBottomNav", async (req, res) => {
    try {
        const { document, bottomNavColor } = req.body;
        const vestraDoc = doc(db, 'Vestra', document);
        await updateDoc(vestraDoc, { bottomNavColor });
        return res.status(200).json({ message: "Document updated successfully" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

app.post("/updateVestraAddPair", async (req, res) => {
    try {
        const { document, lexi, nexa } = req.body;
        const { encrypted, key, iv } = encrypt(nexa);
        const updatedKeyVal = {lexi: lexi, nexa: encrypted, key: key, iv: iv};

        const vestraDoc = doc(db, 'Vestra', document);

        const vestraSnapshot = await getDoc(vestraDoc);
        if (!vestraSnapshot.exists()) {
            return res.status(404).json({ message: "Document not found" });
        }

        const currentKeywords = vestraSnapshot.data().keys || [];

        if (currentKeywords.some(pair => pair.key === lexi)) {
            return res.status(400).json({ message: "Key already exists in the array" });
        }

        const updatedKeywords = [...currentKeywords, updatedKeyVal];
        await updateDoc(vestraDoc, { keys: updatedKeywords });

        return res.status(200).json({ message: "Document updated successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

app.post("/updateVestraDeleteLexi", async (req, res) => {
    try {
        const { document, lexi } = req.body;
        const vestraDoc = doc(db, 'Vestra', document);

        const vestraSnapshot = await getDoc(vestraDoc);
        if (!vestraSnapshot.exists()) {
            return res.status(404).json({ message: "Document not found" });
        }

        const currentKeywords = vestraSnapshot.data().keys || [];
        const indexToRemove = currentKeywords.findIndex(pair => pair.lexi === lexi);

        if (indexToRemove !== -1) {
            currentKeywords.splice(indexToRemove, 1);
            await updateDoc(vestraDoc, { keys: currentKeywords });
            return res.status(200).json({ message: "Key deleted successfully" });
        } else {
            return res.status(404).json({ message: "Key not found in the array" });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

app.post("/updateVestraUpdateLexi", async (req, res) => {
    try {
        const { document, lexi, nexa } = req.body;
        const { encrypted, key, iv } = encrypt(nexa);
        const vestraDoc = doc(db, 'Vestra', document);

        const vestraSnapshot = await getDoc(vestraDoc);
        if (!vestraSnapshot.exists()) {
            return res.status(404).json({ message: "Document not found" });
        }

        const currentKeywords = vestraSnapshot.data().keys || [];
        const indexToUpdate = currentKeywords.findIndex(pair => pair.lexi === lexi);

        if (indexToUpdate !== -1) {
            currentKeywords[indexToUpdate].nexa = encrypted;
            currentKeywords[indexToUpdate].key = key;
            currentKeywords[indexToUpdate].iv = iv;
            await updateDoc(vestraDoc, { keys: currentKeywords });

            return res.status(200).json({ message: "Key updated successfully" });
        } else {
            return res.status(404).json({ message: "Key not found in the array" });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

app.post("/updateVestraFindLexi", async (req, res) => {
    try {
        const { document, lexi } = req.body;
        const vestraDoc = doc(db, 'Vestra', document);

        const vestraSnapshot = await getDoc(vestraDoc);
        if (!vestraSnapshot.exists()) {
            return res.status(404).json({ message: "Document not found" });
        }

        const currentKeywords = vestraSnapshot.data().keys || [];
        const keyValPair = currentKeywords.find(pair => pair.lexi === lexi);

        // if (keyValPair) {
            const vestraData = vestraSnapshot.data();
            const result = {...keyValPair, topNavColor: vestraData.topNavColor, bottomNavColor: vestraData.bottomNavColor}
            return res.status(200).json(result);
        // } 
        // else {
        //     return res.status(404).json({ message: "Key not found in the array" });
        // }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

function decrypt(encryptedText, sentKey, sentIv) {
    const key = Buffer.from(sentKey, 'hex');
    const iv = Buffer.from(sentIv, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  
    let decrypted = decipher.update(encryptedText, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');
    
    return decrypted;
};


app.post("/getVestraKey", (req,res) => {
    const { encryptedText, key, iv } = req.body;
    const decryptedText = decrypt(encryptedText, key, iv);
    return res.status(200).json(decryptedText)
});


const port = 3000; 

app.listen(port, () => { 
  console.log(`API server is running on port ${port}`); 
});