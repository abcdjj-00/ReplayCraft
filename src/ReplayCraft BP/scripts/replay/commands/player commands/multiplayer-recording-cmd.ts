import { CustomCommandOrigin, CustomCommandStatus, Player, system } from "@minecraft/server";
import { replayCraftPlayerSettingsDB } from "../../classes/subscriptions/world-initialize";
import { PlayerSettings } from "../../classes/types/types";
import { replaySessions } from "../../data/replay-player-session";

export function multiplayerRecordingCmd(_origin: CustomCommandOrigin, result: boolean) {
    system.run(() => {
        const entity = _origin.sourceEntity;
        const sender = entity as Player;
        const session = replaySessions.playerSessions.get(sender.id);
        let settings: PlayerSettings | undefined = replayCraftPlayerSettingsDB.get(sender.id);

        if (!settings) {
            sender.sendMessage("§c[ReplayCraft] Error: No settings found for you. This should never happen. Please report this to the developer.");
            return;
        }

        settings.multiplayerRecording = result;

        replayCraftPlayerSettingsDB.set(sender.id, settings);
        // Update session if it exists
        if (session) {
            session.multiplayerRecording = result;
        }
    });

    return {
        status: CustomCommandStatus.Success,
        message: `multiplayer recording mode ${result ? "enabled" : "disabled"}.`,
    };
}
