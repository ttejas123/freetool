import pkg from 'tesseract.js';
const { createWorker } = pkg;
import fs from 'fs';

async function test() {
  const imagePath = '/Users/tejasthakare/.gemini/antigravity/brain/34db1737-f72d-48e2-8905-a902e3643eb1/media__1776704945898.png';
  
  // createWorker signature: (langs, oem, options)
  const worker = await createWorker('eng', 1, {
     logger: m => {}
  });

  // recognize signature: (image, options, outputFormats)
  const { data } = await worker.recognize(imagePath, {}, { blocks: true });
  
  const words = [];
  if (data.blocks) {
    data.blocks.forEach(b => {
      if(b.paragraphs) b.paragraphs.forEach(p => {
         if(p.lines) p.lines.forEach(l => {
            if(l.words) l.words.forEach(w => words.push(w));
         });
      });
    });
  }
  
  console.log("Words length:", words.length);
  if (words.length > 0) {
     console.log("Sample word:", words[0].text, words[0].bbox);
  }
  await worker.terminate();
}

test();
