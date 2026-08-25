import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';

const app = express();
app.use(cors({origin:'*'}));
app.use(express.json());
const upload = multer({dest:'uploads/'});

app.get('/', (req,res)=> res.send('C FAMILY API OK - Photo HD + Video'));

 // --- ROUTE 1: PHOTO -> VIDEO (gratuit) ---
app.post('/api/image-to-video', upload.single('image'), async (req,res)=>{
  try{
    const buf = fs.readFileSync(req.file.path);
    const r = await fetch("https://api-inference.huggingface.co/models/stabilityai/stable-video-diffusion-img2vid-xt",{
      method:"POST",
      headers:{Authorization:`Bearer ${process.env.HF_TOKEN}`},
      body: buf
    });
    if(!r.ok) throw new Error(await r.text());
    const blob = await r.blob();
    const b64 = Buffer.from(await blob.arrayBuffer()).toString('base64');
    fs.unlinkSync(req.file.path);
    res.json({ videoUrl: `data:video/mp4;base64,${b64}` });
  }catch(e){ res.status(500).json({error:e.message}); }
});

// --- ROUTE 2: PHOTO HD - UPSCALE x4 (gratuit) ---
app.post('/api/upscale', upload.single('image'), async (req,res)=>{
  try{
    if(!req.file) return res.status(400).json({error:"Pas d'image"});
    const buf = fs.readFileSync(req.file.path);
    
    const r = await fetch("https://api-inference.huggingface.co/models/caidas/swin2SR-realworld-sr-x4-64",{
      method:"POST",
      headers:{ Authorization: `Bearer ${process.env.HF_TOKEN}` },
      body: buf
    });

    if(r.status === 503){
      return res.status(503).json({error:"Modèle gratuit en réveil, réessaie dans 20s"});
    }
    if(!r.ok) throw new Error(await r.text());

    const blob = await r.blob();
    const b64 = Buffer.from(await blob.arrayBuffer()).toString('base64');
    fs.unlinkSync(req.file.path);
    res.json({ imageUrl: `data:image/jpeg;base64,${b64}` });
  }catch(e){
    console.error(e);
    res.status(500).json({error:e.message});
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log('Running on '+PORT));
