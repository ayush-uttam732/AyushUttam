import {
  collectibles,
  gameActions,
  useExperience,
} from "../store/experienceStore";

export function useGameState() {
  const playing = useExperience((s) => s.playing);
  const completed = useExperience((s) => s.completed);
  const found = useExperience((s) => s.collected.length);

  return {
    playing,
    completed,
    found,
    total: collectibles.length,
    start: gameActions.start,
    stop: gameActions.stop,
  };
}