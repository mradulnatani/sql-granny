// Game data and level configuration extracted from the original game file.
export const GTA_INTRO_SLIDES = [
  {
    id: 0,
    tag: 'BLACKWOOD COUNTY POLICE ARCHIVE // CASE #884-SQL',
    title: 'THE ABDUCTION ON HIGHWAY 44',
    subtitle: '02:14 AM — BLACKWOOD FOREST',
    caption:
      'Your vehicle spun out across a spiked chain on Old Highway 44. Before the airbags deflated, a hunched figure dragging a barbed-wire bat shattered the driver window.',
    accent: '#ef4444',
    bgGrad: 'from-red-950 via-neutral-950 to-black',
    panelLeftTitle: ' PATROL DASHCAM #09',
    panelLeftDesc: 'SIGNAL LOST AT MILE MARKER 13',
    panelRightTitle: 'SUSPECT PROFILE',
    panelRightDesc: 'KNOWN AS "THE MATRIARCH"',
    badge: 'ACT I // THE AMBUSH'
  },
  {
    id: 1,
    tag: 'SURVIVOR DOSSIER // DETECTIVE VANCE',
    title: 'THE MATRIARCH OF BLACKWOOD',
    subtitle: 'NO ONE LEAVES THE SANCTUARY',
    caption:
      'She hunts by sound. Every creaking floorboard, every panicked breath echoes through the halls. Hide beneath rusted iron beds or crawl through 0.38m ventilation shafts to stay alive.',
    accent: '#f59e0b',
    bgGrad: 'from-amber-950 via-stone-950 to-black',
    panelLeftTitle: 'ACOUSTIC STALKER',
    panelLeftDesc: 'REACTS TO FOOTSTEPS & ALARMS',
    panelRightTitle: '3-STANCE STEALTH',
    panelRightDesc: 'STAND • CROUCH [C] • CRAWL [Z]',
    badge: 'ACT II // THE HUNTER'
  },
  {
    id: 2,
    tag: '1984 BLACKWOOD SECURITY MAINFRAME',
    title: 'THE SQL LOCKDOWN PROTOCOL',
    subtitle: 'RELATIONAL CIPHERS GUARD EVERY EXIT',
    caption:
      'Detective Vance discovered the truth before he vanished: every magnetic padlock in the estate is wired into an encrypted SQLite mainframe. Find his hidden dossiers and query the database to unlock the tools.',
    accent: '#10b981',
    bgGrad: 'from-emerald-950 via-neutral-950 to-black',
    panelLeftTitle: 'STEP 1: FIND CLUES',
    panelLeftDesc: 'LOCATE 4 ENCRYPTED DOSSIERS',
    panelRightTitle: 'STEP 2: EXECUTE SQL',
    panelRightDesc: 'DECRYPT TOOLS & 8s SAFE WARDS',
    badge: 'ACT III // THE MAINFRAME'
  },
  {
    id: 3,
    tag: 'FINAL WARNING // 5 DAYS REMAINING',
    title: 'FIVE NIGHTS TO BREACH THE GATE',
    subtitle: '4 CHAPTERS • 16 SQL LOCKS • 1 ESCAPE',
    caption:
      'Fight your way from the Rotting 2nd-Floor Bedroom down into the Flooded Boiler Cellar, through the Underground Catacombs, and out into the Blood Moon Courtyard.',
    accent: '#e11d48',
    bgGrad: 'from-rose-950 via-neutral-950 to-black',
    panelLeftTitle: '4 STORY CHAPTERS',
    panelLeftDesc: 'ESCALATING TERROR & SQL',
    panelRightTitle: 'SURVIVAL WINDOW',
    panelRightDesc: '5 DAYS PER CHAPTER',
    badge: 'ACT IV // THE EXODUS'
  }
];

/**
 * ============================================================================
 * 2. 4-CHAPTER STORY CAMPAIGN & LEVEL CONFIGURATIONS
 * ============================================================================
 */
