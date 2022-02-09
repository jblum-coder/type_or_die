import { Engine } from "./Engine.js";
import { playTune, loopTune } from "./tunePlayers.js";

const BLACK_LISTED_WORDS = [
  "localStorage",
  "document",
  "window",
  // "eval",
  "import",
  // "Function"
];

const LB_SERVER = "https://misguided.enterprises/gamelabscores/";

export function createEval() {
  let currentEngine = null;
  let tunePlayers = [];

  return evalGameScript;

  function evalGameScript({ assets, prog, show, gameCanvas }) {
    for (let i = 0; i < BLACK_LISTED_WORDS.length; i++) {
      const word = BLACK_LISTED_WORDS[i];
      if (prog.includes(word)) {
        return new Error(`Error: "${word}" is not allowed in game script.`);
      }
    }

    if (tunePlayers.length > 0) {
      tunePlayers.forEach((x) => x.end());
      tunePlayers = [];
    }

    Engine.show = show;

    const included = {
      playTune() {
        const tunePlayer = playTune(...arguments);
        tunePlayers.push(tunePlayer);

        return tunePlayer;
      },
      gameCanvas,
      loopTune() {
        const tunePlayer = loopTune(...arguments);
        tunePlayers.push(tunePlayer);

        return tunePlayer;
      },
      createEngine(...args) {
        if (currentEngine) cancelAnimationFrame(currentEngine._animId);
        currentEngine = new Engine(...args);
        return currentEngine;
      },
      leaderboard: async (score, e) => {
        await fetch(LB_SERVER, {
          method: 'post',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user: prompt("name for leaderboard?"), score })
        });
        let lb = await fetch(LB_SERVER).then(x => x.json());
        let scores = Object.entries(lb);
        
        e.addText(
          (scores.length) ? "LEADERBOARD" : "Leaderboard is empty :(",
          100,
          100
        );

        scores.sort(([ , a], [ , b]) => b - a);
        let y = 100;
        for (const [name, score] of scores)
          e.addText(name + ": " + score, 100, y += 20);
      }
    };

    assets.forEach((asset) => {
      included[asset.name] = asset.data;
    });

    try {
      new Function(...Object.keys(included), prog)(...Object.values(included));

      return null;
    } catch (err) {
      return err;
    }
  }
}