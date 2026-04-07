import { replaySessions } from "../data/replay-player-session";
import * as ui from "@minecraft/server-ui";
import { Player } from "@minecraft/server";
import { clearStructure } from "../functions/clear-structure";
import { loadBlocksUpToTick } from "../functions/load-blocks-upto-tick";
import { removeEntities } from "../functions/remove-entities";
import { summonReplayEntity } from "../functions/summon-replay-entity";

export function loadFrameSecondsForm(player: Player) {
    const session = replaySessions.playerSessions.get(player.id);
    if (!session) {
        player.sendMessage(`§c[ReplayCraft] Error: No replay session found for you.`);
        return;
    }
    const totalTicks = session.recordingEndTick;
    const totalSeconds = Math.floor(totalTicks / 20);
    const currentSeconds = Math.floor(session.targetFrameTick / 20);

    // Find last camera point tick or fallback to 0
    const lastCamTick = session.replayCamPos.length > 0 ? Math.max(...session.replayCamPos.map((c) => c.tick)) : 0;
    const lastCamSeconds = Math.floor(lastCamTick / 20);

    // Slider min is the last camera point in seconds, max is totalSeconds
    const sliderMin = lastCamSeconds;
    const sliderMax = totalSeconds;

    // Clamp currentSeconds between sliderMin and sliderMax
    const defaultSlider = Math.max(sliderMin, Math.min(currentSeconds, sliderMax));

    // Update wantLoadFrameTick accordingly
    session.targetFrameTick = Math.min(session.targetFrameTick, totalTicks);

    const form = new ui.ModalFormData()
        .title("Load Frames - Seconds")
        .slider(`These values are slightly rounded off.\n§bAccurate time: §r${(totalTicks / 20).toFixed(2)}\n\nSelect Frame (Secs)`, sliderMin, sliderMax, {
            valueStep: 1,
            defaultValue: defaultSlider,
        })
        .textField("Enter Frame Seconds", "Enter Frame Seconds", {
            defaultValue: `${lastCamSeconds}`,
        });

    form.show(player).then(async (response) => {
        if (response.canceled || !response.formValues) return;

        const sliderVal = Number(response.formValues[0]);
        const textVal = Number(response.formValues[1]);

        const selectedSeconds = isNaN(textVal) || sliderVal > textVal ? sliderVal : textVal;
        session.targetFrameTick = Math.min(Math.round(selectedSeconds * 20), totalTicks);
        session.frameLoaded = true;

        removeEntities(player, true);

        for (const p of session.trackedPlayers) {
            await clearStructure(p, session);
        }
        for (const playerId of session.allRecordedPlayerIds) {
            const joinData = session.trackedPlayerJoinTicks.get(playerId);
            if (!joinData) continue;

            const joinTick = joinData.joinTick;

            if (session.targetFrameTick >= joinTick && session.targetFrameTick <= session.recordingEndTick) {
                summonReplayEntity(session, player, playerId, joinData.name);
            }
            await loadBlocksUpToTick(session.targetFrameTick, player, playerId);
        }
    });
}
