/**
 * The Kidtropy picture catalog.
 *
 * Every game draws from this list, so adding a new thing here makes it show up
 * in Talk Time, Find It, Count It and friends automatically.
 *
 * - `emoji` items use the device's emoji font (gorgeous on iPad/iPhone).
 * - `art` items use the hand-drawn SVGs in src/art/art.ts (for things that
 *   have no emoji, like an excavator or a triceratops).
 * - `aliases` are the other words a little kid might say for it. Speech
 *   recognition of small children is fuzzy, so be generous here.
 */

export type Theme = "trucks" | "construction" | "dinos" | "animals" | "farm" | "racing";

export interface Item {
  id: string;
  /** What we call it, e.g. "fire truck". */
  name: string;
  /** "a" / "an" / "the" ... defaults to a/an by first letter. */
  article?: string;
  emoji?: string;
  art?: string;
  themes: Theme[];
  aliases?: string[];
  /** What it says, e.g. "Moo!" */
  sound?: string;
  /** A one-line fun fact read aloud after a correct answer. */
  fact?: string;
}

export const THEMES: { id: Theme; label: string; icon: string; color: string }[] = [
  { id: "trucks", label: "Trucks & Cars", icon: "🚚", color: "#ff7043" },
  { id: "construction", label: "Diggers", icon: "🏗️", color: "#fbc02d" },
  { id: "dinos", label: "Dinosaurs", icon: "🦖", color: "#66bb6a" },
  { id: "animals", label: "Animals", icon: "🦁", color: "#ffa726" },
  { id: "farm", label: "Farm", icon: "🐄", color: "#8d6e63" },
  { id: "racing", label: "Racing", icon: "🏎️", color: "#e53935" },
];

