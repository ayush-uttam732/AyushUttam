export type GameId = "stack" | "bugs" | "dodge";

export type GameProps = {
  /** called whenever the score changes */
  onScore: (score: number) => void;
  /** small status text for the HUD (time left, streak, ...) */
  onInfo: (text: string) => void;
  /** called once when the round ends */
  onOver: (score: number) => void;
};

export const BG = "#070a14";