export const STORY_CHAPTERS = [
  {
    levelIndex: 0,
    chapterNumber: 'CHAPTER I',
    title: 'THE AWAKENING',
    subtitle: '2nd Floor — The Rotting Manor Wing',
    exitName: 'Chained Cellar Hatch',
    grannySpeedMultiplier: 1.0,
    fogColor: 0x060203,
    fogDensity: 0.078,
    wallTint: '#261d1b',
    floorTint: '#1c110b',
    sconceColor: 0xf97316,
    skyMoon: false,
    radioCaller: 'DET. MARCUS VANCE (RECORDING #01)',
    storyBriefing:
      '"If you are hearing this tape, you woke up in the upstairs bedroom just like I did. Listen carefully: the Matriarch wired every mechanical deadbolt on this floor to an old 1984 relational database terminal. I hid 4 Encrypted Case Notes around the rooms. Pick them up, run the SQL queries to reveal where the physical bypass tools are stashed, and crawl under the iron beds ([Z]) whenever you hear her bat dragging..."',
    clues: [
      {
        id: 0,
        clueName: 'Blood-Stained Diary Page #1',
        room: 'Spawn Bedroom',
        cluePos: { x: -12.5, y: 0.45, z: -14.0 },
        unlockedToolName: 'Rusty Padlock Key',
        toolPos: { x: -18.5, y: 0.28, z: -18.5 },
        decryptedSecretHint:
          'DECRYPTED DIARY: "The Rusty Padlock Key is hidden underneath the Bedroom Iron Bed! Press [Z] to Prone Crawl (0.38m) under the bedframe to grab it."',
        tableName: 'diary_cipher_log',
        columns: ['entry_id', 'room_name', 'hiding_spot', 'item_hidden', 'is_authentic'],
        rows: [
          [101, "'Bedroom'", "'Under Iron Bed'", "'Rusty Padlock Key'", 1],
          [102, "'Bedroom'", "'Broken Mirror'", "'Decoy Key'", 0],
          [103, "'Attic'", "'Old Dollhouse'", "'Empty Box'", 0],
          [104, "'Kitchen'", "'Meat Freezer'", "'Rusted Chain'", 1]
        ],
        sqlPrompt:
          "Decrypt Diary Page #1: Select `hiding_spot, item_hidden` from `diary_cipher_log` where `room_name = 'Bedroom'` AND `is_authentic = 1`.",
        canonicalQuery:
          "SELECT hiding_spot, item_hidden FROM diary_cipher_log WHERE room_name = 'Bedroom' AND is_authentic = 1;",
        tokens: [
          'SELECT',
          'hiding_spot, item_hidden',
          '*',
          'FROM',
          'diary_cipher_log',
          'WHERE',
          "room_name = 'Bedroom'",
          'AND',
          'is_authentic = 1',
          ';'
        ],
        validator: (q) =>
          q.includes('select') &&
          q.includes('from diary_cipher_log') &&
          q.includes('where') &&
          q.includes('bedroom') &&
          q.includes('1')
      },
      {
        id: 1,
        clueName: 'Rusted Microcassette #2',
        room: 'Creaky Kitchen',
        cluePos: { x: -14.0, y: 0.95, z: 13.5 },
        unlockedToolName: 'Insulated Wire Cutters',
        toolPos: { x: -18.5, y: 0.35, z: 10.5 },
        decryptedSecretHint:
          'DECRYPTED CASSETTE: "The Insulated Wire Cutters are stashed underneath the Hollow Butcher Table in the Kitchen! Crawl ([Z]) under the table to retrieve them."',
        tableName: 'audio_tape_records',
        columns: ['tape_id', 'sector', 'tool_stashed', 'voltage_rating', 'corrupted'],
        rows: [
          [1, "'Cellar'", "'Broken Pliers'", 110, 1],
          [2, "'Kitchen Table'", "'Insulated Wire Cutters'", 440, 0],
          [3, "'Study'", "'Fuse Wire'", 220, 1],
          [4, "'Foyer'", "'Copper Clamp'", 480, 1]
        ],
        sqlPrompt:
          'Decode Microcassette #2: Select `sector, tool_stashed` from `audio_tape_records` where `voltage_rating >= 400` AND `corrupted = 0`.',
        canonicalQuery:
          'SELECT sector, tool_stashed FROM audio_tape_records WHERE voltage_rating >= 400 AND corrupted = 0;',
        tokens: [
          'SELECT',
          'sector, tool_stashed',
          '*',
          'FROM',
          'audio_tape_records',
          'WHERE',
          'voltage_rating >= 400',
          'AND',
          'corrupted = 0',
          ';'
        ],
        validator: (q) =>
          q.includes('select') &&
          q.includes('from audio_tape_records') &&
          q.includes('where') &&
          q.includes('400') &&
          q.includes('0')
      },
      {
        id: 2,
        clueName: 'Torn Autopsy Ledger #3',
        room: 'Bloodied Study',
        cluePos: { x: 2.5, y: 0.95, z: -15.5 },
        unlockedToolName: 'Master Vault Keycard',
        toolPos: { x: 4.5, y: 0.4, z: -18.5 },
        decryptedSecretHint:
          'DECRYPTED LEDGER: "The Master Vault Keycard is hidden inside the Slatted Oak Wardrobe in the Study. Approach the wardrobe to collect it."',
        tableName: 'autopsy_safe_ledger',
        columns: ['case_id', 'storage_unit', 'clearance_level', 'keycard_hash', 'active'],
        rows: [
          [201, "'Morgue Drawer'", 2, "'HASH-101'", 0],
          [202, "'Study Wardrobe'", 5, "'MASTER-9942'", 1],
          [203, "'Attic Chest'", 3, "'HASH-404'", 0],
          [204, "'Basement Coffin'", 4, "'HASH-880'", 0]
        ],
        sqlPrompt:
          'Crack Autopsy Ledger #3: Select `storage_unit, keycard_hash` from `autopsy_safe_ledger` where `clearance_level >= 5` AND `active = 1`.',
        canonicalQuery:
          'SELECT storage_unit, keycard_hash FROM autopsy_safe_ledger WHERE clearance_level >= 5 AND active = 1;',
        tokens: [
          'SELECT',
          'storage_unit, keycard_hash',
          '*',
          'FROM',
          'autopsy_safe_ledger',
          'WHERE',
          'clearance_level >= 5',
          'AND',
          'active = 1',
          ';'
        ],
        validator: (q) =>
          q.includes('select') &&
          q.includes('from autopsy_safe_ledger') &&
          q.includes('where') &&
          q.includes('5') &&
          q.includes('1')
      },
      {
        id: 3,
        clueName: 'Carved Bone Tablet #4',
        room: 'East Storage Wing',
        cluePos: { x: 14.5, y: 0.5, z: -13.5 },
        unlockedToolName: 'Heavy Claw Hammer',
        toolPos: { x: 18.5, y: 0.35, z: 18.5 },
        decryptedSecretHint:
          'DECRYPTED BONE TABLET: "The Heavy Claw Hammer rests inside the South-East Coffin Chest! Grab it to pry open the Cellar Hatch."',
        tableName: 'ritual_exit_seals',
        columns: ['seal_id', 'chamber', 'relic_tool', 'seal_status', 'power_level'],
        rows: [
          [1, "'North Crypt'", "'Rusted Spike'", "'BROKEN'", 10],
          [2, "'South-East Coffin'", "'Heavy Claw Hammer'", "'SEALED'", 99],
          [3, "'West Tunnel'", "'Bone Saw'", "'BROKEN'", 25],
          [4, "'Well Shaft'", "'Rope Hook'", "'SEALED'", 40]
        ],
        sqlPrompt:
          "Translate Bone Tablet #4: Select `chamber, relic_tool` from `ritual_exit_seals` where `seal_status = 'SEALED'` AND `power_level > 80`.",
        canonicalQuery:
          "SELECT chamber, relic_tool FROM ritual_exit_seals WHERE seal_status = 'SEALED' AND power_level > 80;",
        tokens: [
          'SELECT',
          'chamber, relic_tool',
          '*',
          'FROM',
          'ritual_exit_seals',
          'WHERE',
          "seal_status = 'SEALED'",
          'AND',
          'power_level > 80',
          ';'
        ],
        validator: (q) =>
          q.includes('select') &&
          q.includes('from ritual_exit_seals') &&
          q.includes('where') &&
          q.includes('sealed') &&
          q.includes('80')
      }
    ]
  },
  {
    levelIndex: 1,
    chapterNumber: 'CHAPTER II',
    title: 'BENEATH THE FLOORBOARDS',
    subtitle: 'Sub-Level 1 — The Flooded Boiler Cellar',
    exitName: 'Catacomb Freight Elevator',
    grannySpeedMultiplier: 1.18,
    fogColor: 0x020906,
    fogDensity: 0.082,
    wallTint: '#14241b',
    floorTint: '#09140e',
    sconceColor: 0x10b981,
    skyMoon: false,
    radioCaller: 'DET. MARCUS VANCE (RECORDING #02)',
    storyBriefing:
      '"You made it down to the Boiler Cellar! Watch your step—the damp stone floor is rigged with extra Bear Traps and Granny moves 18% faster down here because she knows the pipe layout. The Freight Elevator to the Catacombs is locked by 4 Boiler Pressure Schematics. Use intermediate SQL queries (ORDER BY, LIKE, AND) to locate the 4 hydraulic parts!"',
    clues: [
      {
        id: 0,
        clueName: 'Waterlogged Boiler Blueprint #1',
        room: 'West Boiler Room',
        cluePos: { x: -13.0, y: 0.45, z: -13.5 },
        unlockedToolName: 'Brass Pressure Valve',
        toolPos: { x: -18.5, y: 0.28, z: -18.5 },
        decryptedSecretHint:
          'DECRYPTED BLUEPRINT: "The Brass Pressure Valve rolled under the West Cellar Iron Cot! Crawl ([Z]) underneath to pick it up."',
        tableName: 'boiler_valves',
        columns: ['valve_id', 'sector_name', 'psi_rating', 'part_name', 'intact'],
        rows: [
          [10, "'East Drain'", 120, "'Cracked Gauge'", 0],
          [11, "'West Cellar Cot'", 450, "'Brass Pressure Valve'", 1],
          [12, "'North Pipe'", 210, "'Lead Seal'", 0],
          [13, "'Sump Pit'", 390, "'Rusty Coupling'", 1]
        ],
        sqlPrompt:
          'Decode Boiler Blueprint #1: Select `sector_name, part_name` from `boiler_valves` where `psi_rating >= 400` AND `intact = 1` ORDER BY `psi_rating` DESC.',
        canonicalQuery:
          'SELECT sector_name, part_name FROM boiler_valves WHERE psi_rating >= 400 AND intact = 1 ORDER BY psi_rating DESC;',
        tokens: [
          'SELECT',
          'sector_name, part_name',
          'FROM',
          'boiler_valves',
          'WHERE',
          'psi_rating >= 400',
          'AND',
          'intact = 1',
          'ORDER BY',
          'psi_rating DESC',
          ';'
        ],
        validator: (q) =>
          q.includes('select') &&
          q.includes('from boiler_valves') &&
          q.includes('where') &&
          q.includes('400')
      },
      {
        id: 1,
        clueName: 'Grease-Stained Maintenance Log #2',
        room: 'South Sump Pump',
        cluePos: { x: -14.0, y: 0.95, z: 13.5 },
        unlockedToolName: 'High-Torque Wrench',
        toolPos: { x: -18.5, y: 0.35, z: 10.5 },
        decryptedSecretHint:
          'DECRYPTED LOG: "The High-Torque Wrench is tucked underneath the Worktable in the South Sump Room!"',
        tableName: 'maintenance_tools',
        columns: ['tool_id', 'tool_code', 'bench_location', 'torque_nm'],
        rows: [
          [1, "'WRENCH-PRO-99'", "'South Worktable'", 320],
          [2, "'PLIERS-OLD-01'", "'Drain Grate'", 45],
          [3, "'WRENCH-BROKEN'", "'Coal Chute'", 80],
          [4, "'SAW-RUST-04'", "'Furnace'", 110]
        ],
        sqlPrompt:
          "Crack Maintenance Log #2: Select `bench_location, tool_code` from `maintenance_tools` where `tool_code LIKE 'WRENCH%'` AND `torque_nm > 200`.",
        canonicalQuery:
          "SELECT bench_location, tool_code FROM maintenance_tools WHERE tool_code LIKE 'WRENCH%' AND torque_nm > 200;",
        tokens: [
          'SELECT',
          'bench_location, tool_code',
          'FROM',
          'maintenance_tools',
          'WHERE',
          "tool_code LIKE 'WRENCH%'",
          'AND',
          'torque_nm > 200',
          ';'
        ],
        validator: (q) =>
          q.includes('select') &&
          q.includes('from maintenance_tools') &&
          q.includes('where') &&
          (q.includes('wrench') || q.includes('200'))
      },
      {
        id: 2,
        clueName: 'Waterproof Generator Manual #3',
        room: 'Central Turbine Room',
        cluePos: { x: 2.5, y: 0.95, z: -15.5 },
        unlockedToolName: 'Copper Solenoid Coil',
        toolPos: { x: 4.5, y: 0.4, z: -18.5 },
        decryptedSecretHint:
          'DECRYPTED MANUAL: "The Copper Solenoid Coil is stored inside the Central Locker Cabinet!"',
        tableName: 'generator_parts',
        columns: ['part_id', 'cabinet_name', 'component', 'kilowatts', 'ready'],
        rows: [
          [501, "'Flooded Crate'", "'Burned Fuse'", 12, 0],
          [502, "'Central Locker'", "'Copper Solenoid Coil'", 85, 1],
          [503, "'Boiler Rack'", "'Lead Battery'", 40, 0]
        ],
        sqlPrompt:
          'Decode Generator Manual #3: Select `cabinet_name, component` from `generator_parts` where `kilowatts >= 80` AND `ready = 1`.',
        canonicalQuery:
          'SELECT cabinet_name, component FROM generator_parts WHERE kilowatts >= 80 AND ready = 1;',
        tokens: [
          'SELECT',
          'cabinet_name, component',
          'FROM',
          'generator_parts',
          'WHERE',
          'kilowatts >= 80',
          'AND',
          'ready = 1',
          ';'
        ],
        validator: (q) =>
          q.includes('select') &&
          q.includes('from generator_parts') &&
          q.includes('where') &&
          q.includes('80')
      },
      {
        id: 3,
        clueName: 'Elevator Schematic Clipboard #4',
        room: 'East Steam Tunnel',
        cluePos: { x: 14.5, y: 0.5, z: -13.5 },
        unlockedToolName: 'Hydraulic Lift Crank',
        toolPos: { x: 18.5, y: 0.35, z: 18.5 },
        decryptedSecretHint:
          'DECRYPTED CLIPBOARD: "The Hydraulic Lift Crank is inside the South-East Iron Chest! Collect it to power the Freight Elevator."',
        tableName: 'elevator_relays',
        columns: ['relay_id', 'vault_box', 'part_stored', 'line_voltage'],
        rows: [
          [1, "'North Pipe Box'", "'Empty'", 0],
          [2, "'South-East Iron Chest'", "'Hydraulic Lift Crank'", 480],
          [3, "'West Valve Box'", "'Rusted Gear'", 120]
        ],
        sqlPrompt:
          'Decode Schematic #4: Select `vault_box, part_stored` from `elevator_relays` where `line_voltage = 480`.',
        canonicalQuery:
          'SELECT vault_box, part_stored FROM elevator_relays WHERE line_voltage = 480;',
        tokens: [
          'SELECT',
          'vault_box, part_stored',
          'FROM',
          'elevator_relays',
          'WHERE',
          'line_voltage = 480',
          ';'
        ],
        validator: (q) =>
          q.includes('select') &&
          q.includes('from elevator_relays') &&
          q.includes('where') &&
          q.includes('480')
      }
    ]
  },
  {
    levelIndex: 2,
    chapterNumber: 'CHAPTER III',
    title: "THE MATRIARCH'S CRYPT",
    subtitle: 'Sub-Level 2 — The Ancient Ossuary Catacombs',
    exitName: 'Sealed Catacomb Portcullis',
    grannySpeedMultiplier: 1.32,
    fogColor: 0x0b0402,
    fogDensity: 0.086,
    wallTint: '#2b1810',
    floorTint: '#170d08',
    sconceColor: 0xe11d48,
    skyMoon: false,
    radioCaller: 'DET. MARCUS VANCE (RECORDING #03)',
    storyBriefing:
      '"These catacombs predate the mansion by two centuries. Every stone sarcophagus is indexed in the Matriarch’s ossuary ledger. She is relentless down here—use the low burial crawl tunnels ([Z]) between crypt chambers and solve the 4 aggregate & relational SQL inscriptions to raise the Portcullis Gate to the surface!"',
    clues: [
      {
        id: 0,
        clueName: 'Engraved Ossuary Scroll #1',
        room: 'North-West Tomb',
        cluePos: { x: -12.5, y: 0.45, z: -14.0 },
        unlockedToolName: 'Obsidian Crypt Medallion',
        toolPos: { x: -18.5, y: 0.28, z: -18.5 },
        decryptedSecretHint:
          'DECRYPTED SCROLL: "The Obsidian Crypt Medallion lies beneath the North-West Burial Bier! Crawl ([Z]) under the stone slab to claim it."',
        tableName: 'ossuary_tombs',
        columns: ['tomb_id', 'crypt_wing', 'relic_name', 'burial_year', 'cursed'],
        rows: [
          [1, "'North-West Slab'", "'Obsidian Crypt Medallion'", 1812, 0],
          [2, "'East Alcove'", "'Fake Glass Medallion'", 1920, 1],
          [3, "'South Vault'", "'Broken Urn'", 1885, 1]
        ],
        sqlPrompt:
          'Translate Ossuary Scroll #1: Select `crypt_wing, relic_name` from `ossuary_tombs` where `burial_year < 1850` AND `cursed = 0`.',
        canonicalQuery:
          'SELECT crypt_wing, relic_name FROM ossuary_tombs WHERE burial_year < 1850 AND cursed = 0;',
        tokens: [
          'SELECT',
          'crypt_wing, relic_name',
          'FROM',
          'ossuary_tombs',
          'WHERE',
          'burial_year < 1850',
          'AND',
          'cursed = 0',
          ';'
        ],
        validator: (q) =>
          q.includes('select') &&
          q.includes('from ossuary_tombs') &&
          q.includes('where') &&
          q.includes('1850')
      },
      {
        id: 1,
        clueName: 'Inquisitor Wax Tablet #2',
        room: 'South-West Ritual Hall',
        cluePos: { x: -14.0, y: 0.95, z: 13.5 },
        unlockedToolName: 'Silver Sacrificial Dagger',
        toolPos: { x: -18.5, y: 0.35, z: 10.5 },
        decryptedSecretHint:
          'DECRYPTED WAX TABLET: "The Silver Sacrificial Dagger is concealed beneath the Stone Altar Table in the South-West Hall!"',
        tableName: 'ritual_artifacts',
        columns: ['art_id', 'altar_zone', 'artifact', 'purity_pct'],
        rows: [
          [10, "'West Niche'", "'Lead Chalice'", 15],
          [11, "'South-West Altar'", "'Silver Sacrificial Dagger'", 99],
          [12, "'Crypt steps'", "'Iron Candle'", 40]
        ],
        sqlPrompt:
          'Decode Wax Tablet #2: Select `altar_zone, MAX(purity_pct)` from `ritual_artifacts` where `purity_pct > 90`.',
        canonicalQuery:
          'SELECT altar_zone, MAX(purity_pct) FROM ritual_artifacts WHERE purity_pct > 90;',
        tokens: [
          'SELECT',
          'altar_zone, MAX(purity_pct)',
          'FROM',
          'ritual_artifacts',
          'WHERE',
          'purity_pct > 90',
          ';'
        ],
        validator: (q) =>
          q.includes('select') &&
          q.includes('from ritual_artifacts') &&
          (q.includes('90') || q.includes('max'))
      },
      {
        id: 2,
        clueName: 'Catacomb Keeper Parchment #3',
        room: 'Central Charnel House',
        cluePos: { x: 2.5, y: 0.95, z: -15.5 },
        unlockedToolName: 'Ancient Iron Winch Chain',
        toolPos: { x: 4.5, y: 0.4, z: -18.5 },
        decryptedSecretHint:
          'DECRYPTED PARCHMENT: "The Ancient Iron Winch Chain hangs inside the Central Charnel Reliquary Wardrobe!"',
        tableName: 'catacomb_chains',
        columns: ['chain_id', 'reliquary_loc', 'item_title', 'tensile_tons'],
        rows: [
          [1, "'North Hook'", "'Rotted Rope'", 1],
          [2, "'Central Reliquary'", "'Ancient Iron Winch Chain'", 15],
          [3, "'East Pit'", "'Tin Wire'", 2]
        ],
        sqlPrompt:
          'Crack Parchment #3: Select `reliquary_loc, item_title` from `catacomb_chains` where `tensile_tons >= 10`.',
        canonicalQuery:
          'SELECT reliquary_loc, item_title FROM catacomb_chains WHERE tensile_tons >= 10;',
        tokens: [
          'SELECT',
          'reliquary_loc, item_title',
          'FROM',
          'catacomb_chains',
          'WHERE',
          'tensile_tons >= 10',
          ';'
        ],
        validator: (q) =>
          q.includes('select') &&
          q.includes('from catacomb_chains') &&
          q.includes('where') &&
          q.includes('10')
      },
      {
        id: 3,
        clueName: 'Blood-Sealed Gate Codex #4',
        room: 'East Crypt Sanctum',
        cluePos: { x: 14.5, y: 0.5, z: -13.5 },
        unlockedToolName: 'Portcullis Crown Gear',
        toolPos: { x: 18.5, y: 0.35, z: 18.5 },
        decryptedSecretHint:
          'DECRYPTED CODEX: "The Portcullis Crown Gear is sealed inside the South-East Stone Sarcophagus! Retrieve it to open the surface gate."',
        tableName: 'portcullis_gears',
        columns: ['gear_id', 'sarcophagus', 'gear_type', 'teeth_count', 'verified'],
        rows: [
          [1, "'Broken Tomb'", "'Wooden Cog'", 12, 0],
          [2, "'South-East Sarcophagus'", "'Portcullis Crown Gear'", 64, 1],
          [3, "'Drain Crypt'", "'Cracked Pinion'", 24, 0]
        ],
        sqlPrompt:
          'Translate Gate Codex #4: Select `sarcophagus, gear_type` from `portcullis_gears` where `teeth_count = 64` AND `verified = 1`.',
        canonicalQuery:
          'SELECT sarcophagus, gear_type FROM portcullis_gears WHERE teeth_count = 64 AND verified = 1;',
        tokens: [
          'SELECT',
          'sarcophagus, gear_type',
          'FROM',
          'portcullis_gears',
          'WHERE',
          'teeth_count = 64',
          'AND',
          'verified = 1',
          ';'
        ],
        validator: (q) =>
          q.includes('select') &&
          q.includes('from portcullis_gears') &&
          q.includes('where') &&
          q.includes('64')
      }
    ]
  },
  {
    levelIndex: 3,
    chapterNumber: 'CHAPTER IV — FINALE',
    title: 'BLOOD MOON EXODUS',
    subtitle: 'Surface Exterior — The Gothic Courtyard & Cruiser Gate',
    exitName: 'Armored Police Cruiser & Main Gate',
    grannySpeedMultiplier: 1.45,
    fogColor: 0x190306,
    fogDensity: 0.064,
    wallTint: '#1f1924',
    floorTint: '#121712',
    sconceColor: 0xdc2626,
    skyMoon: true,
    radioCaller: 'DET. MARCUS VANCE (FINAL TRANSMISSION)',
    storyBriefing:
      '"You breached the surface! Look up—the Blood Moon is at its zenith. My armored police cruiser is parked right outside the Main Iron Gate, but Granny has overridden the 4 perimeter electromagnetic relays and she is in a permanent blood-frenzy. Execute the final 4 SQL override commands, grab the ignition & gate keys, and drive out of Blackwood forever!"',
    clues: [
      {
        id: 0,
        clueName: 'Police Cruiser Dispatch Terminal #1',
        room: 'North-West Guardhouse',
        cluePos: { x: -12.5, y: 0.45, z: -14.0 },
        unlockedToolName: 'Cruiser Encrypted Ignition Key',
        toolPos: { x: -18.5, y: 0.28, z: -18.5 },
        decryptedSecretHint:
          'DECRYPTED DISPATCH: "The Cruiser Encrypted Ignition Key is hidden underneath the Guardhouse Cot! Crawl ([Z]) under the cot to grab it."',
        tableName: 'police_cruiser_keys',
        columns: ['unit_id', 'hideout_spot', 'key_model', 'transponder_active'],
        rows: [
          [901, "'Guardhouse Cot'", "'Cruiser Encrypted Ignition Key'", 1],
          [902, "'Mud Ditch'", "'Bent Civilian Key'", 0],
          [903, "'Fountain'", "'Decoy Fob'", 0]
        ],
        sqlPrompt:
          'Hack Dispatch #1: Select `hideout_spot, key_model` from `police_cruiser_keys` where `unit_id = 901` AND `transponder_active = 1`.',
        canonicalQuery:
          'SELECT hideout_spot, key_model FROM police_cruiser_keys WHERE unit_id = 901 AND transponder_active = 1;',
        tokens: [
          'SELECT',
          'hideout_spot, key_model',
          'FROM',
          'police_cruiser_keys',
          'WHERE',
          'unit_id = 901',
          'AND',
          'transponder_active = 1',
          ';'
        ],
        validator: (q) =>
          q.includes('select') &&
          q.includes('from police_cruiser_keys') &&
          q.includes('where') &&
          q.includes('901')
      },
      {
        id: 1,
        clueName: 'High-Voltage Perimeter Box #2',
        room: 'South-West Hedge Maze',
        cluePos: { x: -14.0, y: 0.95, z: 13.5 },
        unlockedToolName: 'Gate Transformer Shunt',
        toolPos: { x: -18.5, y: 0.35, z: 10.5 },
        decryptedSecretHint:
          'DECRYPTED PERIMETER BOX: "The Gate Transformer Shunt is stashed under the Courtyard Stone Bench in the South-West sector!"',
        tableName: 'perimeter_grid',
        columns: ['node_id', 'sector_bench', 'shunt_device', 'megawatts', 'armed'],
        rows: [
          [1, "'North Hedge'", "'Blown Capacitor'", 10, 1],
          [2, "'South-West Stone Bench'", "'Gate Transformer Shunt'", 500, 0],
          [3, "'Dog Kennel'", "'Scrap Copper'", 25, 1]
        ],
        sqlPrompt:
          'Override Perimeter Box #2: Select `sector_bench, shunt_device` from `perimeter_grid` where `megawatts >= 500` AND `armed = 0`.',
        canonicalQuery:
          'SELECT sector_bench, shunt_device FROM perimeter_grid WHERE megawatts >= 500 AND armed = 0;',
        tokens: [
          'SELECT',
          'sector_bench, shunt_device',
          'FROM',
          'perimeter_grid',
          'WHERE',
          'megawatts >= 500',
          'AND',
          'armed = 0',
          ';'
        ],
        validator: (q) =>
          q.includes('select') &&
          q.includes('from perimeter_grid') &&
          q.includes('where') &&
          q.includes('500')
      },
      {
        id: 2,
        clueName: 'Warden Radio Cipher #3',
        room: 'Courtyard Chapel',
        cluePos: { x: 2.5, y: 0.95, z: -15.5 },
        unlockedToolName: '液压 Hydraulic Gate Ram',
        toolPos: { x: 4.5, y: 0.4, z: -18.5 },
        decryptedSecretHint:
          'DECRYPTED RADIO CIPHER: "The Hydraulic Gate Ram is locked inside the Chapel Confessional Wardrobe!"',
        tableName: 'chapel_armory',
        columns: ['arm_id', 'enclosure', 'heavy_tool', 'security_code'],
        rows: [
          [1, "'Belfry'", "'Broken Rope'", "'CODE-00'"],
          [2, "'Chapel Confessional'", "'Hydraulic Gate Ram'", "'OVERRIDE-77'"],
          [3, "'Graveyard'", "'Rusty Shovel'", "'CODE-12'"]
        ],
        sqlPrompt:
          "Crack Radio Cipher #3: Select `enclosure, heavy_tool` from `chapel_armory` where `security_code = 'OVERRIDE-77'`.",
        canonicalQuery:
          "SELECT enclosure, heavy_tool FROM chapel_armory WHERE security_code = 'OVERRIDE-77';",
        tokens: [
          'SELECT',
          'enclosure, heavy_tool',
          'FROM',
          'chapel_armory',
          'WHERE',
          "security_code = 'OVERRIDE-77'",
          ';'
        ],
        validator: (q) =>
          q.includes('select') &&
          q.includes('from chapel_armory') &&
          q.includes('where') &&
          q.includes('77')
      },
      {
        id: 3,
        clueName: 'Master Exodus Mainframe #4',
        room: 'East Mausoleum',
        cluePos: { x: 14.5, y: 0.5, z: -13.5 },
        unlockedToolName: 'Master Perimeter Override Chip',
        toolPos: { x: 18.5, y: 0.35, z: 18.5 },
        decryptedSecretHint:
          'DECRYPTED EXODUS MAINFRAME: "The Master Perimeter Override Chip is inside the South-East Mausoleum Crypt! Collect it and run to the Main Gate!"',
        tableName: 'exodus_master_locks',
        columns: ['chip_id', 'mausoleum_box', 'chip_name', 'authorization'],
        rows: [
          [1, "'West Urn'", "'Revoked Token'", "'DENIED'"],
          [2, "'South-East Crypt'", "'Master Perimeter Override Chip'", "'GRANTED'"],
          [3, "'Gate Post'", "'Test Chip'", "'DENIED'"]
        ],
        sqlPrompt:
          "Execute Final Mainframe Override #4: Select `mausoleum_box, chip_name` from `exodus_master_locks` where `authorization = 'GRANTED'`.",
        canonicalQuery:
          "SELECT mausoleum_box, chip_name FROM exodus_master_locks WHERE authorization = 'GRANTED';",
        tokens: [
          'SELECT',
          'mausoleum_box, chip_name',
          'FROM',
          'exodus_master_locks',
          'WHERE',
          "authorization = 'GRANTED'",
          ';'
        ],
        validator: (q) =>
          q.includes('select') &&
          q.includes('from exodus_master_locks') &&
          q.includes('where') &&
          q.includes('granted')
      }
    ]
  }
];

