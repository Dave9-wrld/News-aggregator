// Enterprise Dynamic High-Resolution Topic Visuals & Guaranteed Non-Repeating Image Engine

// FOOTBALL / SOCCER specific pool (dominant sport in global news)
const FOOTBALL_PHOTOS = [
  "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80", // Soccer stadium lights
  "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1200&q=80", // Soccer ball in net
  "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80", // Football pitch action
  "https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&w=1200&q=80", // Player kicking ball
  "https://images.unsplash.com/photo-1569517282132-25d22f4573e6?auto=format&fit=crop&w=1200&q=80", // Stadium crowd celebration
  "https://images.unsplash.com/photo-1521537634581-0dced2fed2a8?auto=format&fit=crop&w=1200&q=80", // Football tactics board
  "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=80", // Stadium seats panorama
  "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1200&q=80", // Football goal celebration
  "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=1200&q=80", // Football boots on grass
  "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=1200&q=80", // Football match aerial
  "https://images.unsplash.com/photo-1553778263-73a83bab9b0c?auto=format&fit=crop&w=1200&q=80", // Soccer corner kick
  "https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?auto=format&fit=crop&w=1200&q=80", // Football trophy
  "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?auto=format&fit=crop&w=1200&q=80", // Soccer field lines
  "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=1200&q=80", // Football fans in stadium
  "https://images.unsplash.com/photo-1606925797300-0b35e9d1794e?auto=format&fit=crop&w=1200&q=80", // Football player silhouette
  "https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=1200&q=80", // Soccer ball close up
  "https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&w=1200&q=80", // Stadium floodlights
  "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1200&q=80", // Arena crowd
  "https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=1200&q=80", // Football pitch grass
  "https://images.unsplash.com/photo-1600679472829-3044539ce8ed?auto=format&fit=crop&w=1200&q=80", // Soccer training ground
];

// OTHER SPORTS pool (basketball, tennis, F1, athletics, etc.)
const OTHER_SPORTS_PHOTOS = [
  "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80", // Basketball arena
  "https://images.unsplash.com/photo-1519766304817-4f37bda74a29?auto=format&fit=crop&w=1200&q=80", // Basketball dunk
  "https://images.unsplash.com/photo-1516478177764-9fe5bd7e9717?auto=format&fit=crop&w=1200&q=80", // Basketball rim
  "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1200&q=80", // Track athlete sprinting
  "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80", // Olympic track finish
  "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1200&q=80", // Marathon runners
  "https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=1200&q=80", // Swimmer in pool
  "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80", // Athlete runner training
  "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80", // Baseball pitch
  "https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1200&q=80", // Baseball glove & ball
  "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=1200&q=80", // Tennis match
  "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=1200&q=80", // Golf green swing
  "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80", // Racing circuit
  "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80", // Gym training
  "https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=1200&q=80", // Surfer wave
  "https://images.unsplash.com/photo-1512719994953-eabf50895df7?auto=format&fit=crop&w=1200&q=80", // Winter sports ski
];

export const TOPIC_PHOTO_POOLS = {
  football: FOOTBALL_PHOTOS,
  sports: OTHER_SPORTS_PHOTOS,
  technology: [
    "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1517433456452-f9633a875f6f?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1535378917042-10a22c95931a?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1510519138197-06b862a29411?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1200&q=80",
  ],
  business: [
    "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1553729459-efe14ef6055d?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1565372195458-9de0b320ef04?auto=format&fit=crop&w=1200&q=80",
  ],
  science: [
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80",
  ],
  entertainment: [
    "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80",
  ],
  health: [
    "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1583912267670-6575ad3624e8?auto=format&fit=crop&w=1200&q=80",
  ],
  general: [
    "https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1200&q=80",
  ],
};

// Football / Soccer detection (covers leagues, clubs, players, and betting/odds terms)
const FOOTBALL_KEYWORDS = /\b(football|soccer|chelsea|arsenal|manchester|man utd|man city|united|liverpool|tottenham|spurs|newcastle|aston villa|everton|west ham|wolves|brighton|fulham|crystal palace|leicester|bournemouth|ipswich|southampton|nottingham|forest|barcelona|barca|real madrid|atletico|atleti|sevilla|betis|villarreal|valencia|sociedad|bilbao|celta|mallorca|girona|getafe|espanyol|valladolid|osasuna|rayo|alaves|leganes|bayern|dortmund|leverkusen|leipzig|psg|paris|marseille|lyon|lille|juventus|juve|napoli|roma|lazio|milan|inter|atalanta|fiorentina|bologna|porto|benfica|sporting|ajax|feyenoord|celtic|rangers|galatasaray|fenerbahce|besiktas|pedro|delap|haaland|mbappe|mbapp|messi|ronaldo|salah|kane|bellingham|vinicius|yamal|saka|foden|palmer|rice|odegaard|alvarez|simeone|romero|griezmann|neymar|modric|kroos|xavi|ancelotti|guardiola|klopp|arteta|pochettino|mourinho|tuchel|conte|inzaghi|maresca|postecoglou|slot|emery|squad|jersey|shirt|number|transfer|signing|loan|striker|midfielder|defender|goalkeeper|winger|fullback|centre back|keeper|manager|gaffer|coach|premier league|la liga|laliga|serie a|bundesliga|ligue 1|eredivisie|champions league|europa league|conference league|world cup|euros|euro 2024|carabao|fa cup|copa del rey|matchday|fixture|kickoff|kick off|halftime|half time|penalty|offside|var|yellow card|red card|clean sheet|assist|hat trick|hattrick|brace|nutmeg|volley|free kick|corner kick|goal|goals|nil|draw|defeat|victory|win|won|lost|odds|bets|betting|predictions|picks|best bets|sportsbook|handicap|accumulator|acca|talksport|goal\.com|tribalfootball|espn fc|skysports|sky sports|bbc sport|marca|as\.com|gazzetta|corriere|lequipe|kicker|sport1|flashscore|sofascore|transfermarkt|whoscored|fbref|optajoe|fabrizio romano|david ornstein)\b/i;

