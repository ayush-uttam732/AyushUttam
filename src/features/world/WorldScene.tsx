import { Float, Sparkles, ContactShadows } from "@react-three/drei";

import type { PanelName } from "../../types";
import { AMBER, CYAN, PINK, PURPLE } from "../../utils/constants";

import { Room } from "./objects/Room";
import { CityWindow } from "./objects/CityWindow";
import { Painting, Pegboard, WallShelf } from "./objects/Welldecoder";
import { NeonSign } from "./objects/Neonsign";
import { Desk } from "./objects/Computer";
import { GamingChair } from "./objects/Chair";
import { Bookshelf } from "./objects/Bookshelf";
import { Guitar } from "./objects/Guitar";
import { Dog } from "./objects/Dog";
import { Lounge } from "./objects/Lounge";
import { Plant } from "./objects/Plant";
import { Hotspot } from "./objects/Hotspot";
import { CollectiblesGame } from "../games/collectibles/CollectiblesGame";

type WorldSceneProps = {
  onSelect: (panel: PanelName) => void;
};

/** Saari practical lights ek jagah: har light apne object ke paas hai */
function RoomLights() {
  return (
    <group>
      {/* Neon sign "Good Code Good Life": wall se bahar ki taraf warm glow */}
      <rectAreaLight
        position={[-3.3, 3.0, -3.7]}
        rotation={[0, Math.PI, 0]}
        width={0.9}
        height={2}
        color="#ffb070"
        intensity={5}
      />
      <pointLight position={[-3.3, 3.0, -3.2]} color="#ff9a55" intensity={4} distance={4} decay={2} />

      {/* Desk lamp */}
      <spotLight
        position={[-1.3, 2.4, -1.6]}
        color="#ffb36b"
        intensity={55}
        angle={0.75}
        penumbra={0.9}
        distance={9}
        decay={2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0004}
      />

      {/* Monitors ki cool glow + PC ki purple glow */}
      <pointLight position={[0.5, 1.5, -1.4]} color="#6a8cff" intensity={6} distance={5} decay={2} />
      <pointLight position={[1.7, 1.0, -1.6]} color="#8a5cff" intensity={7} distance={5} decay={2} />

      {/* Desk ke neeche LED strip */}
      <pointLight position={[0.5, 0.25, -1.3]} color="#8a5cff" intensity={4} distance={3.5} decay={2} />

      {/* Bookshelf LED strips (amber) */}
      <pointLight position={[-3.45, 2.0, -1.0]} color="#ff9a3c" intensity={8} distance={5} decay={2} />
      <pointLight position={[-3.45, 0.9, -1.0]} color="#ff9a3c" intensity={4} distance={4} decay={2} />

      {/* Wall shelf ke upar ki warm strip */}
      <pointLight position={[2.85, 3.8, -3.2]} color="#ffb070" intensity={4} distance={4} decay={2} />

      {/* Orb lamp (PLAY ke paas) */}
      <pointLight position={[2.95, 0.9, 1.95]} color="#ffb347" intensity={6} distance={5} decay={2} />

      {/* Window se aati city ki cool light */}
      <directionalLight
        position={[7, 6, -1]}
        intensity={0.8}
        color="#7f9bff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0003}
        shadow-normalBias={0.03}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
      />
    </group>
  );
}

export function WorldScene({ onSelect }: WorldSceneProps) {
  return (
    <group>
      <RoomLights />

      <Room />
      <CityWindow />
      <CollectiblesGame />

      {/* back wall */}
      <NeonSign position={[-3.3, 3.0, -3.84]} />
      <Painting position={[-0.7, 3.2, -3.84]} />
      <Pegboard position={[2.85, 2.55, -3.84]} />
      <WallShelf position={[2.85, 3.9, -3.62]} />

      {/* furniture */}
      <Desk />
      <GamingChair position={[0.1, 0, -0.1]} rotationY={Math.PI + 0.45} />
      <Bookshelf />
      <Lounge />

      {/* character */}
      <Guitar position={[-3.55, 0.32, 0.45]} rotation={[0, 0.65, 0.14]} />
      <Dog position={[1.9, 0, 1.15]} rotationY={-0.45} />

      {/* plants */}
      <Plant position={[-3.6, 0, -0.75]} scale={1.35} />
      <Plant position={[3.9, 0, -2.45]} scale={1.15} />
      <Plant position={[-4.45, 0, 2.0]} scale={0.85} />
      <Plant position={[4.6, 0, 3.3]} scale={0.9} />

      {/* Realism extras */}
      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.55}
        scale={14}
        blur={2.6}
        far={4}
        resolution={512}
        color="#000000"
        frames={1}
      />
      {/* Hawa me tairti dhool: light beams me dikhti hai */}
      <Sparkles
        count={70}
        scale={[9, 4, 7]}
        position={[0, 2, 0]}
        size={1.6}
        speed={0.15}
        opacity={0.35}
        color="#ffcf9a"
      />

      {/* clickable room locations */}
      <Hotspot position={[-3.45, 2.3, -1.4]} label="SKILLS" accent={AMBER} onClick={() => onSelect("skills")} />
      <Hotspot position={[0.5, 2.85, -1.3]} label="PROJECTS" accent={CYAN} onClick={() => onSelect("projects")} />
      <Hotspot position={[2.95, 2.45, -0.9]} label="ABOUT" accent={PURPLE} onClick={() => onSelect("about")} />
      <Hotspot position={[4.15, 2.0, -0.3]} label="CONTACT" accent={PINK} onClick={() => onSelect("contact")} />

      <Float speed={1.2} floatIntensity={0.05} rotationIntensity={0.02}>
        <Hotspot position={[2.95, 0.55, 1.95]} label="PLAY" accent={CYAN} onClick={() => onSelect("play")} />
      </Float>
    </group>
  );
}