/**
 * ============================================================================
 * 3. ARCHITECTURAL GEOMETRY, CRAWLSPACE VENTS (0.65m), BEDS & WARDROBES
 * ============================================================================
 */
export const MANSION_SOLID_WALLS = [
  { x: 0, z: -22, w: 44, d: 1.2 },
  { x: 0, z: 22, w: 44, d: 1.2 },
  { x: -22, z: 0, w: 1.2, d: 44 },
  { x: 22, z: 0, w: 1.2, d: 44 },

  { x: -7.5, z: -18.0, w: 1.0, d: 8.0 },
  { x: -7.5, z: 0, w: 1.0, d: 11.0 },
  { x: -7.5, z: 17.5, w: 1.0, d: 9.0 },

  { x: 7.5, z: -18.0, w: 1.0, d: 8.0 },
  { x: 7.5, z: 0, w: 1.0, d: 11.0 },
  { x: 7.5, z: 17.5, w: 1.0, d: 9.0 },

  { x: -18.0, z: 0, w: 8.0, d: 1.0 },
  { x: -3.5, z: 0, w: 7.0, d: 1.0 },
  { x: 3.5, z: 0, w: 7.0, d: 1.0 },
  { x: 18.0, z: 0, w: 8.0, d: 1.0 },

  { x: -14.5, z: -7.5, w: 1.8, d: 1.8 },
  { x: 0, z: -7.5, w: 2.0, d: 1.8 },
  { x: 14.5, z: -7.5, w: 1.8, d: 1.8 },
  { x: -14.5, z: 7.5, w: 1.8, d: 1.8 },
  { x: 14.5, z: 7.5, w: 1.8, d: 1.8 }
];

