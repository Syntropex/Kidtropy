// Prints every sentence Kidtropy can say, as JSON. Used by generate.py.
import { everySentence, SPEAK_AS } from "../../src/voice/all-lines";
import { clipId } from "../../src/voice/lines";

process.stdout.write(
  JSON.stringify(
    everySentence().map((text) => ({ id: clipId(text), text, ...(SPEAK_AS[text] ? { phonemes: SPEAK_AS[text] } : {}) })),
    null,
    1,
  ),
);
