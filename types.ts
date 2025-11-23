

export enum AppMode {
  UPLOAD = 'UPLOAD',
  PREVIEW = 'PREVIEW',
  RESULT = 'RESULT'
}

export enum ProcessingStatus {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  ANALYZING = 'ANALYZING',
  EDITING = 'EDITING',
  GENERATING_VIDEO = 'GENERATING_VIDEO',
  ERROR = 'ERROR'
}

export interface HistoricalEra {
  id: string;
  name: string;
  description: string;
  promptSuffix: string;
  imageSrc?: string;
}

export interface AnalysisResult {
  text: string;
}

export const RANDOM_ERA_ID = 'random_surprise';

export const SUPPORTED_ERAS: HistoricalEra[] = [
  {
    id: RANDOM_ERA_ID,
    name: '🎲 Random Time Jump',
    description: 'Let AI choose your destiny',
    promptSuffix: 'SURPRISE_ME' 
  },
  {
    id: 'cyberpunk_2077',
    name: 'Neo-Tokyo 2077',
    description: 'Futuristic Cyberpunk City',
    promptSuffix: 'standing in a rain-slicked neon street in a futuristic cyberpunk city. Wearing a high-tech leather jacket with glowing LED accents. Wires and cybernetic implants visible. Expression: Cool, gritty determination. Blue and pink neon lighting, cinematic sci-fi atmosphere.'
  },
  {
    id: 'moon_landing_control',
    name: 'Apollo 11 Mission Control',
    description: 'Houston, 1969',
    promptSuffix: 'standing inside Mission Control Center during the moon landing, cheering and hugging other engineers wearing white shirts and skinny ties. The room is filled with cigarette smoke and tension turning into joy. Expression: Ecstatic screaming. Grainy 1960s color film style.'
  },
  {
    id: 'woodstock_mud',
    name: 'Woodstock Mud Slide',
    description: 'Bethel, NY, 1969',
    promptSuffix: 'sliding in the mud at Woodstock with a group of laughing hippies. Covered in mud, wearing a headband. Expression: Pure joy and wild laughter. Hazy, overexposed vintage Ektachrome look.'
  },
  {
    id: 'titanic_dinner',
    name: 'Titanic Grand Dinner',
    description: 'First Class Dining, 1912',
    promptSuffix: 'sitting at a dining table on the Titanic, raising a crystal glass in a toast with other wealthy passengers. Wearing a tuxedo or evening gown. Expression: Charming, social smile, talking to the person next to them. Warm candlelight, soft focus, highly detailed period fashion.'
  },
  {
    id: 'saloon_poker',
    name: 'Wild West Saloon',
    description: 'Deadwood, 1876',
    promptSuffix: 'playing poker at a scratched wooden table in a smoky western saloon. Holding cards close to chest, eyeing a suspicious cowboy across the table. Whiskey glass nearby. Expression: Poker face, slight smirk, intense eye contact. Sepia tone, dust motes in light beams.'
  },
  {
    id: 'egypt_workers',
    name: 'Building the Sphinx',
    description: 'Giza, 2500 BC',
    promptSuffix: 'hauling a massive stone block with a team of Egyptian workers, pulling on a rope. Covered in dust and sweat. Expression: Intense physical strain and determination. Harsh desert sunlight, cinematic epic composition.'
  },
  {
    id: 'roman_colosseum',
    name: 'Gladiator Arena',
    description: 'Rome, 80 AD',
    promptSuffix: 'standing in the center of the Colosseum arena as a gladiator, holding a shield, looking up at the roaring crowd. Dust floating in the air. Expression: Fierce, adrenaline-filled, shouting. Hyper-realistic cinematic lighting, dramatic shadows.'
  },
  {
    id: 'renaissance_studio',
    name: 'Da Vinci\'s Studio',
    description: 'Florence, 1505',
    promptSuffix: 'posing as a model for Leonardo da Vinci in a sunlit studio, surrounded by sketches and painting supplies. Wearing renaissance velvet robes. Expression: Enigmatic "Mona Lisa" smile, soft and serene. Painterly lighting, sfumato style.'
  },
  {
    id: 'viking_feast',
    name: 'Viking Victory Feast',
    description: 'Great Hall, 800 AD',
    promptSuffix: 'sitting at a long wooden table in a Viking longhouse, laughing loudly and clanking mugs of ale with bearded warriors. Firelight flickering on faces. Expression: Boisterous laughter, possibly slightly drunk. Gritty, dark, realistic texture.'
  },
  {
    id: 'samurai_training',
    name: 'Samurai Dojo',
    description: 'Kyoto, 1600',
    promptSuffix: 'kneeling in a dojo with other samurai, holding a katana with respect. Cherry blossom petals blowing in through the door. Expression: Deep focus and meditation. Kurosawa style cinematic composition, sharp details.'
  },
  {
    id: 'french_revolution',
    name: 'Storming the Bastille',
    description: 'Paris, 1789',
    promptSuffix: 'in the middle of a chaotic crowd storming the Bastille, holding a flag or musket. Smoke, shouting people everywhere. Expression: Revolutionary anger and passion, mouth open shouting. Oil painting aesthetic turned into photorealism.'
  },
  {
    id: 'roaring_20s_dance',
    name: 'Speakeasy Dance Floor',
    description: 'Chicago, 1925',
    promptSuffix: 'doing the Charleston dance in the middle of a packed speakeasy dance floor, surrounded by flappers and musicians. Confetti falling. Expression: Energetic, surprised, mouth open in laughter. High contrast black and white photography with motion blur.'
  },
  {
    id: 'polaroid_90s',
    name: '90s Mall Arcade',
    description: 'USA, 1995',
    promptSuffix: 'hanging out in a neon-lit mall arcade, leaning against a Street Fighter cabinet with friends. Wearing flannel and baggy jeans. Expression: Cool attitude, chewing bubblegum. Flash photography, vintage Polaroid aesthetic.'
  },
  {
    id: 'vj_day_crowd',
    name: 'V-J Day Times Square',
    description: 'NYC, 1945',
    promptSuffix: 'being hugged by a sailor or nurse in the middle of the massive Times Square crowd. Confetti everywhere. Expression: Overwhelmed with happiness, eyes closed or wide with joy. Iconic black and white photojournalism style.'
  },
  {
    id: 'mayan_ritual',
    name: 'Mayan Temple Ritual',
    description: 'Tikal, 700 AD',
    promptSuffix: 'standing atop a massive stone pyramid during a Mayan ceremony, wearing elaborate jade jewelry and feather headdress. Jungle canopy visible below. Expression: Awe-struck, solemn, looking at the sky. Vibrant colors, tropical sunlight.'
  },
  {
    id: 'wright_brothers',
    name: 'First Flight',
    description: 'Kitty Hawk, 1903',
    promptSuffix: 'running alongside the Wright Flyer as it lifts off the ground, helping push it. Sand flying everywhere. Expression: Disbelief and excitement. grainy, scratched antique photograph look.'
  },
  {
    id: 'einstein_classroom',
    name: 'Einstein\'s Class',
    description: 'Princeton, 1940s',
    promptSuffix: 'sitting in a lecture hall, looking confused while pointing at a chalkboard covered in equations next to Albert Einstein. Expression: Puzzled, scratching head, asking a question. Dusty academic atmosphere, soft window light.'
  },
  {
    id: 'beatles_rooftop',
    name: 'Beatles Rooftop Concert',
    description: 'London, 1969',
    promptSuffix: 'standing on the windy rooftop next to John Lennon and Paul McCartney, playing a tambourine or clapping. London skyline in fog behind. Expression: Cool, enjoying the music, windblown hair. Documentary style color film.'
  },
  {
    id: 'jurassic_encounter',
    name: 'Prehistoric Jungle',
    description: 'Cretaceous Period',
    promptSuffix: 'hiding behind a large fern in a dense jungle, looking terrified as a T-Rex walks by in the background. Expression: Pure fear, finger over lips specifically shushing. National Geographic wildlife photography style, highly realistic.'
  },
  {
    id: 'medieval_market',
    name: 'Medieval Market',
    description: 'London, 1400',
    promptSuffix: 'haggling with a merchant over a chicken in a busy muddy medieval street. Surrounded by peasants and livestock. Expression: Skeptical, arguing, hand gesturing. Earthy tones, natural lighting.'
  }
];