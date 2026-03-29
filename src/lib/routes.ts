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
  body?: string;
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
  endPoint?: string;
  heroColor: string;
  image: string;
  shortDescription: string;
  intro: string;
  body: string;
  stages: RouteStage[];
  inclusions: RouteInclusions;
  selfGuidedDesc?: string;
  selfGuidedInclusions?: string[];
  groupDesc?: string;
  groupInclusions?: string[];
  groupMaxWalkers?: number;
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
        desc: 'The final stretch. Misty Galician mornings, ancient h\u00f3rreos (grain stores), and the growing anticipation of arrival. The first sight of the cathedral spires is something you will never forget.',
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
      'The route from Oslo to Trondheim traverses the full breadth of Norway\u2019s extraordinary landscape: from the gentle farmland of the Mj\u00f8sa lakeside, up through dense boreal forests, across the high mountain plateau of the Dovrefjell (where you may spot musk oxen), and down into the Tr\u00f8ndelag region. In midsummer, you walk in near-constant daylight. The trail is well-marked but often remote \u2014 you will go hours without seeing another person, accompanied only by birdsong and the sound of rivers. The solitude is not loneliness; it is a gift.',
    stages: [
      {
        label: 'Week 1',
        name: 'Oslo to Hamar',
        desc: 'Leave the capital and follow the shores of Lake Mj\u00f8sa, Norway\u2019s largest lake. Through gentle farmland and birch forests to the medieval cathedral ruins at Hamar.',
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
        desc: 'Descend through the fertile Tr\u00f8ndelag region. The final days follow the River Nidelva into Trondheim. Your first sight of the Nidaros Cathedral\u2019s west front is a moment of profound arrival.',
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

  'st-cuthberts-way': {
    name: "St Cuthbert\u2019s Way",
    country: 'Scotland & England',
    distance: '100 km',
    duration: '4\u20135 days',
    difficulty: 'Moderate',
    bestMonths: 'May \u2013 September',
    startPoint: 'Melrose Abbey',
    endPoint: 'Lindisfarne',
    heroColor: '#7A9270',
    image: 'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=1440&q=80&fit=crop',
    shortDescription:
      'From Melrose Abbey to the tidal island of Lindisfarne \u2014 one of Britain\u2019s most sacred and spectacular walks.',
    intro:
      'St Cuthbert\u2019s Way follows the life and legacy of one of early Christianity\u2019s most beloved saints \u2014 from his monastic home at Melrose Abbey, through the wild Cheviot Hills, to the wind-swept holy island of Lindisfarne where he lived and died.',
    body:
      'The route crosses from Scotland into England, traversing the rolling Border hills and moorland landscapes that have barely changed in centuries. The dramatic finale \u2014 a tidal causeway crossing to Holy Island at low tide \u2014 is unlike any other walk in Britain. Four to five days of moderate walking, manageable for most walkers with a reasonable level of fitness. The route is waymarked throughout with the distinctive St Cuthbert\u2019s scallop shell.',
    stages: [
      {
        label: 'Day 1',
        name: 'Melrose to Maxton',
        desc: 'Begin at Melrose Abbey, where Cuthbert first became a monk. Follow the River Tweed east through rich farmland and the ruins of Dryburgh Abbey.',
        km: '~21 km',
      },
      {
        label: 'Day 2',
        name: 'Maxton to Morebattle',
        desc: 'Leave the Tweed valley and climb into the Kale Water valley. Open moorland and forest tracks lead through the rolling Scottish Borders to the quiet village of Morebattle.',
        km: '~23 km',
      },
      {
        label: 'Day 3',
        name: 'Morebattle to Kirk Yetholm',
        desc: 'Cross into the Kale valley and climb through heather moorland to the edge of the Cheviots. Kirk Yetholm, the famous end point of the Pennine Way, marks the Scottish border.',
        km: '~18 km',
      },
      {
        label: 'Day 4',
        name: 'Kirk Yetholm to Wooler',
        desc: "Cross the English border into Northumberland. Pass St Cuthbert\u2019s Cave \u2014 a natural sandstone shelter used by monks carrying Cuthbert\u2019s relics \u2014 and descend to Wooler.",
        km: '~22 km',
      },
      {
        label: 'Day 5',
        name: 'Wooler to Lindisfarne',
        desc: 'The final stretch across Northumbrian farmland to the coast, culminating in a tidal causeway crossing to Holy Island. Time the tide. The priory and castle await.',
        km: '~16 km',
      },
    ],
    inclusions: {
      included: [
        'Hand-picked B&Bs, guesthouses and inns (private rooms)',
        'Daily luggage transfers between accommodations',
        'Detailed route notes, OS maps and elevation profiles',
        'Tide tables and Lindisfarne causeway crossing guide',
        '24/7 local support line throughout your walk',
        'Regional food and pub guide for the route',
        'Flexible start dates \u2014 walk when it suits you',
      ],
      notIncluded: [
        'Travel to/from Melrose',
        'Daily meals (dinner and lunch)',
        'Travel insurance',
        'Personal spending money',
      ],
    },
    selfGuidedDesc:
      'Walk at your own pace, on your own schedule. Full logistical support, zero hand-holding.',
    selfGuidedInclusions: [
      'Hand-picked B&Bs, guesthouses and inns (private rooms)',
      'Daily luggage transfers between accommodations',
      'Detailed route notes, OS maps and elevation profiles',
      'Tide tables and Lindisfarne causeway crossing guide',
      '24/7 local support line throughout your walk',
      'Regional food and pub guide for the route',
      'Flexible start dates \u2014 walk when it suits you',
    ],
    groupDesc:
      'Everything in self-guided, plus the companionship of a small group and an expert local guide.',
    groupInclusions: [
      'Everything included in self-guided',
      'Expert Northumbrian guide for the full route',
      'Welcome dinner at Melrose on arrival evening',
      'Farewell dinner on Holy Island on final evening',
      'Historical and spiritual talks each evening',
      'Guided tour of Lindisfarne Priory and Castle',
      'Fixed departures \u2014 great for solo travellers',
    ],
    groupMaxWalkers: 12,
    cta: {
      heading: 'Walk to Holy Island your way.',
      body: 'Tell us your preferred dates, group size and pace. We\u2019ll handle everything from the causeway.',
      button: "Enquire about St Cuthbert\u2019s Way",
    },
  },

  'the-pilgrims-way': {
    name: "The Pilgrims\u2019 Way",
    country: 'England',
    distance: '190 km',
    duration: '8\u201310 days',
    difficulty: 'Moderate',
    bestMonths: 'April \u2013 October',
    startPoint: 'Winchester',
    endPoint: 'Canterbury',
    heroColor: '#C8B898',
    image: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1440&q=80&fit=crop',
    shortDescription:
      "England\u2019s oldest road \u2014 a medieval track from Winchester\u2019s great cathedral to the shrine of Thomas Becket in Canterbury.",
    intro:
      "The Pilgrims\u2019 Way is England\u2019s oldest road \u2014 a medieval track that has drawn pilgrims from Winchester to Canterbury for nearly a thousand years. It follows the route of those travelling to the shrine of Thomas Becket, the Archbishop murdered in Canterbury Cathedral in 1170.",
    body:
      "The North Downs Way uses much of this ancient track, weaving along chalk downland ridges with sweeping views across the Weald of Kent. The route passes through some of England\u2019s most quintessential countryside \u2014 village greens, ancient churches, apple orchards, and hop gardens \u2014 before a final approach to one of the great cathedrals of medieval Europe.",
    stages: [
      {
        label: 'Days 1\u20132',
        name: 'Winchester to Farnham',
        desc: "Leave the ancient capital of England from its magnificent cathedral and follow the Itchen Valley north. Cross the Surrey Hills and arrive at the ancient town of Farnham, gateway to the North Downs.",
        km: '~50 km',
      },
      {
        label: 'Days 3\u20134',
        name: 'Farnham to Guildford',
        desc: 'Walk the chalk ridge above the Wey Valley with views south to the Weald. Pass through the village of Compton with its Norman church and arrive in the market town of Guildford.',
        km: '~35 km',
      },
      {
        label: 'Days 5\u20136',
        name: 'Guildford to Sevenoaks',
        desc: 'The finest stretch of the North Downs. High chalk ridgeway walking with panoramic views. Pass through Box Hill and descend to the Darent Valley at Sevenoaks.',
        km: '~50 km',
      },
      {
        label: 'Days 7\u20138',
        name: 'Sevenoaks to Chilham',
        desc: 'Kentish countryside at its finest \u2014 orchards, oast houses, and village paths. Pass through the medieval village of Chilham, one of the most beautiful in England.',
        km: '~40 km',
      },
      {
        label: 'Days 9\u201310',
        name: 'Chilham to Canterbury',
        desc: "The final approach. Follow the pilgrims\u2019 ancient route into the city, arriving at the Christ Church Gate and the soaring nave of Canterbury Cathedral.",
        km: '~20 km',
      },
    ],
    inclusions: {
      included: [
        'Hand-picked hotels, inns and B&Bs with private rooms throughout',
        'Daily luggage transfers',
        'Detailed route notes with OS maps and waypoints',
        'Welcome pack with guide to Canterbury Cathedral and Becket\u2019s shrine',
        '24/7 local support line',
        'Regional food and pub guide for the Downs',
        'Flexible start dates',
      ],
      notIncluded: [
        'Travel to/from Winchester or Canterbury',
        'Daily meals (breakfast typically included)',
        'Travel insurance',
        'Personal spending money',
      ],
    },
    selfGuidedDesc:
      'Walk the ancient road at your own pace, with every detail arranged ahead of your arrival.',
    selfGuidedInclusions: [
      'Hand-picked hotels, inns and B&Bs with private rooms throughout',
      'Daily luggage transfers',
      'Detailed route notes with OS maps and waypoints',
      'Welcome pack with guide to Canterbury Cathedral and Becket\u2019s shrine',
      '24/7 local support line',
      'Regional food and pub guide for the Downs',
      'Flexible start dates',
    ],
    groupDesc:
      'Everything in self-guided, plus an expert guide and the fellowship of fellow pilgrims.',
    groupInclusions: [
      'Everything included in self-guided',
      'Expert guide for the full route',
      'Welcome dinner in Winchester on arrival evening',
      'Farewell dinner in Canterbury on final evening',
      'Evening talks on Becket, medieval pilgrimage, and the Crusades',
      'Guided tour of Canterbury Cathedral including the crypt',
      'Fixed departures in May, June, and September',
    ],
    groupMaxWalkers: 12,
    cta: {
      heading: 'Follow the ancient road to Canterbury.',
      body: "Two thousand years of pilgrims have walked this way before you. We\u2019ll make sure every step is taken care of.",
      button: "Enquire about the Pilgrims\u2019 Way",
    },
  },

  'st-michaels-way': {
    name: "St Michael\u2019s Way",
    country: 'Cornwall, England',
    distance: '20 km',
    duration: '1\u20132 days',
    difficulty: 'Easy',
    bestMonths: 'April \u2013 October',
    startPoint: 'Lelant, Cornwall',
    endPoint: "St Michael\u2019s Mount",
    heroColor: '#5A8A96',
    image: 'https://images.unsplash.com/photo-1558465093-a93b57a5be07?w=1440&q=80&fit=crop',
    shortDescription:
      "A short, spectacular crossing of west Cornwall, ending at the island fortress of St Michael\u2019s Mount rising from the sea.",
    intro:
      "St Michael\u2019s Way follows a route used by Celtic saints and medieval pilgrims for over a thousand years. Rather than brave the dangerous seas around Land\u2019s End, travellers crossed the Cornish peninsula overland from the north coast at Lelant to the south coast at Marazion \u2014 and on to the extraordinary island castle of St Michael\u2019s Mount.",
    body:
      "At just 20 kilometres, this is A Pilgrim\u2019s Tour\u2019s most accessible route \u2014 perfect as an introduction to pilgrimage walking, a weekend escape, or a meaningful short break. The finale is unforgettable: crossing the tidal cobblestone causeway to St Michael\u2019s Mount as the tide retreats. Walking is straightforward, but Cornwall\u2019s hills and coastal paths require a reasonable level of fitness. The route is waymarked throughout with the distinctive St Michael\u2019s scallop shell.",
    stages: [
      {
        label: 'Part 1',
        name: 'Lelant to Ludgvan',
        desc: "Start at Lelant church \u2014 a place of pilgrimage since the 5th century \u2014 and cross Hayle Estuary. Climb over Trencrom Hill with its Iron Age hillfort and sweeping views from both coasts, then descend through farmland to the village of Ludgvan.",
        km: '~11 km',
      },
      {
        label: 'Part 2',
        name: "Ludgvan to St Michael\u2019s Mount",
        desc: "Through the ancient village of Marazion \u2014 the oldest chartered town in Britain \u2014 to the shore of Mount\u2019s Bay. Cross the tidal cobblestone causeway to St Michael\u2019s Mount when the tide is low, arriving at the castle that has welcomed pilgrims for a thousand years.",
        km: '~9 km',
      },
    ],
    inclusions: {
      included: [
        'Accommodation in Penzance or Marazion (private rooms)',
        'Luggage transfer if staying overnight',
        'Detailed route notes with OS maps',
        "Tide tables for the St Michael\u2019s Mount causeway",
        '24/7 local support line throughout',
        'Cornish food and restaurant guide',
        'Train connections guide (Lelant Saltings station)',
      ],
      notIncluded: [
        'Travel to/from Cornwall',
        'Meals (beyond those listed)',
        'Travel insurance',
        "Entry fee to St Michael\u2019s Mount castle",
      ],
    },
    selfGuidedDesc:
      'Walk at your own pace with all logistics arranged. Perfect for a long weekend.',
    selfGuidedInclusions: [
      'Accommodation in Penzance or Marazion (private rooms)',
      'Luggage transfer if staying overnight',
      'Detailed route notes with OS maps',
      "Tide tables for the St Michael\u2019s Mount causeway",
      '24/7 local support line throughout',
      'Cornish food and restaurant guide',
      'Train connections guide (Lelant Saltings station)',
    ],
    groupDesc:
      'Everything in self-guided, plus a Cornish guide bringing this ancient crossing to life.',
    groupInclusions: [
      'Everything included in self-guided',
      'Expert Cornish guide for the full crossing',
      'Welcome dinner in Penzance on arrival evening',
      "Guided tour of St Michael\u2019s Mount castle and gardens",
      'Stories of Celtic saints and Cornish pilgrimage history',
      'Farewell cream tea on the island',
      'Weekend departures throughout the season',
    ],
    groupMaxWalkers: 12,
    cta: {
      heading: 'Cross Cornwall to the island.',
      body: 'A long weekend, a meaningful walk, an unforgettable finish. Let us arrange every detail.',
      button: "Enquire about St Michael\u2019s Way",
    },
  },

  'north-wales-pilgrims-way': {
    name: "North Wales Pilgrim\u2019s Way",
    country: 'Wales',
    distance: '217 km',
    duration: '10\u201312 days',
    difficulty: 'Moderate\u2013Challenging',
    bestMonths: 'May \u2013 September',
    startPoint: 'Holywell',
    endPoint: 'Bardsey Island',
    heroColor: '#7A8E88',
    image: 'https://images.unsplash.com/photo-1557316655-8715fdecd2d1?w=1440&q=80&fit=crop',
    shortDescription:
      "From Holywell\u2019s sacred spring to Bardsey Island \u2014 the Island of 20,000 Saints \u2014 across the full breadth of North Wales.",
    intro:
      'Medieval pilgrims believed that three journeys to Bardsey Island \u2014 Ynys Enlli \u2014 equalled one to Rome. For centuries, the faithful walked from the shrine of St Winefride at Holywell, one of the oldest continuously visited pilgrimage sites in Britain, across the full length of North Wales to the tip of the Ll\u0177n Peninsula and the holy waters beyond.',
    body:
      'The route is strikingly varied: ancient abbeys, the foothills of Snowdonia, the dramatic Ll\u0177n Peninsula coast, and a boat crossing to the island itself. It passes through Welsh-speaking heartland, a living culture that has nurtured this pilgrimage for 1,500 years. One of Britain\u2019s least-known great pilgrimages \u2014 and all the more rewarding for it. A moderate to challenging walk requiring good fitness and appropriate footwear for mixed terrain.',
    stages: [
      {
        label: 'Days 1\u20132',
        name: 'Holywell to Bodfari',
        desc: "Begin at St Winefride\u2019s Well \u2014 a pilgrimage site continuously visited since the 7th century, known as the \u2018Lourdes of Wales.\u2019 Follow ancient lanes west toward the Vale of Clwyd and the market town of Denbigh.",
        km: '~45 km',
      },
      {
        label: 'Days 3\u20136',
        name: 'Bodfari to Clynnog Fawr',
        desc: "Cross the foothills of the Clwydian Range and enter Snowdonia\u2019s eastern approaches. The route passes a succession of ancient Welsh churches \u2014 many with holy wells \u2014 before arriving at Clynnog Fawr, a major medieval pilgrimage church in the Ll\u0177n Peninsula.",
        km: '~80 km',
      },
      {
        label: 'Days 7\u20139',
        name: 'Ll\u0177n Peninsula Coast',
        desc: 'Walk the dramatic Ll\u0177n Peninsula coastal path \u2014 an AONB of extraordinary beauty. Pass the fishing village of Aberdaron, the last resting point before Bardsey, where pilgrims once waited for suitable weather to cross.',
        km: '~70 km',
      },
      {
        label: 'Days 10\u201312',
        name: 'Aberdaron & Bardsey Island',
        desc: 'Cross Bardsey Sound by boat to the Island of 20,000 Saints. Walk to the 13th-century abbey tower \u2014 all that remains of the monastery that drew medieval pilgrims from across Britain. A profound and isolated conclusion.',
        km: '~22 km',
      },
    ],
    inclusions: {
      included: [
        'Full logistical support across North Wales, with the Bardsey crossing handled for you',
        'Hand-picked Welsh B&Bs, inns and farmhouses',
        'Daily luggage transfers throughout',
        'Detailed bilingual route notes (English & Welsh)',
        'Bardsey Sound boat crossing arranged and confirmed',
        '24/7 local support line throughout',
        'Guide to Welsh-language place names and culture',
        'Flexible start dates to suit Bardsey crossing schedule',
      ],
      notIncluded: [
        'Travel to/from Holywell or North Wales',
        'Daily meals (breakfast typically included)',
        'Travel insurance',
        'Personal spending money',
      ],
    },
    selfGuidedDesc:
      'Full logistical support across North Wales, with all the complexity of the Bardsey crossing handled for you.',
    selfGuidedInclusions: [
      'Full logistical support across North Wales, with the Bardsey crossing handled for you',
      'Hand-picked Welsh B&Bs, inns and farmhouses',
      'Daily luggage transfers throughout',
      'Detailed bilingual route notes (English & Welsh)',
      'Bardsey Sound boat crossing arranged and confirmed',
      '24/7 local support line throughout',
      'Guide to Welsh-language place names and culture',
      'Flexible start dates to suit Bardsey crossing schedule',
    ],
    groupDesc:
      'Everything in self-guided, plus a Welsh-speaking guide steeped in the culture and history of this remarkable route.',
    groupInclusions: [
      'Everything included in self-guided',
      'Welsh-speaking expert guide for the full route',
      'Welcome dinner at Holywell on arrival evening',
      'Evening talks on Celtic Christianity and Welsh saints',
      'Overnight stay on Bardsey Island (limited availability)',
      'Guided tour of Bardsey Abbey and the island',
      'Two departures per year \u2014 May and September',
    ],
    groupMaxWalkers: 12,
    cta: {
      heading: 'Walk to the Island of 20,000 Saints.',
      body: "One of Britain\u2019s most extraordinary pilgrimage journeys. We\u2019ll handle every detail across North Wales and beyond.",
      button: "Enquire about the North Wales Pilgrim\u2019s Way",
    },
  },

  'st-hildas-way': {
    name: "St Hilda\u2019s Way",
    country: 'North Yorkshire, England',
    distance: '65 km',
    duration: '3\u20134 days',
    difficulty: 'Moderate',
    bestMonths: 'April \u2013 October',
    startPoint: 'Hinderwell',
    endPoint: 'Whitby Abbey',
    heroColor: '#7A7870',
    image: 'https://images.unsplash.com/photo-1757788754774-e702993383b0?w=1440&q=80&fit=crop',
    shortDescription:
      'From the North York Moors to the clifftop ruins of Whitby Abbey, following the landscape shaped by Hilda in 657 AD.',
    intro:
      'St Hilda of Whitby was one of the most influential figures of early English Christianity \u2014 an abbess, scholar and diplomat who presided over the Synod of Whitby in 664 AD, where the course of English Christian practice was decided. This route follows the landscape she shaped, from the moorland villages of the North Yorkshire coast to the clifftop ruins of her great monastery.',
    body:
      'The walking is spectacular: heather moorland, dramatic coastal villages like Runswick Bay and Sandsend, and a final approach to Whitby along the clifftops with the Abbey silhouetted against the sky. At three to four days, this is an ideal mid-length route \u2014 long enough to feel like a genuine pilgrimage, short enough for those new to walking holidays or with limited time.',
    stages: [
      {
        label: 'Day 1',
        name: 'Hinderwell to Staithes',
        desc: "Begin at Hinderwell\u2019s ancient church \u2014 dedicated to St Hilda \u2014 and descend through the deeply-cut valley to Staithes, one of the most picturesque fishing villages on the Yorkshire coast. Captain Cook lived here as a boy.",
        km: '~16 km',
      },
      {
        label: 'Day 2',
        name: 'Staithes to Runswick Bay',
        desc: 'Follow the Cleveland Way coastal path south, climbing in and out of dramatic coves. Runswick Bay is one of the finest beaches on the North Yorkshire coast \u2014 a tangle of red-roofed cottages tumbling down to the sand.',
        km: '~16 km',
      },
      {
        label: 'Day 3',
        name: 'Runswick Bay to Sandsend',
        desc: "Cross the moorland plateau above the coast, passing the ruins of Goldsborough signal station and descending to the long sandy beach at Sandsend \u2014 with Whitby\u2019s rooftops and Abbey now visible in the distance.",
        km: '~14 km',
      },
      {
        label: 'Day 4',
        name: 'Sandsend to Whitby Abbey',
        desc: "Walk the beach into Whitby, cross the swing bridge over the Esk, and climb the famous 199 steps to the clifftop. Whitby Abbey\u2019s skeletal Gothic ruins stand against the sky \u2014 the dramatic, unmistakable end to the pilgrimage.",
        km: '~17 km',
      },
    ],
    inclusions: {
      included: [
        'Hand-picked B&Bs and inns in coastal villages (private rooms)',
        'Daily luggage transfers between accommodations',
        'Detailed route notes with OS maps and coastal path guidance',
        "Guide to St Hilda\u2019s life and the Synod of Whitby",
        '24/7 local support line throughout',
        'Yorkshire seafood and restaurant guide',
        'Train and transport connections to Hinderwell and from Whitby',
      ],
      notIncluded: [
        'Travel to/from North Yorkshire',
        'Daily meals (beyond those listed)',
        'Travel insurance',
        'Entry to Whitby Abbey (English Heritage)',
      ],
    },
    selfGuidedDesc:
      'Walk at your own pace along one of England\u2019s finest coastal routes. Start any day that suits.',
    selfGuidedInclusions: [
      'Hand-picked B&Bs and inns in coastal villages (private rooms)',
      'Daily luggage transfers between accommodations',
      'Detailed route notes with OS maps and coastal path guidance',
      "Guide to St Hilda\u2019s life and the Synod of Whitby",
      '24/7 local support line throughout',
      'Yorkshire seafood and restaurant guide',
      'Train and transport connections to Hinderwell and from Whitby',
    ],
    groupDesc:
      'Everything in self-guided, plus a historian guide bringing early medieval Yorkshire to life at every step.',
    groupInclusions: [
      'Everything included in self-guided',
      'Expert guide \u2014 early medieval historian',
      'Welcome dinner at Hinderwell on arrival evening',
      'Farewell dinner in Whitby \u2014 fish and chips on the harbour',
      'Guided tour of Whitby Abbey with English Heritage',
      'Evening talks on St Hilda, Caedmon and the early church',
      'Monthly departures April through October',
    ],
    groupMaxWalkers: 12,
    cta: {
      heading: 'Walk to Whitby Abbey your way.',
      body: "Three to four days along one of England\u2019s finest coastal walking routes. We\u2019ll handle everything from Hinderwell to the 199 steps.",
      button: "Enquire about St Hilda\u2019s Way",
    },
  },

  'the-saints-way': {
    name: "The Saints\u2019 Way",
    country: 'Cornwall, England',
    distance: '45 km',
    duration: '2\u20133 days',
    difficulty: 'Easy\u2013Moderate',
    bestMonths: 'April \u2013 October',
    startPoint: 'Padstow',
    endPoint: 'Fowey',
    heroColor: '#5A8878',
    image: 'https://images.unsplash.com/photo-1558464919-690deda1ca00?w=1440&q=80&fit=crop',
    shortDescription:
      'An ancient Cornish crossing from Padstow on the north coast to Fowey on the south \u2014 linking two of Cornwall\u2019s most beautiful harbour towns.',
    intro:
      "Long before the Saints\u2019 Way was walked by modern pilgrims, Celtic saints \u2014 Petroc, Samson, Fimbarrus \u2014 used this cross-peninsula route to avoid the treacherous seas around Land\u2019s End. Irish and Welsh missionaries travelling to Brittany crossed Cornwall here, leaving behind a trail of ancient churches, holy wells and carved granite crosses that still stand today.",
    body:
      "The route connects Padstow \u2014 one of Cornwall\u2019s most celebrated fishing ports \u2014 with Fowey, a town whose literary and maritime history rivals anywhere in England. Between them: Helman Tor\u2019s Bronze Age landscape, the Luxulyan Valley\u2019s UNESCO World Heritage Site, and a remarkable sequence of medieval Cornish churches. Two to three days of accessible walking through the Cornish interior. Pairs beautifully with St Michael\u2019s Way for a longer Cornish pilgrimage experience.",
    stages: [
      {
        label: 'Day 1',
        name: 'Padstow to Lanivet',
        desc: "Start at St Petroc\u2019s Church in Padstow \u2014 founded by the Celtic saint who arrived from Wales in the 6th century and whose relics were revered across Cornwall and Brittany. Follow the Camel Trail east before heading south through Little Petherick to Lanivet, a village named after the Old Cornish word for shrine.",
        km: '~17 km',
      },
      {
        label: 'Day 2',
        name: 'Lanivet to Luxulyan',
        desc: "Cross the high ground of the Cornish interior \u2014 china clay country \u2014 passing Helman Tor with its ancient hillfort. Descend into the Luxulyan Valley, a magical landscape of giant granite boulders, iron-age field systems and a Victorian viaduct that is part of the Cornwall and West Devon Mining World Heritage Site.",
        km: '~15 km',
      },
      {
        label: 'Day 3',
        name: 'Luxulyan to Fowey',
        desc: "South to St Austell and on to the Fowey estuary. The approach to Fowey is superb \u2014 descending through oak woodland to the water, with the town\u2019s pastel-coloured houses and the deep blue estuary opening up below. Cross by ferry to the town quay, where the journey ends.",
        km: '~13 km',
      },
    ],
    inclusions: {
      included: [
        'Hand-picked accommodation in Cornish B&Bs and inns',
        'Daily luggage transfers throughout',
        'Detailed route notes with OS maps and waypoint guide',
        'Guide to Celtic saints and ancient crosses along the route',
        '24/7 local support line throughout',
        'Cornish food and restaurant guide (Padstow to Fowey)',
        'Fowey ferry crossing arranged',
      ],
      notIncluded: [
        'Travel to/from Cornwall',
        'Daily meals (beyond those listed)',
        'Travel insurance',
        'Fowey passenger ferry fare',
      ],
    },
    selfGuidedDesc:
      'Walk Padstow to Fowey at your own pace, with all logistics handled.',
    selfGuidedInclusions: [
      'Hand-picked accommodation in Cornish B&Bs and inns',
      'Daily luggage transfers throughout',
      'Detailed route notes with OS maps and waypoint guide',
      'Guide to Celtic saints and ancient crosses along the route',
      '24/7 local support line throughout',
      'Cornish food and restaurant guide (Padstow to Fowey)',
      'Fowey ferry crossing arranged',
    ],
    groupDesc:
      'Everything in self-guided, plus an expert Cornish guide steeped in the stories of the Celtic saints who walked this way before you.',
    groupInclusions: [
      'Everything included in self-guided',
      'Expert Cornish guide \u2014 specialising in Celtic Christianity',
      'Welcome dinner in Padstow on arrival evening',
      'Farewell dinner in Fowey on final evening',
      'Evening storytelling: the Celtic saints and their journeys',
      "Option to combine with St Michael\u2019s Way (5-day package)",
      'Weekend departures throughout the walking season',
    ],
    groupMaxWalkers: 12,
    cta: {
      heading: 'Follow the Celtic saints across Cornwall.',
      body: 'From Padstow harbour to the Fowey estuary. A long weekend that feels like a world away.',
      button: "Enquire about the Saints\u2019 Way",
    },
  },
};

export const routeSlugs = Object.keys(routes);