export const LOW_CLEARANCE_CRAWL_ZONES = [
  {
    id: 'vent_west',
    name: 'West-to-Center Crawlspace Vent (0.65m)',
    x: -7.5,
    z: -10.5,
    w: 2.2,
    d: 2.4,
    clearanceY: 0.65,
    isWallVent: true
  },
  {
    id: 'vent_east',
    name: 'Center-to-East Crawlspace Vent (0.65m)',
    x: 7.5,
    z: -10.5,
    w: 2.2,
    d: 2.4,
    clearanceY: 0.65,
    isWallVent: true
  },
  {
    id: 'under_bed_bedroom',
    name: 'Under North-West Rusty Iron Bed',
    x: -18.5,
    z: -18.5,
    w: 3.0,
    d: 2.2,
    clearanceY: 0.65,
    isBed: true
  },
  {
    id: 'under_bed_cellar',
    name: 'Under North-East Iron Cot',
    x: 18.5,
    z: -18.5,
    w: 3.0,
    d: 2.2,
    clearanceY: 0.65,
    isBed: true
  },
  {
    id: 'under_table_kitchen',
    name: 'Under South-West Hollow Worktable',
    x: -18.5,
    z: 10.5,
    w: 2.8,
    d: 2.0,
    clearanceY: 0.65,
    isTable: true
  }
];