export const ITEMS: Item[] = [
  // ---- Trucks & cars -------------------------------------------------------
  { id: "car", name: "car", emoji: "🚗", themes: ["trucks", "racing"], aliases: ["red car", "auto", "vroom"], sound: "Vroom vroom!", fact: "Cars have four wheels that go round and round." },
  { id: "firetruck", name: "fire truck", emoji: "🚒", themes: ["trucks"], aliases: ["fire engine", "firetruck", "fire"], sound: "Wee-oo, wee-oo!", fact: "Fire trucks carry long ladders and hoses to spray water." },
  { id: "police", name: "police car", emoji: "🚓", themes: ["trucks"], aliases: ["police", "cop car", "police cars"], sound: "Wee-oo, wee-oo!", fact: "Police cars have flashing lights on top." },
  { id: "ambulance", name: "ambulance", emoji: "🚑", themes: ["trucks"], aliases: ["amblance", "ambulamps"], sound: "Nee-naw, nee-naw!", fact: "An ambulance takes people to the doctor super fast." },
  { id: "bus", name: "bus", emoji: "🚌", themes: ["trucks"], aliases: ["school bus", "the bus"], sound: "Beep beep!", fact: "The wheels on the bus go round and round!" },
  { id: "taxi", name: "taxi", emoji: "🚕", themes: ["trucks"], aliases: ["taxi cab", "cab", "yellow car"], sound: "Honk honk!", fact: "A taxi gives people a ride around the city." },
  { id: "pickup", name: "pickup truck", emoji: "🛻", themes: ["trucks", "farm"], aliases: ["pickup", "truck", "pick up truck"], sound: "Vroom!", fact: "A pickup truck carries stuff in the back." },
  { id: "delivery", name: "delivery truck", emoji: "🚚", themes: ["trucks"], aliases: ["truck", "box truck", "mail truck"], sound: "Beep beep!", fact: "Delivery trucks bring packages to your door." },
  { id: "semi", name: "big rig", emoji: "🚛", themes: ["trucks"], aliases: ["semi", "semi truck", "big truck", "eighteen wheeler", "truck"], sound: "Honk honk!", fact: "Big rigs can have eighteen wheels!" },
  { id: "garbage", name: "garbage truck", art: "garbage", themes: ["trucks", "construction"], aliases: ["trash truck", "garbage", "recycling truck", "dump"], sound: "Crunch crunch!", fact: "Garbage trucks pick up the trash and squish it." },
  { id: "tow", name: "tow truck", art: "tow", themes: ["trucks"], aliases: ["tow", "towing truck", "wrecker"], sound: "Clink clink!", fact: "Tow trucks pull broken cars with a big hook." },
  { id: "monster", name: "monster truck", art: "monster", themes: ["trucks", "racing"], aliases: ["monster", "big wheels"], sound: "Vroom! Crash!", fact: "Monster trucks have giant wheels and jump really high!" },
  { id: "motorcycle", name: "motorcycle", emoji: "🏍️", themes: ["trucks", "racing"], aliases: ["motorbike", "bike", "dirt bike"], sound: "Vroom vroom!", fact: "A motorcycle has only two wheels." },
  { id: "train", name: "train", emoji: "🚂", themes: ["trucks"], aliases: ["choo choo", "choo choo train", "engine"], sound: "Choo choo!", fact: "Trains ride on long metal tracks." },
  { id: "airplane", name: "airplane", article: "an", emoji: "✈️", themes: ["trucks"], aliases: ["plane", "aeroplane", "jet"], sound: "Zoooom!", fact: "Airplanes fly high up in the clouds." },
  { id: "helicopter", name: "helicopter", emoji: "🚁", themes: ["trucks"], aliases: ["chopper", "copter", "helicopper"], sound: "Whup whup whup!", fact: "Helicopters have spinning blades on top." },
  { id: "rocket", name: "rocket", emoji: "🚀", themes: ["trucks"], aliases: ["rocket ship", "spaceship"], sound: "Three, two, one, blast off!", fact: "Rockets fly all the way to space!" },
  { id: "boat", name: "boat", emoji: "⛵", themes: ["trucks"], aliases: ["sailboat", "ship"], sound: "Splash!", fact: "Boats float on the water." },
  { id: "tram", name: "trolley", emoji: "🚋", themes: ["trucks"], aliases: ["tram", "streetcar", "trolley car"], sound: "Ding ding!", fact: "A trolley rides on tracks in the city street." },
  { id: "bicycle", name: "bicycle", emoji: "🚲", themes: ["trucks"], aliases: ["bike", "bicycle"], sound: "Ring ring!", fact: "You pedal a bicycle with your feet." },

  // ---- Construction --------------------------------------------------------
  { id: "excavator", name: "excavator", article: "an", art: "excavator", themes: ["construction"], aliases: ["digger", "excavate", "escavator", "x cavator", "backhoe", "digging truck"], sound: "Dig dig dig!", fact: "An excavator digs big holes with its bucket." },
  { id: "bulldozer", name: "bulldozer", art: "bulldozer", themes: ["construction"], aliases: ["dozer", "bull dozer", "bulldoser"], sound: "Push push push!", fact: "A bulldozer pushes dirt with its big blade." },
  { id: "dumptruck", name: "dump truck", art: "dumptruck", themes: ["construction"], aliases: ["dump", "dumper", "dumb truck", "truck"], sound: "Dump it out!", fact: "A dump truck tips up its bed to dump out dirt." },
  { id: "mixer", name: "cement mixer", art: "mixer", themes: ["construction"], aliases: ["cement truck", "concrete mixer", "mixer", "concrete truck", "cement"], sound: "Spin spin spin!", fact: "A cement mixer spins its drum so the cement stays soft." },
  { id: "roller", name: "road roller", art: "roller", themes: ["construction"], aliases: ["roller", "steamroller", "steam roller"], sound: "Squish squish!", fact: "A road roller makes the road flat and smooth." },
  { id: "crane", name: "crane", emoji: "🏗️", themes: ["construction"], aliases: ["construction crane", "tower crane"], sound: "Lift it up!", fact: "Cranes lift heavy things way up high." },
  { id: "cone", name: "traffic cone", art: "cone", themes: ["construction", "racing"], aliases: ["cone", "orange cone"], fact: "Cones tell cars to go slow and be careful." },
  { id: "builder", name: "builder", emoji: "👷", themes: ["construction"], aliases: ["construction worker", "worker", "hard hat", "bob"], sound: "Bzzzz!", fact: "Builders wear hard hats to keep their heads safe." },
  { id: "brick", name: "brick", emoji: "🧱", themes: ["construction"], aliases: ["bricks", "wall"], fact: "You stack bricks to build a wall." },
  { id: "hammer", name: "hammer", emoji: "🔨", themes: ["construction"], aliases: ["hammers"], sound: "Bang bang bang!", fact: "A hammer bangs in nails." },
  { id: "tractor", name: "tractor", emoji: "🚜", themes: ["construction", "farm"], aliases: ["tracker", "tractors", "farm tractor"], sound: "Putt putt putt!", fact: "Tractors help farmers in the fields." },

  // ---- Dinosaurs -----------------------------------------------------------
  { id: "trex", name: "T-rex", emoji: "🦖", themes: ["dinos"], aliases: ["t rex", "trex", "tyrannosaurus", "tyrannosaurus rex", "dinosaur", "dino", "tea rex", "teerex"], sound: "ROAR!", fact: "T-rex had tiny arms and big sharp teeth." },
  { id: "longneck", name: "brontosaurus", emoji: "🦕", themes: ["dinos"], aliases: ["long neck", "longneck", "brachiosaurus", "dinosaur", "dino", "diplodocus", "sauropod", "apatosaurus"], sound: "Stomp stomp!", fact: "Long-neck dinosaurs ate leaves from tall trees." },
  { id: "triceratops", name: "triceratops", art: "triceratops", themes: ["dinos"], aliases: ["tricera", "three horn", "dinosaur", "dino", "try sarah tops"], sound: "Snort snort!", fact: "Triceratops had three horns on its face." },
  { id: "stegosaurus", name: "stegosaurus", art: "stegosaurus", themes: ["dinos"], aliases: ["stego", "stegasaurus", "dinosaur", "dino"], sound: "Rawr!", fact: "Stegosaurus had big plates on its back." },
  { id: "pterodactyl", name: "pterodactyl", art: "pterodactyl", themes: ["dinos"], aliases: ["pteranodon", "terodactyl", "flying dinosaur", "dinosaur", "dino", "bird"], sound: "Screech!", fact: "Pterodactyls flew with big leathery wings." },
  { id: "volcano", name: "volcano", emoji: "🌋", themes: ["dinos"], aliases: ["volcanoes", "lava", "mountain"], sound: "Boom!", fact: "Volcanoes have hot lava inside." },
  { id: "bone", name: "bone", emoji: "🦴", themes: ["dinos"], aliases: ["bones", "dog bone", "fossil"], fact: "Dinosaur bones turn into fossils in the ground." },

  // ---- Animals -------------------------------------------------------------
  { id: "lion", name: "lion", emoji: "🦁", themes: ["animals"], aliases: ["lions", "lion king"], sound: "Roar!", fact: "Lions are called the kings of the jungle." },
  { id: "tiger", name: "tiger", emoji: "🐯", themes: ["animals"], aliases: ["tigers"], sound: "Rawr!", fact: "Tigers have orange fur with black stripes." },
  { id: "elephant", name: "elephant", article: "an", emoji: "🐘", themes: ["animals"], aliases: ["elephants", "ellie"], sound: "Toot toot!", fact: "Elephants use their long trunks like a hand." },
  { id: "giraffe", name: "giraffe", emoji: "🦒", themes: ["animals"], aliases: ["giraffes", "draft", "raff"], fact: "Giraffes have super long necks." },
  { id: "zebra", name: "zebra", emoji: "🦓", themes: ["animals"], aliases: ["zebras", "zeebra"], sound: "Hee-haw!", fact: "Zebras have black and white stripes." },
  { id: "monkey", name: "monkey", emoji: "🐵", themes: ["animals"], aliases: ["monkeys", "ape", "chimp"], sound: "Ooh ooh, ah ah!", fact: "Monkeys love to climb trees and eat bananas." },
  { id: "bear", name: "bear", emoji: "🐻", themes: ["animals"], aliases: ["bears", "teddy bear", "teddy"], sound: "Growl!", fact: "Bears love to eat honey and fish." },
  { id: "panda", name: "panda", emoji: "🐼", themes: ["animals"], aliases: ["panda bear"], fact: "Pandas eat bamboo all day long." },
  { id: "penguin", name: "penguin", emoji: "🐧", themes: ["animals"], aliases: ["penguins", "pingu"], sound: "Squeak squeak!", fact: "Penguins can't fly, but they swim really well." },
  { id: "whale", name: "whale", emoji: "🐳", themes: ["animals"], aliases: ["whales", "fish"], sound: "Splash!", fact: "Whales are the biggest animals in the whole world." },
  { id: "shark", name: "shark", emoji: "🦈", themes: ["animals"], aliases: ["sharks", "baby shark"], sound: "Chomp chomp!", fact: "Sharks have lots and lots of teeth." },
  { id: "octopus", name: "octopus", article: "an", emoji: "🐙", themes: ["animals"], aliases: ["octopuses", "octo"], sound: "Bloop bloop!", fact: "An octopus has eight arms." },
  { id: "turtle", name: "turtle", emoji: "🐢", themes: ["animals"], aliases: ["turtles", "tortoise"], fact: "Turtles carry their house on their back." },
  { id: "snake", name: "snake", emoji: "🐍", themes: ["animals"], aliases: ["snakes", "snek"], sound: "Hisssss!", fact: "Snakes have no legs. They slither!" },
  { id: "frog", name: "frog", emoji: "🐸", themes: ["animals"], aliases: ["frogs", "froggy", "toad"], sound: "Ribbit!", fact: "Frogs can jump really far." },
  { id: "owl", name: "owl", article: "an", emoji: "🦉", themes: ["animals"], aliases: ["owls"], sound: "Hoo hoo!", fact: "Owls stay awake at night." },
  { id: "bee", name: "bee", emoji: "🐝", themes: ["animals"], aliases: ["bees", "bumblebee", "bumble bee"], sound: "Buzzzz!", fact: "Bees make sweet honey." },
  { id: "crocodile", name: "crocodile", emoji: "🐊", themes: ["animals"], aliases: ["alligator", "croc", "gator"], sound: "Snap snap!", fact: "Crocodiles have long snappy jaws." },
  { id: "rabbit", name: "bunny", emoji: "🐰", themes: ["animals", "farm"], aliases: ["rabbit", "bunny rabbit", "bunnies"], sound: "Munch munch!", fact: "Bunnies hop and love carrots." },
  { id: "wolf", name: "wolf", emoji: "🐺", themes: ["animals"], aliases: ["wolves", "big bad wolf"], sound: "Aooooo!", fact: "Wolves howl to talk to their family." },
  { id: "bird", name: "bird", emoji: "🐦", themes: ["animals"], aliases: ["birdie", "birds", "tweety"], sound: "Tweet tweet!", fact: "Birds sing songs in the morning." },
  { id: "mouse", name: "mouse", emoji: "🐭", themes: ["animals", "farm"], aliases: ["mice", "mousey"], sound: "Squeak!", fact: "Mice are tiny and love cheese." },
  { id: "dolphin", name: "dolphin", emoji: "🐬", themes: ["animals"], aliases: ["dolphins"], sound: "Click click!", fact: "Dolphins jump and play in the ocean." },
  { id: "seal", name: "seal", emoji: "🦭", themes: ["animals"], aliases: ["seals", "sea lion"], sound: "Arf arf!", fact: "Seals clap their flippers." },
  { id: "gorilla", name: "gorilla", emoji: "🦍", themes: ["animals"], aliases: ["gorillas", "ape", "king kong"], sound: "Ooh ooh!", fact: "Gorillas are big and strong, and they love bananas." },
  { id: "parrot", name: "parrot", emoji: "🦜", themes: ["animals"], aliases: ["parrots", "polly"], sound: "Squawk!", fact: "Parrots can learn to talk!" },
  { id: "hippo", name: "hippo", emoji: "🦛", themes: ["animals"], aliases: ["hippopotamus", "hippos"], sound: "Grunt grunt!", fact: "Hippos love to stay cool in the water." },
  { id: "cricket", name: "cricket", emoji: "🦗", themes: ["animals"], aliases: ["crickets", "grasshopper"], sound: "Chirp chirp!", fact: "Crickets sing at night by rubbing their wings." },
  { id: "dog", name: "dog", emoji: "🐶", themes: ["animals", "farm"], aliases: ["doggy", "puppy", "doggie", "dogs"], sound: "Woof woof!", fact: "Dogs wag their tails when they are happy." },
  { id: "cat", name: "cat", emoji: "🐱", themes: ["animals", "farm"], aliases: ["kitty", "kitten", "cats"], sound: "Meow!", fact: "Cats purr when they are happy." },

  // ---- Farm ----------------------------------------------------------------
  { id: "cow", name: "cow", emoji: "🐮", themes: ["farm"], aliases: ["cows", "moo cow", "moo"], sound: "Moo!", fact: "Cows give us milk." },
  { id: "pig", name: "pig", emoji: "🐷", themes: ["farm"], aliases: ["piggy", "pigs", "piggie"], sound: "Oink oink!", fact: "Pigs love to roll in the mud." },
  { id: "sheep", name: "sheep", emoji: "🐑", themes: ["farm"], aliases: ["lamb", "sheeps"], sound: "Baa baa!", fact: "Sheep have soft wool coats." },
  { id: "horse", name: "horse", emoji: "🐴", themes: ["farm"], aliases: ["horsey", "pony", "horses"], sound: "Neigh!", fact: "Horses can run really fast." },
  { id: "chicken", name: "chicken", emoji: "🐔", themes: ["farm"], aliases: ["hen", "chickens", "chick"], sound: "Cluck cluck!", fact: "Chickens lay eggs." },
  { id: "rooster", name: "rooster", emoji: "🐓", themes: ["farm"], aliases: ["roosters", "chicken"], sound: "Cock-a-doodle-doo!", fact: "Roosters wake up the farm in the morning." },
  { id: "duck", name: "duck", emoji: "🦆", themes: ["farm"], aliases: ["ducks", "ducky", "duckie"], sound: "Quack quack!", fact: "Ducks love to swim in the pond." },
  { id: "chick", name: "chick", emoji: "🐤", themes: ["farm"], aliases: ["baby chick", "chicks", "chicky"], sound: "Peep peep!", fact: "Baby chicks are fluffy and yellow." },
  { id: "donkey", name: "donkey", emoji: "🫏", themes: ["farm"], aliases: ["donkeys", "mule"], sound: "Hee-haw!", fact: "Donkeys have big long ears." },
  { id: "goat", name: "goat", emoji: "🐐", themes: ["farm"], aliases: ["goats", "billy goat"], sound: "Maaa!", fact: "Goats love to climb." },
  { id: "turkey", name: "turkey", emoji: "🦃", themes: ["farm"], aliases: ["turkeys"], sound: "Gobble gobble!", fact: "Turkeys have colorful tail feathers." },
  { id: "farmer", name: "farmer", emoji: "🧑‍🌾", themes: ["farm"], aliases: ["farmers", "old macdonald"], fact: "Farmers grow food and take care of animals." },
  { id: "corn", name: "corn", article: "some", emoji: "🌽", themes: ["farm"], aliases: ["corn on the cob", "popcorn"], sound: "Pop pop pop!", fact: "Corn grows tall in the field." },
  { id: "carrot", name: "carrot", emoji: "🥕", themes: ["farm"], aliases: ["carrots"], sound: "Crunch!", fact: "Carrots grow under the ground." },
  { id: "apple", name: "apple", article: "an", emoji: "🍎", themes: ["farm"], aliases: ["apples", "red apple"], sound: "Crunch!", fact: "Apples grow on trees." },
  { id: "egg", name: "egg", article: "an", emoji: "🥚", themes: ["farm", "dinos"], aliases: ["eggs", "dino egg"], sound: "Crack!", fact: "Baby chicks and baby dinosaurs hatch from eggs!" },

  // ---- Racing --------------------------------------------------------------
  { id: "racecar", name: "race car", emoji: "🏎️", themes: ["racing"], aliases: ["racecar", "racing car", "fast car", "lightning", "car"], sound: "Zoom zoom!", fact: "Race cars go super super fast." },
  { id: "flag", name: "checkered flag", emoji: "🏁", themes: ["racing"], aliases: ["flag", "racing flag", "finish line", "finish"], fact: "The checkered flag means the race is over." },
  { id: "trophy", name: "trophy", emoji: "🏆", themes: ["racing"], aliases: ["cup", "gold cup", "prize"], sound: "Hooray!", fact: "The winner gets a shiny trophy!" },
  { id: "trafficlight", name: "traffic light", emoji: "🚦", themes: ["racing", "trucks"], aliases: ["stop light", "stoplight", "light", "traffic lights"], fact: "Red means stop and green means go!" },
  { id: "wheel", name: "tire", emoji: "🛞", themes: ["racing", "trucks"], aliases: ["wheel", "tyre", "tires", "wheels"], sound: "Screech!", fact: "Tires are made of bumpy rubber." },
  { id: "medal", name: "medal", emoji: "🥇", themes: ["racing"], aliases: ["gold medal", "first place", "number one"], sound: "Hooray!", fact: "First place wins the gold medal." },
];

