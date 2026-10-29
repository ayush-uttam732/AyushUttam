import {
  collectibles,
  gameActions,
  useExperience,
} from "../../../store/experienceStore";
import { Anchor } from "../../experience/Anchor";

/** Where each orb hides on the image (0..1) + its depth. */
const spots: Record<string, { x: number; y: number; depth: number }> = {
  "under-desk": { x: 0.545, y: 0.545, depth: 0.42 },
  bookshelf: { x: 0.285, y: 0.545, depth: 0.36 },
  "wall-shelf": { x: 0.605, y: 0.115, depth: 0.2 },
  "coffee-table": { x: 0.7, y: 0.935, depth: 0.93 },
  "bean-bag": { x: 0.93, y: 0.6, depth: 0.6 },
};

/** Lives inside the stage. Renders the orbs that are still uncollected. */
export function CollectiblesGame() {
  const playing = useExperience((s) => s.playing);
  const collected = useExperience((s) => s.collected);

  if (!playing) return null;

  return (
    <div className="orb-layer">
      {collectibles
        .filter((item) => !collected.includes(item.id) && spots[item.id])
        .map((item) => {
          const spot = spots[item.id];

          return (
            <Anchor key={item.id} x={spot.x} y={spot.y} depth={spot.depth}>
              <button
                className="orb"
                style={{ "--orb": item.color } as React.CSSProperties}
                onClick={() => gameActions.collect(item.id)}
                aria-label="Hidden orb"
              />
            </Anchor>
          );
        })}
    </div>
  );
}