export const MANSION_HIDING_ENCLOSURES = [
  { id: 'bed_1', name: 'North-West Rusty Iron Bed', type: 'BED', x: -18.5, z: -18.5 },
  { id: 'wardrobe_1', name: 'Central Slatted Oak Wardrobe', type: 'WARDROBE', x: 4.5, z: -18.5 },
  { id: 'bed_2', name: 'North-East Bloodied Cot', type: 'BED', x: 18.5, z: -18.5 },
  { id: 'wardrobe_2', name: 'South-West Sanctuary Closet', type: 'WARDROBE', x: -18.5, z: 18.5 },
  { id: 'coffin_1', name: 'South-East Sarcophagus Chest', type: 'COFFIN', x: 18.5, z: 18.5 },
  { id: 'table_1', name: 'South-West Hollow Table', type: 'TABLE', x: -18.5, z: 10.5 }
];

export const INITIAL_BEAR_TRAPS = [
  { id: 'trap_1', x: -7.5, z: 8.5, armed: true },
  { id: 'trap_2', x: 0, z: 6.5, armed: true },
  { id: 'trap_3', x: 7.5, z: 8.5, armed: true },
  { id: 'trap_4', x: 0, z: -13.5, armed: true },
  { id: 'trap_5', x: 11.5, z: 3.5, armed: true }
];

export const CREAKY_FLOOR_PATCHES = [
  { id: 'creak_1', x: -11.5, z: 0, w: 3.4, d: 2.2 },
  { id: 'creak_2', x: 11.5, z: 0, w: 3.4, d: 2.2 },
  { id: 'creak_3', x: 0, z: 12.5, w: 3.2, d: 3.0 }
];

export const EXIT_DOOR_POS = { x: 0, z: 21.1 };

export const MINIMAP_ROOM_LABELS = [
  { name: 'NW WING', x: -15, z: -15 },
  { name: 'CENTRAL', x: 0, z: -15 },
  { name: 'NE WING', x: 15, z: -15 },
  { name: 'SW HALL', x: -15, z: 14 },
  { name: 'FOYER EXIT', x: 0, z: 15 },
  { name: 'SE CRYPT', x: 15, z: 14 }
];

