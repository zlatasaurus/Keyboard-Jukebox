// upload-button.js — upload ur own sound
import { $ } from './dom.js';
import { ensureAudio } from '../audio/engine.js';
import { addUpload } from '../services/sound-library.js';

export function mountUploadButton({ onAdded }) {
  const input = $('file'), msg = $('uploadMsg');
  $('uploadBtn').addEventListener('click', () => input.click());
  input.addEventListener('change', async (e) => {
    const f = e.target.files[0]; e.target.value = '';
    if (!f) return;
    ensureAudio();
    try {
      const added = await addUpload(f);
      msg.textContent = `Added "${added.label}" — trim it below.`;
      onAdded(added);
    } catch {
      msg.textContent = "That file didn't work. Try an mp3, wav or ogg.";
    }
  });
}
