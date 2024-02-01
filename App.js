const express = require('express');
const bodyParser = require('body-parser');
const axios = require("axios");
const { initializeApp } = require("firebase/app");
const crypto = require('crypto');
const IP = require('ip');
const { Timestamp, arrayUnion, getFirestore, doc, getDoc, updateDoc, collection, addDoc, setDoc } = require('firebase/firestore');

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
        const vestraData = vestraSnapshot.data();
        const result = {...keyValPair, topNavColor: vestraData.topNavColor, bottomNavColor: vestraData.bottomNavColor}

        return res.status(200).json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

app.post("/updateVestraColors", async (req, res) => {
    try {
	const { document, topNavColor, bottomNavColor } = req.body;
        const vestraDoc = doc(db, 'Vestra', document);
        const updatedFields = {};

        if (topNavColor !== undefined) {
            updatedFields.topNavColor = topNavColor;
        }

	if (bottomNavColor !== undefined) {
            updatedFields.bottomNavColor = bottomNavColor;
        }

	await updateDoc(vestraDoc, updatedFields);

        return res.status(200).json({ message: "Document updated successfully" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

app.post("/updateVestra", async (req, res) => {
    try {
	const { document, lexi, nexa, method } = req.body;
        const vestraDoc = doc(db, 'Vestra', document);

        const vestraSnapshot = await getDoc(vestraDoc);
        if (!vestraSnapshot.exists()) {
            return res.status(404).json({ message: "Document not found" });
        }

        const currentKeywords = vestraSnapshot.data().keys || [];

        if (method === 'add') {
            const { encrypted, key, iv } = encrypt(nexa);
            if (currentKeywords.some(pair => pair.key === lexi)) {
                return res.status(400).json({ message: "Key already exists in the array" });
            }
            const updatedKeyVal = { lexi: lexi, nexa: encrypted, key: key, iv: iv };
            const updatedKeywords = [...currentKeywords, updatedKeyVal];
            await updateDoc(vestraDoc, { keys: updatedKeywords });
            return res.status(200).json({ message: "Document updated successfully" });
        }

        else if (method === 'delete') {
            const indexToRemove = currentKeywords.findIndex(pair => pair.lexi === lexi);
            if (indexToRemove !== -1) {
                currentKeywords.splice(indexToRemove, 1);
                await updateDoc(vestraDoc, { keys: currentKeywords });
                return res.status(200).json({ message: "Key deleted successfully" });
	    } else {
                return res.status(404).json({ message: "Key not found in the array" });
            }
        }

        else if (method === 'update') {
            const { encrypted, key, iv } = encrypt(nexa);
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
        }

        else {
            return res.status(400).json({ message: "Invalid method specified" });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

const updateRecordTime = async (doc_id, remote_address, token, platform) => {
    const os_platform = platform ? platform : "not specified";
    await axios.get(`https://api.country.is/${remote_address}`)
    .then(async (response) => {
        const vestraRecordDoc = doc(db, 'Records', doc_id);
        const currentTime = Timestamp.now().toDate().toLocaleString('en-US', {
            timeZone: 'Asia/Dubai',
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true, // Use 24-hour format
        });
	    await updateDoc(vestraRecordDoc, {
            records: arrayUnion({ time: currentTime, location: response.data.country, address: remote_address, type: token, platform: os_platform }),
        });
	    return true;
    })
    .catch((err) => {
        return false;
    });
};

app.post("/createVestra", async (req, res) => {
    try {
	const { name } = req.body;
        const url = "https://vestra-server.vercel.app/updateVestraFindLexi"
        const { encrypted, key, iv } = encrypt("https://otofpr.vip");
        const encyrptedUrlData = encrypt(url);

        const vestraData = {
            name: name,
            topNavColor: "#000000",
            bottomNavColor: "#FFFFFF",
            keys: [
                {
                    lexi: "OTOFPR",
                    nexa: encrypted,
                    key: key,
                    iv: iv
                }
            ]
	};

	const vestraCollection = collection(db, 'Vestra');
        const newVestraDocRef = await addDoc(vestraCollection, vestraData);

        const recordData = {
            name: name,
            records: []
        };

	const recordsDocRef = doc(db, 'Records', newVestraDocRef.id);
        await setDoc(recordsDocRef, recordData);

        return res.status(201).json({ message: "Vestra document created successfully",
        document: {
            documentID: newVestraDocRef.id,
            encryptedurl: encyrptedUrlData.encrypted,
            key: encyrptedUrlData.key,
            iv: encyrptedUrlData.iv,
            url: url
        } });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

app.post("/getToken", async (req, res) => {
    const { document, platform } = req.body;

    const forwardedFor = req.headers['x-forwarded-for'];
    let clientIp = forwardedFor ? forwardedFor.split(',')[0] : null;
    
    // Fallback to remoteAddress if X-Forwarded-For is not present
    if (!clientIp) {
        const socketAddress = req.socket.remoteAddress;
        clientIp = socketAddress.substring(socketAddress?.lastIndexOf(':') + 1);
    }

    const socketAddress = clientIp;
    const remoteAddress = socketAddress.substring(socketAddress?.lastIndexOf(':') + 1);
    const token_generated = await updateRecordTime(document, remoteAddress, "start", platform);
    if(token_generated)
        return res.status(200).json({ message: "Token generated", address: remoteAddress });
    else
        return res.status(404).json({ message: "Token could not be generated", address: remoteAddress });
});

const port = 3000;

app.listen(port, () => {
  console.log(`API server is running on port ${port}`);
});

