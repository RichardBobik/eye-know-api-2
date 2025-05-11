const { Buffer } = require('buffer');

const handleImageUrl = async (req, res) => {
    const { imageUrl } = req.body;

    const PAT = process.env.CLARIFAI_PAT;
    const USER_ID = process.env.CLARIFAI_USER_ID;
    const APP_ID = process.env.CLARIFAI_APP_ID;
    const MODEL_ID = "general-image-recognition";

    try {
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) throw new Error("Image fetch failed");
        const arrayBuffer = await imageResponse.arrayBuffer();
        const imageBuffer = Buffer.from(arrayBuffer);

        const base64Image = imageBuffer.toString("base64");

        const raw = JSON.stringify({
            "user_app_id": {
                "user_id": USER_ID,
                "app_id": APP_ID
            },
            "inputs": [
                {
                    "data": {
                        "image": {
                            "base64": base64Image
                        }
                    }
                }
            ]
        });

        const clarifaiResponse = await fetch(`https://api.clarifai.com/v2/models/${MODEL_ID}/outputs`, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Authorization": "Key " + PAT,
                "Content-Type": "application/json"
            },
            body: raw
        });

        const data = await clarifaiResponse.json();
        res.json(data);

    } catch (err) {
        res.status(400).json("Unable to fetch or process image.");
    }
}

module.exports = {
  handleImageUrl
};
