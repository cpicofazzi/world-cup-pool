-- Seed the official 2026 FIFA World Cup group assignments
-- Draw held December 5, 2025

-- Group A: Mexico, South Korea, South Africa, Czechia
UPDATE teams SET group_letter = 'A' WHERE tla IN ('MEX', 'KOR', 'RSA', 'CZE');

-- Group B: Canada, Switzerland, Qatar, Bosnia-Herzegovina
UPDATE teams SET group_letter = 'B' WHERE tla IN ('CAN', 'SUI', 'QAT', 'BIH');

-- Group C: Brazil, Morocco, Scotland, Haiti
UPDATE teams SET group_letter = 'C' WHERE tla IN ('BRA', 'MAR', 'SCO', 'HAI');

-- Group D: USA, Paraguay, Australia, Turkey
UPDATE teams SET group_letter = 'D' WHERE tla IN ('USA', 'PAR', 'AUS', 'TUR');

-- Group E: Germany, Ecuador, Ivory Coast, Curaçao
UPDATE teams SET group_letter = 'E' WHERE tla IN ('GER', 'ECU', 'CIV', 'CUR');

-- Group F: Netherlands, Japan, Tunisia, Sweden
UPDATE teams SET group_letter = 'F' WHERE tla IN ('NED', 'JPN', 'TUN', 'SWE');

-- Group G: Belgium, Iran, Egypt, New Zealand
UPDATE teams SET group_letter = 'G' WHERE tla IN ('BEL', 'IRN', 'EGY', 'NZL');

-- Group H: Spain, Uruguay, Saudi Arabia, Cape Verde
UPDATE teams SET group_letter = 'H' WHERE tla IN ('ESP', 'URU', 'KSA', 'CPV');

-- Group I: France, Senegal, Norway, Iraq
UPDATE teams SET group_letter = 'I' WHERE tla IN ('FRA', 'SEN', 'NOR', 'IRQ');

-- Group J: Argentina, Algeria, Austria, Jordan
UPDATE teams SET group_letter = 'J' WHERE tla IN ('ARG', 'ALG', 'AUT', 'JOR');

-- Group K: Portugal, Colombia, Uzbekistan, Congo DR
UPDATE teams SET group_letter = 'K' WHERE tla IN ('POR', 'COL', 'UZB', 'COD');

-- Group L: England, Croatia, Ghana, Panama
UPDATE teams SET group_letter = 'L' WHERE tla IN ('ENG', 'CRO', 'GHA', 'PAN');
