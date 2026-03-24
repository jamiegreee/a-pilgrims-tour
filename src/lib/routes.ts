export interface RouteStage {
  label: string;
  name: string;
  desc: string;
  km: string;
}

export interface RouteInclusions {
  included: string[];
  notIncluded: string[];
}

export interface RouteCTA {
  heading: string;
  button: string;
}

export interface PilgrimRoute {
  name: string;
  country: string;
  distance: string;
  duration: string;
  difficulty: string;
  bestMonths: string;
  startPoint: string;
  heroColor: string;
  image: string;
  shortDescription: string;
  intro: string;
  body: string;
  stages: RouteStage[];
  inclusions: RouteInclusions;
  cta: RouteCTA;
}

export const routes: Record<string, PilgrimRoute> = {
  'camino-de-santiago': {
    name: 'Camino de Santiago',
    country: 'Spain',
    distance: '790 km',
    duration: '30\u201335 days',
    difficulty: 'Moderate',
    bestMonths: 'April \u2013 October',
    startPoint: 'Saint-Jean-Pied-de-Port',
    heroColor: '#D4C9B8',
    image: '/images/routes/camino.jpg',
    shortDescription:
      'The most walked pilgrimage in the world. Cross the Pyrenees, traverse the Meseta, and arrive at the cathedral in Santiago de Compostela.',
    intro:
      'The most walked pilgrimage in the world \u2014 and for good reason. The Camino Franc\u00e9s stretches from the French side of the Pyrenees to the tomb of Saint James in Santiago de Compostela. For over a thousand years, pilgrims have followed this path seeking meaning, solitude, and the simple rhythm of walking.',
    body:
      'The route passes through medieval villages, sweeping vineyards in La Rioja, the vast golden plains of the Meseta, and the green hills of Galicia. Each day brings a new landscape and a new conversation \u2014 with fellow walkers, with locals, and most importantly, with yourself. The infrastructure is unmatched: centuries of hospitality have created a network of welcoming villages, excellent regional cuisine, and accommodation ranging from ancient monasteries to family-run guesthouses.',
    stages: [
      {
        label: 'Week 1',
        name: 'Saint-Jean to Pamplona',
        desc: 'Over the Pyrenees and into Navarra. The crossing at Roncesvalles is one of the most dramatic starts to any walk in the world. Descend into rolling farmland and the ancient streets of Pamplona.',
        km: '~160 km',
      },
      {
        label: 'Week 2',
        name: 'Pamplona to Burgos',
        desc: 'Through the wine country of La Rioja, past the monastery at Irache (with its famous wine fountain), and into the historic city of Burgos with its soaring Gothic cathedral.',
        km: '~180 km',
      },
      {
        label: 'Week 3',
        name: 'Burgos to Le\u00f3n',
        desc: 'The Meseta \u2014 Spain\'s high central plateau. Long, flat days under enormous skies. This is where the Camino strips everything away and the real inner journey begins.',
        km: '~180 km',
      },
      {
        label: 'Week 4',
        name: 'Le\u00f3n to Sarria',
        desc: 'Climb into the mountains of El Bierzo, pass through the hilltop village of O Cebreiro, and enter Galicia. The landscape shifts to green valleys, stone walls, and eucalyptus forests.',
        km: '~160 km',
      },
      {
        label: 'Week 5',
        name: 'Sarria to Santiago de Compostela',
        desc: 'The final stretch. Misty Galician mornings, ancient hórreos (grain stores), and the growing anticipation of arrival. The first sight of the cathedral spires is something you will never forget.',
        km: '~115 km',
      },
    ],
    inclusions: {
      included: [
        'All accommodation pre-booked (private rooms in quality guesthouses and small hotels)',
        'Daily luggage transfers between stops',
        'Detailed route notes and offline maps',
        'Pilgrim credential (passport) and guidance on the Compostela certificate',
        'Welcome pack with regional food guide',
        '24/7 local support phone line',
        'Airport transfer on arrival day',
      ],
      notIncluded: [
        'Flights to/from Spain',
        'Daily meals (though breakfast is typically included)',
        'Travel insurance',
        'Personal spending money',
      ],
    },
    cta: {
      heading: 'Walk the Camino your way.',
      button: 'Plan My Camino',
    },
  },

  'via-francigena': {
    name: 'Via Francigena',
    country: 'Italy',
    distance: '1,000 km',
    duration: '40\u201345 days',
    difficulty: 'Moderate to Challenging',
    bestMonths: 'May \u2013 October',
    startPoint: 'Great St Bernard Pass',
    heroColor: '#C8B8A0',
    image: '/images/routes/francigena.jpg',
    shortDescription:
      'From the Alpine passes to the eternal city. Walk through Tuscany\u2019s rolling hills, medieval towns, and arrive at St Peter\u2019s Basilica in Rome.',
    intro:
      'The Via Francigena is the pilgrimage that built Europe. First documented by Archbishop Sigeric of Canterbury in 990 AD, it connected the courts and cathedrals of northern Europe to the seat of Christendom in Rome. Today, it offers an intimate journey through some of Italy\u2019s most beautiful and least touristed landscapes.',
    body:
      'Beginning at the Great St Bernard Pass on the Swiss-Italian border, the route descends through the Aosta Valley and crosses the Po Plain before climbing into the Apennines. The Tuscan stretch is the jewel \u2014 rolling hills, cypress-lined roads, vineyards, and medieval hilltop towns like San Gimignano, Monteriggioni, and Siena. The final days take you through Lazio\u2019s quieter countryside before the dome of St Peter\u2019s appears on the horizon. Unlike the Camino, you will often have the path to yourself.',
    stages: [
      {
        label: 'Week 1\u20132',
        name: 'Great St Bernard Pass to Vercelli',
        desc: 'A dramatic descent from the Alps into the fertile Aosta Valley. Walk through chestnut forests, past Roman ruins, and across the misty rice paddies of the Po Plain.',
        km: '~250 km',
      },
      {
        label: 'Week 3',
        name: 'Vercelli to Fidenza',
        desc: 'Cross the wide, flat Po Valley. The walking is gentle and the stops are rewarding \u2014 Pavia\u2019s Carthusian monastery and the Romanesque cathedral at Fidenza are highlights.',
        km: '~180 km',
      },
      {
        label: 'Week 4',
        name: 'Fidenza to Siena',
        desc: 'Over the Cisa Pass and into Tuscany. The landscape transforms into the iconic rolling hills, olive groves, and vineyards. Arrive in Siena\u2019s magnificent Piazza del Campo.',
        km: '~200 km',
      },
      {
        label: 'Week 5',
        name: 'Siena to Bolsena',
        desc: 'Through the Val d\u2019Orcia \u2014 perhaps the most photographed landscape in Italy. Past thermal springs at Bagno Vignoni and into the volcanic lake country of northern Lazio.',
        km: '~180 km',
      },
      {
        label: 'Week 6',
        name: 'Bolsena to Rome',
        desc: 'The final approach to the Eternal City. Through Viterbo\u2019s medieval quarter, across the Roman campagna, and at last \u2014 St Peter\u2019s Square.',
        km: '~190 km',
      },
    ],
    inclusions: {
      included: [
        'All accommodation pre-booked (agriturismos, family hotels, and historic guesthouses)',
        'Daily luggage transfers between stops',
        'Detailed route notes with GPS waypoints',
        'Testimonium (official Via Francigena certificate)',
        'Welcome pack with regional food and wine guide',
        '24/7 local support phone line',
        'Transfer from Geneva or Milan airport to start point',
      ],
      notIncluded: [
        'Flights to/from Italy or Switzerland',
        'Daily meals (breakfast typically included)',
        'Travel insurance',
        'Personal spending money',
      ],
    },
    cta: {
      heading: 'Walk through the heart of Italy.',
      button: 'Plan My Via Francigena',
    },
  },

  'kumano-kodo': {
    name: 'Kumano Kodo',
    country: 'Japan',
    distance: '70 km',
    duration: '5\u20137 days',
    difficulty: 'Moderate',
    bestMonths: 'March \u2013 May, October \u2013 November',
    startPoint: 'Tanabe',
    heroColor: '#A8B8A0',
    image: '/images/routes/kumano.jpg',
    shortDescription:
      'A sacred trail through Japan\u2019s ancient cedar forests. One of only two pilgrimage routes with UNESCO World Heritage status alongside the Camino.',
    intro:
      'The Kumano Kodo is a network of ancient pilgrimage trails through the mountainous Kii Peninsula of Japan. For over a thousand years, everyone from emperors to peasants has walked these paths to reach the three grand shrines of Kumano \u2014 Nachi, Hayatama, and Hongu. It is one of only two pilgrimage routes in the world designated as a UNESCO World Heritage Site.',
    body:
      'Walking the Kumano Kodo is a profoundly different experience from European pilgrimages. The trails wind through towering cedar forests, past moss-covered stone markers, over mountain passes, and through remote villages where time seems to have stopped. Each evening, you rest in traditional Japanese inns (minshuku or ryokan), soaking in onsen hot springs and eating exquisite multi-course kaiseki meals prepared with local mountain ingredients. The spiritual atmosphere is palpable \u2014 Shinto and Buddhist traditions merge seamlessly, and the forest itself feels sacred.',
    stages: [
      {
        label: 'Day 1',
        name: 'Tanabe to Takijiri-oji',
        desc: 'Arrive in the coastal town of Tanabe, meet your guide for an orientation, and transfer to Takijiri-oji \u2014 the sacred gateway to the Kumano trails.',
        km: 'Transfer day',
      },
      {
        label: 'Day 2',
        name: 'Takijiri-oji to Chikatsuyu',
        desc: 'Your first full day on the trail. Climb through cedar forests past ancient oji (subsidiary shrines) to the village of Chikatsuyu. Soak in the onsen after a rewarding day.',
        km: '~14 km',
      },
      {
        label: 'Day 3',
        name: 'Chikatsuyu to Hongu',
        desc: 'Over the Waroda-ishi pass and down to the great shrine of Kumano Hongu Taisha. Pass through the enormous torii gate of Oyunohara \u2014 the largest in Japan.',
        km: '~21 km',
      },
      {
        label: 'Day 4',
        name: 'Hongu to Koguchi',
        desc: 'A quieter, more remote stretch along river valleys and through deep forest. Stay in a small mountain village with exceptional hospitality.',
        km: '~15 km',
      },
      {
        label: 'Day 5',
        name: 'Koguchi to Nachi',
        desc: 'The final climb to Kumano Nachi Taisha and the spectacular Nachi Falls \u2014 Japan\u2019s tallest single-drop waterfall at 133 metres. A fitting conclusion to a sacred journey.',
        km: '~14 km',
      },
    ],
    inclusions: {
      included: [
        'All accommodation pre-booked (traditional ryokan and minshuku with onsen)',
        'Daily luggage forwarding via Yamato Transport',
        'Detailed bilingual route notes and offline maps',
        'Dual Pilgrim passport (Kumano Kodo and Camino dual-pilgrim registration)',
        'Two kaiseki dinners included',
        'Bus transfers between trail sections where needed',
        '24/7 English-speaking local support',
      ],
      notIncluded: [
        'International flights to Japan',
        'Shinkansen or domestic transport to Tanabe',
        'Travel insurance',
        'Additional meals beyond those specified',
        'Personal expenses and souvenirs',
      ],
    },
    cta: {
      heading: 'Walk the sacred trails of Japan.',
      button: 'Plan My Kumano Kodo',
    },
  },

  'st-olavs-way': {
    name: "St Olav\u2019s Way",
    country: 'Norway',
    distance: '643 km',
    duration: '28\u201332 days',
    difficulty: 'Moderate to Challenging',
    bestMonths: 'June \u2013 September',
    startPoint: 'Oslo',
    heroColor: '#B0BEC5',
    image: '/images/routes/norway.jpg',
    shortDescription:
      'From Oslo to Trondheim through Norway\u2019s wild interior. Follow Viking-age paths to the great Nidaros Cathedral \u2014 the northernmost medieval cathedral in the world.',
    intro:
      'St Olav\u2019s Way follows the route taken by pilgrims since the 11th century to reach the shrine of St Olav at Nidaros Cathedral in Trondheim \u2014 the northernmost medieval cathedral in the world. After centuries of dormancy, the trail was revived in 1997 and has quickly become one of Europe\u2019s most compelling pilgrimages.',
    body:
      'The route from Oslo to Trondheim traverses the full breadth of Norway\u2019s extraordinary landscape: from the gentle farmland of the Mjøsa lakeside, up through dense boreal forests, across the high mountain plateau of the Dovrefjell (where you may spot musk oxen), and down into the Trøndelag region. In midsummer, you walk in near-constant daylight. The trail is well-marked but often remote \u2014 you will go hours without seeing another person, accompanied only by birdsong and the sound of rivers. The solitude is not loneliness; it is a gift.',
    stages: [
      {
        label: 'Week 1',
        name: 'Oslo to Hamar',
        desc: 'Leave the capital and follow the shores of Lake Mjøsa, Norway\u2019s largest lake. Through gentle farmland and birch forests to the medieval cathedral ruins at Hamar.',
        km: '~150 km',
      },
      {
        label: 'Week 2',
        name: 'Hamar to Lillehammer and the Gudbrandsdalen',
        desc: 'Past the 1994 Winter Olympics town of Lillehammer and into the long, dramatic Gudbrandsdalen valley. Stave churches, Viking burial mounds, and increasingly wild scenery.',
        km: '~160 km',
      },
      {
        label: 'Week 3',
        name: 'Gudbrandsdalen to Dovrefjell',
        desc: 'Climb to the roof of Norway. Cross the Dovrefjell mountain plateau \u2014 a landscape of tundra, reindeer, and, if you\u2019re lucky, musk oxen. The air is crystalline.',
        km: '~170 km',
      },
      {
        label: 'Week 4',
        name: 'Dovrefjell to Trondheim',
        desc: 'Descend through the fertile Trøndelag region. The final days follow the River Nidelva into Trondheim. Your first sight of the Nidaros Cathedral\u2019s west front is a moment of profound arrival.',
        km: '~163 km',
      },
    ],
    inclusions: {
      included: [
        'All accommodation pre-booked (guesthouses, mountain lodges, and historic inns)',
        'Daily luggage transfers between stops',
        'Detailed route notes with GPS waypoints',
        'Olavspass (official pilgrim credential)',
        'Welcome pack with regional guide',
        '24/7 local support phone line',
        'Transfer from Oslo airport to start point',
      ],
      notIncluded: [
        'Flights to/from Norway',
        'Daily meals (breakfast typically included)',
        'Travel insurance',
        'Personal spending money',
      ],
    },
    cta: {
      heading: 'Walk through Norway\u2019s wild heart.',
      button: "Plan My St Olav\u2019s Way",
    },
  },
};

export const routeSlugs = Object.keys(routes);
