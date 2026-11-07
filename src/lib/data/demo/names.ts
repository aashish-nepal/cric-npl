import type { BattingStyle, BowlingStyle, Player, PlayerRole } from "@/types/cricket";
import { slugify } from "@/lib/utils";

/**
 * Demo-only squads. Names are generated from neutral pools and every profile is
 * explicitly flagged as demo data. No real player statistics are invented.
 */
const FIRST_NAMES = [
  "Aarav",
  "Aayush",
  "Abhishek",
  "Anish",
  "Arjun",
  "Ashish",
  "Avinash",
  "Bibek",
  "Bikash",
  "Bishal",
  "Deepak",
  "Dipendra",
  "Gaurav",
  "Hari",
  "Kamal",
  "Kiran",
  "Lalit",
  "Manish",
  "Nabin",
  "Nirajan",
  "Pawan",
  "Prakash",
  "Rajesh",
  "Ramesh",
  "Rohit",
  "Sagar",
  "Sandeep",
  "Santosh",
  "Shankar",
  "Suman",
  "Suraj",
  "Umesh",
  "Vikram",
  "Yubraj",
  "Nischal",
  "Pratik",
  "Sabin",
  "Sushant",
];

const LAST_NAMES = [
  "Adhikari",
  "Basnet",
  "Bhattarai",
  "Bhandari",
  "Chaudhary",
  "Dhakal",
  "Ghimire",
  "Gurung",
  "Joshi",
  "Karki",
  "Khadka",
  "Khanal",
  "Lama",
  "Limbu",
  "Magar",
  "Maharjan",
  "Malla",
  "Nepali",
  "Ojha",
  "Pandey",
  "Poudel",
  "Rai",
  "Rana",
  "Regmi",
  "Shrestha",
  "Subedi",
  "Tamang",
  "Thapa",
  "Yadav",
  "Shahi",
];

const ROLE_PATTERN: PlayerRole[] = [
  "batter",
  "batter",
  "batter",
  "batter",
  "all_rounder",
  "wicketkeeper",
  "all_rounder",
  "bowler",
  "bowler",
  "bowler",
  "bowler",
  "all_rounder",
];

const BOWLING_STYLES: BowlingStyle[] = [
  "Right-arm medium",
  "Right-arm fast",
  "Right-arm offbreak",
  "Right-arm legbreak",
  "Left-arm medium",
  "Left-arm orthodox",
  "Left-arm wrist spin",
];

const BATTING_STYLES: BattingStyle[] = ["Right-hand bat", "Left-hand bat"];

function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export interface DemoTeamSeed {
  slug: string;
  name: string;
  shortName: string;
  primaryColor: string;
  homeCity: string;
  description: string;
}

export function buildPlayersForTeam(team: DemoTeamSeed, teamIndex: number): Player[] {
  return ROLE_PATTERN.map((role, index) => {
    const seed = hash(`${team.slug}-${index}`);
    const first = FIRST_NAMES[(seed + teamIndex * 3 + index) % FIRST_NAMES.length] ?? "Aarav";
    const last = LAST_NAMES[(seed * 7 + teamIndex * 5 + index * 3) % LAST_NAMES.length] ?? "Shrestha";
    const fullName = `${first} ${last}`;
    const battingStyle = BATTING_STYLES[(seed + index) % 2] ?? "Right-hand bat";
    const bowlingStyle: BowlingStyle =
      role === "bowler" || role === "all_rounder"
        ? (BOWLING_STYLES[(seed + index) % BOWLING_STYLES.length] ?? "Right-arm medium")
        : "None";
    const roleLabel =
      role === "wicketkeeper"
        ? "wicketkeeper-batter"
        : role === "all_rounder"
          ? "all-rounder"
          : role;

    return {
      id: `player-${team.slug}-${index + 1}`,
      fullName,
      slug: `${slugify(fullName)}-${team.shortName.toLowerCase()}-${index + 1}`,
      profileImage: null,
      dateOfBirth: null,
      nationality: "Nepal",
      battingStyle,
      bowlingStyle,
      playingRole: role,
      biography: `Demo profile for ${fullName}, a ${roleLabel} in the ${team.name} squad. This profile is illustrative only and is not an official player record.`,
      isDemo: true,
    } satisfies Player;
  });
}
