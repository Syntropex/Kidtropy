// Prints every sentence Kidtropy can say, as JSON. Used by generate.py.
import { abcPairs } from "../../src/data/abc";
import { EXTRAS } from "../../src/data/items";
import { allLines, clipId } from "../../src/voice/lines";

const lines = allLines(EXTRAS, abcPairs());
process.stdout.write(JSON.stringify(lines.map((text) => ({ id: clipId(text), text })), null, 1));