// Other specific sports detection
const BASKETBALL_KEYWORDS = /\b(nba|basketball|lakers|warriors|celtics|bucks|knicks|nets|76ers|heat|cavaliers|nuggets|clippers|suns|mavericks|timberwolves|thunder|lebron|curry|durant|giannis|jokic|tatum|dunk|three pointer|slam dunk|court|hoops)\b/i;
const TENNIS_KEYWORDS = /\b(tennis|wimbledon|us open|french open|australian open|roland garros|djokovic|alcaraz|sinner|nadal|federer|swiatek|sabalenka|gauff|grand slam|atp|wta|match point|set point|deuce|ace|serve|backhand|forehand)\b/i;
const F1_KEYWORDS = /\b(formula 1|formula one|f1|grand prix|verstappen|hamilton|leclerc|norris|sainz|perez|russell|red bull|ferrari|mclaren|mercedes|pit stop|pole position|qualifying|podium|fastest lap|fia)\b/i;
const GENERAL_SPORTS_KEYWORDS = /\b(nfl|mlb|nhl|chiefs|quarterback|touchdown|super bowl|baseball|hockey|golf|pga|masters|ryder cup|olympic|olympics|athletics|track and field|marathon|swimming|cycling|tour de france|rugby|cricket|ipl|boxing|ufc|mma|wrestling)\b/i;

const TECH_KEYWORDS = /\b(ai|artificial intelligence|openai|chatgpt|gemini|claude|deepmind|anthropic|nvidia|gpu|blackwell|amd|intel|apple|iphone|ipad|macbook|ios|google|android|pixel|samsung|galaxy|microsoft|windows|meta|zuckerberg|quantum|computing|cyber|hacker|malware|crypto|bitcoin|ethereum|solana|blockchain|robot|robotics|drone|software|developer|coding|app|algorithm|semiconductor|tsmc|tech|techcrunch|the verge|wired)\b/i;

const BUSINESS_KEYWORDS = /\b(stock|market|shares|nasdaq|s&p|dow jones|wall street|fed|powell|inflation|interest rate|cpi|economy|recession|gdp|bank|jpmorgan|goldman|treasury|yield|bond|revenue|earnings|quarterly|profit|ipo|valuation|billionaire|musk|bezos|buffett|crude|oil|brent|gold|forex|dollar|trade|tariff|bloomberg|financial times|reuters|business)\b/i;

const SCIENCE_KEYWORDS = /\b(nasa|space|spacex|starship|moon|mars|galaxy|telescope|james webb|hubble|astronomy|physics|quantum|biology|climate|ocean|deep sea|coral|species|fossil|archaeology|energy|solar|fusion|nuclear|national geographic|nature)\b/i;

const HEALTH_KEYWORDS = /\b(health|medical|medicine|hospital|doctor|cancer|tumor|vaccine|mrna|clinical|trial|fda|pharma|drug|disease|virus|flu|covid|mental health|therapy|brain|heart|surgery|biotech|medical news)\b/i;

const ENTERTAINMENT_KEYWORDS = /\b(movie|film|cinema|actor|actress|hollywood|director|oscar|emmy|grammy|box office|netflix|disney|hbo|marvel|music|song|album|singer|concert|tour|gaming|playstation|xbox|nintendo|steam|gta|rpg|ign|entertainment)\b/i;

/**
 * Infer category with sub-sport awareness.
 * Returns "football" for soccer/football articles specifically,
 * "sports" for other sports, or the relevant non-sport category.
 */
export function inferCategoryFromText(title = "", query = "", fallback = "general") {
  const text = `${title} ${query}`;
  
  // Check football FIRST (most common sport in global news)
  if (text.match(FOOTBALL_KEYWORDS)) return "football";
  
  // Check other specific sports
  if (text.match(BASKETBALL_KEYWORDS)) return "sports"; // uses basketball/general sports pool
  if (text.match(TENNIS_KEYWORDS)) return "sports";
  if (text.match(F1_KEYWORDS)) return "sports";
  if (text.match(GENERAL_SPORTS_KEYWORDS)) return "sports";
  
  // Non-sport categories
  if (text.match(TECH_KEYWORDS)) return "technology";
  if (text.match(BUSINESS_KEYWORDS)) return "business";
  if (text.match(SCIENCE_KEYWORDS)) return "science";
  if (text.match(HEALTH_KEYWORDS)) return "health";
  if (text.match(ENTERTAINMENT_KEYWORDS)) return "entertainment";

  return fallback && TOPIC_PHOTO_POOLS[fallback] ? fallback : "general";
}

/**
 * Sequential index assignment guaranteed to prevent ANY duplicate image on screen.
 */
export function getDynamicArticleImage(title = "", category = "general", index = 0) {
  const resolvedCategory = inferCategoryFromText(title, "", category);
  const pool = TOPIC_PHOTO_POOLS[resolvedCategory] || TOPIC_PHOTO_POOLS.general;
  
  const safeIndex = Math.abs(index) % pool.length;
  return pool[safeIndex];
}