/**
 * Pictures that are not part of the main game pool (ABC words, Dino Dig treasure).
 */
export const EXTRAS: Item[] = [
  { id: "fossil", name: "dinosaur fossil", art: "fossil", themes: [], fact: "Fossils are dinosaur bones that turned into rock." },
  { id: "gem", name: "treasure", article: "some", emoji: "💎", themes: [], fact: "Shiny, sparkly treasure!" },
  { id: "icecream", name: "ice cream", article: "an", emoji: "🍦", themes: [] },
  { id: "juice", name: "juice", article: "some", emoji: "🧃", themes: [] },
  { id: "jellyfish", name: "jellyfish", emoji: "🪼", themes: [] },
  { id: "kangaroo", name: "kangaroo", emoji: "🦘", themes: [] },
  { id: "kite", name: "kite", emoji: "🪁", themes: [] },
  { id: "ladder", name: "ladder", emoji: "🪜", themes: [] },
  { id: "nest", name: "nest", emoji: "🪺", themes: [] },
  { id: "nose", name: "nose", emoji: "👃", themes: [] },
  { id: "queen", name: "queen", emoji: "👸", themes: [] },
  { id: "umbrella", name: "umbrella", article: "an", emoji: "☂️", themes: [] },
  { id: "unicorn", name: "unicorn", emoji: "🦄", themes: [] },
  { id: "van", name: "van", emoji: "🚐", themes: [] },
  { id: "xray", name: "x-ray", article: "an", emoji: "🩻", themes: [] },
  { id: "yoyo", name: "yo-yo", emoji: "🪀", themes: [] },
  { id: "yak", name: "yak", emoji: "🐃", themes: [] },
];

export const byId = new Map([...ITEMS, ...EXTRAS].map((i) => [i.id, i]));

export function itemsFor(themes: Theme[] | "all"): Item[] {
  if (themes === "all" || themes.length === 0) return ITEMS;
  const set = new Set(themes);
  return ITEMS.filter((i) => i.themes.some((t) => set.has(t)));
}

export function withArticle(item: Item): string {
  const a = item.article ?? (/^[aeiou]/i.test(item.name) ? "an" : "a");
  return `${a} ${item.name}`;
}
