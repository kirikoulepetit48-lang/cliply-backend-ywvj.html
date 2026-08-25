const express = require('express');
const cors = require('cors');
const multer = require('multer');
const sharp = require('sharp');

const app = express();
app.use(cors({ origin: '*' }));

const upload = multer({ storage: multer.memoryStorage() });

app.get('/', (req, res) => {
  res.json({ status: 'C PHOTO HD LIVE', endpoint: '/enhance' });
});

app.post('/enhance', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image' });
    
    const inputBuffer = req.file.buffer;
    
    // HD x2 + sharpen
    const outputBuffer = await sharp(inputBuffer)
      .resize({ width: undefined, height: undefined, factor: 2, kernel: 'lanczos3' })
      .sharpen({ sigma: 1.5, m1: 1.2, m2: 1.0 })
      .modulate({ brightness: 1.05, saturation: 1.1 })
      .jpeg({ quality: 95 })
      .toBuffer();

    res.set('Content-Type', 'image/jpeg');
    res.send(outputBuffer);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Enhance failed' });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log('C PHOTO HD running on ' + PORT));
